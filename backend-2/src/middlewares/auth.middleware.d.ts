import type { Request, Response, NextFunction } from 'express';
import type { TokenPayload } from '../utils/crypto.js';
declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}
/**
 * Middleware to protect routes.
 * Extracts Bearer token from headers, verifies it, and attaches the payload to req.user.
 */
export declare const requireAuth: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map