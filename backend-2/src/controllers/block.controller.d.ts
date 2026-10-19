import type { Request, Response } from 'express';
/**
 * @route   GET /api/properties/:propertyId/units/:unitId/blocks
 * @desc    Fetch all blocks for a unit (Calendar View)
 */
export declare const getUnitBlocks: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   POST /api/properties/:propertyId/units/:unitId/blocks
 * @desc    Schedule an emergency or maintenance block
 */
export declare const createUnitBlock: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   PATCH /api/properties/:propertyId/units/:unitId/blocks/:blockId
 * @desc    Extend or modify an active/future block
 */
export declare const updateUnitBlock: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   DELETE /api/properties/:propertyId/units/:unitId/blocks/:blockId
 * @desc    Lift a unit block early
 */
export declare const removeUnitBlock: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=block.controller.d.ts.map