"use client";

import { useState, useEffect } from "react";
import { MapPin, Navigation, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { prettyCategory } from "@/lib/assetTypes";

type NearbyAsset = {
  id: number;
  category: string;
  qrCodeId: string;
  department: string;
  gpsLat: number;
  gpsLon: number;
};

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

export default function NearbyAssets({ assets }: { assets: NearbyAsset[] }) {
  const supportsGeolocation = typeof navigator !== "undefined" && !!navigator.geolocation;

  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [loading, setLoading] = useState(supportsGeolocation);
  const [errorMsg, setErrorMsg] = useState(
    supportsGeolocation ? "" : "Geolocation is not supported by your browser."
  );

  // Ask the browser for a GPS fix — a genuine subscription to an external
  // system, so both outcomes are handled inside the async callbacks rather
  // than synchronously in the effect body.
  useEffect(() => {
    if (!supportsGeolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setErrorMsg("Could not access your GPS location. Please enable location services.");
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, [supportsGeolocation]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
        <p>Acquiring GPS Signal...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="p-6 bg-alert/10 border border-alert/20 text-alert rounded-2xl flex items-start gap-4">
        <AlertCircle className="w-6 h-6 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold">Location Required</h3>
          <p className="text-sm mt-1">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (!location) return null;

  // Calculate distance for all assets and sort
  const nearbyAssets = assets.map(asset => ({
    ...asset,
    distance: getDistanceFromLatLonInMeters(location.lat, location.lon, asset.gpsLat, asset.gpsLon)
  })).sort((a, b) => a.distance - b.distance).slice(0, 20); // Show top 20 closest

  return (
    <div className="space-y-6">
      <div className="p-4 rounded-xl flex items-center gap-3" style={{ background: "rgba(13,83,71,.07)", border: "1.5px solid rgba(13,83,71,.25)", color: "#0d5347" }}>
        <MapPin className="w-5 h-5 shrink-0" />
        <span className="dc-mono" style={{ fontSize: 11 }}>Your location — {location.lat.toFixed(4)}, {location.lon.toFixed(4)}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {nearbyAssets.length === 0 ? (
          <div className="col-span-full p-12 text-center dc-surface">
             <p className="text-slate-500">No assets found in the system.</p>
          </div>
        ) : (
          nearbyAssets.map(asset => (
            <div key={asset.id} className="dc-surface-soft p-5 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-800">{prettyCategory(asset.category)}</h3>
                  <span className="dc-badge">
                    {asset.distance < 1000 ? `${Math.round(asset.distance)}m` : `${(asset.distance / 1000).toFixed(1)}km`}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-1">Tag: {asset.qrCodeId}</p>
                <p className="text-sm text-slate-500">Dept: {asset.department}</p>
              </div>

              <div className="mt-4 pt-4 flex gap-2" style={{ borderTop: "1.5px solid rgba(18,21,15,.12)" }}>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${asset.gpsLat},${asset.gpsLon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dc-pill-ghost flex-1 text-sm"
                  style={{ minHeight: 40 }}
                >
                  <Navigation className="w-4 h-4" /> Route
                </a>
                <Link
                  href={`/report?asset=${asset.qrCodeId}`}
                  className="dc-pill flex-1 text-sm"
                  style={{ minHeight: 40 }}
                >
                  Report issue
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
