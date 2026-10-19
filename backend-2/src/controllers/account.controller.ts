import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import bcrypt from 'bcrypt';
import { logAction } from '../services/audit.service.js';
import { ensureUnitIsFreeForInterval } from '../services/reservation-conversion.service.js';
import { calculateIsCustomRate, resolveAgreedRate } from '../utils/agreed-rate.js';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const sanitizeFormData = (data: Record<string, any>) => {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    // FIXED: Convert empty strings and 'null' strings to actual null so Prisma clears the database field
    if (value === '' || value === 'null') {
      sanitized[key] = null;
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

// Safe select ensures password hashes are NEVER returned to the frontend
const safeAccountSelect = {
  id: true,
  role: true,
  customerType: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  gender: true,
  department: true,
  designation: true,
  baseSalary: true,
  recurringSubsidy: true,
  isActive: true,
  isDeleted: true,
  createdAt: true,
  
  idType: true,
  idNumber: true,
  joinDate: true,
  leftDate: true,
  dateOfBirth: true,
  parentPhone: true,
  address: true,
  city: true,
  state: true,
  pincode: true,
  photoUrl: true,

  managedProperties: { select: { id: true, name: true } },
  staffProperties: { select: { id: true, name: true } },
  residentProperty: { select: { id: true, name: true } },
  unitAssignments: {
    where: { isActive: true },
    select: { id: true, unitId: true, billingStrategy: true, agreedPricePerNight: true, agreedMonthlyRate: true, agreedMonthlyMessRate: true, isCustomRate: true, expectedCheckIn: true, expectedCheckOut: true, unit: { select: { propertyId: true } } },
  },
  hostelMealAssignments: {
    where: { isActive: true },
    select: { monthlyRate: true },
  },
};

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * @route   GET /api/accounts
 * @desc    Fetch a list of accounts with multi-tenant scope filtering
 */
export const getAccounts = async (req: Request, res: Response) => {
  try {
    const role = req.query.role ? String(req.query.role) : undefined;
    const accountType = req.query.accountType ? String(req.query.accountType).toUpperCase() : undefined;
    const customerTypes = String(req.query.customerType ?? '')
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter(Boolean);
    const customerType = customerTypes.length === 1 ? customerTypes[0] : undefined;
    const isCustomerQuery = String(accountType ?? '').toUpperCase() === 'CUSTOMER' || role === 'CUSTOMER';
    const isGuestQuery = role === 'CUSTOMER' && customerTypes.length === 1 && ['HOSTEL_GUEST', 'HOTEL_GUEST'].includes(customerTypes[0]!);
    const isResidentQuery = role === 'CUSTOMER' && customerType === 'HOSTELER';
    const requestedAccountId = req.query.accountId ? Number(req.query.accountId) : undefined;
    const requestedPropertyIds = String(req.query.propertyIds ?? '')
      .split(',')
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);
    const isActive = req.query.isActive !== undefined ? String(req.query.isActive) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const propertyId = req.query.propertyId ? String(req.query.propertyId) : undefined;
    const parsedPropertyId = propertyId ? Number(propertyId) : undefined;
    const requestedAuthUserId = req.query.authUserId ? Number(req.query.authUserId) : undefined;
    const requestedAuthUserRole = req.query.authUserRole ? String(req.query.authUserRole).toUpperCase() : undefined;
    
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    if (!currentUserId || !currentUserRole) {
      return res.status(401).json({ error: 'Authentication context missing.' });
    }

    if (isGuestQuery) {
      console.debug('[AccountController:getAccounts] Guest query received', {
        tokenUserId: currentUserId,
        tokenUserRole: currentUserRole,
        requestedAccountId,
        requestedAuthUserId,
        requestedAuthUserRole,
        propertyId,
        parsedPropertyId,
        customerType,
      });
      if (requestedAuthUserId !== currentUserId || requestedAuthUserRole !== String(currentUserRole).toUpperCase()) {
        console.warn('[AccountController:getAccounts] Guest query rejected: auth context mismatch');
        return res.status(403).json({ error: 'Authenticated user context does not match the access token.' });
      }

      const authenticatedAccount = await prisma.account.findUnique({
        where: { id: currentUserId },
        select: { role: true, isActive: true, isDeleted: true },
      });
      if (!authenticatedAccount || authenticatedAccount.isDeleted || !authenticatedAccount.isActive || authenticatedAccount.role !== currentUserRole) {
        console.warn('[AccountController:getAccounts] Guest query rejected: authenticated account invalid', {
          authenticatedAccount,
        });
        return res.status(403).json({ error: 'Authenticated user account is not valid.' });
      }

      if ((requestedPropertyIds.length === 0) && (parsedPropertyId === undefined || !Number.isInteger(parsedPropertyId) || parsedPropertyId <= 0)) {
        console.warn('[AccountController:getAccounts] Guest query rejected: invalid property scope', { propertyId, requestedPropertyIds });
        return res.status(400).json({ error: 'Guest queries require a valid property ID list.' });
      }
    }

    const employeeRoles = new Set(['STAFF', 'MANAGER', 'SUPER_ADMIN']);
    const requestedRoles = (role ?? '').split(',').map((value) => value.trim().toUpperCase()).filter(Boolean);
    const isEmployeeQuery = accountType === 'EMPLOYEE' || requestedRoles.some((requestedRole) => employeeRoles.has(requestedRole));
    console.debug('[AccountController:getAccounts] Employee query', {
      accountType,
      requestedRoles,
      requestedAuthUserId,
      requestedAuthUserRole,
      tokenUserId: currentUserId,
      tokenUserRole: currentUserRole,
      propertyId,
      requestedPropertyIds,
    });
    if (isEmployeeQuery) {
      if (!Number.isInteger(requestedAuthUserId) || !requestedAuthUserRole) {
        return res.status(400).json({ error: 'Authenticated user ID and role are required for employee queries.' });
      }
      if (requestedAuthUserId !== currentUserId || requestedAuthUserRole !== String(currentUserRole).toUpperCase()) {
        return res.status(403).json({ error: 'Authenticated user context does not match the access token.' });
      }

      const authenticatedAccount = await prisma.account.findUnique({
        where: { id: currentUserId },
        select: { role: true, isActive: true, isDeleted: true },
      });
      if (!authenticatedAccount || authenticatedAccount.isDeleted || !authenticatedAccount.isActive || authenticatedAccount.role !== currentUserRole) {
        return res.status(403).json({ error: 'Authenticated user role is not valid.' });
      }
    }

    if (requestedAccountId !== undefined && requestedAccountId !== currentUserId) {
      return res.status(403).json({ error: 'Account scope does not match the authenticated user.' });
    }

    if (propertyId && (parsedPropertyId === undefined || !Number.isInteger(parsedPropertyId) || parsedPropertyId <= 0)) {
      return res.status(400).json({ error: 'Invalid property ID.' });
    }

    let whereClause: Prisma.AccountWhereInput = {
      isDeleted: false,
    };

    // Handle comma-separated roles for filtering (e.g., "STAFF,MANAGER,SUPER_ADMIN")
    if (role) {
      const roles = role.split(',').map(r => r.trim());
      if (roles.length > 1) {
        whereClause.role = { in: roles as any };
      } else {
        whereClause.role = role as any;
      }
    }
    if (customerTypes.length > 1) whereClause.customerType = { in: customerTypes as any };
    else if (customerType) whereClause.customerType = customerType as any;
    if (isCustomerQuery) whereClause.role = 'CUSTOMER';
    
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Apply the sidebar's one-property or all-properties scope in one request.
    const propertyIds = requestedPropertyIds.length > 0
      ? [...new Set(requestedPropertyIds)]
      : parsedPropertyId ? [parsedPropertyId] : [];

    if (isResidentQuery && propertyIds.length === 0) {
      return res.status(400).json({ error: 'Resident queries require at least one property ID.' });
    }

    if ((isResidentQuery || isCustomerQuery) && propertyIds.length > 0) {
      const requestedProperties = await prisma.property.findMany({
        where: { id: { in: propertyIds }, isDeleted: false },
        select: { id: true, type: true },
      });
      if (requestedProperties.length !== propertyIds.length) {
        console.warn('[AccountController:getAccounts] Guest query rejected: property not found', { propertyIds });
        return res.status(404).json({ error: 'One or more requested properties were not found.' });
      }
      if (isResidentQuery && requestedProperties.some((property) => !property.type.startsWith('HOSTEL_'))) {
        return res.status(400).json({ error: 'Resident queries support hostel properties only.' });
      }
      if (isCustomerQuery && customerTypes.length > 0) {
        const invalidGuestScope = customerTypes.length === 1 && requestedProperties.some((property) => {
          const expectedType = property.type === 'HOTEL'
            ? 'HOTEL_GUEST'
            : property.type.startsWith('HOSTEL_')
              ? 'HOSTEL_GUEST'
              : null;
          return ['HOSTEL_GUEST', 'HOTEL_GUEST'].includes(customerTypes[0]!) && customerTypes[0] !== expectedType;
        });
        if (invalidGuestScope) {
          console.warn('[AccountController:getAccounts] Guest query rejected: subtype does not match property', {
            propertyIds,
            propertyTypes: requestedProperties.map((property) => property.type),
            customerType: customerTypes[0],
          });
          return res.status(400).json({ error: 'Guest subtype must match the selected property type.' });
        }
      }
    }

    if (isResidentQuery) {
      console.log('[AccountController:getAccounts] Resident scope:', {
        authenticatedAccountId: currentUserId,
        requestedAccountId,
        requestedPropertyIds: propertyIds,
        role,
        customerType,
      });
    }

    if (propertyIds.length > 0) {
      whereClause.AND = [{
        OR: isGuestQuery
          ? [{ role: 'CUSTOMER', residentProperty: { id: { in: propertyIds } } }]
          : [
              {
                role: 'CUSTOMER',
                unitAssignments: { some: { unit: { propertyId: { in: propertyIds } } } },
              },
              { role: 'CUSTOMER', residentProperty: { id: { in: propertyIds } } },
              { role: 'STAFF', staffProperties: { some: { id: { in: propertyIds } } } },
              { role: 'MANAGER', managedProperties: { some: { id: { in: propertyIds } } } },
              { role: 'SUPER_ADMIN' },
            ],
      }];
    }

    // SCOPE ENFORCEMENT
    if (currentUserRole === 'MANAGER') {
      // Managers must be authorized for every property in the requested scope.
      if (propertyIds.length > 0) {
        const managedProperties = await prisma.property.findMany({
          where: {
            id: { in: propertyIds },
            managers: { some: { id: currentUserId } }
          },
          select: { id: true }
        });
        
        if (managedProperties.length !== propertyIds.length) {
          return res.status(403).json({ error: 'Access Denied: You do not manage this property.' });
        }
      } else {
        // Without propertyId, apply standard scope enforcement
        if (!role || role === 'STAFF') {
          whereClause.role = role ? 'STAFF' : { in: ['STAFF', 'CUSTOMER'] };
          const existingAnd = whereClause.AND;
          whereClause.AND = [
            ...(existingAnd ? (Array.isArray(existingAnd) ? existingAnd : [existingAnd]) : []),
            {
              OR: [
                {
                  role: 'CUSTOMER',
                  unitAssignments: {
                    some: {
                      unit: {
                        property: { managers: { some: { id: currentUserId } } }
                      }
                    }
                  }
                },
                {
                  role: 'CUSTOMER',
                  residentProperty: {
                    managers: { some: { id: currentUserId } }
                  }
                },
                {
                  role: 'STAFF',
                  staffProperties: {
                    some: {
                      managers: { some: { id: currentUserId } }
                    }
                  }
                }
              ]
            }
          ];
        }
      }
    } else if (currentUserRole === 'SUPER_ADMIN') {
      // Super admin should be able to view all active accounts across all properties.
      if (!role) {
        whereClause.role = { in: ['SUPER_ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER'] };
      }
      // If role is specified, keep the role filter from above
    }

    const accounts = await prisma.account.findMany({
      where: whereClause,
      select: safeAccountSelect,
      orderBy: { createdAt: 'desc' },
    });

    console.debug('[AccountController:getAccounts] Employee result', {
      count: accounts.length,
      accountIds: accounts.map((account) => account.id),
      roles: accounts.map((account) => account.role),
    });

    if (isGuestQuery) {
      console.debug('[AccountController:getAccounts] Guest query result', {
        propertyIds,
        customerType,
        count: accounts.length,
        accountIds: accounts.map((account) => account.id),
        accountCustomerTypes: [...new Set(accounts.map((account) => account.customerType))],
      });
      if (accounts.length === 0) {
        const candidates = await prisma.account.findMany({
          where: { role: 'CUSTOMER', customerType: customerType as any, isDeleted: false },
          select: {
            id: true,
            customerType: true,
            residentProperty: { select: { id: true, name: true, type: true } },
          },
          take: 20,
        });
        console.warn('[AccountController:getAccounts] Guest query returned no matches; candidate relations:', {
          requestedPropertyIds: propertyIds,
          customerType,
          candidates: candidates.map((candidate) => ({
            id: candidate.id,
            customerType: candidate.customerType,
            residentProperty: candidate.residentProperty,
          })),
        });
      }
    }

    const responseAccounts = accounts.map(({ unitAssignments, residentProperty, managedProperties, staffProperties, ...account }) => ({
      ...account,
      residentProperty,
      unitAssignments,
      managedProperties,
      staffProperties,
      propertyIds: [...new Set([
        ...(residentProperty ? [residentProperty.id] : []),
        ...unitAssignments.map(({ unit }) => unit.propertyId),
        ...managedProperties.map((property) => property.id),
        ...staffProperties.map((property) => property.id),
      ])],
    }));

    console.log('[AccountController:getAccounts] Returning accounts:', {
      count: responseAccounts.length,
      accountIds: responseAccounts.map((account) => account.id),
    });

    return res.status(200).json(responseAccounts);
  } catch (error) {
    console.error('[AccountController: getAccounts]', error);
    return res.status(500).json({ error: 'Internal Server Error while retrieving accounts.' });
  }
};

/**
 * @route   GET /api/accounts/:accountId
 */
export const getCurrentAccount = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) return res.status(401).json({ error: 'Authentication required.' });

    const account = await prisma.account.findUnique({
      where: { id: currentUserId },
      select: safeAccountSelect,
    });

    if (!account || account.isDeleted) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    return res.status(200).json(account);
  } catch (error) {
    console.error('[AccountController: getCurrentAccount]', error);
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
};

