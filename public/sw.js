/*
  Service worker.

  Two caching rules, because the two kinds of file want opposite things:

    - the app shell and hashed assets never change under a given URL, so they
      are served from cache first and the network is never waited on;
    - companies.json does change, so it is fetched fresh, with the cached copy
      kept as a fallback for when the network is not there.

  The cache name carries a version. Bumping it drops everything from the old
  one on activate, which is what makes a deploy actually take effect.
*/
const VERSION = 'v1';
const SHELL = `shell-${VERSION}`;
const DATA = `data-${VERSION}`;

const PRECACHE = ['/', '/index.html', '/manifest.webmanifest', '/favicon.svg', '/pwa-192.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(SHELL)
      // A single missing file must not fail the whole install.
      .then(cache => Promise.allSettled(PRECACHE.map(u => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(keys.filter(k => k !== SHELL && k !== DATA).map(k => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Never touch anything we do not serve ourselves: tiles, Firebase, logos on
  // company domains. Caching those would go stale invisibly.
  if (url.origin !== self.location.origin) return;

  // The dataset: fresh when possible, cached when not.
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const copy = res.clone();
          caches.open(DATA).then(c => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Navigations: fall back to the cached shell so the app opens offline.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
    return;
  }

  // Everything else (hashed assets): cache first.
  event.respondWith(
    caches.match(request).then(
      hit =>
        hit ||
        fetch(request).then(res => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(SHELL).then(c => c.put(request, copy));
          }
          return res;
        })
    )
  );
});
