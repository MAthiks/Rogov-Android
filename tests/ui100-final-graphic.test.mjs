// UI/ART-100 — presentation-only regression guards.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {TERRAIN_SVGS,TERRAIN_SPRITES,terrainSpriteAt,knownCorridorAxis} from "../docs/terrain-art.js";
import {HERO_FACINGS,HERO_SVGS} from "../docs/hero-art.js";
import {ENEMY_ART_IDS,ENEMY_SVGS} from "../docs/enemy-art.js";
import {INTERACTIVE_IDS,INTERACTIVE_SVGS} from "../docs/interaction-art.js";
import {newGame,beginRun,validateSave,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("UI/ART-100: 54 unique 24px deterministic masonry tiles gain broad stone depth",()=>{
  const floors=TERRAIN_SVGS.floor,walls=TERRAIN_SVGS.wall.flat();
  assert.equal(floors.length,6);
  assert.equal(walls.length,48);
  assert.equal(new Set([...floors,...walls]).size,54);
  assert.equal(TERRAIN_SPRITES.floor.length,6);
  for(const xml of floors){
    assert.ok(xml.includes('data-detail="ui100-floor-broad-relief"'));
    assert.ok(xml.includes('data-detail="ui099-quiet-floor"'));
  }
  for(const xml of walls){
    assert.ok(xml.includes('data-detail="ui100-wall-deep-overhang"'));
    assert.ok(xml.includes('data-detail="ui100-wall-upper-plane"'));
  }
  for(const xml of [...floors,...walls]){
    assert.ok(xml.includes('viewBox="0 0 24 24" width="24" height="24"'));
    assert.ok(!xml.includes("<script")&&!xml.includes("<image")&&!xml.includes("<filter"));
    assert.ok(!xml.includes("href="));
  }
});
test("UI/ART-100: corridor cues use only immediate VISIBLE neighbors",()=>{
  const floor=["#####","#...#","#####"];
  const all=(x,y)=>x>=0&&x<5&&y>=0&&y<3;
  assert.equal(knownCorridorAxis(floor,2,1,all),"ew");
  assert.equal(knownCorridorAxis(["###","#.#","###"],1,1,()=>true),null);
  const changed=["#####","#...#","##.##"];
  const partial=(x,y)=>!(x===2&&y===2)&&all(x,y);
  assert.equal(knownCorridorAxis(floor,2,1,partial),null);
  assert.equal(knownCorridorAxis(changed,2,1,partial),null);
  assert.equal(knownCorridorAxis(floor,2,1,()=>false),null);
});
test("UI/ART-100: four hooded Sprite C views, three foes, eighteen interaction IDs",()=>{
  assert.deepEqual(HERO_FACINGS,["down","up","left","right"]);
  assert.deepEqual(ENEMY_ART_IDS,["charognard","guardian","rift_larva"]);
  assert.equal(INTERACTIVE_IDS.length,18);
  for(const facing of HERO_FACINGS){
    const xml=HERO_SVGS[facing];
    assert.ok(xml.includes('data-feature="hood"'));
    assert.ok(xml.includes('data-detail="ui100-hood-rim-contrast"'));
    assert.ok(!xml.includes('<rect width="24" height="24"'));
  }
  for(const id of ENEMY_ART_IDS){
    assert.ok(ENEMY_SVGS[id].includes('data-detail="ui100-'));
    assert.ok(!ENEMY_SVGS[id].includes('<rect width="24" height="24"'));
  }
  for(const id of ["door_open","door_closed","loot","chest_open",
    "trap_revealed","trap_disabled","trap_triggered","exit","hazard"])
    assert.ok(INTERACTIVE_SVGS[id].includes('data-detail="ui100-'),id);
  assert.ok(INTERACTIVE_SVGS.trap_clue.includes('data-feature="subtle-floor-scratches"'));
});
test("UI/ART-100: CSS lacks hostile square frames and preserves existing mobile actions",()=>{
  const css=read("../docs/ui100.css"),html=read("../docs/index.html"),
    sw=read("../docs/sw.js"),tiles=read("../docs/tiles.js");
  assert.ok(css.includes("content:none!important"));
  assert.ok(css.includes("selected-target-tile::before"));
  assert.ok(css.includes("min-height:44px"));
  assert.ok(css.includes("ui100-corridor-ns"));
  assert.ok(!css.includes("@import")&&!css.includes("@keyframes"));
  assert.ok(html.includes('href="./ui099.css?v=1"'));
  assert.ok(html.includes('href="./ui100.css?v=1"'));
  assert.ok(sw.includes('"./ui100.css?v=1"'));
  assert.ok(sw.includes("uiart100-final"));
  assert.ok(tiles.includes("knownCorridorAxis(map,x,y,visibleAt)"));
  assert.ok(tiles.includes('if(!visible&&!remembered)'));
  assert.ok(tiles.includes("const enemy=visible?enemyAt(run,x,y):null"));
});
test("UI/ART-100: no mutated run, no changed save schema, fog retained",()=>{
  const initial=newGame();
  initial.meta.descents=1;
  const state=beginRun(initial).state;
  const json=JSON.stringify(state);
  for(let y=0;y<state.run.map.length;y++)
    for(let x=0;x<state.run.map[y].length;x++){
      const seen=()=>true;
      terrainSpriteAt(state.run.map,x,y,seen,state.run.layoutId);
      knownCorridorAxis(state.run.map,x,y,seen);
    }
  assert.equal(JSON.stringify(state),json);
  assert.equal(validateSave(state),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
});
