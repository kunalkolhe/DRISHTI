/**
 * Duplicate complaint detection. Without this, five citizens reporting the
 * same broken streetlight becomes five separate open tickets, five separate
 * trips for a field worker, and a resolution-rate stat that's quietly
 * counting the same fix five times.
 *
 * Matching rule, cheapest/strongest signal first:
 *  1. Same registered asset (scanned the same QR) — unambiguous.
 *  2. No asset: GPS within ~40m of another still-open report AND the same
 *     issue category (read off the "(Category label) ..." prefix
 *     createComplaint already writes into `description`).
 * Only matches against reports that are themselves originals
 * (duplicateOfId is null), so duplicates never chain onto each other —
 * everything always points straight at one primary.
 */
import { prisma } from "@/lib/prisma";
import type { Complaint, ComplaintStatus } from "@prisma/client";
import { haversineMeters } from "@/lib/geoMath";

const ACTIVE_STATUSES: ComplaintStatus[] = ["OPEN", "ROUTED", "REOPENED", "FIXED_PENDING_CONFIRMATION"];
const NEARBY_METERS = 40;
// ~0.0006° of latitude is about 65m — a cheap DB-level box filter to avoid
// pulling every open complaint in the city before measuring exact distance.
const BOUNDING_BOX_DEGREES = 0.0006;

function descriptionCategory(description: string | null): string | null {
  const m = description?.match(/^\(([^)]+)\)/);
  return m ? m[1] : null;
}

export async function findDuplicateOf(input: {
  assetId?: number | null;
  gpsLat?: number | null;
  gpsLon?: number | null;
  categoryLabel?: string | null;
}): Promise<Complaint | null> {
  if (input.assetId) {
    const match = await prisma.complaint.findFirst({
      where: { assetId: input.assetId, status: { in: ACTIVE_STATUSES }, duplicateOfId: null },
      orderBy: { createdAt: "asc" },
    });
    if (match) return match;
  }

  if (input.gpsLat != null && input.gpsLon != null && input.categoryLabel) {
    const candidates = await prisma.complaint.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        duplicateOfId: null,
        gpsLat: { gte: input.gpsLat - BOUNDING_BOX_DEGREES, lte: input.gpsLat + BOUNDING_BOX_DEGREES },
        gpsLon: { gte: input.gpsLon - BOUNDING_BOX_DEGREES, lte: input.gpsLon + BOUNDING_BOX_DEGREES },
      },
      orderBy: { createdAt: "asc" },
      take: 25,
    });

    for (const c of candidates) {
      if (c.gpsLat == null || c.gpsLon == null) continue;
      if (descriptionCategory(c.description) !== input.categoryLabel) continue;
      const distance = haversineMeters(input.gpsLat, input.gpsLon, c.gpsLat, c.gpsLon);
      if (distance <= NEARBY_METERS) return c;
    }
  }

  return null;
}
