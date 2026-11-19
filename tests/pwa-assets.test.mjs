// DEV-080 — cheap regression guard: the PWA cache must never list missing files.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root=fileURLToPath(new URL("../docs/",import.meta.url));
const pathOf=relative=>resolve(root,relative.replace(/^\.\//,""));

test("PWA offline cache only precaches files that really exist",()=>{
  const sw=readFileSync(pathOf("sw.js"),"utf8");
  const entry=sw.match(/const CORE = (\[[\s\S]*?\]);/);
  assert.ok(entry,"Static cache list is readable");
  const assets=JSON.parse(entry[1]);
  assert.ok(assets.includes("./deep-dungeon.js"),"Deep dungeon engine included offline");
  assert.ok(assets.includes("./loot.js"),"Deterministic reward resolver must work offline");
  assert.ok(assets.includes("./floors.js"),"Deep floor choices must work offline");
  assert.ok(assets.includes("./depth-balance.js"),"Depth encounter and loot profiles must work offline");
  assert.ok(assets.includes("./terrain-tactics.js"),"Terrain shove geometry must work offline");
  for(const asset of assets){
    const name=asset.split("?")[0]==="./"?"index.html":asset.split("?")[0];
    assert.ok(existsSync(pathOf(name)),"Missing PWA cache resource: "+name);
  }
});

test("Android installation icons are real PNGs at their declared dimensions",()=>{
  const manifest=JSON.parse(readFileSync(pathOf("manifest.webmanifest"),"utf8"));
  for(const size of [192,512]){
    const entry=manifest.icons.find(icon=>icon.src==="./icon-"+size+".png");
    assert.ok(entry,"Manifest is missing "+size+"px icon");
    assert.equal(entry.type,"image/png");
    assert.equal(entry.sizes,size+"x"+size);
    const path=pathOf(entry.src);
    assert.ok(existsSync(path),"Icon does not exist: "+entry.src);
    const bytes=readFileSync(path);
    assert.equal(bytes.subarray(0,8).toString("hex"),"89504e470d0a1a0a",
      "PNG signature invalid: "+entry.src);
    assert.equal(bytes.readUInt32BE(16),size,"PNG width incorrect");
    assert.equal(bytes.readUInt32BE(20),size,"PNG height incorrect");
  }
});
