import type { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenVerificationError } from '../utils/crypto.js';
import type { TokenPayload } from '../utils/crypto.js';

// ============================================================================
// TYPE AUGMENTATION
// ============================================================================

// This extends the default Express Request object globally within this project
// to recognize our custom 'user' property.
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Middleware to protect routes. 
 * Extracts Bearer token from headers, verifies it, and attaches the payload to req.user.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // 1. Extract the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required. Missing or malformed Authorization header.' });
      return; // Ensure we exit the function so next() is not called
    }

    // 2. Extract the token string
    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Authentication required. Token missing.' });
      return;
    }

    // 3. Ensure the secret is available
    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      console.error('FATAL: ACCESS_TOKEN_SECRET is not defined in the environment variables.');
      res.status(500).json({ error: 'Internal server error.' });
      return;
    }

    // 4. Verify the token using our crypto utility
    const decodedPayload = verifyToken(token, secret);

    // 5. Attach the decoded payload to the Request object
    req.user = decodedPayload;

    // 6. Pass control to the next middleware or route handler
    next();
  } catch (error) {
    // Catch specific token errors (expired, invalid signature)
    if (error instanceof TokenVerificationError) {
      res.status(401).json({ error: error.message });
      return;
    }

    // Catch unexpected errors
    console.error('[Auth Middleware Error]:', error);
    res.status(500).json({ error: 'Internal server error during authentication.' });
    return;
  }
};