export const getAccountById = async (req: Request, res: Response) => {
  try {
    const accountId = parseInt(String(req.params.accountId), 10);
    if (isNaN(accountId)) return res.status(400).json({ error: 'Invalid account ID.' });

    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    if (!currentUserId) return res.status(401).json({ error: 'Authentication required.' });

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: safeAccountSelect,
    });

    if (!account || account.isDeleted) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    if (currentUserRole === 'MANAGER' && account.id !== currentUserId) {
      if (account.role === 'SUPER_ADMIN' || account.role === 'MANAGER') {
        return res.status(403).json({ error: 'Forbidden: Cannot access peer or superior account details.' });
      }

      const sharesProperty = await prisma.property.findFirst({
        where: {
          managers: { some: { id: currentUserId } },
          staff: { some: { id: accountId } }
        }
      });

      if (!sharesProperty && account.role === 'STAFF') {
        return res.status(403).json({ error: 'Forbidden: Staff member is outside your managed property scope.' });
      }
    }

    return res.status(200).json(account);
  } catch (error) {
    console.error('[AccountController: getAccountById]', error);
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
};

/**
 * @route   POST /api/accounts
 */
export const createAccount = async (req: Request, res: Response) => {
  try {
    const cleanData = sanitizeFormData(req.body);
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      customerType,
      phone,
      parentPhone,
      gender,
      idType,
      idNumber,
      address,
      city,
      state,
      pincode,
      photoUrl,
      idProofPhotoUrl,
      department,
      designation,
      baseSalary,
      recurringSubsidy,
      joinDate,
      leftDate,
      dateOfBirth,
      isActive,
      propertyIds,
      unitId,
      checkIn,
      checkOut,
      agreedPricePerNight,
      agreedMonthlyRate,
      agreedMonthlyMessRate,
      includeMess = agreedMonthlyMessRate !== null && agreedMonthlyMessRate !== undefined,
    } = cleanData;
    const currentUserRole = req.user?.role;
    const currentUserId = req.user?.id;
    console.debug('[AccountController:createAccount] Employee payload', {
      actorId: currentUserId,
      actorRole: currentUserRole,
      role,
      department,
      propertyIds,
    });

    if (!firstName || !lastName || !role) {
      return res.status(400).json({ error: 'First name, last name, and role are required.' });
    }

    if (currentUserRole === 'MANAGER' && (role === 'SUPER_ADMIN' || role === 'MANAGER')) {
      return res.status(403).json({ error: 'Forbidden: Managers can only create STAFF or CUSTOMER accounts.' });
    }

    let residentProperty: { id: number; type: string } | null = null;
    let residentUnitId: number | null = null;
    let residentPropertyIds: number[] = [];
    if (role === 'CUSTOMER') {
      residentPropertyIds = [...new Set(
        (Array.isArray(propertyIds) ? propertyIds : [])
          .map((id: unknown) => Number(id))
          .filter((id: number) => Number.isInteger(id) && id > 0)
      )];

      if (residentPropertyIds.length === 0) {
        return res.status(400).json({ error: 'At least one valid property is required for residents.' });
      }
      if (residentPropertyIds.length !== 1) {
        return res.status(400).json({ error: 'A resident can be assigned to exactly one property.' });
      }

      const residentProperties = await prisma.property.findMany({
        where: { id: { in: residentPropertyIds }, isDeleted: false },
        select: { id: true, type: true },
      });

      if (residentProperties.length !== residentPropertyIds.length) {
        return res.status(404).json({ error: 'One or more selected properties were not found.' });
      }
      residentProperty = residentProperties[0]!;

      const requestedCustomerType = residentProperty.type.startsWith('HOSTEL_') && !checkOut
        ? 'HOSTELER'
        : customerType ? String(customerType).toUpperCase() : 'HOSTELER';
      const expectedCustomerType = residentProperty.type === 'HOTEL' ? 'HOTEL_GUEST' : 'HOSTEL_GUEST';
      if (requestedCustomerType === 'HOSTELER' && !residentProperty.type.startsWith('HOSTEL_')) {
        return res.status(400).json({ error: 'Residents can only be assigned to hostel properties.' });
      }
      if (requestedCustomerType !== 'HOSTELER' && requestedCustomerType !== expectedCustomerType) {
        return res.status(400).json({ error: 'Guest subtype must match the selected property type.' });
      }
      cleanData.customerType = requestedCustomerType;

      if (currentUserRole === 'MANAGER') {
        if (!currentUserId) {
          return res.status(401).json({ error: 'Authentication context missing.' });
        }
        const managedProperties = await prisma.property.findMany({
          where: { id: { in: residentPropertyIds }, managers: { some: { id: currentUserId } } },
          select: { id: true },
        });
        if (managedProperties.length !== residentPropertyIds.length) {
          return res.status(403).json({ error: 'You are not authorized to add residents to this property.' });
        }
      }

      if (unitId) {
        const parsedUnitId = Number(unitId);
        if (!Number.isInteger(parsedUnitId) || parsedUnitId <= 0) {
          return res.status(400).json({ error: 'Invalid unit ID.' });
        }
        const residentUnit = await prisma.unit.findFirst({
          where: { id: parsedUnitId, propertyId: { in: residentPropertyIds } },
          select: { id: true },
        });
        if (!residentUnit) {
          return res.status(400).json({ error: 'The selected unit does not belong to the selected property.' });
        }
        residentUnitId = residentUnit.id;
      }

      const nextCheckIn = checkIn ? new Date(checkIn) : new Date();
      const nextCheckOut = checkOut ? new Date(checkOut) : null;
      if (nextCheckOut && nextCheckIn >= nextCheckOut) {
        return res.status(400).json({ error: 'Check-out date must be after check-in date.' });
      }
      if (residentUnitId) {
        try {
          await ensureUnitIsFreeForInterval(prisma, residentUnitId, nextCheckIn, nextCheckOut);
        } catch (availabilityError) {
          if (availabilityError instanceof Error && availabilityError.message === 'ROOM_NOT_AVAILABLE') {
            return res.status(409).json({ error: 'This room or bed is already occupied for the selected interval.' });
          }
          throw availabilityError;
        }
      }
    }

    if (email) {
      const existing = await prisma.account.findUnique({ where: { email } });
      if (existing) return res.status(409).json({ error: 'Email already registered in the system.' });
    }

    const createPayload: Prisma.AccountCreateInput = {
      firstName,
      lastName,
      email,
      phone,
      parentPhone,
      gender: gender ? (gender as any) : undefined,
      idType: idType ? (idType as any) : undefined,
      idNumber,
      address,
      city,
      state,
      pincode,
      department: role === 'SUPER_ADMIN' ? 'GODMODE' : role === 'MANAGER' ? 'MANAGEMENT' : department,
      designation,
      baseSalary: baseSalary === null || baseSalary === undefined ? null : parseFloat(String(baseSalary)) || 0,
      recurringSubsidy: recurringSubsidy === null || recurringSubsidy === undefined ? null : parseFloat(String(recurringSubsidy)) || 0,
      joinDate: joinDate ? new Date(joinDate) : null,
      leftDate: leftDate ? new Date(leftDate) : null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      role: role as any,
      customerType: role === 'CUSTOMER' ? (cleanData.customerType as any) : customerType ? (customerType as any) : 'NONE',
    };

    if (role === 'CUSTOMER' && residentPropertyIds.length > 0) {
      createPayload.residentProperty = { connect: { id: residentPropertyIds[0]! } };
    }

    if (password) {
      createPayload.passwordHash = await bcrypt.hash(password, 10);
    }

    // Super admins should have access to all existing properties by default.
    let propertyConnections: Array<{ id: number }> = [];
    if (role === 'SUPER_ADMIN') {
      const allProperties = await prisma.property.findMany({ where: { isDeleted: false }, select: { id: true } });
      propertyConnections = allProperties.map((property) => ({ id: property.id }));
    } else {
      const props = propertyIds || req.body.propertyIds;
      if (props && Array.isArray(props) && props.length > 0) {
        propertyConnections = props.map((id: number | string) => ({ id: Number(id) }));
      }
    }

    if (role === 'STAFF' || role === 'MANAGER') {
      if (propertyConnections.length === 0) {
        return res.status(400).json({ error: 'At least one property is required for an employee.' });
      }

      const employeePropertyIds = propertyConnections.map((property) => property.id);
      const requestedProperties = await prisma.property.findMany({
        where: { id: { in: employeePropertyIds }, isDeleted: false },
        select: { id: true },
      });
      if (requestedProperties.length !== employeePropertyIds.length) {
        return res.status(404).json({ error: 'One or more selected properties were not found.' });
      }

      if (currentUserRole === 'MANAGER') {
        if (!currentUserId) {
          return res.status(401).json({ error: 'Authentication context missing.' });
        }
        const managedProperties = await prisma.property.findMany({
          where: { id: { in: employeePropertyIds }, managers: { some: { id: currentUserId } } },
          select: { id: true },
        });
        if (managedProperties.length !== employeePropertyIds.length) {
          return res.status(403).json({ error: 'You can only assign employees to properties you manage.' });
        }
      }
    }

    if (role === 'MANAGER') {
      createPayload.managedProperties = { connect: propertyConnections };
    } else if (role === 'STAFF') {
      createPayload.staffProperties = { connect: propertyConnections };
    } else if (role === 'SUPER_ADMIN' && propertyConnections.length > 0) {
      createPayload.managedProperties = { connect: propertyConnections };
    }

    const newAccount = await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: createPayload,
        select: { id: true },
      });

      if (residentProperty && residentUnitId) {
        const selectedUnit = await tx.unit.findUnique({
          where: { id: residentUnitId },
          select: { id: true, type: true, category: true, capacity: true, defaultPricePerNight: true, defaultRecurringMonthlyRate: true },
        });

        if (selectedUnit) {
          const nextCheckIn = checkIn ? new Date(checkIn) : new Date();
          const nextCheckOut = checkOut ? new Date(checkOut) : null;
          const isMonthlyAssignment = residentProperty.type.startsWith('HOSTEL_');
          const billingStrategy = isMonthlyAssignment ? 'RECURRING_MONTHLY' : 'PER_NIGHT_STAY' as const;
          const agreedRate = resolveAgreedRate({
            billingStrategy,
            agreedPricePerNight,
            agreedMonthlyRate,
            defaultPricePerNight: selectedUnit.defaultPricePerNight,
            defaultRecurringMonthlyRate: selectedUnit.defaultRecurringMonthlyRate,
          });
          const customRate = calculateIsCustomRate({
            billingStrategy,
            agreedPricePerNight,
            agreedMonthlyRate,
            defaultPricePerNight: selectedUnit.defaultPricePerNight,
            defaultRecurringMonthlyRate: selectedUnit.defaultRecurringMonthlyRate,
          });

          const reservation = await tx.reservationRequest.create({
            data: {
              propertyId: residentProperty.id,
              guestName: `${firstName.trim()} ${lastName.trim()}`.trim(),
              mobile: phone || '',
              email: email || null,
              requestedCategory: selectedUnit.category as any,
              requestedType: selectedUnit.type as any,
              requestedQuantity: 1,
              requestedCustomerType: (cleanData.customerType ?? 'HOSTELER') as any,
              numberOfAdults: 1,
              numberOfChildren: 0,
              expectedCheckIn: nextCheckIn,
              expectedCheckOut: nextCheckOut,
              purpose: 'Manual guest creation by staff',
              status: 'CONVERTED',
              convertedAt: new Date(),
            },
          });

          await tx.reservationOccupant.create({
            data: {
              reservationRequestId: reservation.id,
              isPrimary: true,
              firstName: firstName.trim(),
              lastName: lastName.trim() || null,
              phone: phone || null,
              email: email || null,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
              gender: gender ? (gender as any) : null,
              address: address || null,
              city: city || null,
              state: state || null,
              pincode: pincode || null,
              idType: idType ? (idType as any) : null,
              idNumber: idNumber || null,
              photoUrl: photoUrl ?? null,
              idProofPhotoUrl: idProofPhotoUrl || null,
            },
          });

          const createdAssignment = await tx.unitAssignment.create({
            data: {
              unitId: residentUnitId,
              accountId: account.id,
              reservationRequestId: reservation.id,
              billingStrategy,
              expectedCheckIn: nextCheckIn,
              expectedCheckOut: nextCheckOut,
              isActive: true,
              agreedPricePerNight: isMonthlyAssignment ? null : agreedRate,
              agreedMonthlyRate: isMonthlyAssignment ? agreedRate : null,
              agreedMonthlyMessRate: isMonthlyAssignment && includeMess && agreedMonthlyMessRate !== null && agreedMonthlyMessRate !== undefined
                ? Number(agreedMonthlyMessRate)
                : null,
              isCustomRate: customRate,
            },
          });

          await tx.unit.update({
            where: { id: residentUnitId },
            data: { status: 'OCCUPIED' },
          });
        }
      }

      return tx.account.findUniqueOrThrow({
        where: { id: account.id },
        select: safeAccountSelect,
      });
    });

    await logAction(req, 'ACCOUNT', newAccount.id, 'CREATE_INTERNAL_ACCOUNT', { role: newAccount.role });

    return res.status(201).json({ message: 'Account initialized successfully.', account: newAccount });
  } catch (error: any) {
    if (error.message === 'MISSING_AGREED_RATE') return res.status(400).json({ error: 'A valid agreed rate is required for the selected room.' });
    console.error('[AccountController: createAccount]', error);
    return res.status(500).json({ error: 'Internal Server Error during account creation.' });
  }
};

