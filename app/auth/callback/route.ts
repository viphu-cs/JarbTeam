import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  // Support both localhost and deployed domain (Vercel / proxies)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1');
  const baseUrl = isLocal ? origin : forwardedHost ? `https://${forwardedHost}` : origin;

  // Handle OAuth provider errors
  if (error) {
    const loginUrl = new URL('/login', baseUrl);
    loginUrl.searchParams.set('error', errorDescription || error || 'Google authentication failed');
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    const supabase = await createClient();

    // Exchange the authorization code for a session using PKCE
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      const loginUrl = new URL('/login', baseUrl);
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

      // If profile does not exist: redirect to /profile/edit?onboarding=true
      if (!profile) {
        return NextResponse.redirect(`${baseUrl}/profile/edit?onboarding=true`);
      }

      // If profile already exists: redirect to /
      return NextResponse.redirect(`${baseUrl}/`);
    }
  }

  // Fallback redirect if code is missing
  const fallbackUrl = new URL('/login', baseUrl);
  fallbackUrl.searchParams.set('error', 'Authentication code was missing or invalid');
  return NextResponse.redirect(fallbackUrl);
}
