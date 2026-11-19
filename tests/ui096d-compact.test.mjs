// UI-096D — protect the UI-only visual corrections from screenshots.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {syncUi096Threat} from "../docs/ui096.js";
import {SAVE_KEY,SCHEMA_VERSION,newGame,beginRun,validateSave} from "../docs/game.js";

const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

const render=({forecastHidden=true,forecastText="",visibleText="1 HOSTILE VISIBLE",isRun=true}={})=>{
  const nodes={
    "ui096-threat-banner":{hidden:false,dataset:{urgent:"false"},textContent:""},
    "threat-forecast":{hidden:forecastHidden,textContent:forecastText},
    "threat-state":{dataset:{threat:"danger"},textContent:visibleText}
  };
  syncUi096Threat({get:id=>nodes[id],isRun});
  return nodes["ui096-threat-banner"];
};

test("UI-096D: a visible enemy only occupies the existing HUD, not a second banner",()=>{
  const onlyCount=render();
  assert.equal(onlyCount.hidden,true);
  assert.equal(onlyCount.textContent,"");
  assert.equal(onlyCount.dataset.urgent,"false");
  const urgent=render({forecastHidden:false,
    forecastText:"⚠ MENACES AU PROCHAIN TOUR — Gardien : Coup lourd imminent"});
  assert.equal(urgent.hidden,false);
  assert.equal(urgent.dataset.urgent,"true");
  assert.match(urgent.textContent,/Coup lourd imminent/);
  assert.equal(render({isRun:false,forecastHidden:false,forecastText:"test"}).hidden,true);
});

test("UI-096D: new mobile CSS restores map size without shrinking touch targets",()=>{
  const css=read("../docs/ui096d.css");
  const html=read("../docs/index.html");
  const sw=read("../docs/sw.js");
  assert.match(css,/@media\(max-width:730px\) and \(max-height:760px\)/);
  assert.match(css,/calc\(100dvh - 420px\)/);
  assert.match(css,/:has\(#ui096-threat-banner:not\(\[hidden\]\)\)/);
  assert.match(css,/calc\(100dvh - 462px\)/);
  assert.doesNotMatch(css,/#field-controls\s*\{|\.dpad button\s*\{\s*(?:height|min-height|width):/);
  assert.match(css,/\.frame\.is-refuge \.hero-bar\s*\{[\s\S]*?repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css,/\.masthead-left \.subtitle\{display:none\}/);
  assert.match(css,/::-webkit-progress-value/);
  assert.match(html,/<link rel="stylesheet" href="\.\/ui096d\.css\?v=1">/);
  assert.match(html,/EXTRACTION ROGUELIKE — WEB ALPHA 0\.7f/);
  assert.doesNotMatch(html,/EXTRACTION ROGUELIKE — WEB ALPHA 0\.6\.1/);
  // Later artwork batches may rotate the offline cache without removing UI-096D.
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-[a-z0-9-]+"/);
  assert.match(sw,/"\.\/ui096d\.css\?v=1"/);
  assert.doesNotMatch(css,/@import|url\(\s*https?:/);
});

test("UI-096D: presentational warnings cannot mutate persistent saves or turns",()=>{
  const state=beginRun(newGame()).state;
  const before=JSON.stringify(state);
  render();
  render({forecastHidden:false,forecastText:"Danger imminent"});
  assert.equal(JSON.stringify(state),before);
  assert.equal(state.run.turns,0);
  assert.equal(validateSave(state),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
});
