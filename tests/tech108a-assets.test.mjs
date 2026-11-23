// TECH-108A — non-destructive guards for the real PWA shell and shared-origin cache.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const docs = fileURLToPath(new URL("../docs/", import.meta.url));
const read = name => readFileSync(resolve(docs, name), "utf8");
const html = read("index.html");
const sw = read("sw.js");
const coreMatch = sw.match(/const CORE = (\[[\s\S]*?\]);/);
assert.ok(coreMatch, "Service worker CORE list must remain inspectable");
const core = JSON.parse(coreMatch[1]);
const cacheMatch = sw.match(/const CACHE_NAME\s*=\s*("(?:\\.|[^"])*")/);
assert.ok(cacheMatch, "Service worker cache name must remain inspectable");
const cacheName = JSON.parse(cacheMatch[1]);

test("offline asset manifest has no duplicate or unsafe paths", () => {
  assert.equal(core.length, new Set(core).size, "CORE must have unique entries");
  assert.ok(core.includes("./index.html"), "Main HTML must be precached");
  for (const asset of core) {
    assert.match(asset, /^\.\/[a-z0-9./?=_-]*$/i, "Only local relative assets may be precached: " + asset);
    assert.ok(!asset.includes(".."), "No path traversal in PWA cache: " + asset);
  }
});

test("every shell stylesheet and entry script is precached with identical query version", () => {
  const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)]
    .map(match => match[1]);
  const scripts = [...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)]
    .map(match => match[1]);
  assert.ok(styles.length > 0 && scripts.length > 0, "The actual shell must have CSS and JS");
  for (const [kind, urls] of [["stylesheet", styles], ["script", scripts]]) {
    assert.equal(urls.length, new Set(urls).size, "Duplicate shell " + kind + " URL");
    for (const url of urls) {
      assert.ok(url.startsWith("./"), "Unexpected external " + kind + ": " + url);
      assert.ok(core.includes(url), "PWA cache is missing " + kind + ": " + url);
      assert.ok(existsSync(resolve(docs, url.split("?")[0])), "Missing " + kind + " file: " + url);
    }
  }
});

test("activation evicts only obsolete ROGOV caches, not neighboring GitHub Pages apps", async () => {
  const listeners = new Map();
  const deleted = [];
  let claimed = false;
  const self = {
    addEventListener(type, listener) { listeners.set(type, listener); },
    clients: { async claim() { claimed = true; } }
  };
  const caches = {
    async keys() { return ["rogov-old-version", "other-game-v1", cacheName, "unrelated-pwa-cache"]; },
    async delete(key) { deleted.push(key); return true; }
  };
  runInNewContext(sw, { self, caches, URL, Response });
  assert.ok(listeners.has("activate"), "Service worker must handle activation");
  let pending;
  listeners.get("activate")({ waitUntil(promise) { pending = promise; } });
  assert.ok(pending, "Activation cleanup must be awaited");
  await pending;
  assert.deepEqual(deleted, ["rogov-old-version"], "Do not erase another site's offline data");
  assert.equal(claimed, true, "Active PWA clients must be claimed");
});
