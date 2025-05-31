// Service Worker for caching
const CACHE_NAME = 'athkar-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/common.js',
  '/js/profiles.js',
  '/js/tasbeeh-inline.js',
  '/js/adhkar-dynamic.js',
  '/components/sidebar.html',
  '/assets/patterns/islamic-bg-light.png',
  '/assets/patterns/islamic-bg-dark.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Add route-based caching
const CACHE_PATTERNS = {
  core: ['/', '/index.html'],
  assets: [/(\.png|svg|jpg|jpeg)$/],
  data: [/api\.aladhan\.com/]
};

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.status === 200) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', event => {
  if (CACHE_PATTERNS.data.some(p => p.test(event.request.url))) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  // Default: existing cache-then-network strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached response if found
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request).then(
          response => {
            // Check if valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});