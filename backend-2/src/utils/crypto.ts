import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken'; // Explicit type-only import

// ... rest of the file remains exactly the same ...

// ============================================================================
// TYPES & ERRORS
// ============================================================================

export interface TokenPayload extends JwtPayload {
  id: number;
  role: string; // Maps to AccountRole enum from Prisma
  propertyId?: number | null;
}

export class TokenVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenVerificationError';
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TokenVerificationError);
    }
  }
}

// ============================================================================
// PASSWORD UTILITIES
// ============================================================================

/**
 * Hashes a plain text password using bcrypt with 12 salt rounds.
 * @param password - The plain text password to hash
 * @returns A promise resolving to the hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compares a plain text password against a stored bcrypt hash.
 * @param password - The plain text password
 * @param hash - The stored bcrypt hash
 * @returns A promise resolving to a boolean indicating if they match
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// ============================================================================
// TOKEN UTILITIES
// ============================================================================

/**
 * Generates an Access Token valid for 15 minutes.
 * @param payload - Object containing user id, role, and propertyId
 * @returns Signed JWT string
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  
  if (!secret) {
    throw new Error('FATAL: ACCESS_TOKEN_SECRET is not defined in the environment variables.');
  }

  // Extracts only the required fields to avoid embedding unintentional data
  const signPayload = {
    id: payload.id,
    role: payload.role,
    propertyId: payload.propertyId,
  };

  return jwt.sign(signPayload, secret, { expiresIn: '15m' });
};

/**
 * Verifies a given token string against a provided secret.
 * @param token - The JWT string to verify
 * @param secret - The secret key used to sign the token
 * @returns The decoded token payload
 * @throws TokenVerificationError if the token is invalid, expired, or malformed
 */
export const verifyToken = (token: string, secret: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, secret);
    return decoded as TokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenVerificationError('Token has expired.');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new TokenVerificationError('Invalid token signature.');
    }
    
    throw new TokenVerificationError('Token verification failed.');
  }
};