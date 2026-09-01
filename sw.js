/* ============================================================
   sw.js - Service Worker (Offline Support + Fast Cache)
   ShayariVerse PWA
   ============================================================ */

const CACHE_NAME = 'shayariverse-v7';
const DATA_CACHE = 'shayariverse-data-v7';

/* Core shell assets (using relative paths for GitHub Pages compatibility) */
const CORE_ASSETS = [
  './',
  './index.html',
  './browse.html',
  './favorites.html',
  './reels.html',
  './manifest.json',
  './css/global.css',
  './css/themes.css',
  './css/animations.css',
  './css/components.css',
  './css/responsive.css',
  './js/app.js',
  './js/shayari-loader.js',
  './js/audio-controller.js',
  './js/reels-engine.js',
  './js/theme-manager.js',
  './js/favorites-manager.js',
  './js/share-manager.js',
  './icons/favicon.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/logo.jpg'
];

/* Data files */
const DATA_FILES = [
  './data/shayaris.json',
  './data/songs.json'
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
        console.warn('[SW] Pre-cache warning:', err);
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
              console.log('[SW] Deleting outdated cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});


/* ============================
   FETCH - Cache & Network Handling
   ============================ */

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Skip non-GET requests */
  if (request.method !== 'GET') return;

  /* Handle same-origin requests */
  if (url.origin === self.location.origin) {
    /* Data files -> Network-first with cache fallback */
    if (url.pathname.includes('/data/')) {
      event.respondWith(networkFirst(request, DATA_CACHE));
      return;
    }

    /* Core shell & static assets -> Stale-while-revalidate / Cache-first */
    event.respondWith(cacheFirst(request));
  }
});


/* ============================
   STRATEGIES
   ============================ */

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (request.mode === 'navigate') {
      return (await caches.match('./index.html')) || (await caches.match('index.html'));
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('[]', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
