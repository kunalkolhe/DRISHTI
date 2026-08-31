/**
 * Helpers for the QR codes DRISHTI prints:
 *   • asset tags  → open the public asset record  (/asset/<code>)
 *   • worker ID   → open the public worker check   (/verify/DRW-00042)
 */

/** Full URL a printed asset tag should encode. */
export function assetUrl(qrCodeId: string, origin = ""): string {
  return `${origin}/asset/${encodeURIComponent(qrCodeId)}`;
}

/** A scanned tag may be a full URL or a bare code — pull out the code. */
export function extractAssetCode(scanned: string): string {
  const s = (scanned || "").trim();
  const m = s.match(/\/asset\/([^/?#\s]+)/i);
  return m ? decodeURIComponent(m[1]) : s;
}

/** Human-readable ID-card number for a worker, e.g. DRW-00042. */
export function workerCardId(userId: number | string): string {
  return `DRW-${String(userId).padStart(5, "0")}`;
}

/** Parse "DRW-00042" (or a verify URL) back to the numeric user id. */
export function parseWorkerCardId(cardId: string): number | null {
  const m = (cardId || "").match(/(\d+)/);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : null;
}

/** URL a worker ID-card QR should encode. */
export function workerVerifyUrl(userId: number, origin = ""): string {
  return `${origin}/verify/${workerCardId(userId)}`;
}
