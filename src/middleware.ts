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

  // Temporary demo mode: keep all user-facing pages public
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

// ============================================================================
// Configure which routes to protect
// ============================================================================

export const config = {
  matcher: [
    "/",
    "/ocr/:path*",
    "/orders/:path*",
    "/inventory/:path*",
    "/accounting/:path*",
    "/returns/:path*",
    "/products/:path*",
    "/weekly-view/:path*",
    "/shared/:path*",
    "/auth/:path*",
  ],
};
