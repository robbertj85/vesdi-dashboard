import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { redirectTo } from '@/lib/app-url';

/**
 * Gate every route behind the shared demo login.
 * Public: the login page, personal survey links (/uitnodiging/…), the auth API,
 * Next.js build assets and the logos
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

  // nextUrl.pathname excludes the basePath
  const next = pathname !== '/' ? `?next=${encodeURIComponent(pathname + search)}` : '';
  if (process.env.PUBLIC_BASE_URL) return redirectTo(`/login${next}`);
  // Proxy redirects must be absolute; a clone of nextUrl keeps the basePath
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = next;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // The bare root needs its own entry: under a basePath the pattern below
    // becomes /<base>/(...) and would not match /<base> itself.
    '/',
    '/((?!login|uitnodiging|api/auth|_next/static|_next/image|favicon\\.ico|images/).*)',
  ],
};
