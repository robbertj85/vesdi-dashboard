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
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 7; // 7 days

interface AuthConfig {
  username: string;
  password: string;
  secret: string;
}

export function getAuthConfig(): AuthConfig | null {
  const username = process.env.DEMO_USERNAME;
  const password = process.env.DEMO_PASSWORD;
  if (!username || !password) return null;
  const secret =
    process.env.AUTH_SECRET ||
    createHash('sha256').update(`vesdi-session:${username}:${password}`).digest('hex');
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

export function createSessionToken(username: string): string | null {
  const cfg = getAuthConfig();
  if (!cfg) return null;
  const payload = Buffer.from(
    JSON.stringify({ u: username, exp: Date.now() + SESSION_MAX_AGE_S * 1000 })
  ).toString('base64url');
  return `${payload}.${sign(payload, cfg.secret)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const cfg = getAuthConfig();
  if (!cfg) return false;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!safeEqual(signature, sign(payload, cfg.secret))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

/** Only allow same-origin relative redirect targets after login. */
export function safeNextPath(next: unknown, fallback = '/demo'): string {
  if (typeof next !== 'string') return fallback;
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return fallback;
  if (next.startsWith('/login') || next.startsWith('/api/')) return fallback;
  return next;
}
