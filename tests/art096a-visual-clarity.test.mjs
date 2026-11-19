// ART-096A: material and silhouette checks independent of user-visible rules.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {TERRAIN_SVGS,TERRAIN_SPRITES,terrainSpriteAt,wallEdgeMask} from "../docs/terrain-art.js";
import {INTERACTIVE_SVGS,INTERACTIVE_SPRITES} from "../docs/interaction-art.js";
import {ENEMY_SVGS,ENEMY_SPRITES} from "../docs/enemy-art.js";
import {TILE_SPRITES} from "../docs/tiles.js";
import {newGame,beginRun,SAVE_KEY,SCHEMA_VERSION,validateSave} from "../docs/game.js";

const prefix="data:image/svg+xml;charset=UTF-8,";
const xmlOf=uri=>decodeURIComponent(uri.slice(prefix.length));
const all=[...TERRAIN_SVGS.floor,...TERRAIN_SVGS.wall.flat(),
  ...Object.values(INTERACTIVE_SVGS),...Object.values(ENEMY_SVGS)];

test("ART-096A: stone floor is quieter than raised wall geometry across 54 deterministic variants",()=>{
  assert.equal(TERRAIN_SVGS.floor.length,6);
  assert.equal(TERRAIN_SVGS.wall.length,16);
  assert.ok(TERRAIN_SVGS.wall.every(x=>x.length===3));
  for(const x of TERRAIN_SVGS.floor)assert.match(x,/data-material="worn-floor-slabs"/);
  for(const x of TERRAIN_SVGS.wall.flat())assert.match(x,/data-material="raised-stone-ledge"/);
  assert.equal(new Set(TERRAIN_SVGS.floor).size,6);
  assert.equal(new Set(TERRAIN_SVGS.wall.flat()).size,48);
  const map=["#####","#...#","#####"];
  const before=JSON.stringify(map);
  for(const [x,y] of [[0,0],[1,1],[2,1],[3,1]]){
    const uri=terrainSpriteAt(map,x,y,()=>true,"art096a");
    assert.ok(uri.startsWith(prefix));
    assert.equal(uri,terrainSpriteAt(map,x,y,()=>true,"art096a"),
      "The visual variant must not use combat RNG");
  }
  assert.equal(wallEdgeMask(map,1,1,()=>true),0);
  assert.equal(JSON.stringify(map),before,"Visuals cannot mutate terrain topology");
});

test("ART-096A: open door, solid door, extraction arch and lethal rift have distinct structural cues",()=>{
  const d=INTERACTIVE_SVGS;
  assert.match(d.door_open,/data-feature="open-void"/);
  assert.match(d.door_open,/data-detail="arch-keystone"/);
  assert.match(d.door_closed,/data-feature="opaque-timber"/);
  assert.match(d.door_closed,/data-detail="opaque-door-lock"/);
  assert.match(d.exit,/data-feature="turquoise-extraction-arch"/);
  assert.match(d.exit,/data-detail="extraction-keystone"/);
  assert.match(d.hazard,/data-feature="fractured-lethal-rift"/);
  assert.match(d.hazard,/data-detail="rift-black-center"/);
  for(const id of ["door_open","door_closed","exit","hazard"]){
    assert.equal(TILE_SPRITES[id],INTERACTIVE_SPRITES[id]);
    assert.equal(xmlOf(INTERACTIVE_SPRITES[id]),d[id]);
  }
  assert.notEqual(d.door_closed,d.door_open);
  assert.notEqual(d.exit,d.hazard);
});

test("ART-096A: three enemy signatures retain 24px Sprite C and original actor IDs",()=>{
  for(const [id,detail] of [
    ["charognard","ragged-wing-rim"],["guardian","stone-armor-planes"],
    ["rift_larva","segment-ridge"]
  ]){
    assert.match(ENEMY_SVGS[id],new RegExp('data-detail="'+detail+'"'));
    assert.equal(xmlOf(ENEMY_SPRITES[id]),ENEMY_SVGS[id]);
    assert.equal(TILE_SPRITES[id],ENEMY_SPRITES[id]);
  }
  assert.equal(new Set(Object.values(ENEMY_SVGS)).size,3);
  for(const svg of all){
    assert.match(svg,/viewBox="0 0 24 24" width="24" height="24"/);
    assert.match(svg,/shape-rendering="crispEdges"/);
    assert.doesNotMatch(svg,/<(?:script|image|foreignObject|animate|text)\b|(?:xlink:)?href\s*=/i);
    assert.match(svg,/<\/svg>$/);
  }
});

test("ART-096A: fog selection and game saves are unchanged; fresh assets are precached",()=>{
  const s=newGame();s.meta.descents=1;
  const state=beginRun(s,[]).state;
  const frozen=JSON.stringify(state);
  for(const id of ["guardian","charognard","rift_larva","door_open","door_closed","exit","hazard"]){
    assert.ok(TILE_SPRITES[id].startsWith(prefix));
    assert.ok(xmlOf(TILE_SPRITES[id]).startsWith("<svg"));
  }
  assert.equal(JSON.stringify(state),frozen);
  assert.equal(validateSave(state),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  const tiles=readFileSync(new URL("../docs/tiles.js",import.meta.url),"utf8");
  assert.match(tiles,/if\(!visible&&!remembered\)/);
  assert.match(tiles,/const enemy=visible\?enemyAt\(run,x,y\):null;/);
  assert.match(tiles,/else if\(visible&&trapAppearance\(run,x,y\)\)/);
  const sw=readFileSync(new URL("../docs/sw.js",import.meta.url),"utf8");
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-[a-z0-9-]+"/);
  for(const path of ["terrain-art.js","interaction-art.js","enemy-art.js"])
    assert.ok(sw.includes('"./'+path+'"'),"Offline asset absent: "+path);
});
