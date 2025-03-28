import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// This middleware will run on all routes
export async function middleware(request: NextRequest) {
  // For now, we'll use the client-side redirect instead of middleware
  // to avoid potential conflicts and issues with the JWT token

  // Skip for API routes and auth routes
  if (
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/complete-profile") ||
    request.nextUrl.pathname.includes("favicon")
  ) {
    return NextResponse.next();
  }

  // Get the token from the request
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  // If the user is authenticated but doesn't exist in the database, redirect to complete-profile
  if (token && token?.exists === false) {
    console.log(
      "Middleware: User does not exist, redirecting to complete-profile"
    );
    return NextResponse.redirect(new URL("/complete-profile", request.url));
  }

  return NextResponse.next();
}

// Empty matcher to disable the middleware
export const config = {
  matcher: [],
};
