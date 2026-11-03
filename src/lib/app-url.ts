import { NextResponse } from 'next/server';
import { BASE_PATH } from './base-path';

/**
 * Redirect to an app path ("/login?x=1"), basePath included.
 *
 * Never built from request.url: behind the proxy that carries the internal
 * host, and Next rewrites relative Locations in route handlers without the
 * basePath. Verified with a standalone build under /vesdi-dashboard.
 */
export function redirectTo(path: string, status = 307): NextResponse {
  // In production PUBLIC_BASE_URL (https://prototype.transportlab.app/vesdi-dashboard)
  // gives a fixed absolute target, independent of the proxy's Host/proto headers.
  const base = process.env.PUBLIC_BASE_URL?.replace(/\/$/, '') || BASE_PATH;
  return new NextResponse(null, { status, headers: { Location: `${base}${path}` } });
}

/** Session cookie path: only sent to this app, not to other apps on the same host. */
export const COOKIE_PATH = BASE_PATH || '/';
