/**
 * In-memory fixed-window rate limiter — good enough for a single Next.js
 * instance (the shape this app runs in). If you ever scale to multiple
 * instances or serverless functions, this Map won't be shared across them —
 * swap it for a shared store (Redis / Upstash) keyed the same way.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }
  if (bucket.count >= max) {
    return { allowed: false, retryAfterMs: bucket.resetAt - now };
  }
  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

/** Call on a successful attempt so a legitimate user isn't penalised later. */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}
