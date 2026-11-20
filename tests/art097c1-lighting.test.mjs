// ART-097C1 — local static atmosphere, fog-safe and deterministic.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {terrainHash} from "../docs/terrain-art.js";
import {localLightAt,sconceAt,SCONCE_SVG,SCONCE_SPRITE} from "../docs/nhal-lighting.js";
import {newGame,beginRun,validateSave,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";

const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const map=["#######","#.....#","#..E..#","#..^..#","#.....#","#######"].map(x=>x.split(""));
const visibleAll=(x,y)=>x>=0&&y>=0&&y<map.length&&x<map[0].length;

test("ART-097C1: visible real Arche and Faille receive distinct local colors only",()=>{
  assert.equal(localLightAt(map,3,2,visibleAll),"arch");
  assert.equal(localLightAt(map,3,3,visibleAll),"rift");
  assert.equal(localLightAt(map,2,2,visibleAll),"arch-edge");
  assert.equal(localLightAt(map,3,1,visibleAll),"arch-edge");
  assert.equal(localLightAt(map,3,4,visibleAll),"rift-edge");
  // The danger highlight takes precedence when both actual sources are near.
  assert.equal(localLightAt(map,2,3,visibleAll),"rift-edge");
  assert.equal(localLightAt(map,0,0,visibleAll),null);
});

test("ART-097C1: torch placement is deterministic, local and never reads the fog",()=>{
  const sx=3,sy=0; // North wall borders a floor.
  let seed=null;
  for(let i=0;i<1000;i++){
    const candidate="nhal-qa-"+i;
    if(terrainHash(candidate,sx,sy)%13===0){seed=candidate;break;}
  }
  assert.ok(seed);
  assert.equal(sconceAt(map,sx,sy,visibleAll,seed),true);
  assert.equal(localLightAt(map,sx,sy,visibleAll,seed),"sconce");
  assert.equal(localLightAt(map,sx,sy,visibleAll,seed),"sconce");
  // The light is static: it never mutates map, RNG, or saved run.
  const before=JSON.stringify(map);
  assert.equal(sconceAt(map,sx,sy,visibleAll,seed),true);
  assert.equal(JSON.stringify(map),before);
  assert.equal(sconceAt(map,3,1,visibleAll,seed),false,"floor is not a sconce");
  const hidden=(x,y)=>!(x===sx&&y===sy);
  assert.equal(sconceAt(map,sx,sy,hidden,seed),false);
  assert.equal(localLightAt(map,sx,sy,hidden,seed),null);
  // The real visible Arche may still light this tile; only the torch is hidden.
  assert.equal(localLightAt(map,3,1,hidden,seed),"arch-edge");
  // A Proxy throws if the renderer tries to inspect ANY unseen map row.
  const sealed=new Proxy(map,{get(target,key,receiver){
    if(key==="0")throw Error("Hidden map row was read");
    return Reflect.get(target,key,receiver);
  }});
  const belowOnly=(x,y)=>y>0&&visibleAll(x,y);
  assert.equal(localLightAt(sealed,sx,0,belowOnly,seed),null);
  assert.equal(sconceAt(sealed,sx,0,belowOnly,seed),false);
  assert.equal(localLightAt(sealed,3,1,belowOnly,seed),"arch-edge");
});

test("ART-097C1: real torch SVG is original 24px, not an interactive object",()=>{
  assert.match(SCONCE_SVG,/viewBox="0 0 24 24" width="24" height="24"/);
  assert.match(SCONCE_SVG,/shape-rendering="crispEdges"/);
  assert.match(SCONCE_SVG,/data-decoration="wall-sconce"/);
  assert.match(SCONCE_SVG,/data-detail="ember-flame"/);
  assert.match(SCONCE_SVG,/<\/svg>$/);
  assert.doesNotMatch(SCONCE_SVG,/<(?:script|filter|animate|image|foreignObject|text)\b|(?:xlink:)?href\s*=/i);
  assert.ok(SCONCE_SPRITE.startsWith("data:image/svg+xml;charset=UTF-8,"));
  assert.equal(decodeURIComponent(SCONCE_SPRITE.split(",")[1]),SCONCE_SVG);
  const source=read("../docs/tiles.js");
  assert.match(source,/if\(!visible&&!remembered\)[\s\S]*?continue;/);
  assert.match(source,/const ambience=visible\?localLightAt\(map,x,y,visibleAt,artSeed\):null/);
  assert.match(source,/if\(visible&&ambience==="sconce"\)/);
  assert.match(source,/torch\.alt=""/);
  assert.match(source,/const enemy=visible\?enemyAt\(run,x,y\):null/);
  assert.doesNotMatch(source,/spriteId="torch"|spriteId="sconce"/);
});

test("ART-097C1: no animation cost, external asset, save change or touch obstruction",()=>{
  const css=read("../docs/art097c1.css");
  assert.match(css,/data-knowledge="visible"/);
  for(const key of ["sconce","sconce-edge","arch","arch-edge","rift","rift-edge"])
    assert.ok(css.includes("art097c-"+key));
  assert.match(css,/pointer-events:none/);
  assert.doesNotMatch(css,/@keyframes|animation:.*infinite|backdrop-filter|filter:blur|url\(https?:|@import|position:fixed/i);
  const html=read("../docs/index.html"),sw=read("../docs/sw.js");
  assert.match(html,/href="\.\/art097c1\.css\?v=1"/);
  assert.match(sw,/rogov-v0\.7f-art097c1-visible-light/);
  for(const asset of ["art097c1.css?v=1","nhal-lighting.js","terrain-art.js","tiles.js"]){
    assert.ok(sw.includes('"./'+asset+'"'),"Offline asset missing "+asset);
  }
  const state=beginRun(newGame(),[]).state,old=JSON.stringify(state);
  assert.equal(validateSave(state),true);
  localLightAt(state.run.map,state.run.x,state.run.y,visibleAll,
    state.run.layoutId||"legacy");
  assert.equal(JSON.stringify(state),old);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
});
