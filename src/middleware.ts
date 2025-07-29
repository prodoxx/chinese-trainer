import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Add custom middleware logic here if needed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // Allow access to auth pages
        if (req.nextUrl.pathname.startsWith("/auth")) {
          return true;
        }

        // Allow access to API routes
        if (req.nextUrl.pathname.startsWith("/api")) {
          return true;
        }

        // Allow access to public pages and marketing pages
        if (req.nextUrl.pathname === "/" || 
            req.nextUrl.pathname === "/about" ||
            req.nextUrl.pathname === "/how-it-works" ||
            req.nextUrl.pathname === "/science" ||
            req.nextUrl.pathname === "/pricing" ||
            req.nextUrl.pathname === "/features" ||
            req.nextUrl.pathname === "/privacy" ||
            req.nextUrl.pathname === "/terms" ||
            req.nextUrl.pathname.startsWith("/_next")) {
          return true;
        }

        // Require authentication for all other pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};