const CACHE_NAME = "rogov-v0.7f-uiart099-uiart100-final-game101f-chamber-pursuit-game101g-reliquary-ui102-veyr-hub-ui103a-four-screen-art-art103b-scenery-art103c-items-art103d-character-qa104-screen-audit-uiart106a-nhal-uiart106b-materials-art106c-stone-art106d-sprites-uiart106e-responsive-uiart106f-panels-art107a-world-art107b-tileset-art107b34-rhythm-art107c-flagstones";
// GitHub Pages repositories share an origin: never evict another app's cache.
const CACHE_PREFIX = "rogov-";
const CORE = [
  "./", "./index.html", "./style.css?v=0.7f", "./ui092.css?v=2", "./ui096.css?v=1", "./ui096c.css?v=1", "./ui096d.css?v=1", "./ui097a.css?v=1", "./ui097a2.css?v=1", "./art097b2.css?v=1", "./art097c1.css?v=1", "./ui098b1.css?v=1", "./ui099.css?v=1", "./ui100.css?v=1", "./game101.css?v=1", "./ui102.css?v=1", "./ui103a.css?v=1", "./art103b.css?v=1", "./art103c.css?v=1", "./art103d.css?v=1", "./uiart106a.css?v=1", "./uiart106a.js", "./uiart106b.css?v=1", "./art106b-gilded-frame.svg", "./art106b-bandage.svg", "./art106b-tonic.svg", "./character-art103d.js", "./art103d-sprite-c-portrait.svg", "./item-art103c.js", "./art103b-veyr-panorama.svg", "./art103b-nhal-ruins.svg", "./art103b-iron-frame.svg", "./ui097-nhal-frieze.svg", "./app.js?v=0.7f", "./ui092.js", "./ui097a2.js", "./ui099.js", "./ui096.js", "./ui096c.js", "./refuge-dashboard.js", "./narrative.js", "./echo-investigation.js", "./game.js", "./tiles.js", "./hero-art.js", "./art106d-finishes.js", "./art107a-finishes.js", "./art107b-tileset.js", "./art107b34-finishes.js", "./art107c-flagstones.js", "./enemy-art.js", "./character-motion.js", "./interaction-art.js", "./veyr-art.js", "./veyr-refuge-banner.svg", "./terrain-art.js", "./art106c-masonry.js", "./art106c-terrain.css?v=1", "./uiart106e.css?v=1", "./uiart106e.js", "./uiart106f.css?v=1", "./art106e-cavern-bridge.svg", "./nhal-lighting.js", "./combat.js", "./terrain-tactics.js", "./opening-strike.js", "./chamber-pursuit.js", "./stats.js", "./combat-rules.js", "./enemy-ai.js", "./dungeon.js", "./deep-dungeon.js", "./floors.js", "./depth-balance.js", "./optional-duo.js", "./deep-topology.js", "./exploration-visibility.js", "./secrets.js", "./traps.js", "./room-events.js", "./room-encounters.js", "./reliquary.js", "./acoustics.js", "./branch-intel.js", "./route-survey.js", "./expedition-report.js", "./economy.js", "./loot.js",
  "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./title-scene.webp"
];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)))),
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
