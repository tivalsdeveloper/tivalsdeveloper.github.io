const CACHE_NAME = "opencs-news-shell-v1";
const APP_SCOPE = self.registration.scope;
const CORE_ASSETS = [
  APP_SCOPE,
  APP_SCOPE + "index.html",
  APP_SCOPE + "styles.css",
  APP_SCOPE + "app.js",
  APP_SCOPE + "manifest.webmanifest",
  APP_SCOPE + "icon.svg",
  APP_SCOPE + "offline.html"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.includes("/admin")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
      return response;
    }).catch(async () => (await caches.match(request)) || (await caches.match(APP_SCOPE + "index.html")) || caches.match(APP_SCOPE + "offline.html")));
    return;
  }
  if (["style", "script", "image", "font"].includes(request.destination)) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
      return response;
    })));
  }
});