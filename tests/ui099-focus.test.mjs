// UI/ART-099: structural contract for one-pass Android map focus.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {UI099_INFO_IDS} from "../docs/ui099.js";
import {TERRAIN_SVGS,TERRAIN_SPRITES,terrainSpriteAt,wallEdgeMask} from "../docs/terrain-art.js";
import {SAVE_KEY,SCHEMA_VERSION,beginRun,newGame,validateSave} from "../docs/game.js";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("UI-099: one original of each knowledge panel, and explicit native Menu container",()=>{
  assert.deepEqual(UI099_INFO_IDS,[
    "actor-stats-sheet","route-hint","inspect-panel",
    "exploration-map-panel","map-legend-details"
  ]);
  const html=read("../docs/index.html");
  const js=read("../docs/ui099.js");
  const app=read("../docs/app.js");
  for(const id of [...UI099_INFO_IDS,
    "ui099-extras","ui099-info-slot","ui099-feedback","ui099-status","ui099-inspect",
    "ui092-sheet","ui092-sheet-body","jump-menu","jump-combat","jump-bag","jump-journal"]){
    assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,
      "Unique existing or new element: "+id);
  }
  assert.match(html,/id="options-panel"[\s\S]*?id="ui099-extras"[\s\S]*?id="ui099-info-slot"/);
  assert.match(js,/node\.before\(home\)/);
  assert.match(js,/slot\.append\(item\.node\)/);
  assert.match(js,/item\.home\.after\(item\.node\)/);
  assert.match(js,/id==="actor-stats-sheet"&&!isRun\(\)/);
  assert.match(js,/get\("latest-message"\)\.textContent/);
  assert.match(js,/cell\?\.dataset\.knowledge!=="visible"/);
  assert.match(app,/import \{ setupUi099 \} from "\.\/ui099\.js"/);
  assert.match(app,/const ui099=setupUi099/);
  assert.match(app,/ui099\.sync\(\)/);
  assert.match(app,/ui099\.noteInspection\(cell\)/);
  assert.doesNotMatch(js,/\bcloneNode\b|\binnerHTML\b|localStorage|sessionStorage|Math\.random|fetch\(|setTimeout|setInterval|enemyAt|visibleCells|visionKey|\bmove\(|attackTarget/);
});

test("UI-099: portrait-only CSS reduces the long document and preserves native actions",()=>{
  const css=read("../docs/ui099.css");
  assert.match(css,/@media\(max-width:730px\)/);
  assert.match(css,/#expedition \.dungeon-wrap > #combat-dock/);
  assert.match(css,/#expedition \.dungeon-wrap > #bag-panel/);
  assert.match(css,/#expedition > #route-hint/);
  assert.match(css,/#action-panel/);
  assert.match(css,/#ui099-info-slot/);
  assert.match(css,/display:none!important/);
  assert.doesNotMatch(css,/#field-controls\s*\{|\.pixel-map\s*\{|\.dpad\s*\{|@keyframes|animation:.*infinite|@import|url\(\s*https?:|filter:blur/i,
    "Original map size, D-pad and static low-cost visuals remain");
  const html=read("../docs/index.html"),sw=read("../docs/sw.js");
  assert.match(html,/href="\.\/ui099\.css\?v=1"/);
  assert.match(sw,/"\.\/ui099\.js"/);
  assert.match(sw,/"\.\/ui099\.css\?v=1"/);
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-uiart099-[a-z0-9-]+"/);
});

test("ART-099: six quieter slabs, 48 real walls, 54 offline 24px SVGs unchanged",()=>{
  const floors=TERRAIN_SVGS.floor,walls=TERRAIN_SVGS.wall.flat();
  assert.equal(floors.length,6);assert.equal(walls.length,48);
  assert.equal(new Set([...floors,...walls]).size,54);
  for(const src of floors){
    assert.match(src,/data-detail="ui099-quiet-floor" opacity=".32"/);
    assert.match(src,/data-detail="ui099-soft-patina" opacity=".45"/);
    assert.match(src,/data-detail="floor-patina"/);
    assert.match(src,/data-detail="floor-beveled-masonry"/);
    assert.match(src,/data-detail="art097c2-floor-joint-hierarchy"/);
  }
  for(const src of walls){
    assert.match(src,/data-detail="ui099-wall-shadow-face"/);
    assert.match(src,/data-detail="ui099-wall-cap-outline"/);
    assert.match(src,/data-detail="art097c2-wall-face-depth"/);
  }
  for(const xml of [...floors,...walls]){
    assert.match(xml,/viewBox="0 0 24 24" width="24" height="24"/);
    assert.match(xml,/shape-rendering="crispEdges"/);
    assert.doesNotMatch(xml,/<(?:script|image|filter|animate|foreignObject|text)\b|(?:xlink:)?href\s*=/i);
  }
  for(const url of [...TERRAIN_SPRITES.floor,...TERRAIN_SPRITES.wall.flat()]){
    assert.match(url,/^data:image\/svg\+xml;charset=UTF-8,/);
  }
});

test("UI/ART-099: fog/seed and saved-run contract remain unchanged",()=>{
  const a=["#####","#.#.#","#####"],b=["#####","#.###","#####"];
  const known=(x,y)=>x===1&&y===1||x===2&&y===1;
  assert.equal(wallEdgeMask(a,2,1,known),wallEdgeMask(b,2,1,known));
  assert.equal(terrainSpriteAt(a,2,1,known,"99"),terrainSpriteAt(b,2,1,known,"99"));
  const state=newGame();state.meta.descents=1;
  const active=beginRun(state).state;
  const serialized=JSON.stringify(active);
  for(let y=0;y<active.run.map.length;y++)for(let x=0;x<active.run.map[y].length;x++)
    terrainSpriteAt(active.run.map,x,y,()=>true,active.run.layoutId);
  assert.equal(JSON.stringify(active),serialized);
  assert.equal(validateSave(active),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  const tiles=read("../docs/tiles.js");
  assert.match(tiles,/if\(!visible&&!remembered\)[\s\S]*?continue/);
  assert.match(tiles,/const enemy=visible\?enemyAt\(run,x,y\):null/);
});
