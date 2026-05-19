/* ── Service Worker — Portfolio Jules Balluais ── */
const CACHE = 'portfolio-v1';

/* Shell minimal pré-caché à l'installation */
const SHELL = ['/Portfolio/', '/Portfolio/index.html'];

/* ── Install : pré-cache le shell ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

/* ── Activate : purge les anciens caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── Fetch : stratégie selon le type de ressource ── */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  /* Navigation HTML : stale-while-revalidate
     → réponse immédiate depuis le cache, mise à jour en arrière-plan */
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(req).then(cached => {
          const net = fetch(req).then(res => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          });
          return cached || net; /* offline : sert le cache si réseau indispo */
        })
      )
    );
    return;
  }

  /* Assets (images, fonts…) : cache-first, mise en cache à la volée */
  if (req.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(req, clone));
          }
          return res;
        });
      })
    );
  }
});
