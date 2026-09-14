// Taleora Service Worker — Phase 11: PWA & Offline Shell Caching
const CACHE_VERSION = "taleora-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const ASSETS_CACHE = `${CACHE_VERSION}-assets`;

// Pre-cached App Shell URLs
const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/icon-maskable.svg",
];

// Install: precache application shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[SW] Shell precache partial failure:", err);
        return self.skipWaiting();
      })
  );
});

// Activate: purge stale caches and claim clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith("taleora-") && name !== SHELL_CACHE && name !== ASSETS_CACHE)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: Caching strategies tailored for App Shell, static assets, and offline navigation
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle HTTP/HTTPS GET requests
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Bypass third-party and Supabase backend endpoints
  if (url.origin.includes("supabase.co") || url.pathname.startsWith("/api/")) {
    return;
  }

  // 1. Navigation requests (HTML pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Check if page exists in cache
          const cached = await caches.match(request);
          if (cached) return cached;

          // If offline and not in cache, serve the dedicated /offline fallback
          const offlinePage = await caches.match("/offline");
          if (offlinePage) return offlinePage;

          // Fallback to cached home shell
          return (await caches.match("/")) || new Response("Offline", { status: 503, statusText: "Offline" });
        })
    );
    return;
  }

  // 2. Next.js static bundles, fonts, and stylesheets (Stale-While-Revalidate)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(ASSETS_CACHE).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Images and media assets (Cache-first with network fallback)
  if (
    request.destination === "image" ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif|ico)$/i)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(ASSETS_CACHE).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);
      })
    );
    return;
  }
});

// Support manual reload trigger
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
