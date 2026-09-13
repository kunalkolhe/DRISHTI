"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapPoint = {
  id: number;
  lat: number;
  lon: number;
  kind: "asset" | "complaint";
  label: string;
  sublabel: string;
  /** dc-* palette hex — greens/ochres/reds, matching the rest of the site. */
  color: string;
  href?: string;
};

// Fits the view to every point once, on first render — react-leaflet has
// no declarative prop for this, so a tiny child component reaching into
// the map instance via useMap() is the documented way to do it.
function FitToPoints({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();
  useMemo(() => {
    if (bounds) map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
  }, [map, bounds]);
  return null;
}

export default function CityMap({ points }: { points: MapPoint[] }) {
  const withCoords = points.filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lon),
  );

  const bounds: LatLngBoundsExpression | null =
    withCoords.length > 0
      ? withCoords.map((p) => [p.lat, p.lon] as [number, number])
      : null;

  // Fallback center (Pune) only matters when there's nothing to fit to yet.
  const center: [number, number] = bounds ? (bounds[0] as [number, number]) : [18.5204, 73.8567];

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%", background: "#eee8da" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitToPoints bounds={bounds} />
      {withCoords.map((p) => (
        <CircleMarker
          key={`${p.kind}-${p.id}`}
          center={[p.lat, p.lon]}
          radius={p.kind === "complaint" ? 8 : 5}
          pathOptions={{
            color: "#12150f",
            weight: 1.5,
            fillColor: p.color,
            fillOpacity: p.kind === "complaint" ? 0.9 : 0.65,
          }}
        >
          <Popup>
            <div style={{ fontFamily: "inherit", fontSize: 13, lineHeight: 1.4 }}>
              <strong>{p.label}</strong>
              <br />
              <span style={{ color: "#6a6555" }}>{p.sublabel}</span>
              {p.href && (
                <>
                  <br />
                  <a href={p.href} style={{ color: "#0d5347", fontWeight: 600 }}>
                    View details ↗
                  </a>
                </>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
