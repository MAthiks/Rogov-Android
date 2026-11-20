import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {UI092_PANEL_IDS} from "../docs/ui092.js";
import {newGame,beginRun,validateSave,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";
const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");

test("UI-092A: mobile navigation controls map to existing game panels, no invented actions",()=>{
  assert.deepEqual(UI092_PANEL_IDS,{
    "jump-combat":"combat-dock",
    "jump-action":"interaction-dock",
    "jump-report":"expedition-report",
    "jump-bag":"bag-panel",
    "jump-journal":"history-details",
    "jump-menu":"options-panel"
  });
  const html=read("../docs/index.html");
  for(const id of ["jump-map",...Object.keys(UI092_PANEL_IDS),"field-controls",
      "wait-btn","use-bandage","use-tonic","ui092-sheet","ui092-sheet-close"]){
    assert.match(html,new RegExp('id="'+id+'"'),"Missing original button "+id);
  }
  assert.match(html,/id="ui092-sheet-body"/);
  assert.match(html,/<nav id="expedition-shortcuts"/);
});

test("UI-092A: moving existing element nodes does not clone listeners, save state or spend turns",()=>{
  const src=read("../docs/ui092.js");
  assert.match(src,/node\.before\(placeholder\)/);
  assert.match(src,/mount\.append\(node\)/);
  assert.match(src,/placeholder\.replaceWith\(activeNode\)/);
  assert.match(src,/sheet\.hidden=false/);
  assert.match(src,/event\.key==="Escape"/);
  assert.match(src,/ResizeObserver/);
  assert.doesNotMatch(src,/cloneNode|innerHTML|localStorage|sessionStorage|fetch\(|Math\.random|\bmove\(|attackTarget\(|toggleDoor\(|JSON\.stringify/);
  const state=beginRun(newGame(),[]).state;
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(validateSave(state),true);
  assert.equal(state.run.turns,0);
});

test("UI-092A: only active mobile expeditions get a persistent movement/health dock",()=>{
  const css=read("../docs/ui092.css");
  assert.match(css,/@media\(max-width:730px\)/);
  assert.match(css,/\.frame\.is-expedition #field-controls\s*\{[\s\S]*?position:fixed/);
  assert.match(css,/\.frame\.is-expedition \.pixel-map\s*\{[\s\S]*?42dvh/);
  assert.match(css,/\.frame\.is-expedition \.field-quick-actions button\s*\{[\s\S]*?min-height:50px/);
  assert.match(css,/\.frame\.is-expedition \.ui092-sheet\s*\{[\s\S]*?position:fixed/);
  assert.match(css,/bottom:calc\(var\(--ui092-dock-height\) - 1px\)/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(css,/\.frame\.is-expedition \.expedition-shortcuts/);
  assert.doesNotMatch(css,/\.frame:has|@import|url\(\s*https?:/);
});

test("UI-092A: controller included in offline PWA and not coupled to private fog data",()=>{
  const sw=read("../docs/sw.js"),html=read("../docs/index.html"),
    app=read("../docs/app.js");
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-[a-z0-9-]+"/,
    "La PWA doit conserver un cache versionné pour les correctifs UI");
  assert.match(sw,/"\.\/ui092\.js"/);
  assert.match(sw,/"\.\/ui092\.css\?v=2"/);
  assert.match(html,/href="\.\/ui092\.css\?v=2"/);
  assert.match(app,/import \{ setupUi092 \} from "\.\/ui092\.js"/);
  assert.match(app,/const ui092=setupUi092/);
  assert.match(app,/ui092\.sync\(\)/);
  assert.match(app,/ui092\.close\(\)/);
  const module=read("../docs/ui092.js");
  assert.doesNotMatch(module,/visibleCells|visionKey|enemyAt|run\.enemies|run\.secrets|run\.traps/);
});

test("UI-098B1: only the mobile drawer geometry and scrolling change",()=>{
  const css=read("../docs/ui098b1.css");
  const controller=read("../docs/ui092.js");
  const html=read("../docs/index.html");
  const sw=read("../docs/sw.js");
  assert.match(html,/href="\.\/ui098b1\.css\?v=1"/);
  assert.match(sw,/"\.\/ui098b1\.css\?v=1"/);
  assert.match(sw,/rogov-v0\.7f-ui098b1-sheet-clearance/);
  assert.match(css,/@media \(max-width:730px\)/);
  assert.match(css,/--ui098b1-sheet-bottom/);
  assert.match(css,/overflow-y:auto/);
  assert.match(css,/min-height:0/);
  assert.match(css,/z-index:78/);
  assert.match(controller,/window\.innerHeight-dock\.top/);
  assert.match(controller,/ResizeObserver\(measure\)/);
  assert.match(controller,/visualViewport\?\.addEventListener\("resize",measure\)/);
  assert.match(controller,/mount\.scrollTop=0/);
  assert.doesNotMatch(css,/url\(\s*https?:|\.tile-hero\s*:before|\.pixel-tile/);
  assert.doesNotMatch(controller,/localStorage|JSON\.stringify|\bmove\(|\battackTarget\(|cloneNode/);
  const state=beginRun(newGame(),[]).state;
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(validateSave(state),true);
});
