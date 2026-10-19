import type { Request, Response, NextFunction } from 'express';
/**
 * Middleware to enforce tenant isolation.
 * Intercepts property-specific requests by dropping STAFF entirely, verifying
 * MANAGER cross-relational mappings, and allowing SUPER_ADMIN bypass.
 */
export declare const requirePropertyScope: (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=scope.middleware.d.ts.map