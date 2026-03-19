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

  // Keep public pages accessible
  if (
    pathname === "/" ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next();
  }

  // Protect only app routes
  const protectedPrefixes = [
    "/ocr",
    "/orders",
    "/inventory",
    "/accounting",
    "/returns",
    "/products",
    "/weekly-view",
    "/shared",
  ];

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const sessionToken = req.cookies.get("next-auth.session-token")?.value;

  if (!sessionToken) {
    const url = new URL("/auth/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
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
