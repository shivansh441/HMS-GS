import type { Request, Response } from 'express';
/**
 * POST /api/properties/:propertyId/reservations/:reservationId/check-in
 * State Machine: APPROVED -> CONVERTED
 */
export declare const checkIn: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/properties/:propertyId/reservations/:reservationId/check-out
 * State Machine: CONVERTED -> CONVERTED (released assignments) or CANCELLED if forced
 */
export declare const checkOut: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * PATCH /api/properties/:propertyId/reservations/:reservationId/extend
 * Handles date extensions and checks for layout overlap traps.
 */
export declare const extendStay: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=frontdesk.controller.d.ts.map