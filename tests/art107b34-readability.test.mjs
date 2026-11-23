import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  FLOOR_RHYTHMS_107B3,floorRhythm107B3,floorRhythmIndex107B3,
  ART107B3_SITES,finishHero107B4,finishEnemy107B4,finishSite107B3
} from "../docs/art107b34-finishes.js";
import {
  TERRAIN_SVGS,TERRAIN_SPRITES,TERRAIN_FLOOR_RHYTHM_SVGS,
  TERRAIN_FLOOR_RHYTHM_SPRITES,
  floorVariantAt,floorRhythmAt,wallEdgeMask,terrainSpriteAt
} from "../docs/terrain-art.js";
import {HERO_SVGS,HERO_SPRITES,HERO_FACINGS} from "../docs/hero-art.js";
import {ENEMY_SVGS,ENEMY_SPRITES,ENEMY_ART_IDS} from "../docs/enemy-art.js";
import {INTERACTIVE_SVGS,INTERACTIVE_SPRITES,INTERACTIVE_IDS} from "../docs/interaction-art.js";
import {TILE_SPRITES} from "../docs/tiles.js";
import {newGame,beginRun,validateSave,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const prefix="data:image/svg+xml;charset=UTF-8,";
const decode=data=>decodeURIComponent(data.slice(prefix.length));
const svgSafe=source=>{
  assert.match(source,/^<svg /);
  assert.match(source,/viewBox="0 0 24 24"/);
  assert.match(source,/shape-rendering="crispEdges"/);
  assert.match(source,/<\/svg>$/);
  assert.doesNotMatch(source,/<(?:script|image|filter|animate|foreignObject|text)\b|(?:xlink:)?href\s*=/i);
};
test("ART-107B3: 8 materials times 4 prebuilt paving rhythms; historical 56 atlas still works",()=>{
  assert.equal(TERRAIN_SVGS.floor.length,8);
  assert.equal(TERRAIN_SVGS.wall.length,16);
  assert.deepEqual(TERRAIN_SVGS.wall.map(a=>a.length),Array(16).fill(3));
  assert.equal(TERRAIN_SPRITES.floor.length,8);
  assert.equal(FLOOR_RHYTHMS_107B3.length,4);
  assert.deepEqual(TERRAIN_FLOOR_RHYTHM_SVGS.map(a=>a.length),Array(8).fill(4));
  assert.deepEqual(TERRAIN_FLOOR_RHYTHM_SPRITES.map(a=>a.length),Array(8).fill(4));
  const all=TERRAIN_FLOOR_RHYTHM_SVGS.flat();
  assert.equal(all.length,32);
  assert.equal(new Set(all).size,32);
  assert.equal(new Set([...TERRAIN_SVGS.floor,...TERRAIN_SVGS.wall.flat()]).size,56);
  for(let material=0;material<8;material++)for(let rhythm=0;rhythm<4;rhythm++){
    const xml=TERRAIN_FLOOR_RHYTHM_SVGS[material][rhythm];
    svgSafe(xml);
    assert.match(xml,/data-material="worn-floor-slabs"/);
    assert.match(xml,/data-decoration="art107b-floor"/);
    assert.match(xml,/data-art="art107b3-floor-rhythm"/);
    assert.ok(xml.includes('data-rhythm="'+FLOOR_RHYTHMS_107B3[rhythm]+'"'));
    assert.equal(decode(TERRAIN_FLOOR_RHYTHM_SPRITES[material][rhythm]),xml);
  }
  for(let i=0;i<8;i++){
    assert.equal(TERRAIN_SVGS.floor[i],TERRAIN_FLOOR_RHYTHM_SVGS[i][0]);
    assert.equal(decode(TERRAIN_SPRITES.floor[i]),TERRAIN_SVGS.floor[i]);
  }
  for(const i of [-1,4,1.25,NaN])assert.throws(()=>floorRhythm107B3(i),RangeError);
  for(const hash of [-1,0x100000000,1.25,NaN])assert.throws(()=>floorRhythmIndex107B3(hash),RangeError);
});

test("ART-107B3: visual-only hash breaks floor checkerboard and never leaks hidden topology",()=>{
  const seed="nhal-gothic-107b34";
  const hits=new Set(),counts=[0,0,0,0];
  for(let y=0;y<50;y++)for(let x=0;x<50;x++){
    const a=floorRhythmAt(seed,x,y),b=floorRhythmAt(seed,x,y);
    assert.equal(a,b);
    counts[a]++;
    hits.add(a);
    assert.ok(floorVariantAt(seed,x,y)>=0&&floorVariantAt(seed,x,y)<8);
  }
  assert.equal(hits.size,4);
  // All families must be well represented rather than a few repeating stripes.
  assert.ok(counts.every(c=>c>400&&c<850),JSON.stringify(counts));
  const a=["#####","#.#.#","#####"],b=["#####","#.###","#####"];
  const seen=new Set(["2,1","1,1"]);
  const known=(x,y)=>seen.has(x+","+y);
  assert.equal(wallEdgeMask(a,2,1,known),wallEdgeMask(b,2,1,known));
  assert.equal(terrainSpriteAt(a,2,1,known,"no-leak"),terrainSpriteAt(b,2,1,known,"no-leak"));
  seen.add("3,1");
  assert.notEqual(terrainSpriteAt(a,2,1,known,"no-leak"),terrainSpriteAt(b,2,1,known,"no-leak"));
  const floorMap=["#####","#...#","#####"];
  const uri=terrainSpriteAt(floorMap,2,1,()=>false,seed);
  const material=floorVariantAt(seed,2,1),rhythm=floorRhythmAt(seed,2,1);
  assert.equal(uri,TERRAIN_FLOOR_RHYTHM_SPRITES[material][rhythm]);
});

test("ART-107B4: original hooded Sprite C and three real enemies gain internal contrast, not colored frames",()=>{
  assert.deepEqual(HERO_FACINGS,["down","up","left","right"]);
  assert.deepEqual(ENEMY_ART_IDS,["charognard","guardian","rift_larva"]);
  for(const facing of HERO_FACINGS){
    const svg=HERO_SVGS[facing];svgSafe(svg);
    assert.match(svg,new RegExp('data-art="art107b4-hero-'+facing+'"'));
    assert.match(svg,/data-feature="hood"/);
    assert.doesNotMatch(svg,/<rect width="24" height="24"/);
    assert.equal(decode(HERO_SPRITES[facing]),svg);
    assert.equal(TILE_SPRITES[facing==="down"?"hero":"hero_"+facing],HERO_SPRITES[facing]);
  }
  assert.match(HERO_SVGS.right,/scale\(-1 1\)/);
  for(const id of ENEMY_ART_IDS){
    const svg=ENEMY_SVGS[id];svgSafe(svg);
    assert.match(svg,new RegExp('data-art="art107b4-enemy-'+id+'"'));
    assert.equal(decode(ENEMY_SPRITES[id]),svg);
    assert.equal(TILE_SPRITES[id],ENEMY_SPRITES[id]);
  }
  assert.throws(()=>finishHero107B4("north-east",HERO_SVGS.down),RangeError);
  assert.throws(()=>finishEnemy107B4("new-monster",ENEMY_SVGS.guardian),RangeError);
  assert.throws(()=>finishHero107B4("down","<svg/>"),TypeError);
});

test("ART-107B3: only actual discovered site assets enhanced, never hidden trap clues",()=>{
  assert.equal(ART107B3_SITES.length,8);
  for(const id of ART107B3_SITES){
    assert.ok(INTERACTIVE_IDS.includes(id));
    assert.match(INTERACTIVE_SVGS[id],new RegExp('data-art="art107b3-site-'+id+'"'));
    svgSafe(INTERACTIVE_SVGS[id]);
  }
  for(const id of INTERACTIVE_IDS){
    if(!ART107B3_SITES.includes(id))
      assert.doesNotMatch(INTERACTIVE_SVGS[id],/data-art="art107b3-site-/);
    assert.equal(decode(INTERACTIVE_SPRITES[id]),INTERACTIVE_SVGS[id]);
    assert.equal(TILE_SPRITES[id],INTERACTIVE_SPRITES[id]);
  }
  assert.equal(finishSite107B3("trap_clue",INTERACTIVE_SVGS.trap_clue),INTERACTIVE_SVGS.trap_clue);
  assert.doesNotMatch(INTERACTIVE_SVGS.trap_clue,/art107b3-site/);
  assert.notEqual(INTERACTIVE_SVGS.door_closed,INTERACTIVE_SVGS.door_open);
  assert.notEqual(INTERACTIVE_SVGS.exit,INTERACTIVE_SVGS.hazard);
});

test("ART-107B3/B4: offline cache and unchanged save schema, no gameplay-side effects",()=>{
  const f=read("docs/art107b34-finishes.js");
  assert.doesNotMatch(f,/Math\.random|fetch\(|Date\(|localStorage|navigator\.|https?:\/\/|@import/);
  const tiles=read("docs/tiles.js");
  assert.match(tiles,/if\(!visible&&!remembered\)[\s\S]*?continue/);
  assert.match(tiles,/const enemy=visible\?enemyAt\(run,x,y\):null/);
  assert.match(tiles,/if\(visible&&ambience==="sconce"\)/);
  const state=beginRun(newGame(),[]).state,original=JSON.stringify(state);
  assert.equal(validateSave(state),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  floorRhythmAt(state.run.layoutId,1,1);
  terrainSpriteAt(state.run.map,state.run.x,state.run.y,()=>false,state.run.layoutId);
  finishHero107B4("down",HERO_SVGS.down);
  finishSite107B3("site_atelier",INTERACTIVE_SVGS.site_atelier);
  assert.equal(JSON.stringify(state),original);
  assert.ok(read("docs/sw.js").includes('"./art107b34-finishes.js"'));
  assert.match(read("package.json"),/art107b34-readability\.test\.mjs/);
});
