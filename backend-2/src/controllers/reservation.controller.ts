import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { logAction } from '../services/audit.service.js';
import { convertReservationToStay, ensureUnitIsFreeForInterval, saveReservationOccupants, type ConversionOccupant } from '../services/reservation-conversion.service.js';
import { 
  ReservationStatus, 
  UnitType,
  UnitCategory,
} from '@prisma/client';

const debugLog = (event: string, details: Record<string, unknown> = {}) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[ReservationFlow]', event, details);
  }
};

const parsePropertyFilter = (rawValue?: string | string[]) => {
  if (!rawValue) return undefined;
  const values = Array.isArray(rawValue) ? rawValue : rawValue.split(',');
  const ids = values
    .map((item) => Number(String(item).trim()))
    .filter((value) => Number.isFinite(value));
  return ids.length ? ids : undefined;
};

const parsePropertySubtypeFilter = (rawValue?: string | string[]) => {
  if (!rawValue) return undefined;
  const values = Array.isArray(rawValue) ? rawValue : rawValue.split(',');
  const normalized = values
    .map((value) => String(value).trim().toUpperCase())
    .filter(Boolean);
  if (!normalized.length) return undefined;

  const hostelTypes = ['HOSTEL_BOYS', 'HOSTEL_GIRLS', 'HOSTEL_COED'];
  const hotelTypes = ['HOTEL', 'CO_LIVING'];

  const mapped = normalized.flatMap((value) => {
    if (value === 'HOSTEL') return hostelTypes;
    if (value === 'HOTEL') return hotelTypes;
    return value;
  });

  return mapped.length ? [...new Set(mapped)] : undefined;
};

const normalizeGuestName = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

