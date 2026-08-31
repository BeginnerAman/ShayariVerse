/* ============================================================
   sw.js - Service Worker (Offline Support + Cache)
   ShayariVerse PWA

   Strategy:
   - INSTALL: Pre-cache core shell (HTML, CSS, JS)
   - FETCH:   Cache-first for static assets, network-first for data
   - ACTIVATE: Clean old caches on version bump

   NOTE: Service Worker scope = root directory.
   ============================================================ */

const CACHE_NAME = 'shayariverse-v1';
const DATA_CACHE = 'shayariverse-data-v1';

/* Core shell - pre-cached on install */
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/browse.html',
  '/favorites.html',
  '/reels.html',
  '/css/global.css',
  '/css/themes.css',
  '/css/animations.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/shayari-loader.js',
  '/js/audio-controller.js',
  '/js/reels-engine.js',
  '/js/theme-manager.js',
  '/js/favorites-manager.js',
  '/js/share-manager.js',
  '/icons/icon.svg',
  '/manifest.json',
];

/* Data files - network-first, fallback to cache */
const DATA_PATTERNS = [
  '/data/shayaris.json',
  '/data/songs.json',
];


/* ============================
   INSTALL - Pre-cache core shell
   ============================ */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching core shell');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SW] Pre-cache failed (some assets may be missing):', err);
        /* Don't block install if some assets fail */
        return self.skipWaiting();
      })
  );
});


/* ============================
   ACTIVATE - Clean old caches
   ============================ */

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME && key !== DATA_CACHE)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});


/* ============================
   FETCH - Serve from cache / network
   ============================ */

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Only handle same-origin requests */
  if (url.origin !== self.location.origin) return;

  /* Skip non-GET requests */
  if (request.method !== 'GET') return;

  /* Data files → Network-first (always get fresh data if online) */
  if (DATA_PATTERNS.some((pattern) => url.pathname.endsWith(pattern))) {
    event.respondWith(networkFirst(request, DATA_CACHE));
    return;
  }

  /* Everything else → Cache-first (fast offline experience) */
  event.respondWith(cacheFirst(request));
});


/* ============================
   CACHE STRATEGIES
   ============================ */

/**
 * Cache-first: Try cache, fallback to network.
 * Fastest for static assets that don't change often.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    /* Offline fallback for navigation requests */
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network-first: Try network, fallback to cache.
 * Best for data that updates (shayaris.json, songs.json).
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('{}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
