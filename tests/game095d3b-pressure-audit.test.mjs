// GAME-095D3B — concurrent enemy pressure, not human success rates.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {pressureSnapshot,emptyPressure,notePressure,PRESSURE_AUDIT_VERSION}
  from "../tools/pressure-audit.mjs";
import {runExpeditionTrial,runExpeditionAudit,EXPEDITION_AUDIT_VERSION}
  from "../tools/expedition-audit.mjs";
import {newGame,beginRun,SCHEMA_VERSION,SAVE_KEY} from "../docs/game.js";

function roomRun(){
  return {
    x:2,y:2,turns:1,
    map:[".....",".....",".....",".....","....."],
    rooms:[{x:0,y:0,width:5,height:5}],
    doors:[],exploration:{seen:[]},
    enemies:[
      {id:"c",kind:"charognard",x:1,y:2,hp:4},
      {id:"g",kind:"guardian",x:3,y:2,hp:5,tactic:"winding"}
    ]
  };
}

test("GAME-095D3B: two visible contact enemies generate two real attack forecasts",()=>{
  const run=roomRun(),copy=structuredClone(run);
  const snapshot=pressureSnapshot(run);
  assert.deepEqual(snapshot,{visible:2,contact:2,nearby:2,imminent:2,
    guardianHeavy:1,charognardLunge:0,riftPulse:0});
  assert.deepEqual(run,copy,"observer cannot mutate game state");
  const s=emptyPressure();
  notePressure(s,snapshot,{kind:"heal",hpBefore:10,hpAfter:7});
  assert.equal(s.observedTurns,1);
  assert.equal(s.multipleNearbyTurns,1);
  assert.equal(s.multipleContactTurns,1);
  assert.equal(s.simultaneousImminentTurns,1);
  assert.equal(s.damageDuringMultipleNearby,3);
  assert.equal(s.damageDuringImminent,3);
  assert.equal(s.healingUnderContact,1);
  notePressure(s,snapshot,{kind:"swap",hpBefore:7,hpAfter:7});
  assert.equal(s.chestActionsNearEnemies,1);
  assert.equal(s.peakNearby,2);
  assert.equal(s.observedTurns,2);
  assert.equal(PRESSURE_AUDIT_VERSION,1);
});

test("GAME-095D3B: closed walls and fog must never disclose remembered threats",()=>{
  const run=roomRun();
  run.enemies=[{id:"far",kind:"charognard",x:4,y:2,hp:4}];
  run.map[2]="...#."; // barrier at x=3; hero remains on floor x=2
  // A known/remembered enemy tile is not live sight.
  run.exploration.seen=[14];
  assert.equal(pressureSnapshot(run).visible,0);
  assert.equal(pressureSnapshot(run).imminent,0);
  run.rooms=null;run.exploration=null; // Legacy no-fog saves remain supported.
  assert.equal(pressureSnapshot(run).visible,1);
  assert.equal(pressureSnapshot(null).visible,0);
  run.enemies[0].hp=0;
  assert.equal(pressureSnapshot(run).visible,0);
});

test("GAME-095D3B: complete engine-action trials retain depth-separated exposure",()=>{
  for(const policy of ["exit_only","scavenge"]){
    const run=runExpeditionTrial({seed:2,policy,maxActions:440});
    const again=runExpeditionTrial({seed:2,policy,maxActions:440});
    assert.deepEqual(run,again);
    assert.equal(run.pressureByFloor.length,3);
    assert.equal(run.deepestFloor,3);
    assert.equal(run.outcome,"extracted");
    const total=run.pressureByFloor.reduce((n,f)=>n+f.observedTurns,0);
    assert.equal(total,run.actualTurns,"one observation per REAL spent turn");
    for(const floor of run.pressureByFloor){
      assert.ok(floor.observedTurns>0);
      assert.ok(floor.visibleTurns<=floor.observedTurns);
      assert.ok(floor.contactTurns<=floor.nearbyTurns);
      assert.ok(floor.multipleNearbyTurns<=floor.nearbyTurns);
      assert.ok(floor.multipleContactTurns<=floor.contactTurns);
      assert.ok(floor.simultaneousImminentTurns<=floor.imminentTurns);
      assert.ok(floor.imminentTurns<=floor.visibleTurns);
    }
  }
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  const initial=newGame();initial.meta.descents=1;
  const active=beginRun(initial,["weapon.rusty_sword"],null,{multiFloor:true});
  assert.equal(active.changed,true);
  assert.equal(active.state.run.pressureByFloor,undefined,
    "audit metrics must NEVER enter the saved game");
});

test("GAME-095D3B: aggregate is reproducible and does not invent extra fights",()=>{
  const a=runExpeditionAudit({start:2,count:2,maxActions:440});
  assert.deepEqual(a,runExpeditionAudit({start:2,count:2,maxActions:440}));
  assert.equal(a.auditVersion,EXPEDITION_AUDIT_VERSION);
  assert.equal(a.auditVersion,2);
  assert.equal(a.engineActionTrials,4);
  for(const policy of ["exit_only","scavenge"]){
    const summary=a.policies[policy];
    const total=a.trials.filter(t=>t.policy===policy).reduce((n,t)=>n+
      t.pressureByFloor.reduce((m,f)=>m+f.observedTurns,0),0);
    assert.equal(summary.byFloor.reduce((n,f)=>n+f.observedTurns,0),total);
    assert.ok(summary.avgThreatenedTurns>=0);
    assert.ok(summary.avgMultipleNearbyTurns>=0);
    assert.ok(summary.avgSimultaneousImminentTurns>=0);
  }
  assert.match(a.model,/visible threats/);
  assert.match(a.model,/not human win rates/);
  const source=readFileSync(new URL("../tools/expedition-audit.mjs",import.meta.url),"utf8");
  assert.match(source,/notePressure\(ledger,pressureSnapshot\(prev\)/);
  assert.doesNotMatch(source,/run\.hp\s*=(?!=)/);
});
