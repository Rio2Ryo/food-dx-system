/**
 * Authentication Types for CITTA handcho
 */

// ============================================================================
// User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  companyId?: string | null;
  createdAt: Date;
}

export type UserRole = "ADMIN" | "MANAGER" | "STAFF";

// ============================================================================
// Session Types
// ============================================================================

export interface Session {
  user: User;
  expires: Date;
}

// ============================================================================
// Auth State Types
// ============================================================================

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Login/Registration Form Types
// ============================================================================

export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface AuthResponse {
  ok: boolean;
  error?: string;
  user?: User;
}

export interface SessionResponse {
  session: Session | null;
  user: User | null;
}
