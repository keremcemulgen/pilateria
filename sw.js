// Pilateria Service Worker - yalnizca UYGULAMA KABUGU icin (Supabase verileri ASLA cache'lenmez)
// v51 KOK FIX: eski SW, Supabase GET okumalarini da cache'liyordu; ag kesintisinde ESKI veriyi servis edip
// state'i geri sariyordu. Artik yalniz kendi kaynagimizdaki (app dosyalari) GET'ler yonetilir; Supabase/harici
// istekler HIC dokunulmadan dogrudan aga gider (veri tazeligi ZORUNLU).
const CACHE_NAME = 'pilateria-v94-2026-07-18-17';
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
  if (e.request.method !== 'GET') return;
  let url;
  try { url = new URL(e.request.url); } catch (err) { return; }
  // YALNIZ kendi kaynagimizdaki (uygulama dosyalari) GET'leri yonet.
  // Supabase (*.supabase.co), JSONBin ve TUM harici/API istekleri HIC dokunulmaz -> her zaman dogrudan ag,
  // ASLA cache'lenmez, ASLA cache'ten servis edilmez (veri geri sarmaz).
  if (url.origin !== self.location.origin) return;
  // Uygulama dosyalari: network-first, cache fallback (yalniz cevrimdisi acilis icin)
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
