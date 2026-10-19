import type { Request, Response } from 'express';
/**
 * @route   GET /api/accounts
 * @desc    Fetch a list of accounts with multi-tenant scope filtering
 */
export declare const getAccounts: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   GET /api/accounts/:accountId
 */
export declare const getCurrentAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAccountById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   POST /api/accounts
 */
export declare const createAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   PATCH /api/accounts/:accountId
 */
export declare const updateAccount: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
/**
 * @route   PATCH /api/accounts/:accountId/status
 */
export declare const toggleAccountStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getAccountHistory: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=account.controller.d.ts.map