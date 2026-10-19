import type { Request, Response } from 'express';
/**
 * @route   POST /api/auth/register
 * @desc    Public endpoint for landing page sign-ups. Strictly forces CUSTOMER role.
 */
export declare const registerPublicUser: (req: Request, res: Response) => Promise<void>;
/**
 * @route   POST /api/auth/login
 * @desc    Admin Panel Login: Authenticates user, creates session, issues tokens. STRICTLY ADMINS ONLY.
 */
export declare const login: (req: Request, res: Response) => Promise<void>;
/**
 * @route   POST /api/auth/website-login
 * @desc    Public Website Login: Authenticates customers, creates session, issues tokens.
 */
export declare const websiteLogin: (req: Request, res: Response) => Promise<void>;
/**
 * @route   POST /api/auth/refresh
 * @desc    Issues a new Access Token using a valid Refresh Token
 */
export declare const refresh: (req: Request, res: Response) => Promise<void>;
/**
 * @route   POST /api/auth/logout
 * @desc    Destroys the session and clears the cookie
 */
export declare const logout: (req: Request, res: Response) => Promise<void>;
/**
 * @route   GET /api/auth/me
 * @desc    Get current user info using access token
 */
export declare const getCurrentUser: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map