// ART-097A2 — high contrast stateful props. Draw only real map objects.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {INTERACTIVE_IDS,INTERACTIVE_SVGS,INTERACTIVE_SPRITES} from "../docs/interaction-art.js";
import {TILE_SPRITES} from "../docs/tiles.js";
import {newGame,beginRun,validateSave,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";

const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const prefix="data:image/svg+xml;charset=UTF-8,";
const detail=(svg,key)=>svg.includes('data-detail="'+key+'"');

test("ART-097A2: six interactive sprites gain unique high-contrast carvings",()=>{
  const checks={
    door_open:["door-ribbed-voussoirs","door-recessed-threshold"],
    door_closed:["door-iron-straps","door-ring-pull"],
    loot:["chest-gold-corners","chest-lock-glint"],
    chest_open:["chest-open-hinges","chest-void-recess"],
    exit:["arch-carved-stones","arch-rune-crown","arch-luminous-threshold"],
    hazard:["rift-branch-fractures","rift-ember-flecks"]
  };
  assert.equal(INTERACTIVE_IDS.length,15);
  assert.equal(new Set(INTERACTIVE_IDS).size,15);
  assert.equal(new Set(Object.values(INTERACTIVE_SVGS)).size,15);
  for(const [key,features] of Object.entries(checks)){
    const svg=INTERACTIVE_SVGS[key];
    for(const marker of features)assert.ok(detail(svg,marker),key+" missing "+marker);
    assert.match(svg,/viewBox="0 0 24 24" width="24" height="24"/);
    assert.match(svg,/shape-rendering="crispEdges"/);
    assert.match(svg,/<\/svg>$/);
    assert.doesNotMatch(svg,/<(?:image|script|foreignObject|animate|filter|text)\b|(?:xlink:)?href\s*=/i);
    assert.ok(INTERACTIVE_SPRITES[key].startsWith(prefix));
    assert.equal(decodeURIComponent(INTERACTIVE_SPRITES[key].slice(prefix.length)),svg);
    assert.equal(TILE_SPRITES[key],INTERACTIVE_SPRITES[key]);
    assert.ok(svg.length<2400,"24px art should remain lightweight: "+key);
  }
  assert.notEqual(INTERACTIVE_SVGS.door_closed,INTERACTIVE_SVGS.door_open);
  assert.notEqual(INTERACTIVE_SVGS.chest_open,INTERACTIVE_SVGS.loot);
  assert.notEqual(INTERACTIVE_SVGS.exit,INTERACTIVE_SVGS.hazard);
  assert.ok(!detail(INTERACTIVE_SVGS.door_open,"door-ring-pull"));
  assert.ok(!detail(INTERACTIVE_SVGS.chest_open,"chest-lock-glint"));
  assert.ok(!detail(INTERACTIVE_SVGS.hazard,"arch-rune-crown"));
});

test("ART-097A2: decoration never exposes hidden traps or maps",()=>{
  const tiles=read("../docs/tiles.js");
  assert.match(tiles,/if\(!visible&&!remembered\)[\s\S]*?continue;/);
  assert.match(tiles,/const enemy=visible\?enemyAt\(run,x,y\):null;/);
  assert.match(tiles,/else if\(visible&&trapAppearance\(run,x,y\)\)/);
  assert.match(tiles,/run\.collected\.includes\(x\+","\+y\)\?"chest_open":"loot"/);
  for(const id of ["trap_clue","trap_revealed","trap_disabled","trap_triggered"]){
    assert.ok(INTERACTIVE_IDS.includes(id));
    assert.doesNotMatch(INTERACTIVE_SVGS.trap_clue,/armed-trap-fangs|broken-spikes|spent-trap-empty-bed/);
  }
  const s=newGame();s.meta.descents=1;
  const state=beginRun(s,[]).state;
  const saved=JSON.stringify(state);
  for(const id of INTERACTIVE_IDS)assert.ok(TILE_SPRITES[id].startsWith(prefix));
  assert.equal(JSON.stringify(state),saved);
  assert.equal(validateSave(state),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
});

test("ART-097A2: offline cache includes actual interactive atlas",()=>{
  const sw=read("../docs/sw.js");
  assert.match(sw,/rogov-v0\.7f-art097a2-interactive-contrast/);
  assert.ok(sw.includes('"./interaction-art.js"'));
  assert.ok(sw.includes('"./tiles.js"'));
  assert.ok(sw.includes('"./terrain-art.js"'));
});
