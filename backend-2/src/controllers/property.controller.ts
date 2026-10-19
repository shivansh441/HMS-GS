import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client'; // REQUIRED for the strict typing in updateProperty
import { prisma } from '../utils/prisma.js'; // Ensure this path matches your setup
import { comparePassword } from '../utils/crypto.js';
import { logAction } from '../services/audit.service.js';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Strips empty strings from form data so Prisma doesn't crash on optional fields.
 */
const sanitizeFormData = (data: Record<string, any>) => {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    sanitized[key] = value === '' ? undefined : value;
  }
  return sanitized;
};

/**
 * Automatically fetches Latitude and Longitude based on Address using OpenStreetMap.
 * Note: Requires Node.js 18+ for native fetch.
 */
const geocodeAddress = async (address: string, city: string, state: string): Promise<{ lat: number; lng: number } | null> => {
  try {
    const query = encodeURIComponent(`${address}, ${city}, ${state}`);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: {
        'User-Agent': 'PropertyManagementApp/1.0', 
      },
    });
    
    if (!response.ok) return null;
    
    const data = (await response.json()) as any[];
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.warn('[Geocoding Warning] Failed to fetch coordinates:', error);
    return null; 
  }
};

// ============================================================================
// CONTROLLERS
// ============================================================================

/**
 * @route   POST /api/properties
 * @desc    Initialize a brand new property/tenant system-wide
 * @access  Private (SUPER_ADMIN Only via Middleware)
 */
/**
 * @route   POST /api/properties
 * @desc    Initialize a brand new property/tenant system-wide
 * @access  Private (SUPER_ADMIN Only via Middleware)
 */
