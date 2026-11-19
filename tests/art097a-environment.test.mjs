// ART-097A1: original, inexpensive masonry layers; all tests are renderer-only.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  TERRAIN_SVGS,TERRAIN_SPRITES,terrainSpriteAt,wallEdgeMask
} from "../docs/terrain-art.js";
import {newGame,beginRun,validateSave,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";

const uriPrefix="data:image/svg+xml;charset=UTF-8,";
const decode=src=>decodeURIComponent(src.slice(uriPrefix.length));

test("ART-097A1: all 54 original 24x24 textures have legible structural relief",()=>{
  const floors=TERRAIN_SVGS.floor;
  const walls=TERRAIN_SVGS.wall.flat();
  assert.equal(floors.length,6);
  assert.equal(walls.length,48);
  assert.equal(new Set([...floors,...walls]).size,54);
  for(const xml of floors){
    assert.match(xml,/data-material="worn-floor-slabs"/);
    assert.match(xml,/data-detail="floor-beveled-masonry"/);
    assert.match(xml,/data-detail="floor-mortar-depth"/);
    assert.match(xml,/data-detail="floor-patina"/);
  }
  for(const xml of walls){
    assert.match(xml,/data-material="raised-stone-ledge"/);
    assert.match(xml,/data-detail="wall-dressed-capstone"/);
    assert.match(xml,/data-detail="wall-recessed-joints"/);
    assert.match(xml,/data-detail="wall-face-bevel"/);
    assert.match(xml,/data-detail="wall-age-patina"/);
  }
  for(const xml of [...floors,...walls]){
    assert.match(xml,/viewBox="0 0 24 24" width="24" height="24"/);
    assert.match(xml,/shape-rendering="crispEdges"/);
    assert.match(xml,/<\/svg>$/);
    assert.doesNotMatch(xml,/<(?:image|script|filter|animate|foreignObject|text)\b|(?:xlink:)?href\s*=/i);
    // The drawn stone must not imply unobserved traps, chests, foes or doors.
    assert.doesNotMatch(xml,/data-(?:feature|detail)="(?:trap|door|chest|hostile|secret)/i);
  }
  for(const src of [...TERRAIN_SPRITES.floor,...TERRAIN_SPRITES.wall.flat()]){
    assert.ok(src.startsWith(uriPrefix));
    assert.match(decode(src),/^<svg /);
  }
});

test("ART-097A1: relief variants remain deterministic and never read unknown connections",()=>{
  const a=["#####","#.#.#","#####"];
  const b=["#####","#.###","#####"];
  const beforeA=JSON.stringify(a),beforeB=JSON.stringify(b);
  const known=new Set(["1,1","2,1"]);
  const isKnown=(x,y)=>known.has(x+","+y);
  assert.equal(wallEdgeMask(a,2,1,isKnown),8);
  assert.equal(wallEdgeMask(b,2,1,isKnown),8);
  assert.equal(terrainSpriteAt(a,2,1,isKnown,"97"),terrainSpriteAt(b,2,1,isKnown,"97"));
  known.add("3,1");
  assert.notEqual(terrainSpriteAt(a,2,1,isKnown,"97"),terrainSpriteAt(b,2,1,isKnown,"97"));
  for(let n=1;n<=40;n++){
    assert.equal(terrainSpriteAt(a,1,1,()=>true,n),
      terrainSpriteAt(a,1,1,()=>true,n));
  }
  assert.equal(JSON.stringify(a),beforeA);
  assert.equal(JSON.stringify(b),beforeB);
});

test("ART-097A1: existing save contract and offline atlas remain intact",()=>{
  const initial=newGame();
  initial.meta.descents=1;
  const state=beginRun(initial,[]).state;
  const saved=JSON.stringify(state);
  terrainSpriteAt(state.run.map,state.run.x,state.run.y,()=>true,state.run.layoutId);
  assert.equal(JSON.stringify(state),saved);
  assert.equal(validateSave(state),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  const sw=readFileSync(new URL("../docs/sw.js",import.meta.url),"utf8");
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-[a-z0-9-]+"/);
  assert.match(sw,/"\.\/terrain-art\.js"/);
});
