"use server";

import { reverseGeocode, forwardGeocode, type AreaGuess } from "@/lib/geo";
import { JURISDICTIONS } from "@/lib/jurisdictions";

export type ResolveAreaResult =
  | { ok: true; guess: AreaGuess; matchedKey: string | null }
  | { ok: false; error: string };

/**
 * Turns the citizen's GPS point and/or typed "Location description" into an
 * area guess, and tries to match it to one of the built-in jurisdictions.
 * GPS wins when both are given.
 */
export async function resolveArea(input: {
  lat?: number | null;
  lon?: number | null;
  text?: string | null;
}): Promise<ResolveAreaResult> {
  try {
    let guess: AreaGuess | null = null;

    if (input.lat != null && input.lon != null) {
      guess = await reverseGeocode(input.lat, input.lon);
    }
    if (!guess && input.text && input.text.trim().length > 2) {
      guess = await forwardGeocode(input.text.trim());
    }
    if (!guess) return { ok: false, error: "Could not work out the area from that." };

    const hay = `${guess.areaName} ${guess.district ?? ""} ${guess.state}`.toLowerCase();
    const matchedKey =
      Object.values(JURISDICTIONS).find((j) => {
        const words = j.displayName
          .toLowerCase()
          .replace(/[^a-z ]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length > 3);
        return words.some((w) => hay.includes(w));
      })?.key ?? null;

    return { ok: true, guess, matchedKey };
  } catch (e) {
    console.error("resolveArea failed:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Area lookup failed" };
  }
}
