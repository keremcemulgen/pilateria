// Pilateria Service Worker - minimal, sadece install ve offline fallback icin
// Veriler localStorage'da, bu yuzden cache stratejisi: network-first, cache fallback
const CACHE_NAME = 'pilateria-v15-2026-05-11-15';
const ASSETS = [
    './',
    './index.html',
    './pilateria.html',
    './manifest.json',
    './pilateria-logo.png'
  ];

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(
          caches.open(CACHE_NAME).then(c => c.addAll(ASSETS).catch(() => {}))
        );
});

self.addEventListener('activate', e => {
    e.waitUntil(
          caches.keys().then(keys => Promise.all(
                  keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
                ))
        );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (e.request.method !== 'GET') return;
    if (e.request.url.includes('jsonbin.io')) return;
    e.respondWith(
          fetch(e.request)
            .then(res => {
                      const copy = res.clone();
                      caches.open(CACHE_NAME).then(c => c.put(e.request, copy)).catch(() => {});
                      return res;
            })
            .catch(() => caches.match(e.request).then(r => r || new Response('Cevrimdisi', { status: 503 })))
        );
});
