import type { Request, Response } from 'express';
/**
 * POST /properties/:propertyId/reservations
 * Handles dynamic bed/room allocation and dual-billing strategies atomically.
 */
export declare const createReservation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /properties/:propertyId/reservations
 */
export declare const getReservations: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * GET /api/properties/reservations
 * Get all reservations (SUPER_ADMIN) or reservations for manager's properties
 */
export declare const getAllReservations: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * PATCH /properties/:propertyId/reservations/:reservationId/status
 */
export declare const updateReservationStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateReservation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   POST /api/public/reservations
 * @desc    Create a reservation request (public endpoint, no auth required)
 * @access  Public
 */
export declare const createPublicReservation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=reservation.controller.d.ts.map