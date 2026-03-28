import { NextRequest, NextResponse } from 'next/server'
import { FASTAPI_BASE_URL } from '@/lib/fastapi-base-url'

/**
 * Middleware for handling authentication with FastAPI backend
 * 
 * This middleware validates user sessions by checking if the user is authenticated
 * via the FastAPI backend. The backend handles all session management through cookies.
 * 
 * Protects /chat routes by redirecting unauthenticated users to the home page.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /chat routes - require authentication
  if (pathname.startsWith('/chat')) {
    // Get cookies from the request
    const cookieHeader = request.cookies
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    try {
      // Verify authentication by calling the backend's /me endpoint
      // This endpoint returns 200 if authenticated, 401 if not authenticated
      const meUrl = `${FASTAPI_BASE_URL}/api/v1/auth/me`;
      const response = await fetch(meUrl, {
        method: 'GET',
        headers: {
          'Cookie': cookieHeader,
        },
      });

      // If the request fails (401 = not authenticated, or other errors), redirect to home page
      if (!response.ok) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
      // If response is ok (200), user is authenticated, continue with the request
    } catch (error) {
      // If there's an error (e.g., backend unreachable), redirect to home page
      console.error('[Middleware] Auth verification failed:', error);
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

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