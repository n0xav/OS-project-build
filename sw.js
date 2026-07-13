const CACHE_VERSION = 'webos-v1';
const CACHE_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/app.js',
    '/core/kernel_emulator.js',
    '/core/gesture_engine.js',
    '/ui/compositor.js',
    '/apps/terminal.js',
    '/apps/settings.js',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            return cache.addAll(CACHE_URLS).catch(err => {
                console.log('Cache addAll failed:', err);
                return Promise.resolve();
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_VERSION) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request).then((response) => {
                if (!response || response.status !== 200 || response.type === 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_VERSION).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            }).catch(() => {
                return caches.match('/index.html');
            });
        })
    );
});
