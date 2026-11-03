/**
 * Set at build time when the app is served under a subpath
 * (prototype.transportlab.app/vesdi-dashboard). Empty for local dev.
 *
 * next/link, next/navigation's router and redirects built from
 * request.nextUrl add it automatically; plain fetch/img/form/location do not.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export function withBase(path: string): string {
  return `${BASE_PATH}${path}`;
}
