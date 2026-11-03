'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { Polyline, Popup, Tooltip } from 'react-leaflet';
import { DynamicMap } from './dynamic-map';
import { useVesdiStore } from '@/lib/store';
import { ROUTE_HEAT_COLORS } from '@/lib/colors';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  ORS_PROFILE,
  aggregateRoutePairs,
  buildCentroidMap,
  decodePolyline,
  resolveCentroid,
  type Centroid,
  type GeoKeyPairAgg,
} from '@/lib/route-pairs';

interface RouteSegment {
  coordinates: [number, number][];
  count: number;
  color: string;
  euro6Count: number;
  euro05Count: number;
  topKlassen: { klasse: string; count: number; pct: number }[];
}

function getHeatColor(count: number, maxCount: number): string {
  if (maxCount === 0) return ROUTE_HEAT_COLORS[0];
  const ratio = count / maxCount;
  const idx = Math.min(
    Math.floor(ratio * (ROUTE_HEAT_COLORS.length - 1)),
    ROUTE_HEAT_COLORS.length - 1
  );
  return ROUTE_HEAT_COLORS[idx];
}

/** Build dynamic legend buckets from actual data range */
export function buildLegendBuckets(maxCount: number): { min: number; max: number | null; color: string }[] {
  if (maxCount === 0) return [{ min: 0, max: null, color: ROUTE_HEAT_COLORS[0] }];
  const step = Math.ceil(maxCount / ROUTE_HEAT_COLORS.length);
  return ROUTE_HEAT_COLORS.map((color, i) => {
    const min = i * step;
    const max = i === ROUTE_HEAT_COLORS.length - 1 ? null : (i + 1) * step - 1;
    return { min, max, color };
  }).reverse();
}

// Routes used to be cached in localStorage (capped at ~5 MB); they now live in
// the server-side route cache. Free the space taken by the old cache once.
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('vesdi-routes-cache');
  } catch {
    // storage unavailable
  }
}

/** Larger batches are fine: cached routes come back from the server instantly */
const BATCH_SIZE = 500;

/**
 * Routes for a batch of pairs from the server-side route cache (/api/ors).
 * Returns [lat, lng] coordinates per pair, or null when no route is available.
 */
