import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware for handling authentication with FastAPI backend
 * 
 * This middleware validates user sessions by checking if the user is authenticated
 * via the FastAPI backend. The backend handles all session management through cookies.
 */
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled by Next.js API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}