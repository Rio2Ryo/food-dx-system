/**
 * Middleware for Route Protection
 * 
 * This middleware protects dashboard routes by checking if the user is authenticated.
 * Unauthenticated users are redirected to the login page.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ============================================================================
// Middleware Configuration
// ============================================================================

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Skip middleware for auth pages and static assets
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next();
  }
  
  // Get session token from cookies
  const sessionToken = req.cookies.get("next-auth.session-token")?.value;
  
  // If no session, redirect to login
  if (!sessionToken) {
    const url = new URL("/auth/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  
  // Session exists, allow request to proceed
  return NextResponse.next();
}

// ============================================================================
// Configure which routes to protect
// ============================================================================

export const config = {
  // Match all protected routes
  // All routes under / (root) except /auth/* are protected
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