/**
 * @route   PATCH /api/accounts/:accountId
 */
export const updateAccount = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) return res.status(401).json({ error: 'Authentication required.' });

    const accountId = req.params.accountId === 'me' || !req.params.accountId
      ? currentUserId
      : parseInt(String(req.params.accountId), 10);

    if (isNaN(accountId)) return res.status(400).json({ error: 'Invalid account ID.' });

    const cleanData = sanitizeFormData(req.body);
    const currentUserRole = req.user?.role;

    const targetAccount = await prisma.account.findUnique({ where: { id: accountId } });
    console.debug('[AccountController:updateAccount] Employee update', {
      actorId: currentUserId,
      actorRole: currentUserRole,
      targetAccountId: accountId,
      targetRole: targetAccount?.role,
      requestedRole: cleanData.role,
      propertyIds: cleanData.propertyIds,
      department: cleanData.department,
    });
    if (!targetAccount || targetAccount.isDeleted) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    if (currentUserRole === 'MANAGER' && targetAccount.id !== currentUserId) {
      if (targetAccount.role === 'SUPER_ADMIN' || targetAccount.role === 'MANAGER') {
        return res.status(403).json({ error: 'Forbidden: Cannot modify peer or superior administrative accounts.' });
      }
    }

    // Extract raw payload values that shouldn't be mapped directly
    const {
      propertyIds,
      managedProperties,
      staffProperties,
      residentProperty,
      unitAssignments,
      hostelMealAssignments,
      billingStrategy,
      unitId,
      checkIn,
      checkOut,
      password,
      gender,
      idType,
      idNumber,
      joinDate,
      leftDate,
      dateOfBirth,
      baseSalary,
      recurringSubsidy,
      agreedPricePerNight,
      agreedMonthlyRate,
      agreedMonthlyMessRate,
      isCustomRate,
      includeMess = agreedMonthlyMessRate !== null && agreedMonthlyMessRate !== undefined,
      ...restUpdateData
    } = cleanData;
    
    // Explicit protection against backend state overrides
    const protectedFields = ['id', 'createdAt', 'updatedAt', 'isDeleted', 'passwordHash'];
    protectedFields.forEach((field) => delete restUpdateData[field]);

    const updatePayload: Prisma.AccountUpdateInput = {
      ...restUpdateData,
    };
    let residentAssignmentUpdate: {
      assignmentId: number;
      previousUnitId: number;
      nextUnitId: number;
      checkIn: Date;
      checkOut: Date | null;
      agreedPricePerNight: Prisma.Decimal | null;
      agreedMonthlyRate: Prisma.Decimal | null;
      agreedMonthlyMessRate: Prisma.Decimal | null;
      isCustomRate: boolean;
    } | null = null;
    let residentAssignmentCreate: {
      unitId: number;
      propertyId: number;
      unitType: string;
      unitCategory: string;
      defaultPricePerNight: Prisma.Decimal | null;
      defaultRecurringMonthlyRate: Prisma.Decimal | null;
      agreedPricePerNight: Prisma.Decimal | null;
      agreedMonthlyRate: Prisma.Decimal | null;
      isCustomRate: boolean;
      checkIn: Date;
      checkOut: Date | null;
    } | null = null;

    // 1. Force explicitly extracted String/Enum fields into the payload (allowing null to wipe them)
    if (gender !== undefined) updatePayload.gender = gender;
    if (idType !== undefined) updatePayload.idType = idType;
    if (idNumber !== undefined) updatePayload.idNumber = idNumber ? String(idNumber).trim() : null;

    // 2. Safely parse string timestamps into native JS Date Objects for Prisma (or null if cleared)
    if (joinDate !== undefined) {
      updatePayload.joinDate = joinDate ? new Date(joinDate) : null;
    }
    if (leftDate !== undefined) {
      updatePayload.leftDate = leftDate ? new Date(leftDate) : null;
    }
    if (dateOfBirth !== undefined) {
      updatePayload.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    // Handle financial precision formatting safely
    if (baseSalary !== undefined) {
      updatePayload.baseSalary = baseSalary === null ? null : parseFloat(String(baseSalary)) || 0;
    }
    if (recurringSubsidy !== undefined) {
      updatePayload.recurringSubsidy = recurringSubsidy === null ? null : parseFloat(String(recurringSubsidy)) || 0;
    }

    if (password) {
      updatePayload.passwordHash = await bcrypt.hash(password, 10);
    }

    if (restUpdateData.email) {
      const existingEmail = await prisma.account.findFirst({
        where: { email: String(restUpdateData.email), id: { not: accountId }, isDeleted: false },
        select: { id: true },
      });
      if (existingEmail) return res.status(409).json({ error: 'Email already registered in the system.' });
    }

    const targetRole = restUpdateData.role || targetAccount.role;
    const roleChanged = restUpdateData.role && restUpdateData.role !== targetAccount.role;

    if (targetRole === 'SUPER_ADMIN') {
      updatePayload.department = 'GODMODE';
    } else if (targetRole === 'MANAGER') {
      updatePayload.department = 'MANAGEMENT';
    }

    if (currentUserRole === 'MANAGER' && targetAccount.role !== 'CUSTOMER' && targetRole !== 'STAFF') {
      return res.status(403).json({ error: 'Managers can only create or update STAFF accounts.' });
    }

    if (targetRole === 'CUSTOMER') {
      const residentPropertyIds = [...new Set(
        (Array.isArray(propertyIds) ? propertyIds : [])
          .map((id: unknown) => Number(id))
          .filter((id: number) => Number.isInteger(id) && id > 0)
      )];
      if (residentPropertyIds.length === 0) {
        return res.status(400).json({ error: 'At least one valid property is required for residents.' });
      }
            if (residentPropertyIds.length !== 1) {
              return res.status(400).json({ error: 'A resident can be assigned to exactly one property.' });
            }

      const residentProperties = await prisma.property.findMany({
        where: { id: { in: residentPropertyIds }, isDeleted: false },
        select: { id: true, type: true },
      });
      if (residentProperties.length !== residentPropertyIds.length) {
        return res.status(404).json({ error: 'One or more selected properties were not found.' });
      }

      const requestedCustomerType = residentProperties[0]!.type.startsWith('HOSTEL_') && !cleanData.checkOut
        ? 'HOSTELER'
        : cleanData.customerType ? String(cleanData.customerType).toUpperCase() : 'HOSTELER';
      const expectedCustomerType = residentProperties[0]!.type === 'HOTEL' ? 'HOTEL_GUEST' : 'HOSTEL_GUEST';
      if (requestedCustomerType === 'HOSTELER' && !residentProperties[0]!.type.startsWith('HOSTEL_')) {
        return res.status(400).json({ error: 'Residents can only be assigned to hostel properties.' });
      }
      if (requestedCustomerType !== 'HOSTELER' && requestedCustomerType !== expectedCustomerType) {
        return res.status(400).json({ error: 'Guest subtype must match the selected property type.' });
      }

      if (currentUserRole === 'MANAGER') {
        if (!currentUserId) {
          return res.status(401).json({ error: 'Authentication context missing.' });
        }
        const managedProperties = await prisma.property.findMany({
          where: { id: { in: residentPropertyIds }, managers: { some: { id: currentUserId } } },
          select: { id: true },
        });
        if (managedProperties.length !== residentPropertyIds.length) {
          return res.status(403).json({ error: 'You are not authorized to update residents in this property.' });
        }
      }

      updatePayload.role = 'CUSTOMER';
      updatePayload.customerType = requestedCustomerType as any;
      updatePayload.residentProperty = { connect: { id: residentPropertyIds[0]! } };

      if (unitId) {
        const parsedUnitId = Number(unitId);
        const residentUnit = await prisma.unit.findFirst({
          where: { id: parsedUnitId, propertyId: { in: residentPropertyIds } },
          select: { id: true, type: true, category: true, propertyId: true, defaultPricePerNight: true, defaultRecurringMonthlyRate: true },
        });
        if (!residentUnit) {
          return res.status(400).json({ error: 'The selected unit does not belong to the selected property.' });
        }

        const currentAssignment = await prisma.unitAssignment.findFirst({
          where: { accountId, isActive: true },
          select: { id: true, unitId: true },
        });
        const selectedCheckIn = cleanData.checkIn ? new Date(cleanData.checkIn) : new Date();
        const selectedCheckOut = cleanData.checkOut ? new Date(cleanData.checkOut) : null;
        if (selectedCheckOut && selectedCheckIn >= selectedCheckOut) {
          return res.status(400).json({ error: 'Check-out date must be after check-in date.' });
        }

        try {
          await ensureUnitIsFreeForInterval(prisma, residentUnit.id, selectedCheckIn, selectedCheckOut, currentAssignment?.id);
        } catch (availabilityError) {
          if (availabilityError instanceof Error && availabilityError.message === 'ROOM_NOT_AVAILABLE') {
            console.warn('[AccountController:updateAccount] Resident assignment conflict', {
              accountId,
              assignmentId: currentAssignment?.id ?? null,
              currentUnitId: currentAssignment?.unitId ?? null,
              requestedUnitId: residentUnit.id,
              checkIn: selectedCheckIn.toISOString(),
              checkOut: selectedCheckOut?.toISOString() ?? null,
            });
            return res.status(409).json({ error: 'This room or bed is already occupied for the selected interval.' });
          }
          throw availabilityError;
        }

        if (currentAssignment) {
          const billingStrategy = requestedCustomerType === 'HOSTELER' ? 'RECURRING_MONTHLY' : 'PER_NIGHT_STAY' as const;
          const agreedRate = resolveAgreedRate({
            billingStrategy,
            agreedPricePerNight,
            agreedMonthlyRate,
            defaultPricePerNight: residentUnit.defaultPricePerNight,
            defaultRecurringMonthlyRate: residentUnit.defaultRecurringMonthlyRate,
          });
          const customRate = calculateIsCustomRate({
            billingStrategy,
            agreedPricePerNight,
            agreedMonthlyRate,
            defaultPricePerNight: residentUnit.defaultPricePerNight,
            defaultRecurringMonthlyRate: residentUnit.defaultRecurringMonthlyRate,
          });
          residentAssignmentUpdate = {
            assignmentId: currentAssignment.id,
            previousUnitId: currentAssignment.unitId,
            nextUnitId: residentUnit.id,
            checkIn: selectedCheckIn,
            checkOut: selectedCheckOut,
            agreedPricePerNight: requestedCustomerType === 'HOSTELER' ? null : agreedRate,
            agreedMonthlyRate: requestedCustomerType === 'HOSTELER' ? agreedRate : null,
            agreedMonthlyMessRate: requestedCustomerType === 'HOSTELER' && includeMess && agreedMonthlyMessRate !== null && agreedMonthlyMessRate !== undefined
              ? new Prisma.Decimal(agreedMonthlyMessRate)
              : null,
            isCustomRate: customRate,
          };
        } else {
          const billingStrategy = requestedCustomerType === 'HOSTELER' ? 'RECURRING_MONTHLY' : 'PER_NIGHT_STAY' as const;
          const agreedRate = resolveAgreedRate({
            billingStrategy,
            agreedPricePerNight,
            agreedMonthlyRate,
            defaultPricePerNight: residentUnit.defaultPricePerNight,
            defaultRecurringMonthlyRate: residentUnit.defaultRecurringMonthlyRate,
          });
          const customRate = calculateIsCustomRate({
            billingStrategy,
            agreedPricePerNight,
            agreedMonthlyRate,
            defaultPricePerNight: residentUnit.defaultPricePerNight,
            defaultRecurringMonthlyRate: residentUnit.defaultRecurringMonthlyRate,
          });
          residentAssignmentCreate = {
            unitId: residentUnit.id,
            propertyId: residentUnit.propertyId,
            unitType: residentUnit.type,
            unitCategory: residentUnit.category,
            defaultPricePerNight: residentUnit.defaultPricePerNight,
            defaultRecurringMonthlyRate: residentUnit.defaultRecurringMonthlyRate,
            agreedPricePerNight: requestedCustomerType === 'HOSTELER' ? null : agreedRate,
            agreedMonthlyRate: requestedCustomerType === 'HOSTELER' ? agreedRate : null,
            isCustomRate: customRate,
            checkIn: selectedCheckIn,
            checkOut: selectedCheckOut,
          };
        }
      }
    }

    // Note: checking req.body directly because an empty array might be stripped/altered by sanitization depending on formData parser
    const incomingPropertyIds = propertyIds || req.body.propertyIds;

    if ((targetRole === 'STAFF' || targetRole === 'MANAGER') && Array.isArray(incomingPropertyIds)) {
      const employeePropertyIds = [...new Set(incomingPropertyIds
        .map((id: unknown) => Number(id))
        .filter((id: number) => Number.isInteger(id) && id > 0))];
      if (employeePropertyIds.length !== incomingPropertyIds.length || employeePropertyIds.length === 0) {
        return res.status(400).json({ error: 'At least one valid property is required for an employee.' });
      }

      const requestedProperties = await prisma.property.findMany({
        where: { id: { in: employeePropertyIds }, isDeleted: false },
        select: { id: true },
      });
      if (requestedProperties.length !== employeePropertyIds.length) {
        return res.status(404).json({ error: 'One or more selected properties were not found.' });
      }

      if (currentUserRole === 'MANAGER') {
        const managedProperties = await prisma.property.findMany({
          where: { id: { in: employeePropertyIds }, managers: { some: { id: currentUserId } } },
          select: { id: true },
        });
        if (managedProperties.length !== employeePropertyIds.length) {
          return res.status(403).json({ error: 'You can only assign employees to properties you manage.' });
        }
      }
    }

    // Wrap relational lists within valid Prisma relational action blocks ({ set: [...] })
    if (incomingPropertyIds && Array.isArray(incomingPropertyIds)) {
      const propertyConnections = incomingPropertyIds.map((id: any) => ({ id: Number(id) }));
      
      if (targetRole === 'MANAGER') {
        updatePayload.managedProperties = { set: propertyConnections };
        updatePayload.staffProperties = { set: [] }; 
      } else if (targetRole === 'STAFF') {
        updatePayload.staffProperties = { set: propertyConnections };
        updatePayload.managedProperties = { set: [] }; 
      } else {
        updatePayload.managedProperties = { set: [] };
        updatePayload.staffProperties = { set: [] };
      }
    } else if (req.body.propertyIds === '' || incomingPropertyIds?.length === 0) {
       // If properties were explicitly cleared out
       updatePayload.managedProperties = { set: [] };
       updatePayload.staffProperties = { set: [] };
    } else if (roleChanged) {
      if (targetRole === 'SUPER_ADMIN') {
        const allProperties = await prisma.property.findMany({ where: { isDeleted: false }, select: { id: true } });
        updatePayload.managedProperties = { set: allProperties.map((property) => ({ id: property.id })) };
        updatePayload.staffProperties = { set: [] };
      } else if (targetRole === 'MANAGER') {
        updatePayload.staffProperties = { set: [] };
      } else if (targetRole === 'STAFF') {
        updatePayload.managedProperties = { set: [] };
      } else {
        updatePayload.managedProperties = { set: [] };
        updatePayload.staffProperties = { set: [] };
      }
    }

    const updatedAccount = await prisma.$transaction(async (tx) => {
      const account = await tx.account.update({
        where: { id: accountId },
        data: updatePayload,
        select: safeAccountSelect,
      });

      if (residentAssignmentUpdate) {
        await tx.unitAssignment.update({
          where: { id: residentAssignmentUpdate.assignmentId },
          data: {
            unitId: residentAssignmentUpdate.nextUnitId,
            expectedCheckIn: residentAssignmentUpdate.checkIn,
            expectedCheckOut: residentAssignmentUpdate.checkOut,
            agreedPricePerNight: residentAssignmentUpdate.agreedPricePerNight,
            agreedMonthlyRate: residentAssignmentUpdate.agreedMonthlyRate,
            agreedMonthlyMessRate: residentAssignmentUpdate.agreedMonthlyMessRate,
            isCustomRate: residentAssignmentUpdate.isCustomRate,
          },
        });
        await tx.unit.update({ where: { id: residentAssignmentUpdate.nextUnitId }, data: { status: 'OCCUPIED' } });
        if (residentAssignmentUpdate.previousUnitId !== residentAssignmentUpdate.nextUnitId) {
          const remainingAssignments = await tx.unitAssignment.count({ where: { unitId: residentAssignmentUpdate.previousUnitId, isActive: true } });
          if (remainingAssignments === 0) {
            await tx.unit.update({ where: { id: residentAssignmentUpdate.previousUnitId }, data: { status: 'AVAILABLE' } });
          }
        }
      }

      if (residentAssignmentCreate) {
        const reservation = await tx.reservationRequest.create({
          data: {
            propertyId: residentAssignmentCreate.propertyId,
            primaryAccountId: accountId,
            guestName: `${String(restUpdateData.firstName ?? targetAccount.firstName)} ${String(restUpdateData.lastName ?? targetAccount.lastName)}`.trim(),
            mobile: String(restUpdateData.phone ?? targetAccount.phone ?? ''),
            email: restUpdateData.email ?? targetAccount.email ?? null,
            requestedCategory: residentAssignmentCreate.unitCategory as any,
            requestedType: residentAssignmentCreate.unitType as any,
            requestedCustomerType: (updatePayload.customerType ?? targetAccount.customerType) as any,
            expectedCheckIn: residentAssignmentCreate.checkIn,
            expectedCheckOut: residentAssignmentCreate.checkOut,
            purpose: 'Residence assignment added during resident update',
            status: 'CONVERTED',
            convertedAt: new Date(),
          },
        });

        const createdAssignment = await tx.unitAssignment.create({
          data: {
            unitId: residentAssignmentCreate.unitId,
            accountId,
            reservationRequestId: reservation.id,
            billingStrategy: updatePayload.customerType === 'HOSTELER' ? 'RECURRING_MONTHLY' : 'PER_NIGHT_STAY',
            expectedCheckIn: residentAssignmentCreate.checkIn,
            expectedCheckOut: residentAssignmentCreate.checkOut,
            isActive: true,
            agreedPricePerNight: residentAssignmentCreate.agreedPricePerNight,
            agreedMonthlyRate: residentAssignmentCreate.agreedMonthlyRate,
            agreedMonthlyMessRate: updatePayload.customerType === 'HOSTELER' && includeMess && agreedMonthlyMessRate !== null && agreedMonthlyMessRate !== undefined
              ? new Prisma.Decimal(agreedMonthlyMessRate)
              : null,
            isCustomRate: residentAssignmentCreate.isCustomRate,
          },
        });

        await tx.unit.update({ where: { id: residentAssignmentCreate.unitId }, data: { status: 'OCCUPIED' } });
      }

      return account;
    });

    await logAction(req, 'ACCOUNT', updatedAccount.id, 'UPDATE_ACCOUNT', updatePayload);

    return res.status(200).json({ message: 'Account updated successfully.', account: updatedAccount });
  } catch (error) {
    console.error('[AccountController: updateAccount]', {
      error,
      accountId: req.params.accountId,
      body: req.body,
    });
    if ((error as { code?: string })?.code === 'P2002') {
      return res.status(409).json({ error: 'An account with one of these unique fields already exists.' });
    }
    return res.status(500).json({ error: 'Internal Server Error during account modification.' });
  }
};

