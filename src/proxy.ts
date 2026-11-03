import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';

/**
 * Gate every route behind the shared demo login.
 * Public: the login page, the auth API, Next.js build assets and the logos
 * shown on the login page (see `matcher` below).
 */
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (verifySessionToken(token)) return NextResponse.next();

  const { pathname, search } = request.nextUrl;

  // APIs and data files get a plain 401 instead of a redirect
  if (pathname.startsWith('/api/') || pathname.startsWith('/geo/')) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const loginUrl = new URL('/login', request.url);
  if (pathname !== '/') loginUrl.searchParams.set('next', pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|images/).*)',
  ],
};
