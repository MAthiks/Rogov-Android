import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ITEMS,SCHEMA_VERSION,SAVE_KEY,newGame,beginRun,validateSave} from "../docs/game.js";
import {ITEM_ART_IDS} from "../docs/veyr-art.js";
import {ART103C_ITEM_IDS,ITEM_SVGS_103C,ITEM_SPRITES_103C,ITEM_MATERIAL_103C} from "../docs/item-art103c.js";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const html=read("docs/index.html");
const css=read("docs/art103c.css");
const sw=read("docs/sw.js");
const app=read("docs/app.js");
const model=read("docs/item-art103c.js");

test("ART-103C: exactly the 11 real save-compatible items receive individual crisp artwork",()=>{
  assert.deepEqual([...ART103C_ITEM_IDS].sort(),Object.keys(ITEMS).sort());
  assert.deepEqual([...ART103C_ITEM_IDS],ITEM_ART_IDS);
  assert.deepEqual(Object.keys(ITEM_SVGS_103C).sort(),Object.keys(ITEMS).sort());
  for(const id of ART103C_ITEM_IDS){
    const svg=ITEM_SVGS_103C[id];
    assert.match(svg,/shape-rendering="crispEdges"/,id);
    assert.match(svg,/viewBox="0 0 24 24"/,id);
    assert.match(svg,/data-art="art103c-material-details"/,id);
    assert.match(svg,/^<svg/,id);
    assert.match(svg,/<\/svg>$/,id);
    assert.ok(ITEM_SPRITES_103C[id].startsWith("data:image/svg+xml;charset=UTF-8,"),id);
    assert.equal(decodeURIComponent(ITEM_SPRITES_103C[id].split(",")[1]),svg,id);
    assert.equal(ITEM_MATERIAL_103C[id],id.split(".")[0],id);
    assert.doesNotMatch(svg.replace('xmlns="http://www.w3.org/2000/svg"',""),
      /https?:\/\/|<script\b|<foreignObject\b|onload\s*=/i,id);
  }
  assert.equal(Object.isFrozen(ITEM_SPRITES_103C),true);
  assert.equal(Object.isFrozen(ITEM_SVGS_103C),true);
  assert.doesNotMatch(model,/localStorage|document\.|window\.|Math\.random|\bfetch\(/);
});

test("ART-103C: real four-slot layout and item flags remain read-only presentation",()=>{
  assert.match(app,/import \{ITEM_SPRITES_103C as ITEM_SPRITES,ITEM_MATERIAL_103C\}/);
  assert.match(app,/\["mainHand","ARME"\],\["offHand","SECONDAIRE"\],\["body","ARMURE"\],\["relic","RELIQUE"\]/);
  assert.match(app,/line\.dataset\.equipped=item\?"true":"false"/);
  assert.match(app,/row\.dataset\.itemId=id/);
  assert.match(app,/row\.dataset\.equipped=state\.run&&Object\.values\(state\.run\.loadout\|\|\{\}\)/);
  assert.match(app,/line\.append\(icon,caption\)/);
  assert.match(app,/bagActions\(row,id,count\)/);
  assert.match(css,/#bag-equipped \.art103c-slot\[data-equipped="true"\]/);
  assert.match(css,/#bag-items \.item-row\[data-equipped="true"\]/);
  for(const id of ["bag-equipped","bag-items","stash-items","bag-panel","refuge","start-btn"])
    assert.equal(html.split('id="'+id+'"').length-1,1,id);
});

test("ART-103C: Android layouts and offline PWA include all new materials",()=>{
  const former=html.indexOf('href="./art103b.css?v=1"');
  const newer=html.indexOf('href="./art103c.css?v=1"');
  assert.ok(former>=0&&newer>former);
  assert.equal(html.match(/href="\.\/art103c\.css\?v=1"/g)?.length,1);
  assert.ok(sw.includes('"./art103c.css?v=1"'));
  assert.ok(sw.includes('"./item-art103c.js"'));
  assert.match(sw,/ui102-veyr-hub-ui103a-four-screen-art-art103b-scenery-art103c-items/);
  assert.match(css,/@media\(max-width:370px\)/);
  assert.match(css,/@media\(max-width:350px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/min-height:44px/);
  assert.doesNotMatch(css,/@import|https?:\/\//);
  assert.doesNotMatch(css,/#tile-map\s*\{|#field-controls\s*\{|#ui092-sheet\s*\{/);
});

test("ART-103C: saved games and original loadout rules remain unchanged",()=>{
  const before=newGame();
  const snapshot=JSON.stringify(before);
  const after=beginRun(before,{"weapon.rusty_sword":1,"consumable.bandage":2},
    null,{multiFloor:true});
  assert.equal(after.changed,true);
  assert.ok(validateSave(after.state));
  assert.equal(after.state.run.carried["consumable.bandage"],2);
  assert.equal(after.state.run.carried["weapon.rusty_sword"],1);
  assert.equal(after.state.run.loadout.mainHand,"weapon.rusty_sword");
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(JSON.stringify(before),snapshot);
});
