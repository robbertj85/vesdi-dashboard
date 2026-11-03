import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Minimal shared-credential auth for the public demo.
 *
 * One generic username/password (env: DEMO_USERNAME / DEMO_PASSWORD) grants
 * access to the whole app. A successful login sets an HMAC-signed, httpOnly
 * session cookie that `src/proxy.ts` checks on every request.
 *
 * The signing key is AUTH_SECRET, or — if that is not set — derived from the
 * credentials, so changing the password automatically invalidates all
 * existing sessions.
 */

export const SESSION_COOKIE = 'vesdi_session';
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days (shared login)
/** Personal survey links: long enough to come back during the whole survey period */
export const INVITE_SESSION_MAX_AGE_S = 60 * 60 * 24 * 90;

interface AuthConfig {
  username: string;
  password: string;
  secret: string;
}

/**
 * Key for signing session cookies: AUTH_SECRET, or derived from the shared
 * credentials. Null when neither is configured (nobody can log in).
 */
function signingSecret(): string | null {
  if (process.env.AUTH_SECRET) return process.env.AUTH_SECRET;
  const { DEMO_USERNAME: u, DEMO_PASSWORD: p } = process.env;
  return u && p ? createHash('sha256').update(`vesdi-session:${u}:${p}`).digest('hex') : null;
}

/**
 * The shared username/password login. Leave DEMO_USERNAME/DEMO_PASSWORD unset
 * (but set AUTH_SECRET) to make the site link-only: then only personal
 * invite links give access.
 */
export function sharedLoginEnabled(): boolean {
  return Boolean(process.env.DEMO_USERNAME && process.env.DEMO_PASSWORD);
}

export function getAuthConfig(): AuthConfig | null {
  const username = process.env.DEMO_USERNAME;
  const password = process.env.DEMO_PASSWORD;
  const secret = signingSecret();
  if (!username || !password || !secret) return null;
  return { username, password, secret };
}

/** Constant-time string comparison (hash first so lengths always match). */
function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkCredentials(username: string, password: string): boolean {
  const cfg = getAuthConfig();
  if (!cfg) return false;
  // Evaluate both so timing does not reveal which one was wrong
  const userOk = safeEqual(username, cfg.username);
  const passOk = safeEqual(password, cfg.password);
  return userOk && passOk;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export interface Session {
  /** Shared demo username, or `invite:<id>` for a personal survey link */
  u: string;
  exp: number;
  /** Survey invite id when the visitor came in through a personal link */
  inv?: string;
}

export function createSessionToken(
  username: string,
  inviteId?: string,
  maxAgeS: number = SESSION_MAX_AGE_S
): string | null {
  const secret = signingSecret();
  if (!secret) return null;
  const session: Session = { u: username, exp: Date.now() + maxAgeS * 1000 };
  if (inviteId) session.inv = inviteId;
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

/** Returns the session if the token is authentic and not expired. */
export function readSession(token: string | undefined): Session | null {
  if (!token) return null;
  const secret = signingSecret();
  if (!secret) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!safeEqual(signature, sign(payload, secret))) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Session;
    return typeof session.exp === 'number' && session.exp > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export function verifySessionToken(token: string | undefined): boolean {
  return readSession(token) !== null;
}

export { safeEqual };

/** Only allow same-origin relative redirect targets after login. */
export function safeNextPath(next: unknown, fallback = '/demo'): string {
  if (typeof next !== 'string') return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  if (next.startsWith('/login') || next.startsWith('/api/')) return fallback;
  return next;
}
