import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newGame,beginRun,validateSave,SAVE_KEY,SCHEMA_VERSION,MAX_HP} from "../docs/game.js";
import {heroDerivedStats} from "../docs/stats.js";
import {characterPresentation,CHARACTER103D_METRICS} from "../docs/character-art103d.js";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const html=read("docs/index.html");
const css=read("docs/art103d.css");
const js=read("docs/app.js");
const sw=read("docs/sw.js");
const portrait=read("docs/art103d-sprite-c-portrait.svg");

test("ART-103D: original Sprite C portrait is local, inert, crisp and hooded",()=>{
  assert.match(portrait,/<svg\s/);
  assert.match(portrait,/viewBox="0 0 96 112"/);
  assert.match(portrait,/shape-rendering="crispEdges"/);
  assert.match(portrait,/Sprite C/);
  const body=portrait.replace('xmlns="http://www.w3.org/2000/svg"',"");
  assert.doesNotMatch(body,/https?:\/\/|<script\b|<foreignObject\b|<image\b|onload\s*=|(?:xlink:)?href\s*=/i);
  assert.ok(portrait.length>2000&&portrait.length<30000);
  assert.match(html,/src="\.\/art103d-sprite-c-portrait\.svg"/);
});

test("ART-103D: current refuge state yields real level, XP and no fictional vitals",()=>{
  const state=newGame();
  const saved=JSON.stringify(state);
  const model=characterPresentation(state,heroDerivedStats(state));
  assert.equal(model.name,"L'Égaré");
  assert.equal(model.level,1);
  assert.equal(model.xpProgress,0);
  assert.equal(model.xpGoal,5);
  assert.equal(model.xpCaption,"0 / 5 XP vers niveau 2");
  assert.equal(model.location,"Veyr · refuge");
  assert.equal(model.health,"Hors expédition");
  assert.equal(model.endurance,"Hors expédition");
  assert.equal(model.metrics.length,6);
  assert.deepEqual(model.metrics.map(x=>x.key),[
    "enduranceMax","criticalChance","dodgeChance","parryChance","blockChance","armor"
  ]);
  assert.deepEqual(model.metrics.map(x=>x.label),
    CHARACTER103D_METRICS.map(x=>x.label));
  assert.equal(Object.isFrozen(model),true);
  assert.equal(JSON.stringify(state),saved,"Presentation cannot mutate game state");
  assert.equal(validateSave(state),true);
});

test("ART-103D: Nhal renders real saved HP / END and level XP without new state fields",()=>{
  const s=newGame();
  s.meta.hero.xp=7;s.meta.hero.level=2;
  const started=beginRun(s,["weapon.rusty_sword"]).state;
  assert.equal(validateSave(started),true);
  const snapshot=JSON.stringify(started);
  const view=characterPresentation(started,heroDerivedStats(started));
  assert.equal(view.level,2);
  assert.equal(view.xpProgress,2);
  assert.equal(view.xpCaption,"2 / 5 XP vers niveau 3");
  assert.equal(view.location,"Nhal · expédition");
  assert.equal(view.health,started.run.hp+" / "+MAX_HP+" PV");
  assert.equal(view.endurance,started.run.endurance+" / "+
    (started.run.enduranceMax??heroDerivedStats(started).enduranceMax)+" END");
  assert.equal(view.metrics.find(x=>x.key==="armor").value,
    String(heroDerivedStats(started).armor));
  assert.equal(JSON.stringify(started),snapshot);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
});

test("ART-103D: shared real sheet is unique and renders only six genuine combat metrics",()=>{
  for(const id of ["actor-stats-sheet","actor-stat-values","actor-derived-values",
    "actor-class-label","actor103d-portrait","actor103d-name","actor103d-level",
    "actor103d-location","actor103d-xp-meter","actor103d-xp-label",
    "actor103d-health","actor103d-endurance","actor103d-derived-grid"]){
    assert.equal(html.split('id="'+id+'"').length-1,1,"unique shared actor ID: "+id);
  }
  assert.match(js,/import \{characterPresentation\} from "\.\/character-art103d\.js"/);
  assert.match(js,/const visual=characterPresentation\(state,profile\)/);
  assert.match(js,/visual\.metrics/);
  assert.match(js,/grid\.replaceChildren\(\)/);
  assert.match(js,/renderActorStats\(\);\s*ui096c\.sync\(\)/);
  assert.match(html,/État mental : système non simulé dans cette version/);
  assert.doesNotMatch(read("docs/character-art103d.js"),
    /localStorage|sessionStorage|document\.|window\.|Math\.random|\bfetch\(/);
});

test("ART-103D: Android safe layouts and new image cached for offline WebView",()=>{
  const previous=html.indexOf('href="./art103c.css?v=1"');
  const current=html.indexOf('href="./art103d.css?v=1"');
  assert.ok(previous>=0&&current>previous);
  assert.equal(html.match(/href="\.\/art103d\.css\?v=1"/g)?.length,1);
  for(const name of ["art103d.css?v=1","character-art103d.js",
    "art103d-sprite-c-portrait.svg"])
    assert.ok(sw.includes('"./'+name+'"'),"Missing offline asset: "+name);
  assert.match(sw,/art103c-items-art103d-character/);
  assert.match(css,/@media\(max-width:730px\)/);
  assert.match(css,/@media\(max-width:390px\)/);
  assert.match(css,/@media\(max-width:350px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/pointer-events:none/);
  assert.doesNotMatch(css,/#tile-map\s*\{|#field-controls\s*\{|#ui092-sheet\s*\{/);
  assert.doesNotMatch(css,/@import|https?:\/\//);
});
