import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// This middleware will run on all routes
export async function middleware(request: NextRequest) {
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

  // Check for referral code in URL
  const ref =
    request.nextUrl.searchParams.get("ref") ||
    request.nextUrl.pathname.split("=")[1]; // Handle /ref=CODE format

  if (ref) {
    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("referral_code", ref, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    });
    return response;
  }

  return NextResponse.next();
}

// Run middleware on all paths except excluded ones
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
