import type { Request, Response } from 'express';
export declare const getHostelMenu: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const saveHostelMenu: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMealAssignments: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const assignMessFacility: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const optOutMessFacility: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFoodMenu: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const saveFoodMenuItem: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getFoodOrders: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createFoodOrder: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateFoodOrderStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=dining.controller.d.ts.map