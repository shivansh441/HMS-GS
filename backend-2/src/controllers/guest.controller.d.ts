import type { Request, Response } from 'express';
export declare const getGuestCards: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/properties/:propertyId/assignments/:unitAssignmentId/kyc
 * Updates the Primary Account and adds Accompanying Guests while enforcing capacity and compliance.
 */
export declare const uploadKyc: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * PATCH /api/properties/:propertyId/assignments/:unitAssignmentId/kyc/verify
 * Logs a manual staff verification event.
 */
export declare const verifyKyc: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /api/guests/merge
 * Safely merges duplicate accounts while protecting active in-house stays.
 */
export declare const mergeGuests: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=guest.controller.d.ts.map