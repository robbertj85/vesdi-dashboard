/**
 * Precompute every route-map trajectory server-side, so visitors never wait for
 * OpenRouteService.
 *
 *   npm run routes:precompute            # all pairs in the demo dataset
 *   npm run routes:precompute -- --limit 1000
 *
 * Reads the deelritten CSVs from DEMO_DATA_DIR (default demo-data/utrecht), derives
 * the same origin→destination pairs as the route map (shared code in
 * src/lib/route-pairs.ts) and fills the route cache in ROUTE_CACHE_DIR
 * (default data/routes). Already cached pairs are skipped, so the script can be
 * stopped and resumed at any time. Concurrency: ROUTE_CONCURRENCY (default 16).
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseCSV } from '../src/lib/parse-csv';
import { transformDeelritten } from '../src/lib/transform';
import { DETECTION_KEYS } from '../src/lib/column-schemas';
import { ORS_PROFILE, aggregateRoutePairs, buildCentroidMap, resolveCentroid, type Centroid } from '../src/lib/route-pairs';
import { getRoutes, type RouteBatchStats } from '../src/lib/route-cache';
import type { DeelritRow } from '../src/lib/types';

const CHUNK = 500;

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, 'utf8')) as T;
}

async function main() {
  // Pick up ORS settings from .env.local when running locally (optional on a server)
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // no .env.local: use the process environment
  }
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
  const concurrency = Number(process.env.ROUTE_CONCURRENCY) || 16;
  const dataDir = path.resolve(process.env.DEMO_DATA_DIR || 'demo-data/utrecht');

  // 1. Deelritten files (detected by header, like the upload page)
  const rowSets: DeelritRow[][] = [];
  for (const name of (await readdir(dataDir)).sort()) {
    if (!name.toLowerCase().endsWith('.csv')) continue;
    const text = await readFile(path.join(dataDir, name), 'utf8');
    const header = text.slice(0, text.indexOf('\n'));
    if (!header.includes(DETECTION_KEYS.deelritten)) continue;
    const { data } = parseCSV<DeelritRow>(text);
    rowSets.push(transformDeelritten(data, null));
    console.log(`  ${name}: ${data.length.toLocaleString('nl-NL')} rijen`);
  }
  if (rowSets.length === 0) throw new Error(`Geen deelrittenbestanden gevonden in ${dataDir}`);

  // 2. Same pairs and centroids as the route map
  const allPairs = aggregateRoutePairs(rowSets);
  const geo = path.resolve('public/geo');
  const centroids = buildCentroidMap(
    await readJson<Record<string, [number, number]>>(path.join(geo, 'pc6-centroids.json')),
    await readJson<Record<string, Centroid>>(path.join(geo, 'pc4-centroids.json')),
    await readJson<Record<string, Centroid>>(path.join(geo, 'nuts3-centroids.json'))
  );
  const pairs: { from: Centroid; to: Centroid }[] = [];
  for (const p of allPairs) {
    const from = resolveCentroid(centroids, p.fromKey);
    const to = resolveCentroid(centroids, p.toKey);
    if (from && to) pairs.push({ from, to });
    if (pairs.length >= limit) break;
  }
  console.log(`\n${allPairs.length.toLocaleString('nl-NL')} unieke paren, ${pairs.length.toLocaleString('nl-NL')} met bekende locatie. Concurrency ${concurrency}.\n`);

  // 3. Resolve in chunks (busiest pairs first), persisting as we go
  const total: RouteBatchStats = { cached: 0, resolved: 0, unroutable: 0, failed: 0 };
  const started = Date.now();
  for (let i = 0; i < pairs.length; i += CHUNK) {
    const { stats } = await getRoutes(ORS_PROFILE, pairs.slice(i, i + CHUNK), concurrency);
    for (const k of Object.keys(total) as (keyof RouteBatchStats)[]) total[k] += stats[k];
    const done = Math.min(i + CHUNK, pairs.length);
    const computed = total.resolved + total.unroutable + total.failed;
    const elapsed = (Date.now() - started) / 1000;
    const rate = computed / Math.max(elapsed, 1);
    const remaining = pairs.length - done;
    const eta = rate > 0 ? Math.round(remaining / rate / 60) : 0;
    console.log(
      `${done.toLocaleString('nl-NL').padStart(7)}/${pairs.length.toLocaleString('nl-NL')}` +
        `  cache ${total.cached}  nieuw ${total.resolved}  geen-route ${total.unroutable}  mislukt ${total.failed}` +
        (computed > 0 && remaining > 0 ? `  (~${eta} min te gaan)` : '')
    );
  }

  console.log(`\nKlaar in ${Math.round((Date.now() - started) / 1000)} s.`);
  if (total.failed > 0) {
    console.log(`${total.failed} routes mislukt (tijdelijke fout); draai het script nog eens om die opnieuw te proberen.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
