import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(
  request: NextRequest,
  intlResponse?: NextResponse
) {
  const response = intlResponse ?? NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh auth session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Extract current locale and clean pathname
  const localeMatch = pathname.match(/^\/(th|en)($|\/)/);
  const locale = localeMatch ? localeMatch[1] : 'th';
  const pathnameWithoutLocale = pathname.replace(/^\/(th|en)/, '') || '/';

  const protectedRoutes = [
    '/profile/edit',
    '/projects/create',
    '/my-projects',
    '/join-requests',
  ];

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathnameWithoutLocale.startsWith(route)
  );

  // If not authenticated and visiting protected route, redirect to localized login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(url);
  }

  // If authenticated and visiting login or signup, redirect to localized home
  if (
    user &&
    (pathnameWithoutLocale === '/login' || pathnameWithoutLocale === '/signup')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    return NextResponse.redirect(url);
  }

  return response;
}
