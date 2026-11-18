import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ENEMY_ART_IDS,ENEMY_SVGS,ENEMY_SPRITES} from "../docs/enemy-art.js";
import {HERO_SPRITES} from "../docs/hero-art.js";
import {TILE_SPRITES,LEGEND_ITEMS} from "../docs/tiles.js";
import {ENEMY_TYPES,SAVE_KEY,SCHEMA_VERSION,newGame,beginRun,validateSave,mapText} from "../docs/game.js";

const decode=url=>decodeURIComponent(url.slice("data:image/svg+xml;charset=UTF-8,".length));

test("ART-091B: original, transparent 24px SVG enemies are distinct and offline-only",()=>{
  assert.deepEqual(ENEMY_ART_IDS,["charognard","guardian","rift_larva"]);
  assert.equal(new Set(Object.values(ENEMY_SVGS)).size,3);
  assert.equal(new Set(Object.values(ENEMY_SPRITES)).size,3);
  for(const id of ENEMY_ART_IDS){
    const source=ENEMY_SVGS[id],uri=ENEMY_SPRITES[id];
    assert.match(source,/viewBox="0 0 24 24" width="24" height="24"/);
    assert.match(source,/shape-rendering="crispEdges"/);
    assert.match(source,/^<svg/);
    assert.match(source,/<\/svg>$/);
    assert.doesNotMatch(source,/<(?:script|image|foreignObject|text|animate|rect width="24" height="24")\b|(?:xlink:)?href\s*=/i);
    assert.match(uri,/^data:image\/svg\+xml;charset=UTF-8,/);
    assert.equal(decode(uri),source,"The prebuilt URI must encode the full SVG");
    assert.equal(TILE_SPRITES[id],uri,"Both combat portrait and dungeon tile share the source");
    assert.ok(LEGEND_ITEMS.some(([name])=>name===id),"Existing legend key remains intact");
    assert.notEqual(TILE_SPRITES[id],HERO_SPRITES.down,"Enemy silhouette differs from PJ");
  }
});

test("ART-091B: every enemy has the approved silhouette and a different focal contrast",()=>{
  assert.match(ENEMY_SVGS.charognard,/data-feature="low-carrion-silhouette"/);
  assert.match(ENEMY_SVGS.charognard,/data-feature="hooked-bone-beak"/);
  assert.match(ENEMY_SVGS.charognard,/#e2d3ad/,"A pale beak must punctuate the low torso");
  assert.match(ENEMY_SVGS.guardian,/data-feature="heavy-stone-sentinel"/);
  assert.match(ENEMY_SVGS.guardian,/data-feature="massive-mace"/);
  assert.match(ENEMY_SVGS.guardian,/#65717b/,"Armored head reads as stone, not plum hood");
  assert.match(ENEMY_SVGS.rift_larva,/data-feature="segmented-horizontal-larva"/);
  assert.match(ENEMY_SVGS.rift_larva,/data-feature="localized-spectral-emitter"/);
  assert.match(ENEMY_SVGS.rift_larva,/#e0f1d9/,"The anomaly has a small luminous point");
  assert.ok(!ENEMY_SVGS.guardian.includes('data-feature="hood"'));
  assert.ok(!ENEMY_SVGS.rift_larva.includes('data-feature="hooked-bone-beak"'));
});

test("ART-091B: combat/ASCII and saves are unchanged for the three live enemy families",()=>{
  const s=beginRun(newGame(),[]).state;
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(validateSave(s),true);
  assert.deepEqual(s.run.enemies.map(enemy=>enemy.kind),ENEMY_ART_IDS);
  assert.deepEqual(s.run.enemies.map(enemy=>enemy.hp),[3,5,4]);
  assert.deepEqual(ENEMY_ART_IDS.map(id=>ENEMY_TYPES[id].symbol),["c","G","L"]);
  const ascii=mapText(s);
  for(const mark of ["c","G","L"])assert.ok(ascii.includes(mark));
  assert.ok(s.run.enemies.every(enemy=>!Object.hasOwn(enemy,"sprite")),
    "The visual update must never enter the persisted combat model");
});

test("ART-091B: sprite module is precached and rendering layer remains fog-safe",()=>{
  const sw=readFileSync(new URL("../docs/sw.js",import.meta.url),"utf8");
  assert.match(sw,/const CACHE_NAME = "rogov-v0\\.7f-[a-z0-9-]+"/,
    "PWA cache remains revisioned as later packs are added");
  assert.match(sw,/"\.\/enemy-art\.js"/);
  const tiles=readFileSync(new URL("../docs/tiles.js",import.meta.url),"utf8");
  assert.match(tiles,/const enemy=visible\?enemyAt\(run,x,y\):null;/,
    "Enemies can only be looked up for visible cells");
  assert.match(tiles,/if\(!visible&&!remembered\)/,
    "Unknown cells must not gain a sprite or entity dataset");
  assert.match(tiles,/cell\.dataset\.hp=String\(enemy\.hp\)/,
    "Existing numeric HP badge remains independent of sprite art");
  assert.match(tiles,/selected-target-tile/);
  const css=readFileSync(new URL("../docs/style.css",import.meta.url),"utf8");
  for(const key of ["tile-charognard","tile-guardian","tile-rift_larva"])
    assert.ok(css.includes(key),"Type-specific target border remains: "+key);
});
