"use server";

import { geocodeAddress } from "@/lib/geo";

export type GeocodeResult =
  | { ok: true; lat: number; lon: number; label: string; area: string | null }
  | { ok: false; error: string };

/** Turn a typed address / landmark into map coordinates (via OSM Nominatim). */
export async function resolveAddress(text: string): Promise<GeocodeResult> {
  const q = (text || "").trim();
  if (q.length < 3) return { ok: false, error: "Type a fuller address or landmark." };
  try {
    const hit = await geocodeAddress(q);
    if (!hit) return { ok: false, error: "Couldn't find that place. Add the city / area name and try again." };
    const area = hit.area ? hit.area.areaName || hit.area.label : null;
    return { ok: true, lat: hit.lat, lon: hit.lon, label: hit.label, area };
  } catch (e) {
    console.error("resolveAddress failed:", e);
    return { ok: false, error: "Address lookup is unavailable right now." };
  }
}
