import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {floorRelief107A,wallRelief107A,polishHero107A,polishEnemy107A,
  polishInteractive107A,ART107A_ENHANCED} from "../docs/art107a-finishes.js";
import {TERRAIN_SVGS,TERRAIN_SPRITES,terrainSpriteAt,wallEdgeMask}
  from "../docs/terrain-art.js";
import {HERO_FACINGS,HERO_SVGS,HERO_SPRITES} from "../docs/hero-art.js";
import {ENEMY_ART_IDS,ENEMY_SVGS,ENEMY_SPRITES} from "../docs/enemy-art.js";
import {INTERACTIVE_IDS,INTERACTIVE_SVGS,INTERACTIVE_SPRITES}
  from "../docs/interaction-art.js";
import {TILE_SPRITES} from "../docs/tiles.js";
import {newGame,beginRun,validateSave,SAVE_KEY} from "../docs/game.js";

const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const decode=uri=>decodeURIComponent(uri.slice("data:image/svg+xml;charset=UTF-8,".length));
const safe=source=>{
  assert.match(source,/viewBox="0 0 24 24"/);
  assert.match(source,/shape-rendering="crispEdges"/);
  assert.doesNotMatch(source,/<(?:script|image|filter|animate|foreignObject)\b|(?:xlink:)?href\s*=/i);
};

test("ART-107A1: real floor/wall atlas remains 6+16x3 original 24px assets",()=>{
  assert.equal(ART107A_ENHANCED.floorVariants,6);
  assert.equal(ART107A_ENHANCED.wallMasks,16);
  assert.equal(ART107A_ENHANCED.wallVariants,3);
  assert.equal(TERRAIN_SVGS.floor.length,6);
  assert.equal(TERRAIN_SVGS.wall.length,16);
  assert.ok(TERRAIN_SVGS.wall.every(row=>row.length===3));
  for(let i=0;i<6;i++){
    assert.match(floorRelief107A(i),/data-art="art107a-floor-relief"/);
    assert.match(TERRAIN_SVGS.floor[i],/data-art="art107a-floor-relief"/);
    assert.equal(decode(TERRAIN_SPRITES.floor[i]),TERRAIN_SVGS.floor[i]);
    safe(TERRAIN_SVGS.floor[i]);
  }
  for(let mask=0;mask<16;mask++)for(let variant=0;variant<3;variant++){
    const mark=mask===15?"art107a-freestanding-pillar":"art107a-wall-relief";
    assert.ok(wallRelief107A(mask,variant).includes(mark));
    assert.ok(TERRAIN_SVGS.wall[mask][variant].includes(mark));
    safe(TERRAIN_SVGS.wall[mask][variant]);
  }
  assert.equal(new Set([...TERRAIN_SPRITES.floor,...TERRAIN_SPRITES.wall.flat()]).size,54);
  for(const bad of [-1,6,1.5,NaN])assert.throws(()=>floorRelief107A(bad),RangeError);
  for(const pair of [[-1,0],[16,0],[0,3],[0,-1],[1.5,0]])
    assert.throws(()=>wallRelief107A(...pair),RangeError);
});

test("ART-107A1: fog-safe wall mask ignores unknown neighbors",()=>{
  const a=["#####","#.#.#","#####"],b=["#####","#.###","#####"];
  const known=new Set(["2,1","1,1"]);
  const isKnown=(x,y)=>known.has(x+","+y);
  assert.equal(wallEdgeMask(a,2,1,isKnown),wallEdgeMask(b,2,1,isKnown));
  assert.equal(terrainSpriteAt(a,2,1,isKnown,"qa107a"),
    terrainSpriteAt(b,2,1,isKnown,"qa107a"));
  known.add("3,1");
  assert.notEqual(terrainSpriteAt(a,2,1,isKnown,"qa107a"),
    terrainSpriteAt(b,2,1,isKnown,"qa107a"));
  assert.equal(terrainSpriteAt(a,2,1,isKnown,"qa107a"),
    terrainSpriteAt(a,2,1,isKnown,"qa107a"));
});