export const createProperty = async (req: Request, res: Response) => {
  try {
    const cleanData = sanitizeFormData(req.body);

    // Extract managerIds from payload
    const { name, type, address, city, state, pincode, contactPhone, contactEmail, facilities, floors, managerIds } = cleanData;

    if (!name || !type || !address || !city || !state || !contactPhone) {
      return res.status(400).json({ error: 'Missing required fields. Name, type, address, city, state, and phone are mandatory.' });
    }

    let latitude: number | null = null;
    let longitude: number | null = null;
    
    const coords = await geocodeAddress(address, city, state);
    if (coords) {
      latitude = coords.lat;
      longitude = coords.lng;
    }

    const parsedFloors = floors ? parseInt(String(floors), 10) : 1;

    // FIX: Construct a strictly-typed payload object for Prisma first
    const createPayload: Prisma.PropertyCreateInput = {
      name,
      type,
      address,
      city,
      state,
      pincode,
      contactPhone,
      contactEmail,
      facilities: facilities || [],
      floors: isNaN(parsedFloors) ? 1 : parsedFloors,
      latitude,
      longitude,
      status: 'ACTIVE',
      currency: 'INR',
      standardMessRate: cleanData.standardMessRate && type !== 'HOTEL' ? new Prisma.Decimal(cleanData.standardMessRate) : null,
    };

    // Safely attach relational manager data ONLY if it exists, avoiding explicit 'undefined'
    const managerConnections: Array<{ id: number }> = [];
    if (managerIds && Array.isArray(managerIds) && managerIds.length > 0) {
      managerConnections.push(...managerIds.map((id: number) => ({ id })));
    }

    // Ensure all active SUPER_ADMIN accounts are connected to this new property so they retain global access.
    const superAdmins = await prisma.account.findMany({ where: { role: 'SUPER_ADMIN', isDeleted: false }, select: { id: true } });
    const superAdminConnections = superAdmins.map((admin) => ({ id: admin.id }));

    const uniqueManagerConnections = Array.from(new Map([...managerConnections, ...superAdminConnections].map((item) => [item.id, item])).values());

    if (uniqueManagerConnections.length > 0) {
      createPayload.managers = {
        connect: uniqueManagerConnections,
      };
    }

    const newProperty = await prisma.property.create({
      data: createPayload, // Pass the strictly-typed object here
      include: {
        managers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await logAction(req, 'PROPERTY', newProperty.id, 'CREATE_PROPERTY', { 
      name, 
      type, 
      assignedManagersCount: managerIds?.length || 0 
    });

    return res.status(201).json({ message: 'Property initialized successfully.', property: newProperty });
  } catch (error) {
    console.error('[PropertyController: createProperty]', error);
    return res.status(500).json({ error: 'Internal Server Error during property creation.' });
  }
};

/**
 * @route   GET /api/properties
 * @desc    Fetch properties contextualized by roles (Global vs Multi-Tenant isolation)
 * @access  Private (All Authenticated Staff Roles)
 */
export const getProperties = async (req: Request, res: Response) => {
  try {
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required: User identity context missing.' });
    }

    const properties = await prisma.property.findMany({
      where: {
        isDeleted: false,
        ...(isSuperAdmin
          ? {}
          : {
              OR: [
                { managers: { some: { id: userId } } },
                { staff: { some: { id: userId } } },
              ],
            }),
      },
      include: {
        managers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json(properties);
  } catch (error) {
    console.error('[PropertyController: getProperties]', error);
    return res.status(500).json({ error: 'Internal Server Error while retrieving data.' });
  }
};

/**
 * @route   GET /api/public/properties
 * @desc    Fetch all available properties for public website (no authentication required)
 * @access  Public
 */
export const getPublicProperties = async (req: Request, res: Response) => {
  try {
    const properties = await prisma.property.findMany({
      where: {
        isDeleted: false,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        contactPhone: true,
        contactEmail: true,
        facilities: true,
        currency: true,
        latitude: true,
        longitude: true,
        geofenceRadius: true,
        floors: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json(properties);
  } catch (error) {
    console.error('[PropertyController: getPublicProperties]', error);
    console.error('[PropertyController: getPublicProperties Details]', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({ error: 'Internal Server Error while retrieving public properties.' });
  }
};

/**
 * @route   GET /api/public/properties/:propertyId
 * @desc    Fetch a single property's details for public website (no authentication required)
 * @access  Public
 */
export const getPublicPropertyById = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId as string, 10);
    
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID provided.' });
    }

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        isDeleted: false,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        type: true,
        status: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        contactPhone: true,
        contactEmail: true,
        facilities: true,
        currency: true,
        latitude: true,
        longitude: true,
        geofenceRadius: true,
        floors: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found or not available.' });
    }

    return res.status(200).json(property);
  } catch (error) {
    console.error('[PropertyController: getPublicPropertyById]', error);
    console.error('[PropertyController: getPublicPropertyById Details]', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({ error: 'Internal Server Error fetching public property.' });
  }
};

/**
 * @route   GET /api/properties/:propertyId
 * @desc    Fetch a single property's details
 * @access  Private (SUPER_ADMIN, MANAGER/STAFF via scope check)
 */
export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId as string, 10);
    
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID provided.' });
    }

    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required: User identity context missing.' });
    }

    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        isDeleted: false,
        ...(isSuperAdmin ? {} : { managers: { some: { id: userId } } }),
      },
      include: {
        managers: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } }, 
      },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found or access denied.' });
    }

    return res.status(200).json(property);
  } catch (error) {
    console.error('[PropertyController: getPropertyById]', error);
    return res.status(500).json({ error: 'Internal Server Error fetching property.' });
  }
};

/**
 * @route   PATCH /api/properties/:propertyId
 * @desc    Update partial configurations of an existing property profile
 * @access  Private (SUPER_ADMIN, MANAGER via scope check)
 */
