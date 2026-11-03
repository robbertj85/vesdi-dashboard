'use client';

import { SectionTitle } from '@/components/ui/info-tip';
import { useMemo, useEffect, useState } from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';
import { DynamicMap } from './dynamic-map';
import { Card } from '@/components/ui/card';

interface PC4BubbleData {
  pc4: string;
  count: number;
  weight: number;
}

interface Centroid {
  lat: number;
  lng: number;
}

interface PC4BubbleMapProps {
  title: string;
  titleTooltip?: string;
  data: PC4BubbleData[];
  color?: string;
  height?: number;
  level?: 'PC4' | 'PC6';
  /** Render without the card frame, e.g. inside another card */
  bare?: boolean;
}

const EMPTY_CENTROIDS: Record<string, Centroid> = {};

export function PC4BubbleMap({
  title,
  titleTooltip,
  data,
  color = '#1d3b64',
  height = 300,
  level = 'PC4',
  bare = false,
}: PC4BubbleMapProps) {
  // Centroids are tagged with the level they were loaded for, so `loading`
  // can be derived instead of set synchronously inside the effect.
  const [loaded, setLoaded] = useState<{ level: 'PC4' | 'PC6'; centroids: Record<string, Centroid> } | null>(null);
  const loading = loaded?.level !== level;
  const centroids = loaded?.level === level ? loaded.centroids : EMPTY_CENTROIDS;

  useEffect(() => {
    let cancelled = false;
    const file = level === 'PC6' ? '/geo/pc6-centroids.json' : '/geo/pc4-centroids.json';
    fetch(file)
      .then((res) => res.json())
      .then((raw) => {
        if (cancelled) return;
        if (level === 'PC6') {
          // PC6 format: {"1234AB": [lat, lng], ...}
          const mapped: Record<string, Centroid> = {};
          for (const [code, coords] of Object.entries(raw as Record<string, [number, number]>)) {
            mapped[code] = { lat: coords[0], lng: coords[1] };
          }
          setLoaded({ level, centroids: mapped });
        } else {
          // PC4 format: {"1234": {lat, lng}, ...}
          setLoaded({ level, centroids: raw as Record<string, Centroid> });
        }
      })
      .catch(() => {
        if (!cancelled) setLoaded({ level, centroids: {} });
      });
    return () => {
      cancelled = true;
    };
  }, [level]);

  const maxCount = useMemo(
    () => Math.max(...data.map((d) => d.count), 1),
    [data]
  );

  const mappedData = useMemo(
    () =>
      data
        .map((d) => {
          const centroid = centroids[d.pc4];
          if (!centroid) return null;
          return { ...d, lat: centroid.lat, lng: centroid.lng };
        })
        .filter(Boolean) as (PC4BubbleData & { lat: number; lng: number })[],
    [data, centroids]
  );

  // Auto-compute center from data
  const center = useMemo((): [number, number] => {
    if (mappedData.length === 0) return [52.09, 5.12];
    const avgLat = mappedData.reduce((s, d) => s + d.lat, 0) / mappedData.length;
    const avgLng = mappedData.reduce((s, d) => s + d.lng, 0) / mappedData.length;
    return [avgLat, avgLng];
  }, [mappedData]);

  if (loading) {
    return (
      <Card className="animate-pulse" style={{ height }}>
        <div className="flex items-center justify-center h-full text-sm text-dmi-text/40">
          Kaart laden...
        </div>
      </Card>
    );
  }

  const levelLabel = level === 'PC6' ? 'PC6' : 'PC4';

  return (
    <Card className={bare ? 'p-0 border-0 shadow-none bg-transparent gap-2' : 'p-2'}>
      {title && <SectionTitle title={title} tooltip={titleTooltip} className={bare ? '' : 'px-2 mb-2'} />}
      <DynamicMap center={center} zoom={level === 'PC6' ? 13 : 11} height={height - 40}>
        {mappedData.map((d) => {
          const radius = Math.max(3, Math.sqrt(d.count / maxCount) * 20);
          return (
            <CircleMarker
              key={d.pc4}
              center={[d.lat, d.lng]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.6,
                color: color,
                weight: 1,
                opacity: 0.8,
              }}
            >
              <Tooltip sticky>
                <strong>{levelLabel} {d.pc4}</strong>
                <br />
                Aantal: {d.count.toLocaleString('nl-NL')}
                <br />
                Gewicht: {d.weight.toLocaleString('nl-NL')} kg
              </Tooltip>
            </CircleMarker>
          );
        })}
      </DynamicMap>
    </Card>
  );
}
