import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { ReservationStatus } from '@prisma/client';
import { validateRoomPrivacyAndCapacity } from '../utils/occupancy.js'; // Phase 6.1 Privacy Guard
import { convertReservationToStay, type ConversionOccupant } from '../services/reservation-conversion.service.js';

const PROPERTY_CHECK_IN_HOUR = 14; // 2:00 PM Standard Check-in Time

/**
 * POST /api/properties/:propertyId/reservations/:reservationId/check-in
 * State Machine: APPROVED -> CONVERTED
 */
export const checkIn = async (req: Request, res: Response) => {
  const propertyId = parseInt(req.params.propertyId as string, 10);
  const reservationId = parseInt(req.params.reservationId as string, 10);

  try {
    // 1. PRE-CHECK: Fetch data outside the transaction for the Privacy Matrix
    let reservationPreCheck = await prisma.reservationRequest.findUnique({
      where: { id: reservationId },
      include: { unitAssignments: { include: { account: true, accompanyingGuests: true } } }
    });

    if (!reservationPreCheck || reservationPreCheck.propertyId !== propertyId) {
      return res.status(404).json({ error: 'Reservation not found.' });
    }

    if (reservationPreCheck.status !== ReservationStatus.APPROVED) {
      return res.status(400).json({ error: `STATE_ERROR: Cannot check-in a reservation in ${reservationPreCheck.status} state. Must be APPROVED.` });
    }

    if (reservationPreCheck.status === ReservationStatus.APPROVED) {
      await convertReservationToStay(reservationId, Array.isArray(req.body.occupants) ? req.body.occupants as ConversionOccupant[] : []);
      reservationPreCheck = await prisma.reservationRequest.findUnique({
        where: { id: reservationId },
        include: { unitAssignments: { include: { account: true, accompanyingGuests: true } } },
      });
      if (!reservationPreCheck) return res.status(404).json({ error: 'Reservation not found.' });
    }

    // 2. THE PRIVACY MATRIX: Ensure we aren't mixing incompatible guests
    for (const assignment of reservationPreCheck.unitAssignments) {
      const privacyCheck = await validateRoomPrivacyAndCapacity(
        assignment.unitId,
        1 + assignment.accompanyingGuests.length, 
        assignment.accountId,
        assignment.account.customerType
      );

      if (!privacyCheck.isValid) {
        return res.status(403).json({ error: `CHECK-IN BLOCKED: ${privacyCheck.error}` });
      }
    }

    // 3. EXECUTE PHYSICAL CHECK-IN
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();
      const expectedIn = new Date(reservationPreCheck.expectedCheckIn);
      
      const isEarlyArrival = 
        now.toDateString() === expectedIn.toDateString() && 
        now.getHours() < PROPERTY_CHECK_IN_HOUR;

      await tx.reservationRequest.update({
        where: { id: reservationId },
        data: { status: ReservationStatus.CONVERTED, convertedAt: now }
      });

      for (const assignment of reservationPreCheck.unitAssignments) {
        await tx.unitAssignment.update({
          where: { id: assignment.id },
          data: { actualCheckIn: now, isActive: true }
        });

        await tx.unit.update({
          where: { id: assignment.unitId },
          data: { status: 'OCCUPIED' }
        });
      }

      const fallbackGuestId = reservationPreCheck.unitAssignments[0]?.accountId || null;

      await tx.auditLog.create({
        data: {
          accountId: fallbackGuestId,
          propertyId,
          entityType: 'RESERVATION',
          entityId: reservationId,
          action: 'CHECK_IN',
          details: { isEarlyArrival, checkInTime: now },
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        }
      });

      return { isEarlyArrival };
    });

    return res.status(200).json({ 
      message: 'Check-in successful. Reservation state is now CONVERTED.', 
      requiresEarlyArrivalFee: result.isEarlyArrival 
    });

  } catch (error: any) {
    console.error('Check-In Error:', error);
    return res.status(500).json({ error: 'Internal Server Error during check-in.' });
  }
};

/**
 * POST /api/properties/:propertyId/reservations/:reservationId/check-out
 * State Machine: CONVERTED -> CONVERTED (released assignments) or CANCELLED if forced
 */
