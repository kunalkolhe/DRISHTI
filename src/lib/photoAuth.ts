/**
 * Photo authenticity check — the actual core promise of this app ("every
 * fix has proof from the spot") only means something if a proof photo can
 * be checked against where and when it claims to have been taken.
 *
 * Reads the EXIF metadata a camera embeds in a JPEG/HEIC — GPS coordinates
 * and capture timestamp — and compares them against the complaint's
 * expected location and the upload time. This is advisory, not a hard
 * block: plenty of legitimate photos have no EXIF at all (iOS Safari
 * strips GPS unless precise location is granted to the camera; PNG/WEBP
 * carry no EXIF; some Android camera apps omit it). A missing-data flag
 * just means "look at this one yourself", not "reject it".
 */
import exifr from "exifr";
import { haversineMeters } from "@/lib/geoMath";

export type PhotoAuthResult = {
  hasGps: boolean;
  hasTimestamp: boolean;
  distanceMeters: number | null;
  /** Human-readable notes for citizens/workers/admins — never blocks anything. */
  flags: string[];
};

const MAX_EXPECTED_DISTANCE_M = 200; // a phone GPS fix is routinely off by 10-50m; 200m gives headroom
const MAX_PHOTO_AGE_MS = 24 * 60 * 60 * 1000; // proof should be "just now", not dug out of a gallery
const FUTURE_CLOCK_SKEW_MS = 5 * 60 * 1000; // allow a little clock drift before calling it "in the future"

/**
 * @param buffer the uploaded photo's raw bytes (read before/independently
 *   of saveUpload — Blob/File.arrayBuffer() can be read more than once)
 * @param expected the location this photo should have been taken near, if
 *   known (the complaint's GPS, or the citizen's own capture point)
 */
export async function analyzePhoto(
  buffer: Buffer,
  expected?: { lat: number | null | undefined; lon: number | null | undefined },
): Promise<PhotoAuthResult> {
  const flags: string[] = [];
  let gps: { lat: number; lon: number } | null = null;
  let takenAt: Date | null = null;

  try {
    const data = await exifr.parse(buffer, { gps: true, pick: ["DateTimeOriginal", "CreateDate"] });
    if (typeof data?.latitude === "number" && typeof data?.longitude === "number") {
      gps = { lat: data.latitude, lon: data.longitude };
    }
    const taken = data?.DateTimeOriginal ?? data?.CreateDate;
    if (taken instanceof Date && !Number.isNaN(taken.getTime())) takenAt = taken;
  } catch {
    // Not a JPEG/HEIC with EXIF (e.g. PNG/WEBP), or corrupt metadata —
    // treated the same as "no EXIF found" below.
  }

  if (!gps) flags.push("No location data found in the photo (common on some phones/browsers).");
  if (!takenAt) flags.push("No capture time found in the photo.");

  let distanceMeters: number | null = null;
  if (gps && expected?.lat != null && expected?.lon != null) {
    distanceMeters = haversineMeters(gps.lat, gps.lon, expected.lat, expected.lon);
    if (distanceMeters > MAX_EXPECTED_DISTANCE_M) {
      flags.push(`Photo's location is ~${Math.round(distanceMeters)}m from the reported spot.`);
    }
  }

  if (takenAt) {
    const ageMs = Date.now() - takenAt.getTime();
    if (ageMs > MAX_PHOTO_AGE_MS) {
      const days = Math.round(ageMs / (24 * 60 * 60 * 1000));
      flags.push(`Photo appears to have been taken ${days} day${days === 1 ? "" : "s"} before it was uploaded.`);
    } else if (ageMs < -FUTURE_CLOCK_SKEW_MS) {
      flags.push("Photo's timestamp is in the future — the camera's clock may be wrong.");
    }
  }

  return { hasGps: !!gps, hasTimestamp: !!takenAt, distanceMeters, flags };
}
