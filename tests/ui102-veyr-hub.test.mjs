import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {refugeDashboard,REFUGE_BAG_CAPACITY} from "../docs/refuge-dashboard.js";
import {newGame,beginRun,validateSave,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";
const read=file=>readFileSync(new URL("../docs/"+file,import.meta.url),"utf8");

test("UI-102: only reads existing stash/selection and never mutates save state",()=>{
  assert.equal(REFUGE_BAG_CAPACITY,8);
  const game=newGame();
  const original=JSON.stringify(game);
  const stash={...game.meta.stash,"relic.ashen_fragment":3};
  const carried={"consumable.bandage":2,"weapon.rusty_sword":1};
  const beforeStash=JSON.stringify(stash),beforeCarried=JSON.stringify(carried);
  const d=refugeDashboard(stash,carried,{bestDepth:2,maxDepth:3});
  assert.equal(d.fragments,3);
  assert.equal(d.packedUnits,3);
  assert.equal(d.securedUnits,Object.values(stash).reduce((a,b)=>a+b,0));
  assert.equal(d.canDepart,true);
  assert.equal(d.depthLabel,"2 / 3");
  assert.equal(refugeDashboard(stash,{"consumable.bandage":9}).canDepart,false);
  assert.equal(refugeDashboard({},{},{maxDepth:3}).depthLabel,"— / 3");
  assert.equal(JSON.stringify(stash),beforeStash);
  assert.equal(JSON.stringify(carried),beforeCarried);
  assert.equal(JSON.stringify(game),original);
  assert.ok(validateSave(game));
  assert.ok(validateSave(beginRun(game).state));
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
});

test("UI-102: one real refuge, one departure, original forge, bag and character",()=>{
  const html=read("index.html"),app=read("app.js");
  const unique=["refuge","refuge-preparation","stash-items","refuge-prep-meter",
    "prep-mainHand","prep-offHand","prep-body","forge-blade","forge-bandages",
    "forge-fragments","refuge-character-slot","actor-stats-sheet","echo-dossier-refuge",
    "start-btn","refuge-clear-preparation","veyr-stash-total","veyr-fragment-total",
    "veyr-depth-total","veyr-start-state","veyr-nav-prep","veyr-nav-forge",
    "veyr-nav-echoes","veyr-nav-character"];
  for(const id of unique)assert.equal(html.split('id="'+id+'"').length-1,1,id);
  for(const destination of ["prepare","forge","echoes","character"])
    assert.match(html,new RegExp('data-refuge-go="'+destination+'"'));
  const order=["id=\"refuge-quick-nav\"","id=\"refuge-preparation\"",
    "id=\"veyr-forge\"","id=\"refuge-character-slot\"",
    "id=\"echo-dossier-refuge\""];
  for(let i=1;i<order.length;i++)assert.ok(html.indexOf(order[i-1])<html.indexOf(order[i]));
  assert.match(app,/refugeDashboard\(state\.meta\.stash,carried/);
  assert.match(app,/resetPreparation\(\); \/\/ Only clears ephemeral selection/);
  assert.match(app,/act\(beginRun\(state,preparationCounts\(\),preparedChoice\(\),\{multiFloor:true\}\)\)/);
  assert.match(app,/act\(craftAtRefuge\(state,button\.dataset\.recipe\)\)/);
});

test("UI-102: offline Android assets, safe viewport, reduced motion and no external content",()=>{
  const sw=read("sw.js"),html=read("index.html"),css=read("ui102.css");
  assert.match(html,/href="\.\/ui102\.css\?v=1"/);
  for(const asset of ['"./ui102.css?v=1"','"./refuge-dashboard.js"'])
    assert.ok(sw.includes(asset),"offline asset "+asset);
  assert.match(sw,/ui102-veyr-hub/);
  assert.match(css,/\.veyr-overview/);
  assert.match(css,/\.veyr-hero/);
  assert.match(css,/min-height:6[0-9]px/);
  assert.match(css,/env\(safe-area-inset-bottom\)/);
  assert.match(css,/@media\(max-width:350px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.doesNotMatch(css,/@import|https?:\/\/|position:sticky.*#start-btn/);
  const model=read("refuge-dashboard.js");
  assert.doesNotMatch(model,/localStorage|Math\.random|\bfetch\(|\bcraft\(|\bmove\(|\.push\(/);
});
