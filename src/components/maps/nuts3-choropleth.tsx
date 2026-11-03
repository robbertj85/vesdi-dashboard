'use client';

import { useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import { DynamicMap } from './dynamic-map';
import { useGeoJSON } from '@/hooks/use-geojson';
import { CHOROPLETH_TEAL, CHOROPLETH_MAUVE } from '@/lib/colors';
import { Card } from '@/components/ui/card';
import type { Nuts3Data } from '@/lib/types';
import type { Feature, Geometry } from 'geojson';
import type { Layer, PathOptions } from 'leaflet';

interface Nuts3ChoroplethProps {
  data: Nuts3Data[];
  colorScale?: 'teal' | 'mauve';
  height?: number;
  /** Initial view; defaults to the Netherlands, where most VESDI flows are */
  center?: [number, number];
  zoom?: number;
}

const NO_DATA = '#f0f0f0';

function formatPct(v: number): string {
  const pct = v * 100;
  if (pct === 0) return '0%';
  if (pct < 1) return `${pct.toLocaleString('nl-NL', { maximumSignificantDigits: 2 })}%`;
  return `${pct.toLocaleString('nl-NL', { maximumFractionDigits: pct < 10 ? 1 : 0 })}%`;
}

export function Nuts3Choropleth({
  data,
  colorScale = 'teal',
  height = 400,
  center = [52.15, 5.4],
  zoom = 6,
}: Nuts3ChoroplethProps) {
  const { data: geojson, loading } = useGeoJSON('/geo/nuts3-europe.json');
  // Skip the palette's lightest step: it is too close to the "no data" grey
  const classes = (colorScale === 'teal' ? CHOROPLETH_TEAL : CHOROPLETH_MAUVE).slice(1);

  const dataMap = useMemo(() => {
    const map = new Map<string, Nuts3Data>();
    for (const d of data) map.set(d.nuts3, d);
    return map;
  }, [data]);

  /**
   * Quantile class breaks: each colour holds roughly the same number of regions.
   * Flows are extremely skewed (the home region dominates), so a linear scale
   * would paint almost every region in the lightest colour.
   */
  const breaks = useMemo(() => {
    const values = data.map((d) => d.percentage).filter((v) => v > 0).sort((a, b) => a - b);
    if (values.length === 0) return [] as number[];
    const n = Math.min(classes.length, values.length);
    const out: number[] = [];
    for (let i = 1; i < n; i++) {
      const b = values[Math.floor((i / n) * values.length)];
      if (out.length === 0 || b > out[out.length - 1]) out.push(b);
    }
    return out;
  }, [data, classes.length]);

  // Spread the used classes over the full palette so dark = high even with few breaks
  const classColor = (i: number) => {
    const used = breaks.length + 1;
    if (used <= 1) return classes[classes.length - 1];
    return classes[Math.round((i / (used - 1)) * (classes.length - 1))];
  };
  const getColor = (pct: number) => {
    if (pct <= 0) return NO_DATA;
    const idx = breaks.findIndex((b) => pct < b);
    return classColor(idx === -1 ? breaks.length : idx);
  };

  const legend = useMemo(() => {
    if (data.length === 0) return [];
    const max = Math.max(...data.map((d) => d.percentage));
    const bounds = [0, ...breaks, max];
    return bounds.slice(0, -1).map((lo, i) => ({
      color: classColor(i),
      label: `${formatPct(lo)} – ${formatPct(bounds[i + 1])}`,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, breaks]);

  const style = (feature?: Feature<Geometry> | undefined): PathOptions => {
    const nuts3Id = feature?.properties?.NUTS_ID || '';
    const d = dataMap.get(nuts3Id);
    return {
      fillColor: d ? getColor(d.percentage) : NO_DATA,
      weight: 0.5,
      opacity: 1,
      color: '#bbb',
      fillOpacity: d ? 0.85 : 0.15,
    };
  };

  const onEachFeature = (feature: Feature, layer: Layer) => {
    const nuts3Id = feature.properties?.NUTS_ID || '';
    const name = feature.properties?.NUTS_NAME || nuts3Id;
    const d = dataMap.get(nuts3Id);
    if (d) {
      layer.bindTooltip(
        `<strong>${name}</strong><br/>${d.count.toLocaleString('nl-NL')} (${formatPct(d.percentage)})`,
        { sticky: true }
      );
    }
  };

  // react-leaflet's GeoJSON keeps its first style; remount it when the data changes
  const dataKey = useMemo(
    () => `${data.length}:${data.reduce((s, d) => s + d.count, 0)}`,
    [data]
  );

  if (loading || !geojson) {
    return (
      <Card className="animate-pulse bg-white/5" style={{ height }}>
        <div className="flex items-center justify-center h-full text-sm text-dmi-text/40">
          Kaart laden...
        </div>
      </Card>
    );
  }

  return (
    <div className="relative">
      <DynamicMap center={center} zoom={zoom} height={height}>
        <GeoJSON key={dataKey} data={geojson} style={style} onEachFeature={onEachFeature} />
      </DynamicMap>
      {legend.length > 0 && (
        <div className="absolute bottom-6 left-2 z-[5] rounded-md bg-white/90 shadow-sm px-2.5 py-2 text-[11px] text-dmi-text/80 space-y-0.5 pointer-events-none">
          {legend.map((l, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-3.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
              {l.label}
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-dmi-text/50">
            <span className="w-3.5 h-2.5 rounded-sm border border-dmi-text/15" style={{ backgroundColor: NO_DATA }} />
            geen
          </div>
        </div>
      )}
    </div>
  );
}
