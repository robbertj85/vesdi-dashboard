'use client';

import { useState, useEffect } from 'react';
import type { FeatureCollection } from 'geojson';

const cache = new Map<string, FeatureCollection>();

type Result = { path: string; data: FeatureCollection | null; error: string | null };

/**
 * Fetch and cache a GeoJSON file from /public/geo/
 */
export function useGeoJSON(path: string): {
  data: FeatureCollection | null;
  loading: boolean;
  error: string | null;
} {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (cache.has(path)) return;

    let cancelled = false;
    fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
        return res.json();
      })
      .then((geojson: FeatureCollection) => {
        cache.set(path, geojson);
        if (!cancelled) setResult({ path, data: geojson, error: null });
      })
      .catch((err: Error) => {
        if (!cancelled) setResult({ path, data: null, error: err.message });
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  const cached = cache.get(path);
  if (cached) return { data: cached, loading: false, error: null };
  if (result?.path === path) return { data: result.data, loading: false, error: result.error };
  return { data: null, loading: true, error: null };
}
