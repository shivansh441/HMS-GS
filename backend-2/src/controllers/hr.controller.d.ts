import type { Request, Response } from 'express';
export declare const addPublicHoliday: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getPublicHolidays: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const addSalaryDeduction: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const toggleSalaryDeduction: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getStaffWorkRecords: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const saveStaffWorkRecord: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getStaffPayrolls: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const processStaffPayroll: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const recordPayrollPayment: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateStaffSalary: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getStaffSalaryHistory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=hr.controller.d.ts.map