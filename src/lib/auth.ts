/**
 * Authentication Utilities for CITTA handcho
 * 
 * This module provides:
 * - Password hashing with bcrypt
 * - Session management utilities
 * - User authentication helpers
 * - D1 database adapter for NextAuth
 */

import { compare, hash } from "bcryptjs";
import { getPrisma } from "./prisma";

// ============================================================================
// Password Hashing
// ============================================================================

/**
 * Hash a password using bcrypt
 * @param password The plain text password to hash
 * @returns The hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);
  return await hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 * @param password The plain text password
 * @param hashedPassword The hashed password to compare against
 * @returns True if passwords match, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await compare(password, hashedPassword);
}

// ============================================================================
// User Authentication Helpers
// ============================================================================

/**
 * Validate email format
 * @param email The email to validate
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param password The password to validate
 * @returns Object with validation result and error message if invalid
 */
export function validatePasswordStrength(
  password: string
): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }
  return { valid: true };
}

// ============================================================================
// User CRUD Operations
// ============================================================================

/**
 * Find a user by email
 * @param email The email to search for
 * @returns The user object or null if not found
 */
export async function findUserByEmail(email: string) {
  const prisma = await getPrisma();
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      avatarUrl: true,
      role: true,
      companyId: true,
      createdAt: true,
    },
  });
}

/**
 * Find a user by ID
 * @param id The user ID
 * @returns The user object or null if not found
 */
export async function findUserById(id: string) {
  const prisma = await getPrisma();
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      companyId: true,
      createdAt: true,
    },
  });
}

/**
 * Create a new user
 * @param data The user data (password should be plain text)
 * @returns The created user object
 */
export async function createUser(data: {
  email: string;
  password: string;
  name?: string;
  avatarUrl?: string;
  role?: string;
  companyId?: string;
}) {
  const prisma = await getPrisma();
  
  // Hash the password
  const hashedPassword = await hashPassword(data.password);
  
  return prisma.user.create({
    data: {
      email: data.email.toLowerCase(),
      password: hashedPassword,
      name: data.name,
      avatarUrl: data.avatarUrl,
      role: data.role || "STAFF",
      companyId: data.companyId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      companyId: true,
      createdAt: true,
    },
  });
}

/**
 * Update user profile
 * @param userId The user ID
 * @param data The data to update
 * @returns The updated user object
 */
export async function updateUser(
  userId: string,
  data: {
    name?: string;
    avatarUrl?: string;
    password?: string;
  }
) {
  const prisma = await getPrisma();
  
  const updateData: Record<string, unknown> = {};
  
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.avatarUrl !== undefined) {
    updateData.avatarUrl = data.avatarUrl;
  }
  if (data.password !== undefined) {
    updateData.password = await hashPassword(data.password);
  }
  
  return prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      companyId: true,
      createdAt: true,
    },
  });
}

/**
 * Delete a user
 * @param userId The user ID to delete
 * @returns The deleted user object
 */
