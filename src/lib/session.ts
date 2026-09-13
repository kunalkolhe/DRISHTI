/**
 * Signed session tokens — HMAC-SHA256 over `{ id, exp }`, using Node's
 * built-in `crypto` (no extra dependency). Replaces storing the raw user id
 * in a cookie: `httpOnly` stops JavaScript from reading a cookie, but does
 * nothing to stop a person editing its *value* in their own browser's
 * DevTools — an unsigned `session_user_id=1` cookie let anyone become
 * whichever user owns id 1, including an admin. A token only verifies if
 * it was signed with SESSION_SECRET, which only the server holds.
 */
import crypto from "crypto";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "SESSION_SECRET is missing (or too short) — set a long random value in .env. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return s;
}

function sign(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

/** Issues a signed token for `userId`, valid for `ttlMs` (default 7 days). */
export function createSessionToken(userId: number, ttlMs: number = WEEK_MS): string {
  const payload = Buffer.from(JSON.stringify({ id: userId, exp: Date.now() + ttlMs })).toString(
    "base64url",
  );
  return `${payload}.${sign(payload)}`;
}

/** Verifies a token's signature and expiry, returning the user id or null. */
export function verifySessionToken(token: string | undefined | null): number | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  let expected: string;
  try {
    expected = sign(payload);
  } catch (e) {
    console.error("verifySessionToken:", e);
    return null;
  }

  // Constant-time compare — a plain `===` leaks timing information an
  // attacker could use to forge a valid signature byte by byte.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data.id !== "number" || typeof data.exp !== "number") return null;
    if (Date.now() > data.exp) return null;
    return data.id;
  } catch {
    return null;
  }
}
