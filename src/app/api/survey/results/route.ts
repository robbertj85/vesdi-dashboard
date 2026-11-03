import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import {
  ANPR_KANS_SCALE,
  BELEMMERINGEN,
  CAMERA_OPTIONS,
  CONTRACT_OPTIONS,
  FUNCTIES,
  SURVEY_ITEMS,
  type StoredResponse,
  type SurveySummary,
} from '@/lib/survey';
import { checkAdminKey, readResponses } from '@/lib/survey-store';

export const dynamic = 'force-dynamic';


function summarize(responses: StoredResponse[]): SurveySummary {
  const countBy = <T extends { value: string; label: string }>(options: readonly T[], pick: (r: StoredResponse) => string | null | string[]) =>
    options.map((o) => ({
      value: o.value,
      label: o.label,
      count: responses.filter((r) => {
        const v = pick(r);
        return Array.isArray(v) ? v.includes(o.value) : v === o.value;
      }).length,
    }));

  const gemeenteCounts = new Map<string, number>();
  for (const r of responses) {
    const g = r.respondent.gemeente.trim();
    const key = g.toLowerCase();
    const existing = [...gemeenteCounts.keys()].find((k) => k.toLowerCase() === key);
    gemeenteCounts.set(existing ?? g, (gemeenteCounts.get(existing ?? g) ?? 0) + 1);
  }

  const items = SURVEY_ITEMS.map((item) => {
    const distribution = [0, 0, 0, 0, 0];
    let nvt = 0;
    const comments: string[] = [];
    for (const r of responses) {
      const rating = r.ratings[item.id];
      if (!rating) continue;
      if (rating.score === 'nvt') nvt++;
      else if (typeof rating.score === 'number') distribution[rating.score - 1]++;
      if (rating.comment) comments.push(rating.comment);
    }
    const rated = distribution.reduce((s, c) => s + c, 0);
    const average = rated > 0 ? distribution.reduce((s, c, i) => s + c * (i + 1), 0) / rated : null;
    return { id: item.id, title: item.title, page: item.page, distribution, nvt, rated, average, comments };
  });

  const kansDist = [0, 0, 0, 0, 0];
  for (const r of responses) if (r.anpr.kans) kansDist[r.anpr.kans - 1]++;
  const kansRated = kansDist.reduce((s, c) => s + c, 0);

  return {
    total: responses.length,
    gemeenten: [...gemeenteCounts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    functies: countBy(FUNCTIES, (r) => r.respondent.functie),
    items,
    contract: countBy(CONTRACT_OPTIONS, (r) => r.contract.intentie),
    cameras: countBy(CAMERA_OPTIONS, (r) => r.anpr.cameras),
    anprKans: {
      distribution: kansDist,
      rated: kansRated,
      average: kansRated > 0 ? kansDist.reduce((s, c, i) => s + c * (i + 1), 0) / kansRated : null,
    },
    belemmeringen: countBy(BELEMMERINGEN, (r) => r.anpr.belemmeringen),
    anonymous: responses.filter((r) => !r.inviteId).length,
  };
}

/** Semicolon-separated with BOM, so Dutch Excel opens it correctly. */
function toCsv(responses: StoredResponse[]): string {
  const cell = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const label = (opts: readonly { value: string | number; label: string }[], v: unknown) =>
    opts.find((o) => o.value === v)?.label ?? (v ?? '');
  const header = [
    'id', 'ingediend', 'via_uitnodiging', 'naam', 'gemeente', 'functie', 'email',
    'contract_intentie', 'contract_toelichting',
    'anpr_cameras', 'anpr_kans', 'anpr_belemmeringen', 'anpr_toelichting', 'opmerkingen',
    ...SURVEY_ITEMS.flatMap((i) => [`${i.id}_score`, `${i.id}_toelichting`]),
  ];
  const rows = responses.map((r) => [
    r.id, r.submittedAt, r.inviteId ? 'ja' : 'nee', r.respondent.naam ?? '', r.respondent.gemeente, label(FUNCTIES, r.respondent.functie), r.respondent.email,
    label(CONTRACT_OPTIONS, r.contract.intentie), r.contract.toelichting,
    label(CAMERA_OPTIONS, r.anpr.cameras), r.anpr.kans ? `${r.anpr.kans} (${label(ANPR_KANS_SCALE, r.anpr.kans)})` : '',
    r.anpr.belemmeringen.map((b) => label(BELEMMERINGEN, b)).join(', '), r.anpr.toelichting, r.opmerkingen,
    ...SURVEY_ITEMS.flatMap((i) => [r.ratings[i.id]?.score ?? '', r.ratings[i.id]?.comment ?? '']),
  ]);
  return '﻿' + [header, ...rows].map((row) => row.map(cell).join(';')).join('\r\n');
}

/** Survey results for DMI. Requires the demo login AND the x-admin-key header. */
export async function GET(request: NextRequest) {
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

  const responses = await readResponses();
  if (request.nextUrl.searchParams.get('format') === 'csv') {
    return new NextResponse(toCsv(responses), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="vesdi-enquete-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-store',
      },
    });
  }
  return NextResponse.json(summarize(responses), { headers: { 'Cache-Control': 'no-store' } });
}
