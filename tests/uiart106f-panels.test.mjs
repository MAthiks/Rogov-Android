import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {UI092_PANEL_IDS} from "../docs/ui092.js";
import {UI099_INFO_IDS} from "../docs/ui099.js";
import {newGame,beginRun,validateSave,SAVE_KEY} from "../docs/game.js";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("UI/ART-106F: exact real panel IDs, no new controls or duplicate actor",()=>{
  const html=read("docs/index.html"),js=read("docs/ui092.js");
  const expected={
    "jump-combat":"combat-dock","jump-action":"interaction-dock",
    "jump-report":"expedition-report","jump-bag":"bag-panel",
    "jump-journal":"history-details","jump-menu":"options-panel"
  };
  assert.deepEqual(UI092_PANEL_IDS,expected);
  for(const id of Object.values(expected))
    assert.equal((html.match(new RegExp('id="'+id+'"',"g"))||[]).length,1);
  for(const id of ["ui092-sheet","ui092-sheet-title","ui092-sheet-body",
    "ui092-sheet-close","actor-stats-sheet","bag-items","target-choices",
    "journal","bag-equipped","bag-meter"]){
    assert.equal((html.match(new RegExp('id="'+id+'"',"g"))||[]).length,1,
      id+" must have exactly one real DOM node");
  }
  assert.ok(UI099_INFO_IDS.includes("actor-stats-sheet"));
  assert.match(js,/sheet\.dataset\.panel=id/);
  assert.match(js,/delete sheet\.dataset\.panel/);
  assert.match(js,/mount\.append\(node\)/);
  assert.match(js,/placeholder\.replaceWith\(activeNode\)/);
  assert.match(js,/get\("jump-map"\)/);
});

test("UI/ART-106F: real combat, item actions, character and journal all receive dedicated materials",()=>{
  const css=read("docs/uiart106f.css");
  const html=read("docs/index.html");
  for(const id of ["jump-combat","jump-bag","jump-journal","jump-menu","jump-action","jump-report"])
    assert.ok(css.includes('[data-panel="'+id+'"]'),id+" material tint");
  for(const id of ["#combat-attack","#bag-meter","#bag-equipped","#bag-items",
    "#history-details","#journal","#actor-stats-sheet","#combat-intent",
    "#ui092-sheet-body","#ui092-sheet-close"]){
    assert.ok(css.includes(id),id+" existing panel artwork");
  }
  assert.match(css,/min-height:44px/);
  assert.match(css,/--ui098b1-sheet-bottom/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/prefers-contrast:more/);
  assert.doesNotMatch(css,/\.pixel-tile[\s{:.#\[]/);
  assert.doesNotMatch(css,/https?:\/\/|@import|position\s*:\s*fixed/i);
  assert.ok(html.indexOf('uiart106f.css?v=1')>html.indexOf('uiart106e.css?v=1'));
  const sw=read("docs/sw.js");
  assert.match(sw,/uiart106f-panels/);
  assert.match(sw,/"\.\/uiart106f\.css\?v=1"/);
});

test("UI/ART-106F: CSS never advances turns or changes valid run data",()=>{
  const save=beginRun(newGame()).state;
  assert.equal(validateSave(save),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  const src=read("docs/uiart106f.css")+read("docs/ui092.js");
  assert.doesNotMatch(src,/Math\.random|localStorage|resolveStrike|attackTarget|move\(state/);
  assert.match(read("docs/ui092.js"),/isRun\(\)/);
  assert.equal(validateSave(save),true);
});
