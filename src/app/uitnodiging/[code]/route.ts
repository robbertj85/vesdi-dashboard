import { NextRequest, NextResponse } from 'next/server';
import { INVITE_SESSION_MAX_AGE_S, SESSION_COOKIE, createSessionToken } from '@/lib/auth';
import { findInviteByCode } from '@/lib/survey-store';

export const dynamic = 'force-dynamic';

/**
 * Personal survey link: logs the respondent in (no password needed) with a
 * session tied to their invite, then opens the questionnaire.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const invite = await findInviteByCode(code);
  if (!invite) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.redirect(new URL('/login?fout=uitnodiging', request.url));
  }
  const token = createSessionToken(`invite:${invite.id}`, invite.id, INVITE_SESSION_MAX_AGE_S);
  if (!token) return NextResponse.redirect(new URL('/login', request.url));

  const res = NextResponse.redirect(new URL('/demo?next=/dashboard/enquete', request.url));
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: INVITE_SESSION_MAX_AGE_S,
  });
  return res;
}
