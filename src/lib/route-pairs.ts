/**
 * Route-map building blocks shared by the browser (route map) and the
 * server-side precompute script, so both derive identical pairs and cache keys.
 * No browser or Node APIs in here.
 */
import type { DeelritRow } from './types';

export const ORS_PROFILE = 'driving-hgv';

export interface Centroid {
  lat: number;
  lng: number;
}

export interface GeoKeyPairAgg {
  fromKey: string;
  toKey: string;
  count: number;
  euro6Count: number;
  euro05Count: number;
  klasseMap: Map<string, number>;
}

/** Unique national origin→destination pairs over all years, busiest first. */
export function aggregateRoutePairs(rowSets: Iterable<DeelritRow[]>): GeoKeyPairAgg[] {
  const map = new Map<string, GeoKeyPairAgg>();
  for (const rows of rowSets) {
    for (const r of rows) {
      if (!r.isNational) continue;
      const from = r.geoKeyLaad;
      const to = r.geoKeyLos;
      if (!from || !to || from === to) continue;
      const key = `${from}->${to}`;
      let agg = map.get(key);
      if (!agg) {
        agg = { fromKey: from, toKey: to, count: 0, euro6Count: 0, euro05Count: 0, klasseMap: new Map() };
        map.set(key, agg);
      }
      agg.count += r.aantalDeelritten;
      if (String(r.euronormKlasse) === '6') agg.euro6Count += r.aantalDeelritten;
      else agg.euro05Count += r.aantalDeelritten;
      const klasse = r.stadslogistieke_klasse || `Klasse ${r.stadslogistieke_klasse_code}`;
      agg.klasseMap.set(klasse, (agg.klasseMap.get(klasse) || 0) + r.aantalDeelritten);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

/**
 * Merge the three centroid files into one lookup.
 * pc6: {"1234AB": [lat, lng]}, pc4: {"1234": {lat, lng}}, nuts3: {"NL310": {lat, lng}} → "NUTS3:NL310"
 */
export function buildCentroidMap(
  pc6: Record<string, [number, number]> | null,
  pc4: Record<string, Centroid> | null,
  nuts3: Record<string, Centroid> | null
): Record<string, Centroid> {
  const combined: Record<string, Centroid> = {};
  if (pc6) for (const [code, c] of Object.entries(pc6)) combined[code] = { lat: c[0], lng: c[1] };
  if (pc4) Object.assign(combined, pc4);
  if (nuts3) for (const [code, c] of Object.entries(nuts3)) combined[`NUTS3:${code}`] = c;
  return combined;
}

/** Centroid for a geo key, falling back from PC6 to its PC4. */
export function resolveCentroid(map: Record<string, Centroid>, key: string): Centroid | undefined {
  if (map[key]) return map[key];
  if (/^\d{4}[A-Z]{2}$/i.test(key)) return map[key.substring(0, 4)];
  return undefined;
}

/** Cache key for one routed pair (coordinates rounded to ~10 m). */
export function routeCacheKey(profile: string, from: Centroid, to: Centroid): string {
  return `${profile}|${from.lat.toFixed(4)},${from.lng.toFixed(4)}-${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
}

// ─── Google encoded polyline (precision 5), [lat, lng] pairs ───

export function encodePolyline(coords: [number, number][]): string {
  let out = '';
  let prevLat = 0;
  let prevLng = 0;
  const enc = (v: number) => {
    let n = v < 0 ? ~(v << 1) : v << 1;
    let s = '';
    while (n >= 0x20) {
      s += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
      n >>= 5;
    }
    return s + String.fromCharCode(n + 63);
  };
  for (const [lat, lng] of coords) {
    const la = Math.round(lat * 1e5);
    const ln = Math.round(lng * 1e5);
    out += enc(la - prevLat) + enc(ln - prevLng);
    prevLat = la;
    prevLng = ln;
  }
  return out;
}

export function decodePolyline(str: string): [number, number][] {
  const coords: [number, number][] = [];
  let i = 0;
  let lat = 0;
  let lng = 0;
  const next = () => {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      b = str.charCodeAt(i++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (i < str.length) {
    lat += next();
    lng += next();
    coords.push([lat / 1e5, lng / 1e5]);
  }
  return coords;
}