const findDuplicateReservation = async ({
  propertyId,
  guestName,
  mobile,
  expectedCheckIn,
  expectedCheckOut,
  requestedType,
  requestedCategory,
}: {
  propertyId: number;
  guestName: string;
  mobile: string;
  expectedCheckIn: Date;
  expectedCheckOut: Date | null;
  requestedType: UnitType;
  requestedCategory: UnitCategory;
}) => {
  const normalizedName = normalizeGuestName(guestName);
  if (!normalizedName || !mobile?.trim()) return null;

  return prisma.reservationRequest.findFirst({
    where: {
      propertyId,
      mobile: { equals: mobile.trim(), mode: 'insensitive' },
      guestName: { contains: normalizedName.split(' ')[0] ?? normalizedName, mode: 'insensitive' },
      requestedType,
      requestedCategory,
      status: { in: ['PENDING', 'APPROVED', 'CONVERTED'] as ReservationStatus[] },
      expectedCheckIn: {
        equals: new Date(expectedCheckIn),
      },
      expectedCheckOut: expectedCheckOut ? { equals: new Date(expectedCheckOut) } : null,
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getAccessibleReservationScope = async (
  currentUserId: number,
  currentUserRole: string,
  requestedPropertyIds?: number[],
  requestedSubtypes?: string[],
) => {
  if (currentUserRole === 'SUPER_ADMIN') {
    return {
      propertyIds: requestedPropertyIds && requestedPropertyIds.length ? requestedPropertyIds : undefined,
      subtypeFilter: requestedSubtypes,
    };
  }

  const scopedProperties = await prisma.property.findMany({
    where: {
      isDeleted: false,
      ...(currentUserRole === 'MANAGER'
        ? { managers: { some: { id: currentUserId } } }
        : {}),
    },
    select: { id: true, type: true },
  });

  const allowedPropertyIds = new Set(scopedProperties.map((property) => property.id));

  const propertyScope = requestedPropertyIds && requestedPropertyIds.length
    ? requestedPropertyIds.filter((id) => allowedPropertyIds.has(id))
    : [...allowedPropertyIds];

  if (requestedPropertyIds && requestedPropertyIds.length && propertyScope.length !== requestedPropertyIds.length) {
    throw new Error('PROPERTY_SCOPE_DENIED');
  }

  if (!propertyScope.length) {
    return { propertyIds: [], subtypeFilter: requestedSubtypes };
  }

  const subtypeScope = requestedSubtypes && requestedSubtypes.length
    ? requestedSubtypes.filter((subtype) => scopedProperties.some((property) => property.type === subtype && propertyScope.includes(property.id)))
    : undefined;

  const resolvedPropertyIds = subtypeScope && subtypeScope.length
    ? propertyScope.filter((propertyId) => {
        const propertyType = scopedProperties.find((property) => property.id === propertyId)?.type;
        return propertyType ? subtypeScope.includes(propertyType) : false;
      })
    : propertyScope;

  return {
    propertyIds: resolvedPropertyIds,
    subtypeFilter: subtypeScope,
  };
};

/**
 * POST /properties/:propertyId/reservations
 * Handles dynamic bed/room allocation and dual-billing strategies atomically.
 */
export const createReservation = async (req: Request, res: Response) => {
  // FIX: Explicitly cast params as string to satisfy parseInt strictness
  const propertyId = parseInt(req.params.propertyId as string, 10); 
  const {
    guestName,
    mobile,
    parentPhone,
    unitId,
    existingAccountId,
    email,
    dateOfBirth,
    customerType = 'HOTEL_GUEST',
    bookingSource,
    requestedCategory,
    requestedType,
    requestedQuantity = 1,
    numberOfAdults = 1,
    numberOfChildren = 0,
    expectedCheckIn,
    expectedCheckOut,
    purpose,
    specialRequests,
    occupants,
    accompanyingGuests = [],
    address,
    city,
    state,
    pincode,
    idType,
    idNumber,
    photoUrl,
    idProofPhotoUrl
  } = req.body;

  try {
    const checkIn = new Date(expectedCheckIn);
    const checkOut = expectedCheckOut ? new Date(expectedCheckOut) : null;

    const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { type: true } });
    if (!property) return res.status(404).json({ error: 'Property not found.' });
    const isHotelStyle = property.type === 'HOTEL' || property.type === 'CO_LIVING';
    const expectedCustomerTypes = isHotelStyle ? ['HOTEL_GUEST'] : ['HOSTEL_GUEST', 'HOSTELER'];
    if (!expectedCustomerTypes.includes(customerType)) return res.status(400).json({ error: 'Guest type does not match the selected property.' });
    if (isHotelStyle && !['ROOM', 'SUITE'].includes(requestedType)) {
      return res.status(400).json({ error: 'Hotels can only be booked by room or suite.' });
    }
    if (isHotelStyle && requestedQuantity !== 1) {
      return res.status(400).json({ error: 'A hotel booking must reserve exactly one room.' });
    }
    if (!dateOfBirth || Number.isNaN(new Date(dateOfBirth).getTime())) {
      return res.status(400).json({ error: 'Primary guest date of birth is required.' });
    }

    if (checkOut && checkIn >= checkOut) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date.' });
    }

    const duplicateReservation = await findDuplicateReservation({
      propertyId,
      guestName,
      mobile,
      expectedCheckIn: checkIn,
      expectedCheckOut: checkOut,
      requestedType: requestedType as UnitType,
      requestedCategory: requestedCategory as UnitCategory,
    });

    if (duplicateReservation) {
      return res.status(409).json({
        error: 'Duplicate reservation detected. A similar pending or active booking already exists for this guest and stay window.',
      });
    }

    const isManualBooking = String(bookingSource ?? '').toUpperCase() === 'MANUAL';
    const initialStatus = isManualBooking ? 'APPROVED' : 'PENDING';

    const primaryAccountId = existingAccountId ? Number(existingAccountId) : undefined;
    if (primaryAccountId) {
      const existingAccount = await prisma.account.findUnique({ where: { id: primaryAccountId }, select: { id: true, role: true } });
      if (!existingAccount || existingAccount.role !== 'CUSTOMER') return res.status(404).json({ error: 'Guest account not found.' });
    }

    const reservation = await prisma.reservationRequest.create({
      data: {
        propertyId,
        primaryAccountId: primaryAccountId ?? null,
        guestName,
        mobile,
        email,
        requestedCategory: requestedCategory as UnitCategory,
        requestedType: requestedType as UnitType,
        requestedQuantity,
        requestedCustomerType: customerType as any,
        numberOfAdults,
        numberOfChildren,
        expectedCheckIn: checkIn,
        expectedCheckOut: checkOut,
        purpose,
        specialRequests,
        status: initialStatus,
      },
    });

    if (isManualBooking) {
      const manualOccupants = (Array.isArray(occupants) && occupants.length > 0 ? occupants : [
        {
          isPrimary: true,
          accountId: primaryAccountId ?? null,
          firstName: guestName.trim().split(/\s+/)[0] ?? '',
          lastName: guestName.trim().split(/\s+/).slice(1).join(' '),
          phone: mobile,
          parentPhone: parentPhone || null,
          email: email || null,
          dateOfBirth,
          address,
          city,
          state,
          pincode,
          idType,
          idNumber,
          photoUrl,
          idProofPhotoUrl,
        },
      ]).map((occupant: any, index: number) => index === 0
        ? { ...occupant, isPrimary: true, accountId: occupant.accountId ?? primaryAccountId ?? null }
        : occupant);
      const converted = await convertReservationToStay(reservation.id, manualOccupants as ConversionOccupant[], unitId ? Number(unitId) : undefined);
      return res.status(201).json({
        ...reservation,
        ...converted,
        message: 'Manual booking created and assigned successfully.',
      });
    }

    const primaryOccupant: ConversionOccupant = {
      isPrimary: true,
      firstName: guestName.trim().split(/\s+/)[0] ?? '',
      lastName: guestName.trim().split(/\s+/).slice(1).join(' '),
      phone: mobile,
      parentPhone: parentPhone ?? null,
      email: email || null,
      dateOfBirth,
      address,
      city,
      state,
      pincode,
      idType,
      idNumber,
      photoUrl,
      idProofPhotoUrl,
    };
    const conversionOccupants = (Array.isArray(occupants) ? occupants : [primaryOccupant, ...(Array.isArray(accompanyingGuests) ? accompanyingGuests : [])])
      .map((occupant: any, index: number) => index === 0
        ? { ...occupant, isPrimary: true, accountId: occupant.accountId ?? primaryAccountId ?? null }
        : occupant) as ConversionOccupant[];
    await saveReservationOccupants(reservation.id, conversionOccupants);

    await logAction(req as any, 'RESERVATION_REQUEST', reservation.id, 'CREATE_RESERVATION', {
      allocatedQuantity: requestedQuantity,
      category: requestedCategory,
      type: requestedType,
      strategy: requestedType === 'BED' ? 'RECURRING_MONTHLY' : 'PER_NIGHT_STAY',
      status: initialStatus,
      awaitingApproval: !isManualBooking,
      bookingSource: bookingSource ?? 'WEBSITE',
    });

    return res.status(201).json({
      ...reservation,
      message: 'Reservation request created successfully. Awaiting staff approval.',
    });

  } catch (error: any) {
    if (error.message === 'INVENTORY_CONFLICT') {
      return res.status(409).json({ 
        error: 'Conflict: Insufficient available inventory (rooms/beds) for the requested dates.' 
      });
    }
    if (error.message === 'ROOM_NOT_AVAILABLE') {
      return res.status(409).json({ error: 'The selected room is not available for these dates.' });
    }
    if (error.message?.startsWith('ROOM_CAPACITY_MISMATCH:')) {
      const capacity = error.message.split(':')[1];
      return res.status(400).json({ error: `This room requires exactly ${capacity} member(s).` });
    }
    if (error.message === 'OCCUPANT_DETAILS_MISMATCH') {
      return res.status(400).json({ error: 'Provide details for every additional occupant.' });
    }
    if (error.message === 'OCCUPANT_COUNT_MISMATCH') return res.status(400).json({ error: 'Occupant count must match the reservation guest count.' });
    if (error.message === 'PRIMARY_OCCUPANT_REQUIRED') return res.status(400).json({ error: 'Exactly one primary occupant is required.' });
    if (error.message === 'INVENTORY_CONFLICT') return res.status(409).json({ error: 'Conflict: the requested unit is no longer available.' });
    if (error.message?.startsWith('ROOM_CAPACITY:')) {
      return res.status(400).json({ error: `The room requires exactly ${error.message.split(':')[1]} member(s).` });
    }
    console.error('Reservation Error:', error);
    return res.status(500).json({ error: 'Internal Server Error during reservation allocation.' });
  }
};

/**
 * GET /properties/:propertyId/reservations
 */
export const getReservations = async (req: Request, res: Response) => {
  const propertyId = parseInt(req.params.propertyId as string, 10);
  const { status, propertyIds, propertySubTypes } = req.query;

  try {
    const resolvedPropertyIds = parsePropertyFilter(propertyIds as string | string[] | undefined) ?? [propertyId];
    const resolvedSubtypes = parsePropertySubtypeFilter(propertySubTypes as string | string[] | undefined);

    debugLog('GET_RESERVATIONS', {
      propertyId,
      propertyIds: resolvedPropertyIds,
      propertySubTypes: resolvedSubtypes,
      status: status ?? null,
    });

    const reservations = await prisma.reservationRequest.findMany({
      where: {
        propertyId: { in: resolvedPropertyIds },
        ...(status ? { status: status as ReservationStatus } : {}),
        ...(resolvedSubtypes ? {
          property: {
            type: {
              in: resolvedSubtypes as any,
            },
          },
        } : {}),
      },
      include: {
        property: {
          select: { id: true, type: true, name: true },
        },
        unitAssignments: {
          include: {
            unit: {
              select: { unitNumber: true, category: true, type: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(reservations);
  } catch (error) {
    console.error('Fetch Reservations Error:', error);
    return res.status(500).json({ error: 'Failed to fetch reservations.' });
  }
};

/**
 * GET /api/properties/reservations
 * Get all reservations (SUPER_ADMIN) or reservations for manager's properties
 */
export const getAllReservations = async (req: Request, res: Response) => {
  const { status, propertyIds, propertySubTypes } = req.query;
  const currentUserId = req.user?.id;
  const currentUserRole = req.user?.role;

  if (!currentUserId || !currentUserRole) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const resolvedPropertyIds = parsePropertyFilter(propertyIds as string | string[] | undefined);
    const resolvedSubtypes = parsePropertySubtypeFilter(propertySubTypes as string | string[] | undefined);

    let scopedPropertyIds: number[] | undefined;
    let scopedSubtypeFilter: string[] | undefined;

    try {
      const scope = await getAccessibleReservationScope(
        currentUserId,
        currentUserRole,
        resolvedPropertyIds,
        resolvedSubtypes,
      );
      scopedPropertyIds = scope.propertyIds;
      scopedSubtypeFilter = scope.subtypeFilter;
    } catch (error: any) {
      if (error.message === 'PROPERTY_SCOPE_DENIED') {
        return res.status(403).json({ error: 'Access Denied: requested property scope is outside your managed properties.' });
      }
      throw error;
    }

    let whereClause: any = {
      ...(status ? { status: status as ReservationStatus } : {}),
      ...(scopedSubtypeFilter && scopedSubtypeFilter.length ? {
        property: {
          type: {
            in: scopedSubtypeFilter as any,
          },
        },
      } : {}),
      ...(scopedPropertyIds && scopedPropertyIds.length ? { propertyId: { in: scopedPropertyIds } } : {}),
    };

    if (currentUserRole !== 'SUPER_ADMIN' && currentUserRole !== 'MANAGER') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const reservations = await prisma.reservationRequest.findMany({
      where: whereClause,
      include: {
        unitAssignments: {
          include: {
            unit: {
              select: { unitNumber: true, category: true, type: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(reservations);
  } catch (error) {
    console.error('Fetch All Reservations Error:', error);
    return res.status(500).json({ error: 'Failed to fetch reservations.' });
  }
};

/**
 * PATCH /properties/:propertyId/reservations/:reservationId/status
 */
export const updateReservationStatus = async (req: Request, res: Response) => {
  // FIX: Safe param casting
  const propertyId = parseInt(req.params.propertyId as string, 10);
  const reservationId = parseInt(req.params.reservationId as string, 10);
  const { status } = req.body as { status: ReservationStatus };
  const occupants = Array.isArray(req.body.occupants) ? req.body.occupants as ConversionOccupant[] : [];

  try {
    const updatedData = await prisma.$transaction(async (tx) => {
      const existing = await tx.reservationRequest.findUnique({
        where: { id: reservationId },
        include: {
          unitAssignments: true,
        }
      });

      if (!existing || existing.propertyId !== propertyId) {
        throw new Error('NOT_FOUND');
      }

      debugLog('UPDATE_RESERVATION_STATUS', {
        reservationId,
        propertyId,
        status,
        hasExistingAssignments: existing.unitAssignments.length,
      });

      if (status === 'APPROVED' || status === 'CONVERTED') {
        return existing;
      }

      const updatedReservation = await tx.reservationRequest.update({
        where: { id: reservationId },
        data: { status },
      });

      if (['CANCELLED', 'REJECTED', 'NO_SHOW'].includes(status)) {
        await tx.unitAssignment.updateMany({
          where: { reservationRequestId: reservationId },
          data: { isActive: false } 
        });
      }

      return updatedReservation;
    });

    if (status === 'APPROVED' || status === 'CONVERTED') {
      const converted = await convertReservationToStay(reservationId, occupants);
      await logAction(req as any, 'RESERVATION_REQUEST', reservationId, 'CONVERT_RESERVATION', { newStatus: 'CONVERTED' });
      return res.status(200).json(converted);
    }

    await logAction(req as any, 'RESERVATION_REQUEST', reservationId, 'UPDATE_STATUS', { newStatus: status });

    return res.status(200).json(updatedData);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Reservation not found for this property.' });
    }
    if (error.message === 'OCCUPANT_COUNT_MISMATCH') return res.status(400).json({ error: 'Occupant count must match the reservation guest count.' });
    if (error.message === 'PRIMARY_OCCUPANT_REQUIRED') return res.status(400).json({ error: 'Exactly one primary occupant is required.' });
    if (error.message === 'INVENTORY_CONFLICT') return res.status(409).json({ error: 'Conflict: the requested unit is no longer available.' });
    console.error('Update Reservation Status Error:', error);
    return res.status(500).json({ error: 'Failed to update reservation status.' });
  }
};

export const updateReservation = async (req: Request, res: Response) => {
  const propertyId = parseInt(req.params.propertyId as string, 10);
  const reservationId = parseInt(req.params.reservationId as string, 10);
  const { guestName, mobile, email, expectedCheckIn, expectedCheckOut, numberOfAdults, numberOfChildren, purpose, specialRequests } = req.body;

  try {
    const updatedReservation = await prisma.$transaction(async (tx) => {
      const existing = await tx.reservationRequest.findUnique({
        where: { id: reservationId },
        include: { unitAssignments: { include: { unit: { select: { capacity: true, type: true } } } } },
      });
      if (!existing || existing.propertyId !== propertyId) throw new Error('NOT_FOUND');

      const nextCheckIn = expectedCheckIn ? new Date(expectedCheckIn) : existing.expectedCheckIn;
      const nextCheckOut = expectedCheckOut ? new Date(expectedCheckOut) : existing.expectedCheckOut;
      if (nextCheckOut && nextCheckIn >= nextCheckOut) throw new Error('INVALID_DATES');

      const nextAdults = numberOfAdults === undefined ? existing.numberOfAdults : Number(numberOfAdults);
      const nextChildren = numberOfChildren === undefined ? existing.numberOfChildren : Number(numberOfChildren);
      const assignedUnit = existing.unitAssignments[0]?.unit;
      if (assignedUnit?.type !== 'BED' && assignedUnit && nextAdults + nextChildren !== assignedUnit.capacity) {
        throw new Error(`ROOM_CAPACITY:${assignedUnit.capacity}`);
      }

      for (const assignment of existing.unitAssignments) {
        await ensureUnitIsFreeForInterval(tx, assignment.unitId, nextCheckIn, nextCheckOut, assignment.id);
      }

      const reservation = await tx.reservationRequest.update({
        where: { id: reservationId },
        data: {
          guestName, mobile, email,
          expectedCheckIn: nextCheckIn,
          expectedCheckOut: nextCheckOut,
          numberOfAdults: nextAdults,
          numberOfChildren: nextChildren,
          purpose, specialRequests,
        },
      });

      await tx.unitAssignment.updateMany({
        where: { reservationRequestId: reservationId },
        data: { expectedCheckIn: nextCheckIn, expectedCheckOut: nextCheckOut },
      });
      return reservation;
    });
    await logAction(req as any, 'RESERVATION_REQUEST', reservationId, 'UPDATE_RESERVATION', { propertyId });
    return res.status(200).json(updatedReservation);
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'Reservation not found for this property.' });
    if (error.message === 'INVALID_DATES') return res.status(400).json({ error: 'Check-out must be after check-in.' });
    if (error.message?.startsWith('ROOM_CAPACITY:')) return res.status(400).json({ error: `The room requires exactly ${error.message.split(':')[1]} member(s).` });
    console.error('Update Reservation Error:', error);
    return res.status(500).json({ error: 'Failed to update reservation.' });
  }
};

/**
 * @route   POST /api/public/reservations
 * @desc    Create a reservation request (public endpoint, no auth required)
 * @access  Public
 */
export const createPublicReservation = async (req: Request, res: Response) => {
  const {
    propertyId,
    guestName,
    mobile,
    email,
    customerType = 'HOTEL_GUEST',
    requestedCategory,
    requestedType,
    requestedQuantity = 1,
    numberOfAdults = 1,
    numberOfChildren = 0,
    expectedCheckIn,
    expectedCheckOut,
    purpose,
     specialRequests,
     occupants = [],
  } = req.body;

  try {
    if (!propertyId || !guestName || !mobile || !expectedCheckIn) {
      return res.status(400).json({ error: 'Missing required fields: propertyId, guestName, mobile, expectedCheckIn' });
    }

    if (!expectedCheckOut && customerType !== 'HOSTELER') {
      return res.status(400).json({ error: 'Checkout date is required for non-resident bookings' });
    }

    const checkIn = new Date(expectedCheckIn);
    const checkOut = expectedCheckOut ? new Date(expectedCheckOut) : null;

    if (checkOut && checkIn >= checkOut) {
      return res.status(400).json({ error: 'Check-out date must be after check-in date.' });
    }

    const duplicateReservation = await findDuplicateReservation({
      propertyId: parseInt(propertyId as string),
      guestName,
      mobile,
      expectedCheckIn: checkIn,
      expectedCheckOut: checkOut,
      requestedType: requestedType as UnitType,
      requestedCategory: requestedCategory as UnitCategory,
    });

    if (duplicateReservation) {
      return res.status(409).json({
        error: 'Duplicate reservation detected. A similar pending or active booking already exists for this guest and stay window.',
      });
    }

    const reservation = await prisma.reservationRequest.create({
      data: {
        propertyId: parseInt(propertyId as string),
        guestName,
        mobile,
        email: email || null,
        requestedCategory: requestedCategory as any,
        requestedType: requestedType as any,
        requestedQuantity: parseInt(requestedQuantity as string),
        requestedCustomerType: customerType as any,
        numberOfAdults: parseInt(numberOfAdults as string),
        numberOfChildren: parseInt(numberOfChildren as string),
        expectedCheckIn: checkIn,
        expectedCheckOut: checkOut,
        purpose: purpose || null,
        specialRequests: specialRequests || null,
        status: 'PENDING',
      },
      include: {
        property: {
          select: {
            name: true,
            city: true,
            state: true,
          },
        },
      },
    });

    const snapshotOccupants = Array.isArray(occupants) && occupants.length > 0 ? occupants : [];
    if (snapshotOccupants.length > 0) {
      await saveReservationOccupants(reservation.id, snapshotOccupants as ConversionOccupant[]);
    }

    debugLog('PUBLIC_RESERVATION_CREATED', {
      reservationId: reservation.id,
      propertyId: reservation.propertyId,
      guestName,
      status: 'PENDING',
      expectedCheckIn: reservation.expectedCheckIn,
      expectedCheckOut: reservation.expectedCheckOut,
      occupantCount: Array.isArray(occupants) ? occupants.length : 0,
    });

    return res.status(201).json({
      message: 'Reservation request created successfully. Awaiting confirmation.',
      reservation,
    });
  } catch (error) {
    console.error('[ReservationController: createPublicReservation]', error);
    console.error('[ReservationController: createPublicReservation Details]', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({ error: 'Failed to create reservation request' });
  }
};
