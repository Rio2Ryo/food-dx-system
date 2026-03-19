/**
 * NextAuth.js Configuration for 食品流通システム
 *
 * This file configures NextAuth.js to work with Cloudflare Workers and D1 Database.
 * Uses credentials provider for email/password authentication.
 */

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyPassword } from "@/lib/auth";
import { findUserByEmail } from "@/lib/auth";

// ============================================================================
// NextAuth Configuration
// ============================================================================

const authConfig = NextAuth({
  // Secret for signing tokens - use environment variable
  secret: process.env.NEXTAUTH_SECRET,
  
  // Session configuration
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  // Pages configuration
  pages: {
    signIn: "/auth/login",
    signOut: "/auth/logout",
    error: "/auth/error",
  },
  
  // Callbacks for custom logic
  callbacks: {
    // JWT callback - add user data to token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },

    // Session callback - add user data to session
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    
    // Redirect callback - control where users are redirected after auth
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Only allow URLs to the same origin
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      return baseUrl;
    },
  },
  
  // Providers configuration
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const email = (credentials.email as string).toLowerCase();
        const password = credentials.password as string;
        
        // Find user by email
        const user = (await findUserByEmail(email)) as { id: string; email: string; name?: string | null; password: string; role: string };

        if (!user) {
          throw new Error("No user found with this email");
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password);
        
        if (!isValid) {
          throw new Error("Invalid password");
        }
        
        // Return user object (without password)
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          role: user.role,
        };
      },
    }),
  ],

  // Events for logging
  events: {
    async signIn(message) {
      console.log("User signed in:", (message as any).user?.email);
    },
    async signOut(message) {
      console.log("User signed out:", (message as any).user?.email);
    },
  },

  // Debug mode (set to true during development)
  debug: process.env.NODE_ENV === "development",
});

// ============================================================================
// Export Handlers
// ============================================================================

// Export the GET handler for NextAuth
export const { GET, POST } = authConfig.handlers;

// ============================================================================
// Type Declarations
// ============================================================================

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string;
    role: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: string;
    };
  }
}
