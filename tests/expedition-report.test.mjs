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
