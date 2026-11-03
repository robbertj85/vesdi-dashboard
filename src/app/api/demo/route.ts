import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { listDemoFiles } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

/** Manifest of the Utrecht demo dataset (login required). */
export async function GET(request: NextRequest) {
  // Defence in depth: proxy.ts already gates this route
  if (!verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }
  const files = await listDemoFiles();
  return NextResponse.json({ municipality: 'Utrecht', files });
}
