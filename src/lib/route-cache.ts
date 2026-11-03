import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { encodePolyline, routeCacheKey, type Centroid } from './route-pairs';

/**
 * Server-side route cache for the route map ("Trajecten").
 *
 * Every pair resolved through OpenRouteService is stored on disk, so routes are
 * computed once (ideally ahead of time with `npm run routes:precompute`) and
 * then served instantly to every visitor.
 *
 * File: $ROUTE_CACHE_DIR/routes.jsonl (default ./data/routes, gitignored), one
 * line per route: {"k": cacheKey, "p": encodedPolyline | ""}. An empty "p"
 * means ORS could not route the pair; transient failures are not cached.
 */

// Read lazily: the precompute script loads .env.local after imports are evaluated
// ORS_* are runtime settings (Coolify); NEXT_PUBLIC_* would be frozen at build time
const orsBaseUrl = () =>
  process.env.ORS_BASE_URL || process.env.NEXT_PUBLIC_ORS_BASE_URL || 'https://ors.transportbeat.nl/ors';

// Progressive snap radii: start precise, widen on "no routable point"
const SNAP_RADII = [400, 2000, 5000, 10000, 25000, 50000];
const MAX_TRANSIENT_RETRIES = 3;
const RETRY_DELAY_MS = 200;
/** ~5 m: drops redundant vertices without visible change at city zoom levels */
const SIMPLIFY_TOLERANCE_DEG = 0.00005;

export type RouteResult = { coordinates: [number, number][] } | 'unroutable' | null;

function cacheFile(): string {
  const dir = process.env.ROUTE_CACHE_DIR || path.join(process.cwd(), 'data', 'routes');
  return path.join(/*turbopackIgnore: true*/ dir, 'routes.jsonl');
}

function orsHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const key = process.env.ORS_API_KEY || process.env.NEXT_PUBLIC_ORS_API_KEY;
  if (key) h['X-API-Key'] = key;
  return h;
}

