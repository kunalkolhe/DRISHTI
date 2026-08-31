/**
 * Reverse / forward geocoding via OpenStreetMap Nominatim (free, no key).
 *
 * Used to turn a citizen's GPS point or typed "Location description" into an
 * administrative area — city / town / village + state — and a best guess at
 * which local-government body governs it.
 *
 * Call these from the SERVER only (a User-Agent is required by Nominatim's
 * usage policy and browsers cannot set it). Keep to ~1 request/second.
 */

import type { AreaType } from "./jurisdictions";

const UA =
  process.env.NOMINATIM_USER_AGENT ||
  "DRISHTI-civic-reporting/1.0 (+https://drishti.local)";
const BASE = process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org";

export type AreaGuess = {
  areaType: AreaType;
  /** e.g. "Kothrud, Pune" or "Velhe" */
  areaName: string;
  state: string;
  district?: string;
  /** Human label for the confirmation chip. */
  label: string;
  source: "gps" | "text";
};

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  suburb?: string;
  neighbourhood?: string;
  city_district?: string;
  county?: string;
  state_district?: string;
  state?: string;
  region?: string;
  country?: string;
};

/** Infers the local-government body type + the name to show from an OSM address. */
function classify(a: NominatimAddress): { areaType: AreaType; areaName: string } {
  if (a.village || a.hamlet) {
    return { areaType: "GRAM_PANCHAYAT", areaName: a.village || a.hamlet || "" };
  }
  if (a.town) {
    return { areaType: "MUNICIPAL_COUNCIL", areaName: a.town };
  }
  const city = a.city || a.municipality;
  const locality = a.suburb || a.city_district || a.neighbourhood;
  if (city) {
    return {
      areaType: "MUNICIPAL_CORPORATION",
      areaName: locality ? `${locality}, ${city}` : city,
    };
  }
  // A bare locality with no town/village is almost always inside a city.
  if (locality) {
    return { areaType: "MUNICIPAL_CORPORATION", areaName: locality };
  }
  const fallback = a.county || a.state_district || "your area";
  return { areaType: "MUNICIPAL_COUNCIL", areaName: fallback };
}

function toGuess(addr: NominatimAddress, source: "gps" | "text"): AreaGuess {
  const { areaType, areaName } = classify(addr);
  const state = addr.state || addr.region || "";
  const district = addr.state_district || addr.county;
  const label = [areaName, district, state].filter(Boolean).join(", ");
  return { areaType, areaName, state, district, label, source };
}

async function call(pathAndQuery: string): Promise<unknown> {
  const res = await fetch(`${BASE}${pathAndQuery}`, {
    headers: { "User-Agent": UA, "Accept-Language": "en" },
    // area lookups are stable enough to cache briefly
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return res.json();
}

export async function reverseGeocode(lat: number, lon: number): Promise<AreaGuess | null> {
  const data = (await call(
    `/reverse?format=jsonv2&zoom=14&addressdetails=1&lat=${lat}&lon=${lon}`,
  )) as { address?: NominatimAddress };
  if (!data?.address) return null;
  return toGuess(data.address, "gps");
}

export async function forwardGeocode(text: string): Promise<AreaGuess | null> {
  const arr = (await call(
    `/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=in&q=${encodeURIComponent(
      text,
    )}`,
  )) as Array<{ address?: NominatimAddress }>;
  if (!Array.isArray(arr) || !arr.length || !arr[0].address) return null;
  return toGuess(arr[0].address, "text");
}
