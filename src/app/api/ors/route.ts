import { NextRequest, NextResponse } from 'next/server';
import { getRoutes, resolveRoute } from '@/lib/route-cache';

export const dynamic = 'force-dynamic';

const PROFILES = new Set(['driving-hgv', 'driving-car']);
const MAX_BATCH = 1000;

/**
 * POST /api/ors?profile=driving-hgv
 *
 * - Batch (route map): { batch: [{ coordinates: [[lng,lat],[lng,lat]] }, ...] }
 *   → { format: 'polyline', results: (encodedLatLngPolyline | '' | null)[] }
 *   Served from the server-side route cache; missing routes are resolved via
 *   ORS and cached. '' = no route possible, null = temporary failure.
 * - Single route: { coordinates: [[lng,lat],[lng,lat]] } → GeoJSON-like feature
 */
export async function POST(req: NextRequest) {
  const profile = req.nextUrl.searchParams.get('profile') || 'driving-hgv';
  if (!PROFILES.has(profile)) {
    return NextResponse.json({ error: 'Onbekend profiel' }, { status: 400 });
  }
  const parsed = await req.json().catch(() => null);
  if (!parsed) return NextResponse.json({ error: 'Ongeldig verzoek' }, { status: 400 });

  if (!parsed.batch) {
    const result = await resolveRoute(profile, parsed.coordinates);
    if (!result || result === 'unroutable') {
      return NextResponse.json({ error: 'Could not resolve route' }, { status: 404 });
    }
    return NextResponse.json({ features: [{ geometry: { coordinates: result.coordinates } }] });
  }

  const items: { coordinates: [number, number][] }[] = Array.isArray(parsed.batch) ? parsed.batch : [];
  if (items.length > MAX_BATCH) {
    return NextResponse.json({ error: `Maximaal ${MAX_BATCH} routes per verzoek` }, { status: 400 });
  }
  const pairs = items.map((it) => ({
    from: { lng: Number(it.coordinates?.[0]?.[0]), lat: Number(it.coordinates?.[0]?.[1]) },
    to: { lng: Number(it.coordinates?.[1]?.[0]), lat: Number(it.coordinates?.[1]?.[1]) },
  }));
  if (pairs.some((p) => ![p.from.lat, p.from.lng, p.to.lat, p.to.lng].every(Number.isFinite))) {
    return NextResponse.json({ error: 'Ongeldige coördinaten' }, { status: 400 });
  }

  const { results } = await getRoutes(profile, pairs);
  return NextResponse.json({ format: 'polyline', results });
}