export const updateProperty = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId as string, 10);
    
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID provided.' });
    }

    const updateData = sanitizeFormData(req.body);
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const existingProperty = await prisma.property.findFirst({
      where: {
        id: propertyId,
        isDeleted: false,
        ...(isSuperAdmin ? {} : { managers: { some: { id: userId } } }),
      },
    });

    if (!existingProperty) {
      return res.status(404).json({ error: 'Property not found or access denied.' });
    }

    // --- FIX: Parse numerical fields to match Prisma Schema (Float/Int) ---
    if (updateData.floors !== undefined) {
      updateData.floors = parseInt(String(updateData.floors), 10);
    }
    if (updateData.latitude !== undefined) {
      updateData.latitude = parseFloat(String(updateData.latitude));
    }
    if (updateData.longitude !== undefined) {
      updateData.longitude = parseFloat(String(updateData.longitude));
    }
    if (updateData.standardMessRate !== undefined) {
      if (existingProperty.type === 'HOTEL' && updateData.standardMessRate !== null) {
        return res.status(400).json({ error: 'Hotel properties cannot have mess configuration.' });
      }
      updateData.standardMessRate = updateData.standardMessRate !== null ? new Prisma.Decimal(updateData.standardMessRate) : null;
    }
    // ----------------------------------------------------------------------

    // Isolate managerIds out of standard protected fields
    const { managerIds, ...restUpdateData } = updateData;

    const protectedFields = ['id', 'createdAt', 'updatedAt', 'isDeleted', 'type'];
    protectedFields.forEach((field) => delete restUpdateData[field]);

    // Construct a strictly-typed payload object
    const updatePayload: Prisma.PropertyUpdateInput = {
      ...restUpdateData,
    };

    // Attach relational manager data only if it exists
    if (managerIds && Array.isArray(managerIds)) {
      updatePayload.managers = {
        set: managerIds.map((id: number) => ({ id }))
      };
    }

    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: updatePayload,
      include: {
        managers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await logAction(req, 'PROPERTY', updatedProperty.id, 'UPDATE_PROPERTY', restUpdateData);

    return res.status(200).json({ message: 'Property updated successfully.', property: updatedProperty });
  } catch (error) {
    console.error('[PropertyController: updateProperty]', error);
    return res.status(500).json({ error: 'Internal Server Error during property modification.' });
  }
};

/**
 * @route   POST /api/properties/:propertyId/deactivate
 * @desc    Secure, password-verified Soft Delete mechanism for full system property closure
 * @access  Private (SUPER_ADMIN Only via Middleware + Password Check)
 */
export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId as string, 10);
    
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID provided.' });
    }

    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Security Challenge Failed: Administrative password required.' });
    }

    const targetProperty = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!targetProperty) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    if (targetProperty.isDeleted) {
      return res.status(400).json({ error: 'Property is already deactivated and isolated.' });
    }

    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ error: 'Authentication breakdown: Admin session invalid.' });
    }

    const administrator = await prisma.account.findUnique({
      where: { id: adminId }, 
    });

    if (!administrator || !administrator.passwordHash) {
      return res.status(401).json({ error: 'Authentication breakdown: Admin session invalid.' });
    }

    const isPasswordValid = await comparePassword(password, administrator.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Security Challenge Failed: Invalid password confirmation.' });
    }

    const deactivatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        isDeleted: true,
        status: 'CLOSED',
      },
    });

    await logAction(req, 'PROPERTY', deactivatedProperty.id, 'SOFT_DELETE_PROPERTY', {
      approvedBy: administrator.email,
      timestamp: new Date(),
    });

    return res.status(200).json({ message: 'Property successfully closed and isolated from active logic frameworks.' });
  } catch (error) {
    console.error('[PropertyController: deleteProperty]', error);
    return res.status(500).json({ error: 'Internal Server Error executing soft deactivation.' });
  }
};

/**
 * @route   GET /api/public/properties/:propertyId/units
 * @desc    Fetch available units for a property (no authentication required)
 * @access  Public
 */
export const getPublicUnitsByPropertyId = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.propertyId as string, 10);
    
    if (isNaN(propertyId)) {
      return res.status(400).json({ error: 'Invalid property ID provided.' });
    }

    const units = await prisma.unit.findMany({
      where: {
        propertyId: propertyId,
        isDeleted: false,
        status: 'AVAILABLE',
      },
      select: {
        id: true,
        unitNumber: true,
        floor: true,
        type: true,
        category: true,
        capacity: true,
        defaultPricePerNight: true,
        defaultRecurringMonthlyRate: true,
        features: true,
        status: true,
      },
    });

    return res.status(200).json(units);
  } catch (error) {
    console.error('[PropertyController: getPublicUnitsByPropertyId]', error);
    console.error('[PropertyController: getPublicUnitsByPropertyId Details]', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return res.status(500).json({ error: 'Internal server error fetching units.' });
  }
};
