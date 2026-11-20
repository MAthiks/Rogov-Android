// ART-097B1 — high-contrast original silhouettes, strictly cosmetic.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {HERO_FACINGS,HERO_SVGS,HERO_SPRITES,heroFacingFromStep} from "../docs/hero-art.js";
import {ENEMY_ART_IDS,ENEMY_SVGS,ENEMY_SPRITES} from "../docs/enemy-art.js";
import {TILE_SPRITES} from "../docs/tiles.js";
import {SAVE_KEY,SCHEMA_VERSION,newGame,beginRun,validateSave,ENEMY_TYPES} from "../docs/game.js";

const source=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const uriPrefix="data:image/svg+xml;charset=UTF-8,";
const decode=src=>decodeURIComponent(src.slice(uriPrefix.length));

test("ART-097B1: exactly four hood-up 24px player views retain distinct useful material landmarks",()=>{
  assert.deepEqual(HERO_FACINGS,["down","up","left","right"]);
  assert.equal(Object.keys(HERO_SVGS).length,4);
  assert.equal(new Set(Object.values(HERO_SVGS)).size,4);
  for(const facing of HERO_FACINGS){
    const xml=HERO_SVGS[facing];
    assert.match(xml,/viewBox="0 0 24 24" width="24" height="24"/);
    assert.match(xml,/shape-rendering="crispEdges"/);
    assert.match(xml,/data-feature="hood"/);
    assert.match(xml,/data-detail="boot-worn-soles"/);
    assert.match(xml,/#3d3544/,"all orientations keep Sprite C plum hood");
    assert.match(xml,/#252c33/,"anchored boots stay visible");
    assert.match(xml,/<\/svg>$/);
    assert.doesNotMatch(xml,/<(?:script|image|filter|animate|foreignObject|text)\b|(?:xlink:)?href\s*=/i);
    assert.equal(decode(HERO_SPRITES[facing]),xml);
  }
  assert.match(HERO_SVGS.down,/data-detail="front-brass-clasp"/);
  assert.match(HERO_SVGS.down,/data-detail="front-cloak-seams"/);
  assert.match(HERO_SVGS.up,/data-detail="rear-cross-harness"/);
  assert.match(HERO_SVGS.up,/data-detail="rear-cape-stitching"/);
  for(const facing of ["left","right"]){
    assert.match(HERO_SVGS[facing],/data-detail="profile-cloak-hem"/);
    assert.match(HERO_SVGS[facing],/data-detail="profile-hood-overhang"/);
  }
  assert.doesNotMatch(HERO_SVGS.up,/#d5c3a7/,"rear view still has no face");
  assert.match(HERO_SVGS.right,/scale\(-1 1\)/);
  assert.equal(TILE_SPRITES.hero,HERO_SPRITES.down);
  for(const facing of ["up","left","right"])
    assert.equal(TILE_SPRITES["hero_"+facing],HERO_SPRITES[facing]);
});

test("ART-097B1: exactly three existing enemy families keep orthogonal visual signatures",()=>{
  assert.deepEqual(ENEMY_ART_IDS,["charognard","guardian","rift_larva"]);
  assert.equal(Object.keys(ENEMY_SVGS).length,3);
  assert.equal(new Set(Object.values(ENEMY_SVGS)).size,3);
  const markers={
    charognard:["low-carrion-silhouette","hooked-bone-beak",
      "scavenger-barbed-feathers","scavenger-worn-pinions"],
    guardian:["heavy-stone-sentinel","massive-mace",
      "guardian-fractured-pauldrons","guardian-heavy-greaves","guardian-helmet-slit"],
    rift_larva:["segmented-horizontal-larva","localized-spectral-emitter",
      "larva-chitin-facets","larva-dorsal-spines","larva-ventral-shadows"]
  };
  for(const [id,features] of Object.entries(markers)){
    const xml=ENEMY_SVGS[id];
    assert.match(xml,/viewBox="0 0 24 24" width="24" height="24"/);
    assert.match(xml,/shape-rendering="crispEdges"/);
    assert.match(xml,/<\/svg>$/);
    assert.doesNotMatch(xml,/<(?:script|image|filter|animate|foreignObject|text|rect width="24" height="24")\b|(?:xlink:)?href\s*=/i);
    for(const feature of features)
      assert.ok(xml.includes('data-detail="'+feature+'"')||
        xml.includes('data-feature="'+feature+'"'),
        "Missing signature "+feature+" of "+id);
    assert.equal(TILE_SPRITES[id],ENEMY_SPRITES[id]);
    assert.ok(ENEMY_SPRITES[id].startsWith(uriPrefix));
    assert.equal(decode(ENEMY_SPRITES[id]),xml);
    assert.notEqual(TILE_SPRITES[id],HERO_SPRITES.down);
  }
  assert.match(ENEMY_SVGS.charognard,/#e2d3ad/);
  assert.match(ENEMY_SVGS.guardian,/#65717b/);
  assert.match(ENEMY_SVGS.rift_larva,/#e0f1d9/);
  assert.doesNotMatch(ENEMY_SVGS.rift_larva,/data-feature="hood"/);
});

test("ART-097B1: visuals preserve fog, ASCII, combat/save contract and offline cache",()=>{
  const s=beginRun(newGame(),[]).state,before=JSON.stringify(s);
  assert.deepEqual(s.run.enemies.map(x=>x.kind),ENEMY_ART_IDS);
  assert.deepEqual(s.run.enemies.map(x=>x.hp),[3,5,4]);
  assert.deepEqual(ENEMY_ART_IDS.map(x=>ENEMY_TYPES[x].symbol),["c","G","L"]);
  assert.equal(heroFacingFromStep({x:2,y:2},{x:3,y:2}),"right");
  assert.equal(JSON.stringify(s),before);
  assert.equal(validateSave(s),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  const tiles=source("../docs/tiles.js");
  assert.match(tiles,/const enemy=visible\?enemyAt\(run,x,y\):null;/);
  assert.match(tiles,/if\(!visible&&!remembered\)/);
  assert.match(tiles,/cell\.dataset\.hp=String\(enemy\.hp\)/);
  const sw=source("../docs/sw.js");
  // Subsequent animation/art bundles rotate the version; their sprites stay offline.
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-[a-z0-9-]+"/);
  assert.match(sw,/"\.\/hero-art\.js"/);
  assert.match(sw,/"\.\/enemy-art\.js"/);
});
