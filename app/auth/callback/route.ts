import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Support both localhost and deployed domain (Vercel / proxies)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || (origin.startsWith('https') ? 'https' : 'http');
  const host = forwardedHost || origin;
  const isLocalHost = host.includes('localhost') || host.includes('127.0.0.1');
  const proto = isLocalHost ? 'http' : (forwardedProto || 'https');
  const baseUrl = forwardedHost ? `${proto}://${forwardedHost}` : origin;

  // Determine locale from cookie or fallback to default 'th'
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  const locale = cookieLocale === 'en' || cookieLocale === 'th' ? cookieLocale : 'th';

  // Handle OAuth provider errors
  if (error) {
    const loginUrl = new URL(`/${locale}/login`, baseUrl);
    loginUrl.searchParams.set('error', errorDescription || error || 'Google authentication failed');
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const supabase = await createClient();

    // Exchange the authorization code for a session using PKCE
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      const loginUrl = new URL(`/${locale}/login`, baseUrl);
      loginUrl.searchParams.set('error', exchangeError.message);
      return NextResponse.redirect(loginUrl);
    }

    // Retrieve authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Check whether the authenticated user has a record in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      // If profile does not exist: redirect to /[locale]/profile/edit?onboarding=true
      if (!profile) {
        return NextResponse.redirect(new URL(`/${locale}/profile/edit?onboarding=true`, baseUrl));
      }

      // If profile already exists: redirect to /[locale]
      return NextResponse.redirect(new URL(`/${locale}`, baseUrl));
    }
  }

  // Fallback redirect if code is missing
  const fallbackUrl = new URL(`/${locale}/login`, baseUrl);
  fallbackUrl.searchParams.set('error', 'Authentication code was missing or invalid');
  return NextResponse.redirect(fallbackUrl);
}