test("ART-107A2: Sprite C 4 facings and all 3 actual enemy species enhanced",()=>{
  assert.deepEqual(HERO_FACINGS,ART107A_ENHANCED.hero);
  assert.deepEqual(ENEMY_ART_IDS,ART107A_ENHANCED.enemy);
  for(const facing of HERO_FACINGS){
    const src=HERO_SVGS[facing];safe(src);
    assert.match(src,new RegExp('data-art="art107a-hero-'+facing+'"'));
    assert.match(src,/data-feature="hood"/);
    assert.match(src,/data-detail="art106d-hooded-/);
    assert.equal(decode(HERO_SPRITES[facing]),src);
    assert.equal(TILE_SPRITES[facing==="down"?"hero":"hero_"+facing],HERO_SPRITES[facing]);
  }
  for(const kind of ENEMY_ART_IDS){
    const src=ENEMY_SVGS[kind];safe(src);
    assert.match(src,new RegExp('data-art="art107a-enemy-'+kind+'"'));
    assert.match(src,/data-detail="art106d-/);
    assert.equal(decode(ENEMY_SPRITES[kind]),src);
    assert.equal(TILE_SPRITES[kind],ENEMY_SPRITES[kind]);
  }
  assert.match(HERO_SVGS.right,/scale\(-1 1\)/);
  assert.throws(()=>polishHero107A("diagonal",HERO_SVGS.down),RangeError);
  assert.throws(()=>polishEnemy107A("golem",ENEMY_SVGS.guardian),RangeError);
});

test("ART-107A3: real treasure, door, arch, rift and revealed trap states only",()=>{
  assert.equal(INTERACTIVE_IDS.length,18);
  assert.ok(ART107A_ENHANCED.interactive.includes("loot"));
  assert.ok(ART107A_ENHANCED.interactive.includes("hazard"));
  assert.ok(!ART107A_ENHANCED.interactive.includes("trap_clue"));
  for(const kind of INTERACTIVE_IDS){
    const src=INTERACTIVE_SVGS[kind];safe(src);
    if(ART107A_ENHANCED.interactive.includes(kind))
      assert.match(src,new RegExp('data-art="art107a-object-'+kind+'"'));
    else assert.doesNotMatch(src,/data-art="art107a-object-/);
    assert.equal(decode(INTERACTIVE_SPRITES[kind]),src);
    assert.equal(TILE_SPRITES[kind],INTERACTIVE_SPRITES[kind]);
  }
  assert.notEqual(INTERACTIVE_SVGS.loot,INTERACTIVE_SVGS.chest_open);
  assert.notEqual(INTERACTIVE_SVGS.door_open,INTERACTIVE_SVGS.door_closed);
  assert.notEqual(INTERACTIVE_SVGS.exit,INTERACTIVE_SVGS.hazard);
  assert.equal(polishInteractive107A("trap_clue",INTERACTIVE_SVGS.trap_clue),INTERACTIVE_SVGS.trap_clue);
  assert.throws(()=>polishHero107A("down","<svg></svg>"),TypeError);
});

test("ART-107A: preserved gameplay, save schema, fog gates and offline delivery",()=>{
  const src=read("docs/art107a-finishes.js");
  assert.doesNotMatch(src,/Math\.random|fetch\(|Date\(|localStorage|navigator\.|https?:\/\/|@import/);
  const tile=read("docs/tiles.js");
  assert.match(tile,/if\(!visible&&!remembered\)[\s\S]*?continue;/);
  assert.match(tile,/const enemy=visible\?enemyAt\(run,x,y\):null/);
  assert.match(tile,/if\(visible&&ambience==="sconce"\)/);
  assert.match(tile,/terrainSpriteAt\(map,x,y,knows,artSeed\)/);
  const before=beginRun(newGame(),[]).state,serialized=JSON.stringify(before);
  assert.equal(validateSave(before),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  floorRelief107A(0);wallRelief107A(15,1);
  polishHero107A("down",HERO_SVGS.down);
  polishEnemy107A("guardian",ENEMY_SVGS.guardian);
  polishInteractive107A("loot",INTERACTIVE_SVGS.loot);
  assert.equal(JSON.stringify(before),serialized);
  assert.match(read("docs/sw.js"),/\.\/art107a-finishes\.js/);
  assert.match(read("package.json"),/art107a-world-polish\.test\.mjs/);
});
