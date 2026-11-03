import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_S,
  checkCredentials,
  createSessionToken,
  getAuthConfig,
  safeNextPath,
} from '@/lib/auth';
import { COOKIE_PATH } from '@/lib/app-url';

export async function POST(request: NextRequest) {
  if (!getAuthConfig()) {
    return NextResponse.json(
      { error: 'Inloggen met een wachtwoord staat uit. Gebruik de persoonlijke link uit je uitnodiging.' },
      { status: 503 }
    );
  }

  let body: { username?: unknown; password?: unknown; next?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek' }, { status: 400 });
  }

  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!checkCredentials(username, password)) {
    // Small fixed delay to slow down password guessing
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: 'Onjuiste gebruikersnaam of wachtwoord' }, { status: 401 });
  }

  const token = createSessionToken(username)!;
  // Always pass through /demo, which loads the Utrecht dataset into the browser
  // if needed and then continues to the requested page.
  const target = safeNextPath(body.next);
  const next = target === '/demo' ? '/demo' : `/demo?next=${encodeURIComponent(target)}`;
  const res = NextResponse.json({ ok: true, next });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: COOKIE_PATH,
    maxAge: SESSION_MAX_AGE_S,
  });
  return res;
}