async function orsFetch(profile: string, body: string): Promise<Response | null> {
  for (let attempt = 0; attempt < MAX_TRANSIENT_RETRIES; attempt++) {
    try {
      return await fetch(`${orsBaseUrl()}/v2/directions/${profile}/geojson`, {
        method: 'POST',
        headers: orsHeaders(),
        body,
      });
    } catch {
      // ECONNRESET, timeout, … — retry after a short delay
      if (attempt < MAX_TRANSIENT_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }
  return null;
}

/**
 * Route one pair ([lng, lat] input, as ORS expects). Returns [lng, lat]
 * coordinates, 'unroutable' when ORS cannot find a road, or null on a
 * transient failure.
 */
export async function resolveRoute(profile: string, coordinates: [number, number][]): Promise<RouteResult> {
  for (const radius of SNAP_RADII) {
    const body = JSON.stringify({ coordinates, radiuses: Array(coordinates.length).fill(radius) });
    const res = await orsFetch(profile, body);
    if (!res) return null;
    if (res.ok) {
      const data = await res.json();
      const coords = data.features?.[0]?.geometry?.coordinates || [];
      return coords.length ? { coordinates: coords } : 'unroutable';
    }
    const text = await res.text();
    // Only widen the radius on "could not find routable point" (code 2010)
    if (res.status === 404 && text.includes('2010')) continue;
    // 400/404/…: this pair will never route. Auth (401/403), rate limits (429)
    // and 5xx are transient or configuration problems — never cache those.
    const transient = res.status >= 500 || [401, 403, 408, 429].includes(res.status);
    return transient ? null : 'unroutable';
  }
  return 'unroutable';
}

/** Ramer–Douglas–Peucker on [lat, lng] points (iterative, keeps endpoints). */
function simplify(points: [number, number][], tolerance: number): [number, number][] {
  if (points.length <= 2) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  const t2 = tolerance * tolerance;
  while (stack.length) {
    const [a, b] = stack.pop()!;
    const [ax, ay] = points[a];
    const [bx, by] = points[b];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1e-18;
    let maxD = -1;
    let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      const ex = ax + t * dx - px;
      const ey = ay + t * dy - py;
      const d = ex * ex + ey * ey;
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (maxD > t2 && idx > 0) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

// ─── Persistent cache (lazy-loaded, shared by all requests in this process) ───

const memory = new Map<string, string>();
let loadedBytes = 0;
let loading: Promise<void> | null = null;

/**
 * Read lines appended since the last read. The file may also be filled by the
 * precompute script running in another process while the server is live.
 */
function syncFromDisk(): Promise<void> {
  loading ??= (async () => {
    try {
      const buf = await readFile(/*turbopackIgnore: true*/ cacheFile());
      if (buf.length < loadedBytes) {
        memory.clear(); // file was replaced: start over
        loadedBytes = 0;
      }
      if (buf.length > loadedBytes) {
        const text = buf.subarray(loadedBytes).toString('utf8');
        const lastNewline = text.lastIndexOf('\n');
        for (const line of text.slice(0, lastNewline + 1).split('\n')) {
          if (!line) continue;
          try {
            const { k, p } = JSON.parse(line) as { k: string; p: string };
            memory.set(k, p);
          } catch {
            // skip a corrupt line
          }
        }
        loadedBytes += Buffer.byteLength(text.slice(0, lastNewline + 1), 'utf8');
      }
    } catch {
      // no cache file yet
    } finally {
      loading = null;
    }
  })();
  return loading;
}

let initialLoad: Promise<void> | null = null;

async function loadCache(): Promise<Map<string, string>> {
  initialLoad ??= syncFromDisk();
  await initialLoad;
  return memory;
}

async function persist(entries: { k: string; p: string }[]): Promise<void> {
  if (entries.length === 0) return;
  const file = cacheFile();
  await mkdir(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  await appendFile(/*turbopackIgnore: true*/ file, entries.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');
}

export interface RoutePairRequest {
  from: Centroid;
  to: Centroid;
}

export interface RouteBatchStats {
  cached: number;
  resolved: number;
  unroutable: number;
  failed: number;
}

/**
 * Routes for a list of pairs as encoded [lat, lng] polylines ('' = unroutable,
 * null = transient failure). Cached pairs return immediately; the rest are
 * resolved via ORS with `concurrency` parallel requests and then cached.
 */
export async function getRoutes(
  profile: string,
  pairs: RoutePairRequest[],
  concurrency = 50
): Promise<{ results: (string | null)[]; stats: RouteBatchStats }> {
  const cache = await loadCache();
  const results: (string | null)[] = new Array(pairs.length).fill(null);
  const todo: number[] = [];
  const stats: RouteBatchStats = { cached: 0, resolved: 0, unroutable: 0, failed: 0 };

  const lookup = () => {
    todo.length = 0;
    stats.cached = 0;
    pairs.forEach((p, i) => {
      const hit = cache.get(routeCacheKey(profile, p.from, p.to));
      if (hit !== undefined) {
        results[i] = hit;
        stats.cached++;
      } else {
        todo.push(i);
      }
    });
  };
  lookup();
  // Misses may have been computed meanwhile by another process: re-check the file once
  if (todo.length > 0) {
    await syncFromDisk();
    lookup();
  }

  const fresh: { k: string; p: string }[] = [];
  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const i = todo[next++];
      const { from, to } = pairs[i];
      const route = await resolveRoute(profile, [
        [from.lng, from.lat],
        [to.lng, to.lat],
      ]);
      if (route === null) {
        stats.failed++;
        continue;
      }
      const encoded =
        route === 'unroutable'
          ? ''
          : encodePolyline(simplify(route.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]), SIMPLIFY_TOLERANCE_DEG));
      if (encoded) stats.resolved++;
      else stats.unroutable++;
      const k = routeCacheKey(profile, from, to);
      cache.set(k, encoded);
      fresh.push({ k, p: encoded });
      results[i] = encoded;
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, todo.length) }, worker));
  await persist(fresh);

  return { results, stats };
}
