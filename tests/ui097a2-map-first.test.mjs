// UI-097A2 — original navigation and threat warning beneath the live map.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newGame,beginRun,validateSave,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("UI-097A2: reflows original DOM nodes without cloning, action dispatch or fog reads",()=>{
  const module=read("../docs/ui097a2.js");
  const app=read("../docs/app.js");
  const html=read("../docs/index.html");
  const css=read("../docs/ui097a2.css");
  assert.match(module,/ascii\.after\(warning,nav\)/);
  assert.match(module,/navHome\.after\(nav\)/);
  assert.match(module,/warningHome\.after\(warning\)/);
  assert.match(module,/win\.addEventListener\("resize",sync\)/);
  assert.match(module,/max-width: 730px/);
  assert.match(app,/import \{ setupUi097A2 \} from "\.\/ui097a2\.js"/);
  assert.match(app,/const ui097a2=setupUi097A2\(\{get:\$\}\)/);
  assert.match(html,/href="\.\/ui097a2\.css\?v=1"/);
  assert.match(css,/@media\(max-width:730px\)/);
  assert.match(css,/\.dungeon-wrap>\.expedition-shortcuts/);
  assert.match(css,/>#ui096-threat-banner/);
  assert.match(css,/position:relative;top:auto/);
  assert.doesNotMatch(module,/cloneNode|innerHTML|appendChild\(.*clone|Math\.random|run\.enemies|run\.traps|visibleCells|localStorage|save\(|\bmove\(|\battack\(/);
  for(const id of ["expedition-shortcuts","ui096-threat-banner","tile-map","dungeon-map",
    "jump-map","jump-combat","jump-action","jump-report","jump-bag","jump-journal",
    "field-controls","ui092-sheet","wait-btn","use-bandage","use-tonic"]){
    assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,id+" original must exist once");
  }
});

test("UI-097A2: preserves desktop restoration, six live handlers and offline cache",()=>{
  const css=read("../docs/ui097a2.css");
  const sw=read("../docs/sw.js");
  const module=read("../docs/ui097a2.js");
  assert.doesNotMatch(css,/@import|url\(\s*https?:|\.tile-hero\s*:before/);
  assert.match(css,/min-height:46px/);
  assert.match(css,/min-height:44px/);
  assert.match(module,/doc\.createComment/);
  assert.match(module,/navHome\.remove\(\)/);
  assert.match(module,/warningHome\.remove\(\)/);
  for(const file of ["ui097a2.js","ui097a2.css?v=1","ui092.js","ui096.js",
    "terrain-art.js","interaction-art.js"]){
    assert.ok(sw.includes('"./'+file+'"'),"Offline PWA asset missing "+file);
  }
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-ui097a2-map-first"/);
  const state=beginRun(newGame(),[]).state,before=JSON.stringify(state);
  assert.equal(validateSave(state),true);
  assert.equal(JSON.stringify(state),before);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
});
