import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // If request contains an OAuth 'code' but landed outside /auth/callback (e.g. at root '/'),
  // forward it to /auth/callback so the authorization code is properly exchanged for a session.
  if (searchParams.has('code') && !pathname.startsWith('/auth/callback')) {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = '/auth/callback';
    return NextResponse.redirect(callbackUrl);
  }

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