export const checkOut = async (req: Request, res: Response) => {
  const propertyId = parseInt(req.params.propertyId as string, 10);
  const reservationId = parseInt(req.params.reservationId as string, 10);
  const { force } = req.body; 

  try {
    await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservationRequest.findUnique({
        where: { id: reservationId },
        include: { unitAssignments: true }
      });

      if (!reservation || reservation.propertyId !== propertyId) {
        throw new Error('RESERVATION_NOT_FOUND');
      }

      if (reservation.status !== ReservationStatus.CONVERTED && !force) {
        throw new Error(`STATE_ERROR: Cannot check-out a reservation in ${reservation.status} state unless force is applied.`);
      }

      const now = new Date();

      if (force) {
        await tx.reservationRequest.update({
          where: { id: reservationId },
          data: { status: ReservationStatus.CANCELLED } 
        });
      }

      for (const assignment of reservation.unitAssignments) {
        await tx.unitAssignment.update({
          where: { id: assignment.id },
          data: { 
            actualCheckOut: now,
            isActive: false,
            notes: force ? `${assignment.notes || ''}\n[FORCE CHECK-OUT APPLIED]` : assignment.notes
          }
        });

        await tx.unit.update({
          where: { id: assignment.unitId },
          data: { status: 'AVAILABLE' }
        });
      }

      const fallbackGuestId = reservation.unitAssignments[0]?.accountId || null;

      await tx.auditLog.create({
        data: {
          accountId: fallbackGuestId,
          propertyId,
          entityType: 'RESERVATION',
          entityId: reservationId,
          action: force ? 'FORCE_CHECK_OUT' : 'CHECK_OUT',
          details: { checkOutTime: now, isGhostCheckOut: force === true },
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        }
      });
    });

    return res.status(200).json({ 
      message: force ? 'Ghost check-out forced successfully. Rooms instantly freed.' : 'Check-out successful. Rooms are now instantly available.' 
    });

  } catch (error: any) {
    if (error.message === 'RESERVATION_NOT_FOUND') return res.status(404).json({ error: 'Reservation not found.' });
    if (error.message.startsWith('STATE_ERROR')) return res.status(400).json({ error: error.message });
    if (error.message === 'OCCUPANT_COUNT_MISMATCH' || error.message === 'PRIMARY_OCCUPANT_REQUIRED') return res.status(400).json({ error: 'A complete occupant list with one primary occupant is required.' });
    if (error.message === 'INVENTORY_CONFLICT') return res.status(409).json({ error: 'Conflict: the requested unit is no longer available.' });
    console.error('Check-Out Error:', error);
    return res.status(500).json({ error: 'Internal Server Error during check-out.' });
  }
};

/**
 * PATCH /api/properties/:propertyId/reservations/:reservationId/extend
 * Handles date extensions and checks for layout overlap traps.
 */
export const extendStay = async (req: Request, res: Response) => {
  const propertyId = parseInt(req.params.propertyId as string, 10);
  const reservationId = parseInt(req.params.reservationId as string, 10);
  const { newCheckOutDate } = req.body;

  const newDate = new Date(newCheckOutDate);

  try {
    await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservationRequest.findUnique({
        where: { id: reservationId },
        include: { unitAssignments: true }
      });

      if (!reservation || reservation.propertyId !== propertyId) throw new Error('RESERVATION_NOT_FOUND');

      if (!reservation.expectedCheckOut) {
        throw new Error('INVALID_DATE: Cannot extend checkout for open-ended reservations.');
      }

      const currentCheckOut = new Date(reservation.expectedCheckOut);
      if (newDate <= currentCheckOut) {
        throw new Error('INVALID_DATE: New check-out date must be in the future relative to the current check-out date.');
      }

      for (const assignment of reservation.unitAssignments) {
        const conflictingAssignment = await tx.unitAssignment.findFirst({
          where: {
            unitId: assignment.unitId,
            id: { not: assignment.id },
            isActive: true, 
            AND: [
              { expectedCheckIn: { lt: newDate } },
              { expectedCheckOut: { gt: currentCheckOut } } 
            ]
          }
        });

        if (conflictingAssignment) {
          throw new Error(`DOMINO_CONFLICT: Unit ID ${assignment.unitId} is already booked by another incoming guest during the extension period.`);
        }
      }

      await tx.reservationRequest.update({
        where: { id: reservationId },
        data: { expectedCheckOut: newDate }
      });

      for (const assignment of reservation.unitAssignments) {
        await tx.unitAssignment.update({
          where: { id: assignment.id },
          data: { expectedCheckOut: newDate }
        });
      }

      const fallbackGuestId = reservation.unitAssignments[0]?.accountId || null;

      await tx.auditLog.create({
        data: {
          accountId: fallbackGuestId,
          propertyId,
          entityType: 'RESERVATION',
          entityId: reservationId,
          action: 'EXTEND_STAY',
          details: { oldDate: currentCheckOut, newDate },
          ipAddress: req.ip || null,
          userAgent: req.headers['user-agent'] || null
        }
      });
    });

    return res.status(200).json({ message: 'Reservation extended successfully.' });

  } catch (error: any) {
    if (error.message === 'RESERVATION_NOT_FOUND') return res.status(404).json({ error: 'Reservation not found.' });
    if (error.message.startsWith('DOMINO_CONFLICT')) return res.status(409).json({ error: error.message });
    if (error.message.startsWith('INVALID_DATE')) return res.status(400).json({ error: error.message });
    console.error('Extension Error:', error);
    return res.status(500).json({ error: 'Internal Server Error during stay extension.' });
  }
};