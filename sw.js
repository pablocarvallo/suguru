// Permite jugar sin conexión. Con conexión, siempre se pide la versión más reciente
// (página, icono y manifest); la copia guardada solo se usa cuando no hay red.
const CACHE = 'suguru-v3';
const SCOPE = new URL('./', self.location).href;
const CORE = ['./', 'manifest.webmanifest', 'icons/suguru-claro-180.png', 'icons/suguru-claro-192.png', 'icons/suguru-claro-512.png', 'icons/favicon-claro-32.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(CORE.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then((r) => { clearTimeout(t); resolve(r); }, (e) => { clearTimeout(t); reject(e); });
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Página: red primero (sin usar la caché del navegador); copia guardada si no hay conexión.
  if (req.mode === 'navigate') {
    event.respondWith(
      withTimeout(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }), 4000)
        .then((res) => {
          if (res.redirected) return fetch(req);
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(SCOPE, copy)); }
          return res;
        })
        .catch(() => caches.match(SCOPE).then((r) => r || fetch(req)))
    );
    return;
  }

  // Tipografías: se guardan la primera vez que se descargan.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // Archivos propios (icono, manifest): red primero, copia guardada si no hay conexión.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match(req, { ignoreSearch: true })))
    );
  }
});
