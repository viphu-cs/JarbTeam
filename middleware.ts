import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass next-intl locale prefixing for OAuth callback route
  if (pathname.startsWith('/auth/callback') || pathname.startsWith('/api')) {
    return await updateSession(request);
  }

  // Run next-intl middleware to handle locale routing, cookie, and redirects
  const intlResponse = intlMiddleware(request);

  // Chain Supabase session verification with intlResponse
  return await updateSession(request, intlResponse);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static, _next/image
     * - favicon.ico
     * - static image formats
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
