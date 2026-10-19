import type { Request, Response } from 'express';
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
export declare const createProperty: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   GET /api/properties
 * @desc    Fetch properties contextualized by roles (Global vs Multi-Tenant isolation)
 * @access  Private (All Authenticated Staff Roles)
 */
export declare const getProperties: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   GET /api/public/properties
 * @desc    Fetch all available properties for public website (no authentication required)
 * @access  Public
 */
export declare const getPublicProperties: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   GET /api/public/properties/:propertyId
 * @desc    Fetch a single property's details for public website (no authentication required)
 * @access  Public
 */
export declare const getPublicPropertyById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   GET /api/properties/:propertyId
 * @desc    Fetch a single property's details
 * @access  Private (SUPER_ADMIN, MANAGER/STAFF via scope check)
 */
export declare const getPropertyById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   PATCH /api/properties/:propertyId
 * @desc    Update partial configurations of an existing property profile
 * @access  Private (SUPER_ADMIN, MANAGER via scope check)
 */
export declare const updateProperty: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   POST /api/properties/:propertyId/deactivate
 * @desc    Secure, password-verified Soft Delete mechanism for full system property closure
 * @access  Private (SUPER_ADMIN Only via Middleware + Password Check)
 */
export declare const deleteProperty: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   GET /api/public/properties/:propertyId/units
 * @desc    Fetch available units for a property (no authentication required)
 * @access  Public
 */
export declare const getPublicUnitsByPropertyId: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=property.controller.d.ts.map