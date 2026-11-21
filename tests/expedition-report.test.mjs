import test from "node:test";
import assert from "node:assert/strict";
import {newGame,beginRun,validateSave,normalizeJournal} from "../docs/game.js";
import {expeditionReport} from "../docs/expedition-report.js";
import {visionKey,revealAround} from "../docs/exploration-visibility.js";
import {deepRoute} from "../docs/deep-dungeon.js";

const key=p=>p.x+","+p.y;
const fresh=()=>{
  const game=newGame();game.meta.descents=1;
  return beginRun(game).state;
};
function revealAll(run){
  run.exploration.seen=Array.from({length:run.map.length*run.map[0].length},(_,i)=>i);
}

test("DEV-088: refuge and tutorial remain unchanged",()=>{
  assert.deepEqual(expeditionReport(newGame()),{available:false});
  assert.deepEqual(expeditionReport(beginRun(newGame()).state),{available:false});
});

test("DEV-088: no exit or hidden-entity spoilers when starting a deep descent",()=>{
  const game=fresh();
  assert.ok(validateSave(game));
  const frozen=JSON.stringify(game);
  const report=expeditionReport(game);
  assert.equal(report.available,true);
  assert.equal(report.exitKnown,false);
  assert.equal(report.knownRoute,null);
  assert.equal(report.knownSites,0);
  assert.equal(report.knownChests,1,"Only entry chest visible to the player");
  assert.equal(report.fragments,0);
  assert.equal(JSON.stringify(game),frozen,"The field report must never modify the run");
});

test("DEV-088: spotted exit without a discovered route remains an unknown return",()=>{
  const state=fresh();
  state.run.enemies=[]; // Isolate the route advice from already visible entry threats.
  const exit=state.run.exit;
  const discovered=new Set(state.run.exploration.seen);
  discovered.add(visionKey(state.run,exit.x,exit.y));
  state.run.exploration.seen=[...discovered].sort((a,b)=>a-b);
  assert.ok(validateSave(state));
  const report=expeditionReport(state);
  assert.equal(report.exitKnown,true);
  assert.equal(report.knownRoute,null,
    "Knowledge of extraction does not imply a path through unseen rooms");
  assert.match(report.advice,/Aucune route/);
});

test("DEV-088: fully explored map has an indicative route and only public opportunities",()=>{
  const state=fresh();
  revealAll(state.run);
  assert.ok(validateSave(state));
  const before=JSON.stringify(state);
  const report=expeditionReport(state);
  assert.equal(report.exitKnown,true);
  assert.ok(report.knownRoute&&report.knownRoute.steps>0,
    "At least one observed route exists to extraction");
  assert.ok(report.knownRoute.closedDoors>=0);
  assert.equal(report.knownChests,3);
  assert.equal(report.knownSites,6);
  assert.equal(report.carried,0);
  assert.ok(report.secured>=1);
  assert.equal(JSON.stringify(state),before);
  // A chest and a special room can be completed without changing geometry.
  const marked=structuredClone(state);
  const [chest]=Object.keys(marked.run.loot);
  marked.run.collected.push(chest);
  marked.run.sites[0].status="resolved";
  marked.run.sites[0].choice="fragment";
  assert.ok(validateSave(marked));
  const changed=expeditionReport(marked);
  assert.equal(changed.knownChests,2);
  assert.equal(changed.knownSites,5);
  assert.ok(changed.knownRoute);
});

test("DEV-088: report is derived from real exposed inventory, never a fictional score",()=>{
  const state=fresh();
  revealAll(state.run);
  state.run.carried={"relic.ashen_fragment":2,"consumable.bandage":1};
  state.run.enemies=[]; // Isolate the inventory recommendation from visible combat threats.
  assert.ok(validateSave(state));
  const report=expeditionReport(state);
  assert.equal(report.carried,3);
  assert.equal(report.fragments,2);
  assert.equal(report.valuableWeapon,0);
  assert.match(report.advice,/matériel précieux/);
  const reloaded=normalizeJournal(JSON.parse(JSON.stringify(state)));
  assert.ok(validateSave(reloaded));
  assert.deepEqual(expeditionReport(reloaded),report,
    "Report is recreated from the save, no extra field or RNG stored");
  assert.equal(reloaded.run.turns,0);
});

test("DEV-088: critical HP and only visibly observed enemies affect the advice",()=>{
  const state=fresh();
  const report=expeditionReport(state);
  const invisible=state.run.enemies.find(e=>
    !state.run.exploration.seen.includes(visionKey(state.run,e.x,e.y)));
  assert.ok(invisible,"At least one enemy is initially undiscovered");
  const afterMove=structuredClone(state);
  const candidate=afterMove.run.enemies.find(e=>e.id===invisible.id);
  candidate.x=invisible.x;candidate.y=invisible.y;
  assert.equal(expeditionReport(afterMove).enemies,report.enemies);
  const wounded=structuredClone(state);
  wounded.run.hp=4;
  assert.match(expeditionReport(wounded).advice,/Blessures/);
  assert.equal(JSON.stringify(state),JSON.stringify(JSON.parse(JSON.stringify(state))),
    "No mutation from read-only report");
});

test("DEV-088: no fabricated route if known floor is disconnected",()=>{
  const state=fresh();
  revealAll(state.run);
  const exit=state.run.exit;
  const route=deepRoute(state.run.map,{x:state.run.x,y:state.run.y},exit);
  assert.ok(route?.length>3);
  const known=new Set([visionKey(state.run,state.run.x,state.run.y),
    visionKey(state.run,exit.x,exit.y)]);
  state.run.exploration.seen=[...known].sort((a,b)=>a-b);
  const report=expeditionReport(state);
  assert.equal(report.exitKnown,true);
  assert.equal(report.knownRoute,null);
});
