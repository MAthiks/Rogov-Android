const CACHE_NAME = "rogov-v0.5.1";
const CORE = [
  "./", "./index.html", "./style.css", "./app.js", "./game.js", "./tiles.js",
  "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./title-scene.webp"
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) {
        const result = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", result));
      }
      return response;
    }).catch(async () => (await caches.match("./index.html")) || Response.error()));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) {
      const result = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, result));
    }
    return response;
  })));
});
