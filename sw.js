// Pilateria Service Worker - minimal, sadece install ve offline fallback için
// Veriler localStorage'da, bu yüzden cache stratejisi: network-first, cache fallback
const CACHE_NAME = 'pilateria-v52-2026-07-15-15';
const ASSETS = [
  './',
  './index.html',
  './pilateria.html',
  './supabase-vendor.js',
  './manifest.json',
  './pilateria-figure.png',
  './pilateria-logo-full.png'
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
  // Sadece GET isteklerini cache'le
  if (e.request.method !== 'GET') return;
  // JSONBin API isteklerini cache'leme - her zaman fresh
  if (e.request.url.includes('jsonbin.io')) return;
  // Network-first, cache fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || new Response('Çevrimdışı — uygulama yüklenemedi', { status: 503 })))
  );
});
