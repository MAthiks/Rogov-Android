import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ART106C_FLOOR_DETAILS,floorMasonry106C,wallMasonry106C}
  from "../docs/art106c-masonry.js";
import {TERRAIN_SVGS,TERRAIN_SPRITES,terrainSpriteAt,wallEdgeMask}
  from "../docs/terrain-art.js";
import {SCONCE_SVG,sconceAt,localLightAt} from "../docs/nhal-lighting.js";
import {newGame,beginRun,validateSave,SAVE_KEY} from "../docs/game.js";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("ART-106C: actual atlas holds 6 carved floors, 16x3 walls and isolated pillars",()=>{
  assert.equal(ART106C_FLOOR_DETAILS.length,6);
  assert.equal(TERRAIN_SVGS.floor.length,6);
  assert.equal(TERRAIN_SVGS.wall.length,16);
  assert.ok(TERRAIN_SVGS.wall.every(row=>row.length===3));
  const sources=[...TERRAIN_SPRITES.floor,...TERRAIN_SPRITES.wall.flat()];
  assert.equal(sources.length,54);
  assert.equal(new Set(sources).size,54);
  for(let i=0;i<6;i++){
    assert.match(floorMasonry106C(i),/data-decoration="art106c-floor-masonry"/);
    assert.match(TERRAIN_SVGS.floor[i],/data-decoration="art106c-floor-masonry"/);
    assert.match(TERRAIN_SVGS.floor[i],/viewBox="0 0 24 24"/);
  }
  for(let mask=0;mask<16;mask++){
    for(let variant=0;variant<3;variant++){
      const fragment=wallMasonry106C(mask,variant);
      assert.match(fragment,/data-decoration="art106c-wall-masonry"/);
      assert.match(TERRAIN_SVGS.wall[mask][variant],/data-decoration="art106c-wall-masonry"/);
      assert.equal(fragment.includes('data-feature="art106c-isolated-pillar"'),mask===15);
    }
  }
  for(const input of [[-1,0],[16,0],[0,-1],[0,3]])
    assert.throws(()=>wallMasonry106C(...input),RangeError);
  assert.throws(()=>floorMasonry106C(-1),RangeError);
  assert.throws(()=>floorMasonry106C(6),RangeError);
});

test("ART-106C: walls never reveal unseen neighbors or change generated map",()=>{
  const a=["#####","#.#.#","#####"];
  const b=["#####","#.###","#####"];
  const seen=new Set(["2,1","1,1"]);
  const known=(x,y)=>seen.has(x+","+y);
  const before=JSON.stringify(a);
  assert.equal(wallEdgeMask(a,2,1,known),wallEdgeMask(b,2,1,known));
  assert.equal(terrainSpriteAt(a,2,1,known,"qa106c"),
    terrainSpriteAt(b,2,1,known,"qa106c"));
  seen.add("3,1");
  assert.notEqual(terrainSpriteAt(a,2,1,known,"qa106c"),
    terrainSpriteAt(b,2,1,known,"qa106c"));
  assert.equal(JSON.stringify(a),before);
  for(const part of [floorMasonry106C(0),wallMasonry106C(15,0)]){
    assert.doesNotMatch(part,/<(?:script|image|foreignObject|filter|animate)\b|(?:xlink:)?href\s*=/i);
  }
});

test("ART-106C: torch is still real, fog-safe, static and 24x24",()=>{
  assert.match(SCONCE_SVG,/data-detail="ember-flame"/);
  assert.match(SCONCE_SVG,/data-detail="art106c-forged-sconce"/);
  assert.match(SCONCE_SVG,/data-decoration="wall-sconce"/);
  assert.match(SCONCE_SVG,/viewBox="0 0 24 24"/);
  assert.doesNotMatch(SCONCE_SVG,/<(?:script|filter|animate|image|foreignObject|text)\b/i);
  const map=["#####","#...#","#####"];
  const invisible=()=>false;
  assert.equal(localLightAt(map,0,0,invisible,"qa106c"),null);
  assert.equal(sconceAt(map,0,0,invisible,"qa106c"),false);
  const state=beginRun(newGame(),[]).state,before=JSON.stringify(state);
  assert.equal(validateSave(state),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  terrainSpriteAt(state.run.map,state.run.x,state.run.y,()=>false,state.run.layoutId);
  assert.equal(JSON.stringify(state),before);
});

test("ART-106C: asset loaded offline, no hidden cell styling or fake actor",()=>{
  const html=read("docs/index.html"),sw=read("docs/sw.js");
  const terrain=read("docs/art106c-terrain.css");
  const tiles=read("docs/tiles.js");
  assert.match(html,/art106c-terrain\.css\?v=1/);
  assert.match(sw,/art106c-stone/);
  for(const asset of ["art106c-terrain.css?v=1","art106c-masonry.js"])
    assert.ok(sw.includes('"./'+asset+'"'));
  assert.match(terrain,/\[data-knowledge="visible"\]/);
  assert.match(terrain,/\[data-knowledge="remembered"\]/);
  assert.match(terrain,/\.art097c-sconce/);
  assert.match(terrain,/\.art097c-arch/);
  assert.match(terrain,/\.art097c-rift/);
  assert.doesNotMatch(terrain,/https?:\/\/|@import|position\s*:\s*fixed/i);
  assert.match(tiles,/if\(!visible&&!remembered\)[\s\S]*?continue;/);
  assert.match(tiles,/if\(visible&&ambience==="sconce"\)/);
  assert.match(tiles,/terrainSpriteAt\(map,x,y,knows,artSeed\)/);
});
