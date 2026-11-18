import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {HERO_FACINGS,HERO_SVGS,HERO_SPRITES,heroFacingFromStep} from "../docs/hero-art.js";
import {TILE_SPRITES} from "../docs/tiles.js";
import {SAVE_KEY,SCHEMA_VERSION,newGame,beginRun,validateSave} from "../docs/game.js";

const decode=url=>decodeURIComponent(url.slice("data:image/svg+xml;charset=UTF-8,".length));

test("ART-091A: four distinct, standalone 24px hood-up idle views",()=>{
  assert.deepEqual(HERO_FACINGS,["down","up","left","right"]);
  assert.equal(new Set(Object.values(HERO_SVGS)).size,4);
  assert.equal(new Set(Object.values(HERO_SPRITES)).size,4);
  for(const facing of HERO_FACINGS){
    const xml=HERO_SVGS[facing];
    assert.match(xml,/viewBox="0 0 24 24" width="24" height="24"/);
    assert.match(xml,/shape-rendering="crispEdges"/);
    assert.match(xml,/<g data-feature="hood">/,"Hood is raised in every direction");
    assert.match(xml,/#3d3544/,"Consistent desaturated plum hood");
    assert.match(xml,/#252c33/,"Boots keep their anchored pixel silhouette");
    assert.doesNotMatch(xml,/<(?:script|image|foreignObject|text)\b|(?:xlink:)?href\s*=/i,
      "No scripts, captions, decorative backgrounds or remote graphics");
    assert.equal(decode(HERO_SPRITES[facing]),xml);
  }
  assert.match(HERO_SVGS.down,/#ebe3cd/,"Front has pale facial contrast");
  assert.match(HERO_SVGS.left,/#ebe3cd/,"Profile has pale facial contrast");
  assert.match(HERO_SVGS.right,/scale\(-1 1\)/,"Right mirrors identical profile proportions");
  assert.doesNotMatch(HERO_SVGS.up,/#d5c3a7/,"Back of hood has no frontal face");
});

test("ART-091A: old hero key, legend and enemy sprites remain compatible",()=>{
  assert.equal(TILE_SPRITES.hero,HERO_SPRITES.down);
  for(const facing of ["up","left","right"]){
    assert.equal(TILE_SPRITES["hero_"+facing],HERO_SPRITES[facing]);
  }
  for(const id of ["charognard","guardian","rift_larva","door_open","door_closed",
    "loot","chest_open","trap_clue","trap_revealed","trap_disabled","exit"]){
    assert.match(TILE_SPRITES[id],/^data:image\/svg\+xml;charset=UTF-8,/);
  }
});

test("ART-091A: only real cardinal movement changes UI facing",()=>{
  const from={x:8,y:10,turns:9},snapshot=JSON.stringify(from);
  assert.equal(heroFacingFromStep(from,{x:8,y:11},"up"),"down");
  assert.equal(heroFacingFromStep(from,{x:8,y:9},"down"),"up");
  assert.equal(heroFacingFromStep(from,{x:7,y:10},"down"),"left");
  assert.equal(heroFacingFromStep(from,{x:9,y:10},"down"),"right");
  assert.equal(heroFacingFromStep(from,{...from,turns:10},"right"),"right");
  assert.equal(heroFacingFromStep(from,{x:10,y:10},"left"),"left");
  assert.equal(heroFacingFromStep(from,{x:9,y:9},"left"),"left");
  assert.equal(heroFacingFromStep(null,from,"right"),"down");
  assert.equal(heroFacingFromStep(from,null,"right"),"down");
  assert.equal(heroFacingFromStep(from,from,"invalid"),"down");
  assert.equal(JSON.stringify(from),snapshot,"UI facing does not change game state");
});

test("ART-091A: legacy saves and offline PWA cache keep their contracts",()=>{
  const state=beginRun(newGame(),[]).state;
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(validateSave(state),true);
  assert.equal(Object.hasOwn(state.run,"facing"),false,
    "Facing must not introduce a new field into persisted run data");
  const sw=readFileSync(new URL("../docs/sw.js",import.meta.url),"utf8");
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-[a-z0-9-]+"/,
    "Versioned cache remains active as subsequent art packs are added");
  assert.match(sw,/"\.\/hero-art\.js"/,"All four SVG sprites precached offline");
});
