import type { Request, Response } from 'express';
/**
 * PATCH /properties/:propertyId/assignments/:assignmentId/swap
 * Safely swaps a guest to a new room and flags rate discrepancies.
 */
export declare const swapUnit: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /properties/:propertyId/assignments/:assignmentId/emergency-relocation
 * The Midnight Pipe Burst: Swaps guest and instantly enforces a MAINTENANCE block on the old room.
 */
export declare const emergencyRelocation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * POST /properties/:propertyId/assignments
 * Create a manual unit assignment for an existing account (hosteler or guest).
 * Payload: { unitId: number, accountId: number, expectedCheckIn: ISOString, expectedCheckOut?: ISOString }
 */
export declare const updateAssignment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createAssignment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=roster.controller.d.ts.map