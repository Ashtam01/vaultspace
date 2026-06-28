import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const userId = request.cookies.get("session_user_id")?.value

  // If the user is not logged in and trying to access a protected route
  if (!userId && request.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If the user is logged in and on the login page, redirect to a default dashboard.
  // In a real app, you might want to redirect them to their last active workspace.
  if (userId && request.nextUrl.pathname === "/") {
    // For the demo, we'll route them to the /workspaces page (which we will build to let them choose)
    // or just let the client side handle it.
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
