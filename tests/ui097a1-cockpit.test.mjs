// UI-097A1: original presentational cockpit, no new game state or fake actions.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newGame,beginRun,validateSave,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";

const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("UI-097A1: original expedition brand and frieze belong to the live HUD",()=>{
  const html=read("../docs/index.html");
  const css=read("../docs/ui097a.css");
  const frieze=read("../docs/ui097-nhal-frieze.svg");
  assert.match(html,/href="\.\/ui097a\.css\?v=1"/);
  assert.match(html,/class="ui097-brand" aria-hidden="true">ROGOV<\/span>/);
  assert.match(html,/id="exp-title">Profondeurs de Nhal<\/h2>/);
  assert.match(html,/id="floor-depth">1 \/ 3<\/strong>/);
  assert.match(html,/id="turns">0<\/strong>/);
  assert.match(css,/@media\(max-width:730px\)/);
  assert.match(css,/ui097-nhal-frieze\.svg/);
  assert.match(css,/\.frame\.is-expedition/);
  assert.match(frieze,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(frieze,/viewBox="0 0 960 160"/);
  assert.doesNotMatch(frieze,/<(?:script|foreignObject|image|animate)\b|(?:xlink:)?href\s*=/i);
  assert.doesNotMatch(css,/@import|url\(\s*https?:/i);
});

test("UI-097A1: all existing real controls, map and danger text remain unique",()=>{
  const html=read("../docs/index.html");
  const ids=[
    "hp","turns","bag-count","floor-hud","floor-depth",
    "health-state","health-meter","endurance-state","endurance-meter","threat-state",
    "ui096-threat-banner","tile-map","dungeon-map","renderer-toggle",
    "jump-map","jump-combat","jump-action","jump-bag","jump-report","jump-journal",
    "jump-menu","field-controls","wait-btn","use-bandage","use-tonic","ui092-sheet"
  ];
  for(const id of ids){
    assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,
      "Existing interactive/display ID must remain unique: "+id);
  }
  const css=read("../docs/ui097a.css");
  assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css,/#threat-state/);
  assert.match(css,/#ui096-threat-banner\[data-urgent="true"\]/);
  assert.match(css,/\.pixel-map/);
  assert.doesNotMatch(css,/\.tile-hero:before|pointer-events:\s*none[^}]*#tile-map/i);
  assert.doesNotMatch(css,/(?:\.dpad|#field-controls|\.field-quick-actions)\s+button\s*\{[^}]*?(?:min-height|height):\s*(?:[1-3][0-9])px/i);
  // Existing touchscreen accessibility rules are authoritative in ui092/096.
  assert.match(read("../docs/ui092.css"),/min-height:44px/);
  assert.match(read("../docs/ui096.css"),/min-height:46px/);
});

test("UI-097A1: all presentation assets are offline, saves and fog logic untouched",()=>{
  const sw=read("../docs/sw.js");
  for(const path of ["ui097a.css?v=1","ui097-nhal-frieze.svg",
    "tiles.js","terrain-art.js","interaction-art.js"]){
    assert.ok(sw.includes('"./'+path+'"'),"Precache required: "+path);
  }
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-ui097a1-nhal-cockpit"/);
  const tiles=read("../docs/tiles.js");
  assert.match(tiles,/if\(!visible&&!remembered\)[\s\S]*?continue;/);
  const state=beginRun(newGame(),[]).state;
  const before=JSON.stringify(state);
  assert.equal(validateSave(state),true);
  assert.equal(JSON.stringify(state),before);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
});