/**
 * @route   PATCH /api/accounts/:accountId/status
 */
export const toggleAccountStatus = async (req: Request, res: Response) => {
  try {
    const accountId = parseInt(String(req.params.accountId), 10);
    const { isActive, isDeleted } = req.body;

    if (isNaN(accountId)) return res.status(400).json({ error: 'Invalid account ID.' });

    const currentUserRole = req.user?.role;
    
    if (req.user?.id === accountId) {
      return res.status(400).json({ error: 'Operation rejected: Cannot modify own terminal status.' });
    }

    const targetAccount = await prisma.account.findUnique({ where: { id: accountId } });
    if (!targetAccount) return res.status(404).json({ error: 'Account not found.' });

    if (targetAccount.role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Super admin accounts cannot be deleted or deactivated.' });
    }

    if (currentUserRole === 'MANAGER') {
      if (targetAccount.role !== 'STAFF' && targetAccount.role !== 'CUSTOMER') {
        return res.status(403).json({ error: 'Managers can only modify STAFF or CUSTOMER accounts.' });
      }
      const managerId = req.user?.id;
      if (!managerId) {
        return res.status(401).json({ error: 'Authentication context missing.' });
      }

      const sharedProperty = targetAccount.role === 'STAFF'
        ? await prisma.property.findFirst({
            where: { managers: { some: { id: managerId } }, staff: { some: { id: accountId } } },
            select: { id: true },
          })
        : await prisma.property.findFirst({
            where: {
              managers: { some: { id: managerId } },
              OR: [
                { residents: { some: { id: accountId } } },
                { units: { some: { unitAssignments: { some: { accountId, isActive: true } } } } },
              ],
            },
            select: { id: true },
          });
      if (!sharedProperty) {
        return res.status(403).json({ error: 'Account is outside your managed property scope.' });
      }
    }

    const updatePayload: Prisma.AccountUpdateInput = {};
    if (isActive !== undefined) updatePayload.isActive = Boolean(isActive);
    if (isDeleted !== undefined) updatePayload.isDeleted = Boolean(isDeleted);

    const updatedAccount = await prisma.$transaction(async (tx) => {
      const updated = await tx.account.update({
        where: { id: accountId },
        data: updatePayload,
        select: safeAccountSelect,
      });

      if (isDeleted === true && targetAccount.role === 'CUSTOMER') {
        const activeAssignments = await tx.unitAssignment.findMany({
          where: { accountId, isActive: true },
          select: { id: true, unitId: true },
        });
        await tx.unitAssignment.updateMany({ where: { accountId, isActive: true }, data: { isActive: false } });
        for (const assignment of activeAssignments) {
          const remaining = await tx.unitAssignment.count({ where: { unitId: assignment.unitId, isActive: true } });
          if (remaining === 0) {
            await tx.unit.update({ where: { id: assignment.unitId }, data: { status: 'AVAILABLE' } });
          }
        }
      }

      return updated;
    });

    await logAction(req, 'ACCOUNT', updatedAccount.id, 'TOGGLE_STATUS', { isActive, isDeleted });

    return res.status(200).json({ message: 'Account status updated successfully.', account: updatedAccount });
  } catch (error) {
    console.error('[AccountController: toggleAccountStatus]', error);
    return res.status(500).json({ error: 'Internal Server Error executing status modification.' });
  }
};

