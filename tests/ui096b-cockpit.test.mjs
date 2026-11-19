import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {syncUi096Threat} from "../docs/ui096.js";
import {newGame,beginRun,validateSave,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";

const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");

function projected({isRun=true,forecast="",forecastHidden=true,hostiles="AUCUNE MENACE VISIBLE",threat="clear"}={}){
  const banner={hidden:true,dataset:{urgent:"false"},textContent:""};
  const nodes={
    "ui096-threat-banner":banner,
    "threat-forecast":{hidden:forecastHidden,textContent:forecast},
    "threat-state":{textContent:hostiles,dataset:{threat}}
  };
  syncUi096Threat({get:id=>nodes[id],isRun});
  return banner;
}

test("UI-096B: no warning when hidden fog or no visible hostile",()=>{
  assert.deepEqual(projected(),{hidden:true,dataset:{urgent:"false"},textContent:""});
  assert.deepEqual(projected({
    forecast:"⚠ MENACES AU PROCHAIN TOUR — Gardien : Coup lourd",forecastHidden:true,
    hostiles:"AUCUNE MENACE VISIBLE",threat:"clear"
  }),{hidden:true,dataset:{urgent:"false"},textContent:""});
  assert.equal(projected({isRun:false,forecast:"DANGER",forecastHidden:false,
    hostiles:"2 HOSTILES VISIBLES",threat:"danger"}).hidden,true);
});

test("UI-096B: visible pressure and imminent combat intent are copied unchanged",()=>{
  const nearby=projected({hostiles:"2 HOSTILES VISIBLES",threat:"danger"});
  assert.equal(nearby.hidden,false);
  assert.equal(nearby.dataset.urgent,"false");
  assert.equal(nearby.textContent,"⚠ 2 HOSTILES VISIBLES");
  const exact="⚠ MENACES AU PROCHAIN TOUR — Gardien : Coup lourd annoncé";
  const imminent=projected({forecast:exact,forecastHidden:false,
    hostiles:"1 HOSTILE VISIBLE",threat:"danger"});
  assert.equal(imminent.hidden,false);
  assert.equal(imminent.dataset.urgent,"true");
  assert.equal(imminent.textContent,exact);
});

test("UI-096B: Android stylesheet and existing cockpit/actions are linked safely",()=>{
  const html=read("../docs/index.html");
  const css=read("../docs/ui096.css");
  const sw=read("../docs/sw.js");
  const app=read("../docs/app.js");
  assert.match(html,/href="\.\/ui096\.css\?v=1"/);
  assert.match(html,/id="ui096-threat-banner"[^>]*hidden/);
  assert.match(sw,/"\.\/ui096\.js"/);
  assert.match(sw,/"\.\/ui096\.css\?v=1"/);
  assert.match(app,/import \{ syncUi096Threat \} from "\.\/ui096\.js"/);
  assert.match(app,/syncUi096Threat\(\{get:\$,isRun:Boolean\(run\)\}\)/);
  assert.match(css,/@media\(max-width:730px\)/);
  assert.match(css,/\.frame\.is-expedition \.pixel-map\s*\{[\s\S]*?43dvh/);
  assert.match(css,/max-height:760px[\s\S]*?30dvh/);
  assert.match(css,/min-height:46px/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.doesNotMatch(css,/@import|url\(\s*https?:|\.tile-hero:before/);
  for(const id of ["jump-map","jump-combat","jump-action","jump-report","jump-bag",
    "jump-journal","field-controls","wait-btn","use-bandage","use-tonic"]){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  const controller=read("../docs/ui096.js");
  assert.doesNotMatch(controller,
    /localStorage|sessionStorage|Math\.random|run\.enemies|explorationState|visibleCells|\bmove\(|attackTarget\(|getComputedStyle|fetch\(/);
});

test("UI-096B: cosmetic warning never mutates a game save, action or turn",()=>{
  const game=beginRun(newGame(),[]).state;
  const before=JSON.stringify(game);
  projected({isRun:true,hostiles:"1 HOSTILE VISIBLE",threat:"danger"});
  assert.equal(JSON.stringify(game),before);
  assert.equal(game.run.turns,0);
  assert.equal(validateSave(game),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
});
