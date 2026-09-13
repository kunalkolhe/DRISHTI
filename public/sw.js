/**
 * DRISHTI service worker.
 *
 * This app is almost entirely live data behind server actions — there is
 * no honest way to make "report an issue" or "check my reports" work
 * offline without a much bigger project (queueing writes in IndexedDB,
 * background sync, conflict handling on reconnect). This worker doesn't
 * pretend to do that. What it actually does:
 *
 *  - Makes the app installable (a manifest + a registered service worker
 *    are what browsers check for the "Add to Home Screen" prompt).
 *  - Caches build assets and icons (cache-first — Next.js fingerprints
 *    these by content hash, so a cached one is never stale).
 *  - Caches the /offline page once, up front, so a failed page load when
 *    there's truly no network shows something useful instead of the
 *    browser's default dinosaur/"no internet" error.
 *  - Everything else (pages, API routes, server actions) goes straight to
 *    the network — this app's data changes too often, and is too
 *    consequential (photos, complaint state), to ever serve stale from a
 *    cache instead of a fresh fetch.
 */

const CACHE = "drishti-shell-v1";
const PRECACHE_URLS = ["/offline", "/icon-192.png", "/icon-512.png", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never intercept anything that isn't a plain GET — that's every server
  // action and API mutation. Let those go straight through, untouched.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Build output and icons: safe to serve straight from cache, and worth
  // it for faster repeat loads.
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/icon-192.png" ||
    url.pathname === "/icon-512.png" ||
    url.pathname === "/manifest.json";

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        });
      }),
    );
    return;
  }

  // A page navigation (someone opening/reloading the app): always prefer
  // the network, since every page here shows live data. Only fall back to
  // the precached offline page if the network genuinely isn't reachable.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline").then((r) => r || Response.error())),
    );
  }
});
