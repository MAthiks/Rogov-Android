import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ART107B_FLOOR_NAMES,ART107B_WALL_FINISHES,ART107B_STRUCTURE_IDS,
  floorFinish107B,wallFinish107B,finishStructure107B,sconceFinish107B}
  from "../docs/art107b-tileset.js";
import {TERRAIN_SVGS,TERRAIN_SPRITES,floorVariantAt,wallEdgeMask,terrainSpriteAt}
  from "../docs/terrain-art.js";
import {INTERACTIVE_SVGS,INTERACTIVE_IDS} from "../docs/interaction-art.js";
import {SCONCE_SVG,localLightAt} from "../docs/nhal-lighting.js";
import {beginRun,newGame,validateSave,SAVE_KEY} from "../docs/game.js";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const safe=xml=>{
  assert.match(xml,/viewBox="0 0 24 24"/);
  assert.match(xml,/shape-rendering="crispEdges"/);
  assert.doesNotMatch(xml,/<(?:script|filter|animate|image|foreignObject|text)\b|(?:xlink:)?href\s*=/i);
};

test("ART-107B1: eight named 24px floors on the live atlas, 48 connected walls",()=>{
  assert.equal(ART107B_FLOOR_NAMES.length,8);
  assert.equal(TERRAIN_SVGS.floor.length,8);
  assert.equal(TERRAIN_SVGS.wall.length,16);
  assert.deepEqual(TERRAIN_SVGS.wall.map(row=>row.length),Array(16).fill(3));
  assert.equal(ART107B_WALL_FINISHES.length,3);
  const atlas=[...TERRAIN_SVGS.floor,...TERRAIN_SVGS.wall.flat()];
  assert.equal(atlas.length,56);
  assert.equal(new Set(atlas).size,56);
  for(let n=0;n<8;n++){
    const floor=TERRAIN_SVGS.floor[n];
    assert.ok(floor.includes('data-material="'+ART107B_FLOOR_NAMES[n]+'"'));
    assert.ok(floor.includes('data-decoration="art107b-floor"'));
    assert.match(floor,/data-decoration="art106c-floor-masonry"/);
    assert.match(floor,/data-art="art107a-floor-relief"/);
    assert.equal(decodeURIComponent(TERRAIN_SPRITES.floor[n].split(",").slice(1).join(",")),floor);
    safe(floor);
    assert.match(floorFinish107B(n),/data-decoration="art107b-floor"/);
  }
  for(let mask=0;mask<16;mask++)for(let v=0;v<3;v++){
    const wall=TERRAIN_SVGS.wall[mask][v];
    const detail=wallFinish107B(mask,v);
    assert.match(wall,/data-decoration="art107b-wall"/);
    assert.ok(wall.includes('data-material="'+ART107B_WALL_FINISHES[v]+'"'));
    assert.match(wall,/data-decoration="art106c-wall-masonry"/);
    assert.equal(wall.includes('data-pillar="isolated"'),mask===15);
    assert.ok(wall.includes(detail));
    safe(wall);
  }
  for(const bad of [-1,8,1.2,NaN])assert.throws(()=>floorFinish107B(bad),RangeError);
  for(const [mask,v] of [[-1,0],[16,0],[0,-1],[0,3],[1.5,0]])
    assert.throws(()=>wallFinish107B(mask,v),RangeError);
});

test("ART-107B1: deterministic textures never peek at unknown neighbors",()=>{
  const a=["#####","#.#.#","#####"],b=["#####","#.###","#####"];
  const known=new Set(["1,1","2,1"]);
  const k=(x,y)=>known.has(x+","+y);
  const old=JSON.stringify(a);
  assert.equal(wallEdgeMask(a,2,1,k),wallEdgeMask(b,2,1,k));
  assert.equal(terrainSpriteAt(a,2,1,k,"gothic"),
    terrainSpriteAt(b,2,1,k,"gothic"));
  known.add("3,1");
  assert.notEqual(terrainSpriteAt(a,2,1,k,"gothic"),
    terrainSpriteAt(b,2,1,k,"gothic"));
  assert.equal(JSON.stringify(a),old);
  const variants=new Set();
  for(let y=0;y<30;y++)for(let x=0;x<30;x++)
    variants.add(floorVariantAt("art107b-hall",x,y));
  assert.equal(variants.size,8);
});

test("ART-107B2: doors, chests and real rift/arch get stable details, no fake loot",()=>{
  for(const id of ART107B_STRUCTURE_IDS){
    const art=INTERACTIVE_SVGS[id];
    assert.ok(INTERACTIVE_IDS.includes(id));
    assert.ok(art.includes('data-decoration="art107b-structure"'));
    assert.ok(art.includes('data-kind="'+id+'"'));
    safe(art);
  }
  for(const id of INTERACTIVE_IDS){
    if(!ART107B_STRUCTURE_IDS.includes(id))
      assert.doesNotMatch(INTERACTIVE_SVGS[id],/data-decoration="art107b-structure"/);
  }
  assert.doesNotMatch(INTERACTIVE_SVGS.trap_clue,/art107b-structure/);
  assert.notEqual(INTERACTIVE_SVGS.loot,INTERACTIVE_SVGS.chest_open);
  assert.notEqual(INTERACTIVE_SVGS.door_open,INTERACTIVE_SVGS.door_closed);
  assert.notEqual(INTERACTIVE_SVGS.exit,INTERACTIVE_SVGS.hazard);
  assert.equal(finishStructure107B("site_unknown","x"),"x");
  assert.throws(()=>finishStructure107B("loot","not-an-svg"),TypeError);
});

test("ART-107B2: wall torch is local and visibility-gated as before",()=>{
  safe(SCONCE_SVG);
  assert.match(SCONCE_SVG,/data-decoration="art107b-iron-sconce"/);
  assert.match(sconceFinish107B(),/data-decoration="art107b-iron-sconce"/);
  const map=["#####","#...#","#####"];
  assert.equal(localLightAt(map,0,0,()=>false,"dark"),null);
  assert.equal(localLightAt(map,2,1,()=>false,"dark"),null);
  assert.match(read("docs/tiles.js"),/if\(visible&&ambience==="sconce"\)/);
  assert.match(read("docs/tiles.js"),/if\(!visible&&!remembered\)[\s\S]*?continue;/);
});

test("ART-107B: original save and offline PWA stay intact; no new game mechanics",()=>{
  const data=beginRun(newGame(),[]).state;
  const before=JSON.stringify(data);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(validateSave(data),true);
  terrainSpriteAt(data.run.map,data.run.x,data.run.y,()=>false,data.run.layoutId);
  assert.equal(JSON.stringify(data),before);
  assert.doesNotMatch(read("docs/art107b-tileset.js"),/Math\.random|fetch\(|Date\(|localStorage|navigator\.|https?:\/\/|@import/);
  assert.match(read("docs/sw.js"),/art107b-tileset/);
  assert.ok(read("docs/sw.js").includes('"./art107b-tileset.js"'));
  assert.match(read("package.json"),/art107b-tileset\.test\.mjs/);
  assert.match(read("package.json"),/node --check docs\/art107b-tileset\.js/);
});