export const getAccountHistory = async (req: Request, res: Response) => {
  const accountId = Number(req.params.accountId);
  const requestedPropertyId = req.query.propertyId ? Number(req.query.propertyId) : null;

  if (!Number.isInteger(accountId) || accountId <= 0) return res.status(400).json({ error: 'Invalid account ID.' });
  if (requestedPropertyId !== null && (!Number.isInteger(requestedPropertyId) || requestedPropertyId <= 0)) {
    return res.status(400).json({ error: 'Invalid property ID.' });
  }

  try {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: safeAccountSelect,
    });
    if (!account || account.role !== 'CUSTOMER' || account.isDeleted) {
      return res.status(404).json({ error: 'Guest account not found.' });
    }

    let propertyIds: number[] | undefined;
    if (req.user?.role === 'SUPER_ADMIN') {
      propertyIds = requestedPropertyId ? [requestedPropertyId] : undefined;
    } else if (req.user?.role === 'MANAGER') {
      const properties = await prisma.property.findMany({
        where: {
          isDeleted: false,
          managers: { some: { id: req.user.id } },
          ...(requestedPropertyId ? { id: requestedPropertyId } : {}),
        },
        select: { id: true },
      });
      if (requestedPropertyId && properties.length !== 1) {
        return res.status(403).json({ error: 'PROPERTY_SCOPE_DENIED' });
      }
      propertyIds = properties.map((property) => property.id);
    } else {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const assignments = await prisma.unitAssignment.findMany({
      where: {
        accountId,
        ...(propertyIds ? { unit: { propertyId: { in: propertyIds } } } : {}),
      },
      include: {
        unit: { include: { property: { select: { id: true, name: true, type: true } } } },
        reservationRequest: {
          include: {
            occupants: { orderBy: { createdAt: 'asc' } },
          },
        },
        accompanyingGuests: true,
      },
      orderBy: { expectedCheckIn: 'desc' },
    });

    return res.json({
      account,
      history: assignments.map((assignment) => ({
        assignmentId: assignment.id,
        reservationId: assignment.reservationRequestId,
        property: assignment.unit.property,
        unit: assignment.unit,
        checkIn: assignment.actualCheckIn ?? assignment.expectedCheckIn,
        checkOut: assignment.actualCheckOut ?? assignment.expectedCheckOut,
        isCurrent: assignment.isActive,
        reservation: assignment.reservationRequest,
        occupants: assignment.reservationRequest?.occupants ?? [],
        accompanyingGuests: assignment.accompanyingGuests,
      })),
    });
  } catch (error) {
    console.error('[AccountController:getAccountHistory]', error);
    return res.status(500).json({ error: 'Failed to load guest history.' });
  }
};