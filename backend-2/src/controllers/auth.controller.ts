import type { Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { comparePassword, generateAccessToken } from '../utils/crypto.js';

// ============================================================================
// HELPER UTILITIES
// ============================================================================

/**
 * Creates a deterministic SHA-256 hash for database storage and lookups
 */
const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// ============================================================================
// AUTHENTICATION CONTROLLER
// ============================================================================

/**
 * @route   POST /api/auth/register
 * @desc    Public endpoint for landing page sign-ups. Strictly forces CUSTOMER role.
 */
export const registerPublicUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, password, phone, customerType } = req.body;

    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({ error: 'Missing required registration fields.' });
      return;
    }

    // 1. Check if user already exists
    const existingUser = await prisma.account.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    // 2. Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create the Account (CRITICAL: Hardcode role to CUSTOMER for security)
    const newAccount = await prisma.account.create({
      data: {
        firstName,
        lastName,
        email,
        passwordHash,
        phone,
        role: 'CUSTOMER', 
        customerType: 'NONE', 
      },
    });

    // 4. Generate Access Token
    const accessToken = generateAccessToken({
      id: newAccount.id,
      role: newAccount.role,
      // Note: propertyId is no longer embedded in the token due to Many-to-Many architecture
    });

    // 5. Generate & Hash Refresh Token
    const plainRefreshToken = crypto.randomUUID();
    const hashedRefreshToken = hashToken(plainRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 6. Save Session to Database
    await prisma.session.create({
      data: {
        accountId: newAccount.id,
        refreshToken: hashedRefreshToken,
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
        expiresAt,
      },
    });

    // 7. Attach Refresh Token to HTTP-Only Cookie
    res.cookie('refreshToken', plainRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    res.status(201).json({
      message: 'Registration successful',
      accessToken,
      user: { 
        id: newAccount.id, 
        firstName: newAccount.firstName, 
        lastName: newAccount.lastName,
        email: newAccount.email, 
        role: newAccount.role 
      }
    });
  } catch (error) {
    console.error('[Registration Error]:', error);
    console.error('[Registration Error Details]:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: req.body
    });
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Admin Panel Login: Authenticates user, creates session, issues tokens. STRICTLY ADMINS ONLY.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    // 1. Find user by email
    const account = await prisma.account.findUnique({
      where: { email },
    });

    if (!account || !account.passwordHash || account.isDeleted || !account.isActive) {
      res.status(401).json({ error: 'Invalid credentials or inactive account.' });
      return;
    }

    // ==========================================
    // 2. CRITICAL SECURITY ALLOW-LIST FIX
    // ==========================================
    const allowedAdminRoles = ['STAFF', 'MANAGER', 'SUPER_ADMIN'];
    
    if (!allowedAdminRoles.includes(account.role)) {
      res.status(403).json({ error: 'Access denied. You do not have permission to access the admin panel.' });
      return;
    }
    // ==========================================

    // 3. Verify password
    const isMatch = await comparePassword(password, account.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    // 4. Generate Access Token
    const accessToken = generateAccessToken({
      id: account.id,
      role: account.role,
      // Removed propertyId to align with the new Many-to-Many Prisma schema
    });

    // 5. Generate & Hash Refresh Token
    const plainRefreshToken = crypto.randomUUID();
    const hashedRefreshToken = hashToken(plainRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // 6. Save Session to Database
    await prisma.session.create({
      data: {
        accountId: account.id,
        refreshToken: hashedRefreshToken,
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
        expiresAt,
      },
    });

    // 7. Attach Refresh Token to HTTP-Only Cookie
    res.cookie('refreshToken', plainRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in prod
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days in milliseconds
    });

    // 8. Return Access Token & User Payload
    res.status(200).json({
      accessToken,
      user: {
        id: account.id,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        role: account.role,
        // Removed propertyId here as well
      },
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    console.error('[Login Error Details]:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: req.body
    });
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * @route   POST /api/auth/website-login
 * @desc    Public Website Login: Authenticates customers, creates session, issues tokens.
 */
export const websiteLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    // 1. Find user by email
    const account = await prisma.account.findUnique({
      where: { email },
    });

    if (!account || !account.passwordHash || account.isDeleted || !account.isActive) {
      res.status(401).json({ error: 'Invalid credentials or inactive account.' });
      return;
    }

    // 2. Verify password
    const isMatch = await comparePassword(password, account.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    // 3. Generate Access Token
    const accessToken = generateAccessToken({
      id: account.id,
      role: account.role,
    });

    // 4. Generate & Hash Refresh Token
    const plainRefreshToken = crypto.randomUUID();
    const hashedRefreshToken = hashToken(plainRefreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    // 5. Save Session to Database
    await prisma.session.create({
      data: {
        accountId: account.id,
        refreshToken: hashedRefreshToken,
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.headers['user-agent'] || null,
        expiresAt,
      },
    });

    // 6. Attach Refresh Token to HTTP-Only Cookie
    res.cookie('refreshToken', plainRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    // 7. Return Access Token & User Payload
    res.status(200).json({
      accessToken,
      user: {
        id: account.id,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        role: account.role,
        customerType: account.customerType, // Useful for the frontend to route users
      },
    });
  } catch (error) {
    console.error('[Website Login Error]:', error);
    console.error('[Website Login Error Details]:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: req.body
    });
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * @route   POST /api/auth/refresh
 * @desc    Issues a new Access Token using a valid Refresh Token
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: plainRefreshToken } = req.cookies;

    if (!plainRefreshToken) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    // 1. Hash the incoming token to match DB storage
    const hashedRefreshToken = hashToken(plainRefreshToken);

    // 2. Find active session
    const session = await prisma.session.findUnique({
      where: { refreshToken: hashedRefreshToken },
      include: { account: true },
    });

    // 3. Validate session and expiration
    if (!session || session.expiresAt < new Date() || !session.account.isActive) {
      res.clearCookie('refreshToken');
      
      // If expired, clean up the DB proactively
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }

      res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
      return;
    }

    // 4. Issue fresh Access Token
    const accessToken = generateAccessToken({
      id: session.account.id,
      role: session.account.role,
      // Removed propertyId
    });

    res.status(200).json({ accessToken });
  } catch (error) {
    console.error('[Refresh Error]:', error);
    console.error('[Refresh Error Details]:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Destroys the session and clears the cookie
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken: plainRefreshToken } = req.cookies;

    if (plainRefreshToken) {
      // 1. Hash to find the exact record
      const hashedRefreshToken = hashToken(plainRefreshToken);

      // 2. Delete the session from DB
      // Using deleteMany prevents errors if the token was already deleted or doesn't exist
      await prisma.session.deleteMany({
        where: { refreshToken: hashedRefreshToken },
      });
    }

    // 3. Clear the cookie from the client
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('[Logout Error]:', error);
    console.error('[Logout Error Details]:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info using access token
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // The user info should be attached to the request by the auth middleware
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    // Fetch user from database
    const account = await prisma.account.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        customerType: true,
        isActive: true,
        isDeleted: true,
      },
    });

    if (!account || account.isDeleted || !account.isActive) {
      res.status(404).json({ error: 'User not found or inactive.' });
      return;
    }

    res.status(200).json({
      user: {
        id: account.id,
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        role: account.role,
        customerType: account.customerType,
      },
    });
  } catch (error) {
    console.error('[Get Current User Error]:', error);
    console.error('[Get Current User Error Details]:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: 'Internal server error.' });
  }
};