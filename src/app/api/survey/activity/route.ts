import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, readSession } from '@/lib/auth';
import { appendActivity, findInviteById } from '@/lib/survey-store';

export const dynamic = 'force-dynamic';

const MAX_MS = 60 * 60 * 1000; // ignore anything longer than an hour on one step

/**
 * How long an invited respondent had a tour step or survey item on screen:
 * { kind: 'tour' | 'survey', step: '<id>', ms: <number> }. Admin sessions are not logged.
 */
export async function POST(request: NextRequest) {
  const session = readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  if (!session.inv) return NextResponse.json({ ok: true, logged: false });

  const body = (await request.json().catch(() => null)) as { kind?: unknown; step?: unknown; ms?: unknown } | null;
  const kind = body?.kind === 'tour' || body?.kind === 'survey' ? body.kind : null;
  const step = typeof body?.step === 'string' && /^[a-z0-9-]{1,64}$/.test(body.step) ? body.step : null;
  const ms = typeof body?.ms === 'number' && Number.isFinite(body.ms) ? Math.round(body.ms) : null;
  if (!kind || !step || ms === null || ms < 0) {
    return NextResponse.json({ error: 'Ongeldige meting' }, { status: 400 });
  }
  if (ms > MAX_MS || !(await findInviteById(session.inv))) return NextResponse.json({ ok: true, logged: false });

  await appendActivity({ inviteId: session.inv, kind, step, ms });
  return NextResponse.json({ ok: true, logged: true });
}
