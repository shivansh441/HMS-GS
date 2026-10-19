import type { Request, Response } from 'express';
/**
 * ----------------------------------------------------------------------
 * CONTROLLERS
 * ----------------------------------------------------------------------
 */
export declare const getAvailableUnits: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createUnit: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createUnitsBulk: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateUnit: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteUnit: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=unit.controller.d.ts.map