async function fetchRoutesBatch(pairs: { from: Centroid; to: Centroid }[]): Promise<([number, number][] | null)[]> {
  try {
    const res = await fetch(`/api/ors?profile=${ORS_PROFILE}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batch: pairs.map(({ from, to }) => ({ coordinates: [[from.lng, from.lat], [to.lng, to.lat]] })),
      }),
    });
    if (!res.ok) return pairs.map(() => null);
    const data: { results: (string | null)[] } = await res.json();
    return data.results.map((p) => (p ? decodePolyline(p) : null));
  } catch {
    // Network error — fall back to straight lines
    return pairs.map(() => null);
  }
}

/** Load PC6, PC4 and NUTS3 centroid files and return a unified lookup */
async function loadCentroids(): Promise<Record<string, Centroid>> {
  const get = async <T,>(url: string): Promise<T | null> => {
    try {
      const res = await fetch(url);
      return res.ok ? ((await res.json()) as T) : null;
    } catch {
      return null;
    }
  };
  const [pc6, pc4, nuts3] = await Promise.all([
    get<Record<string, [number, number]>>('/geo/pc6-centroids.json'),
    get<Record<string, Centroid>>('/geo/pc4-centroids.json'),
    get<Record<string, Centroid>>('/geo/nuts3-centroids.json'),
  ]);
  return buildCentroidMap(pc6, pc4, nuts3);
}

interface RouteMapProps {
  height?: number;
  maxRoutes?: number;
  useTrajectories?: boolean;
  onLegendData?: (maxCount: number) => void;
  onTotalPairs?: (total: number) => void;
}

export function RouteMap({ height = 500, maxRoutes = 200, useTrajectories = false, onLegendData, onTotalPairs }: RouteMapProps) {
  const deelrittenByYear = useVesdiStore((s) => s.deelrittenByYear);
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  // Aggregate unique geo key pairs across all years with Euro + klasse breakdown
  const allPairsSorted = useMemo(
    (): GeoKeyPairAgg[] => aggregateRoutePairs(deelrittenByYear.values()),
    [deelrittenByYear]
  );

  const geoKeyPairs = useMemo(
    () => maxRoutes > 0 ? allPairsSorted.slice(0, maxRoutes) : allPairsSorted,
    [allPairsSorted, maxRoutes]
  );

  useEffect(() => {
    onTotalPairs?.(allPairsSorted.length);
  }, [allPairsSorted.length, onTotalPairs]);

  const fetchRoutes = useCallback(async (centroidMap: Record<string, Centroid>) => {
    if (Object.keys(centroidMap).length === 0) {
      setLoading(false);
      return;
    }

    const maxCount = Math.max(...geoKeyPairs.map((p) => p.count));
    onLegendData?.(maxCount);
    const results: RouteSegment[] = [];
    setProgress({ done: 0, total: geoKeyPairs.length });

    const resolve = (key: string) => resolveCentroid(centroidMap, key);

    // Pre-resolve centroids and filter out pairs without valid locations
    const resolvedPairs = geoKeyPairs
      .map((pair) => ({
        pair,
        from: resolve(pair.fromKey),
        to: resolve(pair.toKey),
      }))
      .filter((p): p is typeof p & { from: Centroid; to: Centroid } => !!p.from && !!p.to);

    setProgress({ done: 0, total: resolvedPairs.length });
    let done = 0;

    const buildSegment = (pair: GeoKeyPairAgg, coords: [number, number][]) => {
      const topKlassen = [...pair.klasseMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([klasse, count]) => ({
          klasse,
          count,
          pct: pair.count > 0 ? Math.round((count / pair.count) * 100) : 0,
        }));
      return {
        coordinates: coords,
        count: pair.count,
        color: getHeatColor(pair.count, maxCount),
        euro6Count: pair.euro6Count,
        euro05Count: pair.euro05Count,
        topKlassen,
      };
    };

    if (!useTrajectories) {
      // Straight lines — no ORS calls, instant rendering
      for (const { pair, from, to } of resolvedPairs) {
        results.push(buildSegment(pair, [[from.lat, from.lng], [to.lat, to.lng]]));
      }
      setProgress({ done: resolvedPairs.length, total: resolvedPairs.length });
    } else {
      // Routes come from the server-side cache; missing ones are computed there
      for (let batchStart = 0; batchStart < resolvedPairs.length; batchStart += BATCH_SIZE) {
        const batch = resolvedPairs.slice(batchStart, batchStart + BATCH_SIZE);
        const batchCoords = await fetchRoutesBatch(batch.map(({ from, to }) => ({ from, to })));

        for (let j = 0; j < batch.length; j++) {
          let coords = batchCoords[j];
          if (!coords || coords.length === 0) {
            const { from, to } = batch[j];
            coords = [[from.lat, from.lng], [to.lat, to.lng]];
          }
          results.push(buildSegment(batch[j].pair, coords));
        }

        done += batch.length;
        setProgress({ done, total: resolvedPairs.length });
      }
    }

    results.sort((a, b) => a.count - b.count);
    setSegments(results);
    setLoading(false);
  }, [geoKeyPairs, useTrajectories, onLegendData]);

  useEffect(() => {
    // Nothing to fetch: `isLoading` below is derived as false for empty input
    if (geoKeyPairs.length === 0) return;
    loadCentroids().then(fetchRoutes);
  }, [fetchRoutes, geoKeyPairs.length]);

  const isLoading = loading && geoKeyPairs.length > 0;

  if (isLoading) {
    return (
      <Card className="flex flex-col items-center justify-center" style={{ height }}>
        <Loader2 className="w-8 h-8 text-dmi-orange animate-spin mb-3" />
        <p className="text-sm text-dmi-text/60">
          Routes berekenen... {progress.done}/{progress.total}
        </p>
      </Card>
    );
  }

  const allCoords = segments.flatMap((s) => s.coordinates);
  const center: [number, number] =
    allCoords.length > 0
      ? [
          allCoords.reduce((s, c) => s + c[0], 0) / allCoords.length,
          allCoords.reduce((s, c) => s + c[1], 0) / allCoords.length,
        ]
      : [52.09, 5.12];

  return (
    <DynamicMap center={center} zoom={12} height={height}>
      {segments.map((seg, i) => {
        const euro6Pct = seg.count > 0 ? Math.round((seg.euro6Count / seg.count) * 100) : 0;
        const euro05Pct = 100 - euro6Pct;
        return (
          <Polyline
            key={i}
            positions={seg.coordinates}
            pathOptions={{
              color: seg.color,
              weight: 3,
              opacity: 0.8,
              lineJoin: 'round',
              lineCap: 'round',
            }}
          >
            <Tooltip sticky>
              {seg.count.toLocaleString('nl-NL')} deelritten
            </Tooltip>
            <Popup>
              <div className="text-xs min-w-[180px]">
                <p className="font-bold text-sm mb-2">
                  {seg.count.toLocaleString('nl-NL')} deelritten
                </p>
                <p className="font-semibold mb-1">Euronorm</p>
                <div className="flex gap-3 mb-2">
                  <span>Euro 6: <strong>{euro6Pct}%</strong></span>
                  <span>Euro 0-5: <strong>{euro05Pct}%</strong></span>
                </div>
                {seg.topKlassen.length > 0 && (
                  <>
                    <p className="font-semibold mb-1">Top klassen</p>
                    {seg.topKlassen.map((k) => (
                      <div key={k.klasse} className="flex justify-between">
                        <span className="truncate mr-2">{k.klasse}</span>
                        <span className="shrink-0">{k.pct}%</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </DynamicMap>
  );
}
