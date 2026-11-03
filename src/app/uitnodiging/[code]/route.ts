import type { NextRequest } from 'next/server';
import { INVITE_SESSION_MAX_AGE_S, SESSION_COOKIE, createSessionToken } from '@/lib/auth';
import { findInviteByCode } from '@/lib/survey-store';
import { COOKIE_PATH, redirectTo } from '@/lib/app-url';

export const dynamic = 'force-dynamic';

/**
 * Personal survey link: logs the respondent in (no password needed) with a
 * session tied to their invite, then opens the questionnaire.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const invite = await findInviteByCode(code);
  if (!invite) {
    await new Promise((r) => setTimeout(r, 600));
    return redirectTo('/login?fout=uitnodiging');
  }
  const token = createSessionToken(`invite:${invite.id}`, invite.id, INVITE_SESSION_MAX_AGE_S);
  if (!token) return redirectTo('/login');

  const res = redirectTo('/demo?next=/dashboard/enquete');
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: COOKIE_PATH,
    maxAge: INVITE_SESSION_MAX_AGE_S,
  });
  return res;
}
