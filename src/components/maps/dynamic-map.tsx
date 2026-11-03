'use client';

import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bijdragers';

/**
 * Basemap. CARTO serves an "API KEY REQUIRED" watermark on every tile unless a
 * (free) key is passed, so CARTO's light style is only used when
 * NEXT_PUBLIC_CARTO_API_KEY is set. Otherwise fall back to the keyless
 * OpenStreetMap tiles, desaturated via CSS (.basemap-muted) to stay close to
 * the light look.
 */
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY;
const BASEMAP = CARTO_KEY
  ? {
      url: `https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png?key=${encodeURIComponent(CARTO_KEY)}`,
      attribution: `${OSM_ATTRIBUTION}, &copy; <a href="https://carto.com/attributions">CARTO</a>`,
    }
  : {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: OSM_ATTRIBUTION,
      className: 'basemap-muted',
      maxZoom: 19,
    };

interface DynamicMapProps {
  center?: [number, number];
  zoom?: number;
  height?: number;
  children?: React.ReactNode;
}

export function DynamicMap({
  center = [52.09, 5.12], // Utrecht default
  zoom = 7,
  height = 400,
  children,
}: DynamicMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: '0.5rem' }}
      scrollWheelZoom={true}
    >
      <TileLayer {...BASEMAP} />
      {children}
    </MapContainer>
  );
}
