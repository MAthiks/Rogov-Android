// ART-097C2 — pure presentation readability, no extra entity or map state.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {TERRAIN_SVGS,TERRAIN_SPRITES,wallEdgeMask,terrainSpriteAt,
  floorVariantAt,wallVariantAt} from "../docs/terrain-art.js";
import {HERO_FACINGS,HERO_SVGS,HERO_SPRITES} from "../docs/hero-art.js";
import {ENEMY_ART_IDS,ENEMY_SVGS,ENEMY_SPRITES} from "../docs/enemy-art.js";
import {TILE_SPRITES} from "../docs/tiles.js";
import {newGame,beginRun,validateSave,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const noExternal=/<(?:script|image|filter|animate|foreignObject|text)\b|(?:xlink:)?href\s*=/i;
const inline=src=>decodeURIComponent(src.slice("data:image/svg+xml;charset=UTF-8,".length));

test("ART-097C2: quiet floors and raised wall faces retain all 56 deterministic 24px tiles",()=>{
  assert.equal(TERRAIN_SVGS.floor.length,8);
  assert.equal(TERRAIN_SVGS.wall.length,16);
  assert.ok(TERRAIN_SVGS.wall.every(a=>a.length===3));
  const art=[...TERRAIN_SVGS.floor,...TERRAIN_SVGS.wall.flat()];
  assert.equal(art.length,56);
  assert.equal(new Set(art).size,56);
  for(const floor of TERRAIN_SVGS.floor){
    assert.match(floor,/data-material="worn-floor-slabs"/);
    assert.match(floor,/data-detail="art097c2-floor-joint-hierarchy"/);
    assert.match(floor,/fill="#2e3c42" opacity=".38"/);
    assert.doesNotMatch(floor,/data-(?:detail|material)="(?:secret|door|trap|enemy|chest)/);
  }
  for(const wall of TERRAIN_SVGS.wall.flat()){
    assert.match(wall,/data-detail="art097c2-wall-cap-plane"/);
    assert.match(wall,/data-detail="art097c2-wall-face-depth"/);
    assert.match(wall,/fill="#7f9192"/);
    assert.doesNotMatch(wall,/data-(?:detail|material)="(?:secret|door|trap|enemy|chest)/);
  }
  for(const xml of art){
    assert.match(xml,/viewBox="0 0 24 24" width="24" height="24"/);
    assert.match(xml,/shape-rendering="crispEdges"/);
    assert.doesNotMatch(xml,noExternal);
  }
  for(const src of [...TERRAIN_SPRITES.floor,...TERRAIN_SPRITES.wall.flat()]){
    assert.ok(src.startsWith("data:image/svg+xml;charset=UTF-8,"));
    assert.ok(art.includes(inline(src)));
  }
});

test("ART-097C2: Sprite C stays hooded and readable in every facing, enemies stay distinct",()=>{
  assert.deepEqual(HERO_FACINGS,["down","up","left","right"]);
  assert.deepEqual(ENEMY_ART_IDS,["charognard","guardian","rift_larva"]);
  for(const facing of HERO_FACINGS){
    const xml=HERO_SVGS[facing];
    assert.match(xml,/data-feature="hood"/);
    assert.match(xml,/data-detail="art097c2-hood-reading-edge"/);
    assert.match(xml,/data-detail="art097c2-cloak-volume"/);
    assert.match(xml,/viewBox="0 0 24 24" width="24" height="24"/);
    assert.match(xml,/#3d3544/);
    assert.doesNotMatch(xml,noExternal);
    assert.equal(inline(HERO_SPRITES[facing]),xml);
  }
  assert.match(HERO_SVGS.right,/scale\(-1 1\)/);
  assert.doesNotMatch(HERO_SVGS.up,/#d5c3a7/);
  const feature={
    charognard:"art097c2-scavenger-readable-profile",
    guardian:"art097c2-guardian-armor-profile",
    rift_larva:"art097c2-larva-segment-steps"
  };
  for(const id of ENEMY_ART_IDS){
    const xml=ENEMY_SVGS[id];
    assert.ok(xml.includes('data-detail="'+feature[id]+'"'));
    assert.match(xml,/viewBox="0 0 24 24" width="24" height="24"/);
    assert.doesNotMatch(xml,noExternal);
    assert.doesNotMatch(xml,/<rect width="24" height="24"/);
    assert.equal(inline(ENEMY_SPRITES[id]),xml);
    assert.equal(TILE_SPRITES[id],ENEMY_SPRITES[id]);
  }
  assert.equal(TILE_SPRITES.hero,HERO_SPRITES.down);
  for(const f of ["up","left","right"])
    assert.equal(TILE_SPRITES["hero_"+f],HERO_SPRITES[f]);
});

test("ART-097C2: art remains fog-safe, deterministic and does not consume turns or modify saves",()=>{
  const hiddenA=["#####","#.#.#","#####"];
  const hiddenB=["#####","#.###","#####"];
  const knows=(x,y)=>new Set(["2,1","1,1"]).has(x+","+y);
  assert.equal(wallEdgeMask(hiddenA,2,1,knows),8);
  assert.equal(wallEdgeMask(hiddenB,2,1,knows),8);
  assert.equal(terrainSpriteAt(hiddenA,2,1,knows,"test"),
    terrainSpriteAt(hiddenB,2,1,knows,"test"));
  const hero=newGame();hero.meta.descents=1;
  const state=beginRun(hero).state,before=JSON.stringify(state);
  for(let y=0;y<state.run.map.length;y++)
    for(let x=0;x<state.run.map[0].length;x++){
      const seed=state.run.layoutId;
      const image=terrainSpriteAt(state.run.map,x,y,()=>true,seed);
      assert.ok(image.startsWith("data:image/svg+xml;charset=UTF-8,"));
      assert.equal(floorVariantAt(seed,x,y),floorVariantAt(seed,x,y));
      assert.equal(wallVariantAt(seed,x,y),wallVariantAt(seed,x,y));
    }
  assert.equal(JSON.stringify(state),before);
  assert.equal(validateSave(state),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  const render=read("../docs/tiles.js");
  assert.match(render,/if\(!visible&&!remembered\)[\s\S]*?continue/);
  assert.match(render,/const enemy=visible\?enemyAt\(run,x,y\):null/);
  assert.match(render,/const ambience=visible\?localLightAt\(map,x,y,visibleAt,artSeed\):null/);
});

test("ART-097C2: offline PWA and APK bundle existing graphic assets; no runtime visual overhead",()=>{
  const sw=read("../docs/sw.js"),html=read("../docs/index.html");
  // Subsequent UI/ART builds rotate offline cache names; atlas stays cached.
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-[a-z0-9-]+"/);
  for(const asset of ["./terrain-art.js","./hero-art.js","./enemy-art.js","./tiles.js"])
    assert.ok(sw.includes('"'+asset+'"'),"Missing offline asset "+asset);
  assert.match(html,/src="\.\/app\.js\?v=0\.7f"/);
  for(const src of ["../docs/terrain-art.js","../docs/hero-art.js",
    "../docs/enemy-art.js"]){
    const code=read(src);
    assert.doesNotMatch(code,/@keyframes|setInterval|setTimeout|Math\.random|fetch\(/);
  }
});
