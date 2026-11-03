import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { BASE_PATH } from '@/lib/base-path';
import {
  checkAdminKey,
  createInvite,
  deleteInvite,
  importRecipients,
  markInviteMailed,
  readInvites,
  readActivity,
  readResponses,
  recipientsFile,
} from '@/lib/survey-store';

export const dynamic = 'force-dynamic';

/** Links must point at the public site, also when the app runs behind a proxy */
function publicOrigin(request: NextRequest): string {
  return (process.env.PUBLIC_BASE_URL || `${request.nextUrl.origin}${BASE_PATH}`).replace(/\/$/, '');
}

async function guard(request: NextRequest): Promise<NextResponse | null> {
  if (!verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }
  const access = checkAdminKey(request.headers.get('x-admin-key'));
  if (access === 'unconfigured') {
    return NextResponse.json({ error: 'SURVEY_ADMIN_KEY is niet ingesteld op de server' }, { status: 503 });
  }
  if (access === 'denied') {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: 'Onjuiste beheerderssleutel' }, { status: 403 });
  }
  return null;
}

/** List invites with their personal link and whether they responded (admin only). */
export async function GET(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const [invites, responses, activity] = await Promise.all([readInvites(), readResponses(), readActivity()]);
  const seconds = (id: string, kind: 'tour' | 'survey') =>
    Math.round(activity.filter((a) => a.inviteId === id && a.kind === kind).reduce((s, a) => s + a.ms, 0) / 1000);
  const origin = publicOrigin(request);
  return NextResponse.json(
    invites.map((i) => {
      const response = responses.find((r) => r.inviteId === i.id);
      return {
        id: i.id,
        naam: i.naam,
        gemeente: i.gemeente,
        email: i.email,
        createdAt: i.createdAt,
        mailedAt: i.mailedAt ?? null,
        tourCompletedAt: i.tourCompletedAt ?? null,
        tourSeconds: seconds(i.id, 'tour'),
        surveySeconds: seconds(i.id, 'survey'),
        link: `${origin}/uitnodiging/${i.code}`,
        respondedAt: response?.submittedAt ?? null,
      };
    }),
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/**
 * Admin only:
 * - { naam, gemeente, email? } → create one invite
 * - { action: 'import' } → create invites for everyone in the recipient list file
 */
export async function POST(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (body.action === 'import') {
    const result = await importRecipients();
    if (!result) {
      return NextResponse.json(
        { error: `Geen ontvangerslijst gevonden. Zet een CSV (naam;gemeente;email) in ${recipientsFile()}` },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, ...result, file: undefined });
  }
  const s = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const naam = s(body.naam, 120);
  const gemeente = s(body.gemeente, 120);
  const email = s(body.email, 200);
  if (!naam || !gemeente) {
    return NextResponse.json({ error: 'Naam en gemeente zijn verplicht' }, { status: 400 });
  }
  const invite = await createInvite({ naam, gemeente, email });
  return NextResponse.json({ ok: true, id: invite.id, link: `${publicOrigin(request)}/uitnodiging/${invite.code}` });
}

/** Mark an invite as mailed: ?id=… (admin only), called when the e-mail is composed. */
export async function PATCH(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const id = request.nextUrl.searchParams.get('id') ?? '';
  const ok = await markInviteMailed(id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
}

/** Revoke an invite: ?id=… (admin only). Its link stops working immediately. */
export async function DELETE(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const id = request.nextUrl.searchParams.get('id') ?? '';
  const ok = await deleteInvite(id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });
}
