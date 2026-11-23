#!/usr/bin/env node
/**
 * TECH-108A — non-destructive, reproducible source/reference inventory.
 *
 * Run after "node tools/make-icons.mjs" because the two PWA PNG icons are
 * generated during CI and are intentionally absent from the Git index.
 * No sources, game state, caches or user saves are modified.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const docs = join(root, "docs");
const checked = process.argv.includes("--check");
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root })
  .toString("utf8").split("\0").filter(Boolean).sort();
const files = tracked.filter((p) => existsSync(join(root, p)));
const items = files.map((p) => ({ path: p, bytes: statSync(join(root, p)).size }));
const sum = (rows) => rows.reduce((n, item) => n + item.bytes, 0);
const byExt = {};
for (const item of items) {
  const ext = extname(item.path).toLowerCase() || "(none)";
  const current = byExt[ext] || { count: 0, bytes: 0 };
  current.count++;
  current.bytes += item.bytes;
  byExt[ext] = current;
}
const entries = [];
function addRef(source, kind, raw) {
  if (!raw || typeof raw !== "string") return;
  const value = raw.trim();
  if (!value || /^(?:#|\/|\/\/|[a-z][\w+.-]*:)/i.test(value)) return;
  let path = value.split(/[?#]/)[0];
  if (!path || path === "." || path === "./") path = "index.html";
  let full;
  try {
    full = resolve(dirname(join(root, source)), decodeURIComponent(path));
  } catch {
    entries.push({ source, kind, value, target: "(invalid URI)", exists: false });
    return;
  }
  // Only local docs references are evaluated. Do not classify outside paths
  // as deletable or attempt to read files outside the published web root.
  if (full !== docs && !full.startsWith(docs + sep)) {
    entries.push({ source, kind, value, target: "(outside docs)", exists: false });
    return;
  }
  entries.push({
    source, kind, value, target: relative(root, full).split(sep).join("/"),
    exists: existsSync(full)
  });
}
const docsFiles = files.filter((p) => p.startsWith("docs/"));
for (const source of docsFiles) {
  const ext = extname(source).toLowerCase();
  if (![".js", ".css", ".html", ".webmanifest"].includes(ext)) continue;
  const body = readFileSync(join(root, source), "utf8");
  if (ext === ".js") {
    for (const match of body.matchAll(/\bfrom\s+["'](\.{1,2}\/[^"']+)["']/g)) addRef(source, "js-import", match[1]);
    for (const match of body.matchAll(/\bimport\s*(?:\(\s*)?["'](\.{1,2}\/[^"']+)["']/g)) addRef(source, "js-import", match[1]);
  }
  if (ext === ".css") {
    for (const match of body.matchAll(/\burl\(\s*["']?([^"')]+)["']?\s*\)/g)) addRef(source, "css-url", match[1]);
    for (const match of body.matchAll(/@import\s+["']([^"']+)["']/g)) addRef(source, "css-import", match[1]);
  }
  if (ext === ".html") {
    for (const match of body.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)) addRef(source, "html-asset", match[1]);
  }
  if (ext === ".webmanifest") {
    const manifest = JSON.parse(body);
    for (const icon of manifest.icons || []) addRef(source, "manifest-icon", icon.src);
  }
}
const sw = readFileSync(join(docs, "sw.js"), "utf8");
const cacheMatch = sw.match(/const CORE\s*=\s*(\[[\s\S]*?\]);/);
if (!cacheMatch) throw Error("TECH-108A: PWA CORE inventory not found");
const core = JSON.parse(cacheMatch[1]);
for (const name of core) addRef("docs/sw.js", "pwa-core", name);
const missing = entries.filter((entry) => !entry.exists);
const duplicateCacheEntries = core.filter((value, i) => core.indexOf(value) !== i);
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const topFiles = items.toSorted((a, b) => b.bytes - a.bytes).slice(0, 12);
const report = {
  phase: "TECH-108A",
  mode: checked ? "check" : "inventory",
  source: "git ls-files (tracked sources; generated icons excluded from size)",
  trackedFiles: tracked.length,
  presentTrackedFiles: items.length,
  trackedBytes: sum(items),
  docsJs: { count: docsFiles.filter((p) => p.endsWith(".js")).length,
    bytes: sum(items.filter((x) => x.path.startsWith("docs/") && x.path.endsWith(".js"))) },
  docsCss: { count: docsFiles.filter((p) => p.endsWith(".css")).length,
    bytes: sum(items.filter((x) => x.path.startsWith("docs/") && x.path.endsWith(".css"))) },
  markdownFiles: items.filter((x) => x.path.endsWith(".md")).length,
  nodeTests: files.filter((p) => p.startsWith("tests/") && p.endsWith(".test.mjs")).length,
  byExt,
  largestTrackedFiles: topFiles,
  node: { version: packageJson.version,
    runtimeDependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {} },
  references: {
    scanned: entries.length,
    targets: [...new Set(entries.map((e) => e.target))].length,
    missing,
    cacheEntries: core.length,
    duplicateCacheEntries
  },
  invariants: {
    expectedSaveKeyPresent: readFileSync(join(docs, "game.js"), "utf8").includes('SAVE_KEY = "rogov-web-v1"'),
    fogModulePresent: existsSync(join(docs, "exploration-visibility.js")),
    spriteModulePresent: existsSync(join(docs, "hero-art.js"))
  }
};
process.stdout.write(JSON.stringify(report, null, 2) + "\n");
if (checked && (tracked.length !== items.length || missing.length ||
    duplicateCacheEntries.length || !Object.values(report.invariants).every(Boolean))) {
  process.stderr.write("TECH-108A: structural reference/invariant check FAILED\n");
  process.exitCode = 1;
}
