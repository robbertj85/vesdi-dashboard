import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth';
import { demoDataDir, listDemoFiles } from '@/lib/demo-data';

export const dynamic = 'force-dynamic';

const CONTENT_TYPES: Record<string, string> = {
  '.csv': 'text/csv; charset=utf-8',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

/** Serve one demo file (login required). Only names from the manifest are allowed. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  if (!verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });
  }

  const { file } = await params;
  const allowed = await listDemoFiles();
  if (!allowed.some((f) => f.name === file)) {
    return NextResponse.json({ error: 'Bestand niet gevonden' }, { status: 404 });
  }

  const body = await readFile(/*turbopackIgnore: true*/ path.join(demoDataDir(), file));
  return new NextResponse(new Uint8Array(body), {
    headers: {
      'Content-Type': CONTENT_TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'private, no-store',
    },
  });
}
