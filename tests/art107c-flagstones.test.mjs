import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {NHAL_FLAGSTONE_LAYOUTS_107C,flagstoneGeometry107C} from "../docs/art107c-flagstones.js";
import {TERRAIN_SVGS,TERRAIN_SPRITES,TERRAIN_FLOOR_RHYTHM_SVGS,
  TERRAIN_FLOOR_RHYTHM_SPRITES,terrainSpriteAt,wallEdgeMask,floorRhythmAt,floorVariantAt
} from "../docs/terrain-art.js";
import {beginRun,newGame,validateSave,SAVE_KEY} from "../docs/game.js";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const prefix="data:image/svg+xml;charset=UTF-8,";
const xml=data=>decodeURIComponent(data.slice(prefix.length));
test("ART-107C: four distinct full slab geometries, not a repeating joint overlay",()=>{
  assert.equal(NHAL_FLAGSTONE_LAYOUTS_107C.length,4);
  assert.equal(new Set(NHAL_FLAGSTONE_LAYOUTS_107C).size,4);
  const mortar=[];
  const outlines=[];
  for(let index=0;index<4;index++){
    const geometry=flagstoneGeometry107C(index);
    assert.ok(geometry.includes('data-art="art107c-flagstone"'));
    assert.ok(geometry.includes('data-layout="'+NHAL_FLAGSTONE_LAYOUTS_107C[index]+'"'));
    assert.match(geometry,/<path data-material="worn-floor-slabs" d="/);
    const joint=geometry.match(/<path data-detail="floor-mortar-depth" d="([^"]+)"/);
    assert.ok(joint,"Each geometry must have a real mortar network");
    mortar.push(joint[1]);
    const stone=geometry.match(/<path data-material="worn-floor-slabs" d="([^"]+)"/);
    outlines.push(stone[1]);
    assert.match(geometry,/data-detail="floor-beveled-masonry"/);
    assert.match(geometry,/<rect width="24" height="24" fill="#1a2730"/);
    assert.doesNotMatch(geometry,/<(?:script|filter|animate|image|foreignObject|text)\b|(?:xlink:)?href\s*=/i);
  }
  assert.equal(new Set(mortar).size,4,"Mortar paths MUST be different");
  assert.equal(new Set(outlines).size,4,"Stone outlines MUST be different");
  for(const bad of [-1,4,1.5,NaN,null,"0"])assert.throws(()=>flagstoneGeometry107C(bad),RangeError);
});

test("ART-107C: actual 32 used 24px floor sprites contain those geometries, atlas stays compatible",()=>{
  assert.equal(TERRAIN_SVGS.floor.length,8);
  assert.equal(TERRAIN_SVGS.wall.length,16);
  assert.deepEqual(TERRAIN_SVGS.wall.map(x=>x.length),Array(16).fill(3));
  assert.deepEqual(TERRAIN_FLOOR_RHYTHM_SVGS.map(x=>x.length),Array(8).fill(4));
  const all=TERRAIN_FLOOR_RHYTHM_SVGS.flat();
  assert.equal(new Set(all).size,32);
  assert.equal(new Set([...TERRAIN_SVGS.floor,...TERRAIN_SVGS.wall.flat()]).size,56);
  for(let material=0;material<8;material++){
    assert.equal(TERRAIN_SVGS.floor[material],TERRAIN_FLOOR_RHYTHM_SVGS[material][0]);
    assert.equal(xml(TERRAIN_SPRITES.floor[material]),TERRAIN_SVGS.floor[material]);
    for(let rhythm=0;rhythm<4;rhythm++){
      const svg=TERRAIN_FLOOR_RHYTHM_SVGS[material][rhythm];
      assert.match(svg,/<svg[^>]+viewBox="0 0 24 24"[^>]+shape-rendering="crispEdges"/);
      assert.ok(svg.includes('data-layout="'+NHAL_FLAGSTONE_LAYOUTS_107C[rhythm]+'"'));
      assert.ok(svg.includes(flagstoneGeometry107C(rhythm)));
      assert.match(svg,/data-decoration="art106c-floor-masonry"/);
      assert.match(svg,/data-art="art107a-floor-relief"/);
      assert.match(svg,/data-decoration="art107b-floor"/);
      assert.match(svg,/data-art="art107b3-floor-rhythm"/);
      assert.match(svg,/data-detail="art107c-inherited-wear"/);
      assert.equal(xml(TERRAIN_FLOOR_RHYTHM_SPRITES[material][rhythm]),svg);
    }
  }
});

test("ART-107C: stable geometry selection across saves, 11x11 and 15x9 with no hidden map leaks",()=>{
  const seed="nhal-flagstones-stable",counts=Array(4).fill(0);
  for(let y=0;y<50;y++)for(let x=0;x<50;x++){
    const index=floorRhythmAt(seed,x,y);
    assert.ok(index>=0&&index<4);
    assert.equal(index,floorRhythmAt(seed,x,y));
    counts[index]++;
    assert.ok(floorVariantAt(seed,x,y)<8);
  }
  assert.ok(counts.every(c=>c>400&&c<850),JSON.stringify(counts));
  const explored=new Set(["2,1","1,1"]);
  const known=(x,y)=>explored.has(x+","+y);
  const a=["#####","#.#.#","#####"],b=["#####","#.###","#####"];
  assert.equal(wallEdgeMask(a,2,1,known),wallEdgeMask(b,2,1,known));
  assert.equal(terrainSpriteAt(a,2,1,known,seed),terrainSpriteAt(b,2,1,known,seed));
  explored.add("3,1");
  assert.notEqual(terrainSpriteAt(a,2,1,known,seed),terrainSpriteAt(b,2,1,known,seed));
  for(const [w,h] of [[11,11],[15,9]]){
    const map=Array.from({length:h},(_,y)=>y===0||y===h-1?"#".repeat(w):
      "#"+ ".".repeat(w-2)+"#");
    for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
      assert.equal(terrainSpriteAt(map,x,y,()=>false,seed),
        TERRAIN_FLOOR_RHYTHM_SPRITES[floorVariantAt(seed,x,y)][floorRhythmAt(seed,x,y)]);
    }
  }
  const state=beginRun(newGame(),[]).state;
  assert.equal(validateSave(state),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  const old=JSON.stringify(state);
  terrainSpriteAt(state.run.map,state.run.x,state.run.y,()=>false,state.run.layoutId);
  assert.equal(JSON.stringify(state),old);
});

test("ART-107C: local-only SVG, no game RNG, APK and PWA core assets still precached",()=>{
  const module=read("docs/art107c-flagstones.js");
  assert.doesNotMatch(module,/Math\.random|fetch\(|Date\(|localStorage|navigator\.|https?:\/\/|@import|document\./);
  const terrain=read("docs/terrain-art.js");
  assert.match(terrain,/flagstoneGeometry107C\(rhythm\)/);
  assert.match(terrain,/wallEdgeMask\(map,x,y,isKnown\)/);
  assert.match(terrain,/floorRhythmIndex107B3\(terrainHash\(seed,x,y\)\)/);
  assert.match(read("docs/sw.js"),/art107c-flagstones/);
  assert.ok(read("docs/sw.js").includes('"./art107c-flagstones.js"'));
  assert.match(read("package.json"),/art107c-flagstones\.test\.mjs/);
  assert.match(read("package.json"),/node --check docs\/art107c-flagstones\.js/);
});
