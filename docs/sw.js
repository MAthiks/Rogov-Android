const CACHE_NAME = "rogov-v0.7f-game095b1-multifloor";
const CORE = [
  "./", "./index.html", "./style.css?v=0.7f", "./ui092.css?v=2", "./app.js?v=0.7f", "./ui092.js", "./narrative.js", "./echo-investigation.js", "./game.js", "./tiles.js", "./hero-art.js", "./enemy-art.js", "./interaction-art.js", "./veyr-art.js", "./terrain-art.js", "./combat.js", "./stats.js", "./combat-rules.js", "./enemy-ai.js", "./dungeon.js", "./deep-dungeon.js", "./floors.js", "./deep-topology.js", "./exploration-visibility.js", "./secrets.js", "./traps.js", "./room-events.js", "./expedition-report.js", "./economy.js", "./loot.js",
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
  // Network-first for interface assets: prevent new HTML from pairing with an
  // outdated stylesheet in an old PWA cache. Offline usage retains cached files.
  const criticalAsset = /\.(?:css|js)$/i.test(url.pathname);
  if (criticalAsset) {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) {
        const result = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, result));
      }
      return response;
    }).catch(async () => (await caches.match(request)) || Response.error()));
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
