import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, readSession } from '@/lib/auth';
import { markInviteTourCompleted } from '@/lib/survey-store';

export const dynamic = 'force-dynamic';

/**
 * The guided tour (Rondleiding) was completed. Recorded on the respondent's
 * invite, so DMI can see who looked around before rating. Sessions without an
 * invite (admins) are not logged.
 */
export async function POST(request: NextRequest) {
  const session = readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  if (!session.inv) return NextResponse.json({ ok: true, logged: false });
  const logged = await markInviteTourCompleted(session.inv);
  return NextResponse.json({ ok: true, logged });
}
