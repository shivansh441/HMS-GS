import type { JwtPayload } from 'jsonwebtoken';
export interface TokenPayload extends JwtPayload {
    id: number;
    role: string;
    propertyId?: number | null;
}
export declare class TokenVerificationError extends Error {
    constructor(message: string);
}
/**
 * Hashes a plain text password using bcrypt with 12 salt rounds.
 * @param password - The plain text password to hash
 * @returns A promise resolving to the hashed password
 */
export declare const hashPassword: (password: string) => Promise<string>;
/**
 * Compares a plain text password against a stored bcrypt hash.
 * @param password - The plain text password
 * @param hash - The stored bcrypt hash
 * @returns A promise resolving to a boolean indicating if they match
 */
export declare const comparePassword: (password: string, hash: string) => Promise<boolean>;
/**
 * Generates an Access Token valid for 15 minutes.
 * @param payload - Object containing user id, role, and propertyId
 * @returns Signed JWT string
 */
export declare const generateAccessToken: (payload: TokenPayload) => string;
/**
 * Verifies a given token string against a provided secret.
 * @param token - The JWT string to verify
 * @param secret - The secret key used to sign the token
 * @returns The decoded token payload
 * @throws TokenVerificationError if the token is invalid, expired, or malformed
 */
export declare const verifyToken: (token: string, secret: string) => TokenPayload;
//# sourceMappingURL=crypto.d.ts.map