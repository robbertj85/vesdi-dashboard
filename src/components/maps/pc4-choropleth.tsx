'use client';

import { SectionTitle } from '@/components/ui/info-tip';
import { useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';
import { DynamicMap } from './dynamic-map';
import { useGeoJSON } from '@/hooks/use-geojson';
import { CHOROPLETH_TEAL } from '@/lib/colors';
import { Card } from '@/components/ui/card';
import type { Feature, Geometry } from 'geojson';
import type { Layer, PathOptions } from 'leaflet';

interface PC4ChoroplethData {
  pc4: string;
  value: number; // 0-1 (beladingsgraad)
}

interface PC4ChoroplethProps {
  title: string;
  titleTooltip?: string;
  data: PC4ChoroplethData[];
  color?: string;
  height?: number;
}

export function PC4Choropleth({
  title,
  titleTooltip,
  data,
  height = 300,
}: PC4ChoroplethProps) {
  const { data: geojson, loading } = useGeoJSON('/geo/pc4-netherlands.json');

  const dataMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data) {
      map.set(d.pc4, d.value);
    }
    return map;
  }, [data]);

  const maxVal = useMemo(
    () => Math.max(...data.map((d) => d.value), 0.01),
    [data]
  );

  const style = (feature?: Feature<Geometry> | undefined): PathOptions => {
    const pc4 = feature?.properties?.pc4 || feature?.properties?.postcode4 || feature?.properties?.PC4 || '';
    const val = dataMap.get(pc4);
    if (val === undefined) {
      return { fillColor: '#f0f0f0', weight: 0.3, color: '#ddd', fillOpacity: 0.1 };
    }
    const idx = Math.min(
      Math.floor((val / maxVal) * (CHOROPLETH_TEAL.length - 1)),
      CHOROPLETH_TEAL.length - 1
    );
    return {
      fillColor: CHOROPLETH_TEAL[idx],
      weight: 0.5,
      color: '#aaa',
      fillOpacity: 0.7,
    };
  };

  const onEachFeature = (feature: Feature, layer: Layer) => {
    const pc4 = feature.properties?.pc4 || feature.properties?.postcode4 || feature.properties?.PC4 || '';
    const val = dataMap.get(pc4);
    if (val !== undefined) {
      layer.bindTooltip(
        `PC4 ${pc4}: ${(val * 100).toFixed(0)}%`,
        { sticky: true }
      );
    }
  };

  if (loading || !geojson) {
    return (
      <Card className="animate-pulse" style={{ height }}>
        <div className="flex items-center justify-center h-full text-sm text-dmi-text/40">
          Kaart laden...
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-2">
      <SectionTitle title={title} tooltip={titleTooltip} className="px-2 mb-2" />
      <DynamicMap center={[52.09, 5.12]} zoom={11} height={height - 40}>
        <GeoJSON
          data={geojson}
          style={style}
          onEachFeature={onEachFeature}
        />
      </DynamicMap>
    </Card>
  );
}
