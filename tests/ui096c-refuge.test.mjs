import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newGame,beginRun,validateSave,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";
import {heroDerivedStats} from "../docs/stats.js";
import {REFUGE_DESTINATIONS} from "../docs/ui096c.js";

const read=path=>readFileSync(new URL(path,import.meta.url),"utf8");

test("UI-096C: Veyr navigation targets existing game sections without duplicate handlers",()=>{
  const html=read("../docs/index.html");
  assert.deepEqual(Object.keys(REFUGE_DESTINATIONS),
    ["prepare","forge","echoes","character"]);
  for(const [button,id] of Object.entries(REFUGE_DESTINATIONS)){
    assert.match(html,new RegExp('data-refuge-go="'+button+'"'));
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  for(const id of ["stash-items","prep-mainHand","prep-offHand","prep-body",
    "start-btn","forge-blade","forge-bandages","forge-fragments","actor-stats-sheet",
    "actor-stat-values","bag-panel","bag-items","bag-equipped"]){
    assert.equal(html.split('id="'+id+'"').length-1,1,
      "Reuse exactly one working game DOM element: "+id);
  }
  assert.match(html,/id="refuge-prep-meter" max="8"/);
  assert.match(html,/Coffre sécurisé/);
  assert.match(html,/Conservé à Veyr/);
  assert.match(html,/Sac de descente · butin exposé/);
});

test("UI-096C: existing character profile is valid at refuge and expedition without a save change",()=>{
  const refuge=newGame();
  assert.ok(heroDerivedStats(refuge));
  const original=JSON.stringify(refuge);
  const stats=heroDerivedStats(refuge);
  assert.equal(stats.attributes.strength,5);
  assert.equal(JSON.stringify(refuge),original);
  assert.equal(validateSave(refuge),true);
  const game=beginRun(refuge).state;
  assert.ok(heroDerivedStats(game));
  assert.equal(validateSave(game),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
});

test("UI-096C: cosmetic controller only moves the original sheet and scrolls existing elements",()=>{
  const code=read("../docs/ui096c.js");
  const app=read("../docs/app.js");
  assert.match(code,/sheet\.before\(expeditionAnchor\)/);
  assert.match(code,/refugeSlot\.append\(sheet\)/);
  assert.match(code,/expeditionAnchor\.after\(sheet\)/);
  assert.match(code,/details\.open=true/);
  assert.match(code,/button\.addEventListener\("click",\(\)=>activate\(button\)\)/);
  assert.match(app,/import \{ setupUi096C \} from "\.\/ui096c\.js"/);
  assert.match(app,/const ui096c=setupUi096C\(/);
  assert.match(app,/renderActorStats\(\);\s*ui096c\.sync\(\)/);
  assert.match(app,/"refuge-prep-meter"\)\.value=Math\.min\(8,total\)/);
  assert.doesNotMatch(code,/localStorage|fetch\(|save|Math\.random|\bmove\(|\battack\(|\bcraft\(/i);
});

test("UI-096C: offline original refuge illustration and CSS are packaged",()=>{
  const sw=read("../docs/sw.js");
  const html=read("../docs/index.html");
  const css=read("../docs/ui096c.css");
  const svg=read("../docs/veyr-refuge-banner.svg");
  for(const file of ["ui096c.js","ui096c.css?v=1","veyr-refuge-banner.svg"])
    assert.ok(sw.includes('"./'+file+'"'),"PWA should precache "+file);
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-[a-z0-9-]+"/);
  assert.match(html,/href="\.\/ui096c\.css\?v=1"/);
  assert.match(svg,/viewBox="0 0 240 72"/);
  assert.match(svg,/shape-rendering="crispEdges"/);
  assert.doesNotMatch(svg,/<(?:script|foreignObject|image)\b|(?:xlink:)?href\s*=/i);
  assert.match(css,/url\("\.\/veyr-refuge-banner\.svg"\)/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(css,/\.frame\.is-refuge #start-btn\{/);
  assert.match(css,/\.frame\.is-expedition #bag-panel\{/);
  assert.doesNotMatch(css,/@import|https?:\/\//);
});
