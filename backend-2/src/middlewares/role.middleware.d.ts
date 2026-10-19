import type { Request, Response, NextFunction } from 'express';
/**
 * Factory function to generate a middleware that restricts route access
 * based on the user's role.
 * @param allowedRoles - An array of roles (e.g., ['SUPER_ADMIN', 'MANAGER']) permitted to access the route
 * @returns Express middleware function
 */
export declare const requireRole: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=role.middleware.d.ts.map