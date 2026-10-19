import type { Request, Response } from 'express';
/**
 * @route   POST /api/properties/:propertyId/amenities/catalog
 * @desc    ADMIN: Uploads a new JSON catalog for amenities/menus and retires the old one.
 */
export declare const updatePropertyCatalog: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   GET /api/properties/:propertyId/amenities/catalog
 * @desc    EVERYONE: Retrieves the active property catalog/menu for a given date (defaults to today).
 */
export declare const getActiveCatalog: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   GET /api/properties/:propertyId/reservations/:reservationId/active-amenities
 * @desc    USER DASHBOARD: Checks the Financial Ledger to see what facilities the guest currently has active.
 */
export declare const getGuestActiveAmenities: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=amenity.controller.d.ts.map