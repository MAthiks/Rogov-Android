import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const report=JSON.parse(execFileSync(process.execPath,
  ["tools/tech108b4-assets.mjs","--check"],{cwd:root,encoding:"utf8"}));
const visualNames=[
  "art103b-iron-frame.svg",
  "art103b-nhal-ruins.svg",
  "art103b-veyr-panorama.svg",
  "art103d-sprite-c-portrait.svg",
  "art106b-bandage.svg",
  "art106b-gilded-frame.svg",
  "art106b-tonic.svg",
  "art106e-cavern-bridge.svg",
  "icon.svg",
  "title-scene.webp",
  "ui097-nhal-frieze.svg",
  "veyr-refuge-banner.svg"
];
test("TECH-108B4: twelve original file-backed visuals remain precached",()=>{
  assert.equal(report.phase,"TECH-108B4");
  const assets=report.trackedVisualAssets.files;
  for(const name of visualNames){
    const asset=assets.find(x=>x.path==="docs/"+name);
    assert.ok(asset,"missing protected visual asset "+name);
    assert.ok(asset.bytes>0,"empty visual "+name);
    assert.equal(asset.pwaCached,true,"PWA precache missing "+name);
  }
  assert.deepEqual(report.pwaCache.missing,[]);
  assert.deepEqual(report.pwaCache.visualNotListed,[]);
  assert.deepEqual(report.manifest.missingOrNotCached,[]);
});
test("TECH-108B4: generated icons are build outputs, not files to delete",()=>{
  assert.equal(report.generatorKnown,true);
  assert.deepEqual(report.generatedAssets.map(x=>x.path),
    ["docs/icon-192.png","docs/icon-512.png"]);
  for(const icon of report.generatedAssets){
    assert.equal(icon.tracked,false,"generated PNG must stay out of tracked files");
    assert.equal(icon.exists,true,"generate icons before running B4 tests");
    assert.ok(icon.bytes>0);
    assert.equal(icon.manifest,true);
    assert.equal(icon.core,true);
  }
});
test("TECH-108B4: JS sprite providers are not classified as obsolete assets",()=>{
  for(const provider of [
    "docs/terrain-art.js","docs/hero-art.js",
    "docs/enemy-art.js","docs/interaction-art.js"
  ]){
    assert.ok(report.inlineSpriteSourceCandidates.includes(provider),
      "lost text-defined sprite provider "+provider);
  }
  assert.match(report.disclaimer,/MUST NOT be deleted/);
});
