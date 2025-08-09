/* Simple offline SW: static assets cached, network-first for HTML */
const VERSION = '1.0.0-' + (self.registration ? self.registration.scope : Date.now());
const STATIC_CACHE = 'static-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k.startsWith('static-') && k !== STATIC_CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // HTML: network-first
  if (req.destination === 'document' || (req.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(
      fetch(req).then(resp => {
        const clone = resp.clone();
        caches.open(STATIC_CACHE).then(c => c.put(req, clone));
        return resp;
      }).catch(() => caches.match(req).then(r => r || caches.match('./')))
    );
    return;
  }

  // Static assets: cache-first
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(STATIC_CACHE).then(c => c.put(req, copy));
      return resp;
    }))
  );
});
