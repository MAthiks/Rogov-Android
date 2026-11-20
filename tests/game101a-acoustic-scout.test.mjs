// GAME-101A — Listening is a tactical turn, never a free fog radar.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {acousticReading,LISTEN_ENDURANCE_COST,SOUND_RANGE} from "../docs/acoustics.js";
import {newGame,beginRun,listenForThreats,validateSave,normalizeJournal,
  SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";
import {visibleCells,visionKey} from "../docs/exploration-visibility.js";

const fixture=()=>({
  x:2,y:3,rooms:[{}],exploration:{seen:[]},
  map:["#########","#...#...#","#...#...#","#...+...#",
    "#...#...#","#...#...#","#########"],
  doors:[{x:4,y:3,open:false}],
  enemies:[{id:"do-not-expose-guardian",kind:"guardian",x:6,y:3,hp:5}]
});
const deep=()=>{
  const s=newGame();s.meta.descents=1;
  return beginRun(s).state;
};
const source=path=>readFileSync(new URL(path,import.meta.url),"utf8");

test("GAME-101A: sound traverses shut doors at a cost but solid walls block it",()=>{
  const run=fixture(),enemy=run.enemies[0];
  assert.equal(visibleCells(run).has(visionKey(run,enemy.x,enemy.y)),false);
  const report=acousticReading(run);
  assert.match(report,/ÉCOUTE.*l'est/);
  assert.match(report,/galeries proches/);
  for(const privateDetail of ["guardian","6,3","do-not-expose"])
    assert.equal(report.includes(privateDetail),false,"no precise hidden data");
  run.map=run.map.map(row=>row.replace("+","#"));
  assert.match(acousticReading(run),/Aucun mouvement distinct/);
});
test("GAME-101A: already visible foes are not reported as hidden",()=>{
  const run=fixture();
  run.doors[0].open=true;
  assert.equal(visibleCells(run).has(visionKey(run,6,3)),true);
  assert.match(acousticReading(run),/Aucun mouvement distinct/);
});
test("GAME-101A: multiple unseen threats stay vague, no exact count or identity",()=>{
  const run=fixture();
  run.enemies.push({id:"larva-secret",kind:"rift_larva",x:6,y:5,hp:4});
  const report=acousticReading(run);
  assert.match(report,/Des bruits étouffés/);
  assert.doesNotMatch(report,/2|larva|gardien|larve|\(6,|cases/);
  assert.equal(SOUND_RANGE,8);
});
test("GAME-101A: 1 genuine turn and 2 END, no loot, RNG or map revelations",()=>{
  const initial=deep();
  initial.run.enemies=[];
  assert.equal(validateSave(initial),true);
  const json=JSON.stringify(initial),run=initial.run;
  const result=listenForThreats(initial);
  assert.equal(result.changed,true);
  assert.equal(JSON.stringify(initial),json,"game action must not mutate input");
  assert.equal(result.state.run.turns,run.turns+1);
  assert.equal(result.state.run.endurance,run.endurance-LISTEN_ENDURANCE_COST);
  assert.equal(result.state.run.rngState,run.rngState);
  assert.deepEqual(result.state.run.map,run.map);
  assert.deepEqual(result.state.run.exploration.seen,run.exploration.seen);
  assert.deepEqual(result.state.run.carried,run.carried);
  assert.match(result.message,/ÉCOUTE/);
  assert.ok(result.state.journal.some(e=>e.text===result.message));
  assert.equal(validateSave(result.state),true);
  assert.equal(validateSave(normalizeJournal(JSON.parse(JSON.stringify(result.state)))),true);
});
test("GAME-101A: cannot listen without enough END, or during legacy tutorial",()=>{
  const state=deep();
  state.run.endurance=1;
  const json=JSON.stringify(state);
  const denied=listenForThreats(state);
  assert.equal(denied.changed,false);
  assert.equal(JSON.stringify(state),json);
  assert.match(denied.message,/Endurance/);
  const legacy=beginRun(newGame()).state;
  assert.equal(listenForThreats(legacy).changed,false);
  assert.equal(acousticReading(legacy.run),null);
});
test("GAME-101A: no save migration, no extra sprites, original mobile/PWA entry points",()=>{
  const html=source("../docs/index.html"),app=source("../docs/app.js"),
    sw=source("../docs/sw.js"),css=source("../docs/game101.css");
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  assert.ok(html.includes('id="listen-btn"'));
  assert.ok(html.includes('id="game101-listen-result"'));
  assert.ok(app.includes('listenForThreats(state)'));
  assert.ok(sw.includes('"./acoustics.js"'));
  assert.ok(sw.includes('"./game101.css?v=1"'));
  assert.ok(css.includes("min-height:44px"));
});
