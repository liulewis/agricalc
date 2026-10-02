const CACHE_NAME = 'farm-tools-v5';
const STATIC_CACHE = 'farm-static-v5';
const PAGES_CACHE = 'farm-pages-v5';

const CORE_ASSETS = [
  '/',
  '/offline.html',
  '/assets/css/style.css',
  '/assets/js/common.js',
  '/manifest.json',
  '/guides/'
];

const POPULAR_TOOLS = [
  '/tools/seed-calculator.html',
  '/tools/fertilizer-calculator.html',
  '/tools/irrigation-calculator.html',
  '/tools/feed-calculator.html',
  '/tools/temp-converter.html',
  '/tools/area-converter.html',
  '/tools/date-calculator.html',
  '/tools/farm-budget-calculator.html',
  '/tools/crop-water-requirement.html',
  '/tools/yield-calculator.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.addAll(CORE_ASSETS)),
      caches.open(PAGES_CACHE).then(cache => cache.addAll(POPULAR_TOOLS))
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== STATIC_CACHE && name !== PAGES_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  
  if (request.method !== 'GET') return;
  
  const url = new URL(request.url);
  if (url.origin !== location.origin) return;
  
  // HTML pages: network first, cache fallback, offline page
  if (request.mode === 'navigate' || request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(PAGES_CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cached => {
            if (cached) return cached;
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }
  
  // Static assets: cache first, network fallback
  if (url.pathname.match(/\.(css|js|svg|png|jpg|jpeg|gif|ico|woff2?|ttf)$/)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }
  
  // Other: stale-while-revalidate
  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request).then(response => {
        if (response.status === 200) {
          const copy = response.clone();
          caches.open(PAGES_CACHE).then(cache => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});