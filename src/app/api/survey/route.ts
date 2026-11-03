import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, readSession } from '@/lib/auth';
import { sanitizeAnswers } from '@/lib/survey';
import { findInviteById, readResponses, saveResponse } from '@/lib/survey-store';

export const dynamic = 'force-dynamic';

/**
 * Who is filling in the survey? Invited respondents (personal link) get their
 * name/municipality and their previous answers back so they can edit them.
 */
export async function GET(request: NextRequest) {
  const session = readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const invite = await findInviteById(session.inv);
  if (!invite) return NextResponse.json({ invite: null, previous: null });

  const previous = (await readResponses()).find((r) => r.inviteId === invite.id) ?? null;
  return NextResponse.json({
    invite: { naam: invite.naam, gemeente: invite.gemeente, email: invite.email, tourCompletedAt: invite.tourCompletedAt ?? null },
    previous,
  });
}

/** Submit one questionnaire response (login required). */
export async function POST(request: NextRequest) {
  const session = readSession(request.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek' }, { status: 400 });
  }

  // Invited respondents: identity comes from the invite, never from the form
  let inviteId: string | null = null;
  if (session.inv) {
    const invite = await findInviteById(session.inv);
    if (!invite) {
      return NextResponse.json({ error: 'Deze uitnodiging is ingetrokken' }, { status: 403 });
    }
    inviteId = invite.id;
    const respondent = (body.respondent ?? {}) as Record<string, unknown>;
    body.respondent = {
      ...respondent,
      naam: invite.naam,
      gemeente: invite.gemeente,
      email: invite.email || respondent.email,
    };
  }

  const answers = sanitizeAnswers(body);
  if (typeof answers === 'string') {
    return NextResponse.json({ error: answers }, { status: 400 });
  }
  try {
    const saved = await saveResponse(answers, inviteId);
    return NextResponse.json({ ok: true, id: saved.id, viaInvite: inviteId !== null });
  } catch (e) {
    console.error('[survey] opslaan mislukt', e);
    return NextResponse.json({ error: 'Opslaan op de server is mislukt' }, { status: 500 });
  }
}
