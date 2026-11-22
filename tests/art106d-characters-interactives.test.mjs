import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {HERO_FACINGS,HERO_SVGS,HERO_SPRITES} from "../docs/hero-art.js";
import {ENEMY_ART_IDS,ENEMY_SVGS,ENEMY_SPRITES} from "../docs/enemy-art.js";
import {INTERACTIVE_IDS,INTERACTIVE_SVGS,INTERACTIVE_SPRITES}
  from "../docs/interaction-art.js";
import {TILE_SPRITES,drawTileMap} from "../docs/tiles.js";
import {finishHero106D,finishEnemy106D,finishInteractive106D,ART106D_SUPPORTED}
  from "../docs/art106d-finishes.js";
import {beginRun,newGame,validateSave,SAVE_KEY} from "../docs/game.js";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const decode=uri=>decodeURIComponent(uri.slice("data:image/svg+xml;charset=UTF-8,".length));

test("ART-106D: four hero facings use the same original 24px Sprite C identity",()=>{
  assert.deepEqual(ART106D_SUPPORTED.hero,HERO_FACINGS);
  assert.equal(new Set(Object.values(HERO_SVGS)).size,4);
  assert.equal(Object.keys(HERO_SVGS).length,4);
  for(const facing of HERO_FACINGS){
    const svg=HERO_SVGS[facing];
    assert.match(svg,/viewBox="0 0 24 24"/);
    assert.match(svg,/shape-rendering="crispEdges"/);
    assert.match(svg,/data-feature="hood"/);
    assert.match(svg,/data-detail="art106d-hooded-/);
    assert.equal(decode(HERO_SPRITES[facing]),svg);
    assert.equal(TILE_SPRITES[facing==="down"?"hero":"hero_"+facing],HERO_SPRITES[facing]);
    assert.doesNotMatch(svg,/<(?:script|animate|filter|image|foreignObject)\b|(?:xlink:)?href\s*=/i);
  }
  assert.match(HERO_SVGS.right,/scale\(-1 1\)/);
  assert.doesNotMatch(HERO_SVGS.up,/#d5c3a7/);
  assert.throws(()=>finishHero106D("north",HERO_SVGS.down),RangeError);
});

test("ART-106D: enemy species retain identity and gain material / danger detail",()=>{
  assert.deepEqual(ART106D_SUPPORTED.enemy,ENEMY_ART_IDS);
  assert.equal(new Set(Object.values(ENEMY_SVGS)).size,3);
  const features={charognard:"low-carrion-silhouette",
    guardian:"heavy-stone-sentinel",rift_larva:"segmented-horizontal-larva"};
  for(const id of ENEMY_ART_IDS){
    const sprite=ENEMY_SVGS[id];
    assert.match(sprite,new RegExp('data-feature="'+features[id]+'"'));
    assert.match(sprite,new RegExp('data-detail="art106d-'));
    assert.equal(decode(ENEMY_SPRITES[id]),sprite);
    assert.equal(TILE_SPRITES[id],ENEMY_SPRITES[id]);
    assert.doesNotMatch(sprite,/data-detail="art106d-(?:box|halo|selection-frame)"/);
  }
  assert.match(ENEMY_SVGS.guardian,/art106d-guardian-red-eyes/);
  assert.match(ENEMY_SVGS.rift_larva,/art106d-larva-red-eyes/);
  assert.match(ENEMY_SVGS.charognard,/art106d-carrion-wing/);
  assert.throws(()=>finishEnemy106D("dragon",ENEMY_SVGS.guardian),RangeError);
});

test("ART-106D: chest/door/arch/hazard states are genuinely different",()=>{
  assert.equal(INTERACTIVE_IDS.length,18);
  const enhanced=ART106D_SUPPORTED.interactive;
  assert.deepEqual(new Set(enhanced),
    new Set(["loot","chest_open","door_open","door_closed","exit","hazard"]));
  assert.equal(new Set(Object.values(INTERACTIVE_SVGS)).size,18);
  for(const id of INTERACTIVE_IDS){
    const sprite=INTERACTIVE_SVGS[id];
    assert.match(sprite,/viewBox="0 0 24 24"/);
    assert.equal(decode(INTERACTIVE_SPRITES[id]),sprite);
    assert.equal(TILE_SPRITES[id],INTERACTIVE_SPRITES[id]);
    if(enhanced.includes(id))assert.match(sprite,/data-detail="art106d-/);
    else assert.doesNotMatch(sprite,/data-detail="art106d-/);
  }
  assert.match(INTERACTIVE_SVGS.loot,/art106d-sealed-gold-chest/);
  assert.match(INTERACTIVE_SVGS.chest_open,/art106d-open-chest/);
  assert.match(INTERACTIVE_SVGS.exit,/art106d-arch-cyan-keystone/);
  assert.match(INTERACTIVE_SVGS.hazard,/art106d-sickly-green-rift/);
  assert.match(INTERACTIVE_SVGS.hazard,/#64b93c/,"The REAL fissure is now acid green");
  assert.doesNotMatch(INTERACTIVE_SVGS.hazard,/#b65e69/,"No old pink fissure fill");
  assert.match(INTERACTIVE_SVGS.trap_clue,/data-feature="subtle-floor-scratches"/);
  assert.doesNotMatch(INTERACTIVE_SVGS.trap_clue,/exposed-spikes|art106d-/);
  assert.doesNotMatch(INTERACTIVE_SVGS.door_open,/door-ring-pull/);
  assert.notEqual(INTERACTIVE_SVGS.loot,INTERACTIVE_SVGS.chest_open);
  assert.notEqual(INTERACTIVE_SVGS.door_open,INTERACTIVE_SVGS.door_closed);
  assert.notEqual(INTERACTIVE_SVGS.exit,INTERACTIVE_SVGS.hazard);
});

test("ART-106D: no RNG, hidden actor, extra save field, or network dependency",()=>{
  const source=read("docs/art106d-finishes.js");
  assert.doesNotMatch(source,/Math\.random|fetch\(|Date\(|localStorage|navigator\.|https?:\/\/|@import/);
  const hero=read("docs/hero-art.js");
  const enemy=read("docs/enemy-art.js");
  const interactive=read("docs/interaction-art.js");
  for(const text of [hero,enemy,interactive])
    assert.match(text,/art106d-finishes\.js/);
  const tile=read("docs/tiles.js");
  assert.match(tile,/if\(!visible&&!remembered\)[\s\S]*?continue;/);
  assert.match(tile,/const enemy=visible\?enemyAt\(run,x,y\):null/);
  assert.match(tile,/if\(visible&&ambience==="sconce"\)/);
  const before=beginRun(newGame(),[]).state,old=JSON.stringify(before);
  assert.equal(validateSave(before),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  // Constructing sprites and finishing pixels is pure even while a run exists.
  finishHero106D("down",HERO_SVGS.down);
  finishEnemy106D("guardian",ENEMY_SVGS.guardian);
  finishInteractive106D("loot",INTERACTIVE_SVGS.loot);
  assert.equal(JSON.stringify(before),old);
  assert.match(read("docs/sw.js"),/"\.\/art106d-finishes\.js"/);
});
