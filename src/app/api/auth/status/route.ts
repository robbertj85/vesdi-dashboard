import { NextResponse } from 'next/server';
import { sharedLoginEnabled } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Public: tells the login page whether the shared password login is available. */
export async function GET() {
  return NextResponse.json({ sharedLogin: sharedLoginEnabled() });
}