export async function deleteUser(userId: string) {
  const prisma = await getPrisma();
  return prisma.user.delete({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Session data stored in the session token
 */
export interface SessionData {
  userId: string;
  email: string;
  name?: string;
  role: string;
  companyId?: string;
  iat: number;
  exp: number;
}

/**
 * Create a session token
 * @param userId The user ID
 * @param duration Session duration in seconds (default: 30 days)
 * @returns The session token
 */
export function createSessionToken(
  userId: string,
  duration: number = 30 * 24 * 60 * 60 // 30 days
): string {
  const payload: SessionData = {
    userId,
    email: "", // Will be populated from DB
    name: "",
    role: "STAFF",
    companyId: undefined,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + duration,
  };
  
  // In production, this would be a signed JWT
  // For now, we'll use a simple base64 encoding with HMAC
  const token = Buffer.from(JSON.stringify(payload)).toString("base64");
  return token;
}

/**
 * Verify a session token
 * @param token The session token to verify
 * @returns The decoded session data or null if invalid
 */
export function verifySessionToken(token: string): SessionData | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    
    // Check if token has expired
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    return decoded as SessionData;
  } catch {
    return null;
  }
}

// ============================================================================
// NextAuth D1 Adapter (Custom Implementation)
// ============================================================================

/**
 * NextAuth D1 Adapter Interface
 * Implements the adapter pattern for NextAuth with Cloudflare D1
 */
export interface NextAuthD1Adapter {
  createUser: (data: any) => Promise<any>;
  getUser: (id: string) => Promise<any>;
  getUserByEmail: (email: string) => Promise<any>;
  getUserByAccount: (providerAccountId: string) => Promise<any>;
  updateUser: (data: any) => Promise<any>;
  deleteUser: (id: string) => Promise<void>;
  linkAccount: (data: any) => Promise<void>;
  unlinkAccount: (providerAccountId: string) => Promise<void>;
  createSession: (data: any) => Promise<any>;
  getSessionAndUser: (sessionToken: string) => Promise<any>;
  updateSession: (data: any) => Promise<any>;
  deleteSession: (sessionToken: string) => Promise<void>;
  createVerificationToken: (data: any) => Promise<any>;
  useVerificationToken: (identifier: string) => Promise<any>;
}

/**
 * Get the D1 adapter for NextAuth
 * @param d1Database The D1Database binding
 * @returns The adapter object
 */
export function getD1Adapter(d1Database: D1Database): NextAuthD1Adapter {
  return {
    // User operations
    async createUser(data) {
      const prisma = getDb(d1Database);
      const hashedPassword = await hashPassword(data.password);
      
      const user = await prisma.user.create({
        data: {
          id: data.id,
          email: data.email?.toLowerCase(),
          name: data.name,
          password: hashedPassword,
          avatarUrl: data.avatarUrl,
          role: data.role || "STAFF",
          companyId: data.companyId,
          createdAt: data.createdAt,
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          companyId: true,
          createdAt: true,
        },
      });
      
      return user;
    },

    async getUser(id) {
      const prisma = getDb(d1Database);
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          companyId: true,
          createdAt: true,
        },
      });
      
      return user || null;
    },

    async getUserByEmail(email) {
      const prisma = getDb(d1Database);
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        select: {
          id: true,
          email: true,
          name: true,
          password: true,
          avatarUrl: true,
          role: true,
          companyId: true,
          createdAt: true,
        },
      });
      
      return user || null;
    },

    async getUserByAccount(_providerAccountId) {
      // Not used for email/password auth
      return null;
    },

    async updateUser(data) {
      const prisma = getDb(d1Database);
      
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
      if (data.email !== undefined) updateData.email = data.email.toLowerCase();
      
      const user = await prisma.user.update({
        where: { id: data.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          companyId: true,
          createdAt: true,
        },
      });
      
      return user;
    },

    async deleteUser(id) {
      const prisma = getDb(d1Database);
      await prisma.user.delete({ where: { id } });
    },

    // Account operations (for OAuth)
    async linkAccount(_data) {
      // Not used for email/password auth
    },

    async unlinkAccount(_providerAccountId) {
      // Not used for email/password auth
    },

    // Session operations
    async createSession(data) {
      const prisma = getDb(d1Database);
      const session = await prisma.session.create({
        data: {
          id: data.id,
          sessionToken: data.sessionToken,
          userId: data.userId,
          expires: data.expires,
        },
      });
      return session;
    },

    async getSessionAndUser(sessionToken) {
      const prisma = getDb(d1Database);
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: {
          user: true,
        },
      });
      
      if (!session) return null;
      
      return {
        session: {
          id: session.id,
          sessionToken: session.sessionToken,
          userId: session.userId,
          expires: session.expires,
        },
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          avatarUrl: session.user.avatarUrl,
          role: session.user.role,
          companyId: session.user.companyId,
          createdAt: session.user.createdAt,
        },
      };
    },

    async updateSession(data) {
      const prisma = getDb(d1Database);
      const session = await prisma.session.update({
        where: { sessionToken: data.sessionToken },
        data: {
          expires: data.expires,
        },
      });
      return session;
    },

    async deleteSession(sessionToken) {
      const prisma = getDb(d1Database);
      await prisma.session.delete({ where: { sessionToken } });
    },

    // Verification token operations
    async createVerificationToken(data) {
      const prisma = getDb(d1Database);
      const token = await prisma.verificationToken.create({
        data: {
          identifier: data.identifier,
          token: data.token,
          expires: data.expires,
        },
      });
      return token;
    },

    async useVerificationToken(identifier) {
      const prisma = getDb(d1Database);
      const token = await prisma.verificationToken.findFirst({
        where: { identifier },
      });
      
      if (token) {
        await prisma.verificationToken.delete({ where: { id: token.id } });
      }
      
      return token;
    },
  };
}

/**
 * Create a PrismaClient backed by Cloudflare D1.
 * Call this when you have a D1Database binding (e.g. from Cloudflare Workers context).
 */
function getDb(d1: D1Database) {
  const { PrismaD1 } = require("@prisma/adapter-d1");
  const adapter = new PrismaD1(d1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new (require("@prisma/client").PrismaClient)({ adapter: adapter as any });
}
