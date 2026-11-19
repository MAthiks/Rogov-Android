// GAME-095D3 — verify scripted complete expeditions, not human success rates.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync,spawnSync} from "node:child_process";
import {runExpeditionTrial,runExpeditionAudit,ROUTE_POLICIES,
  EXPEDITION_AUDIT_VERSION,DEFAULT_TRIALS}
  from "../tools/expedition-audit.mjs";
import {SAVE_KEY,SCHEMA_VERSION,INVENTORY_LIMIT}
  from "../docs/game.js";

test("GAME-095D3: deterministic script uses real actions across seeds",()=>{
  const a=runExpeditionAudit({start:2,count:2,maxActions:180});
  const b=runExpeditionAudit({start:2,count:2,maxActions:180});
  assert.deepEqual(a,b);
  assert.equal(a.auditVersion,EXPEDITION_AUDIT_VERSION);
  assert.equal(a.expeditionSeeds,2);
  assert.equal(a.engineActionTrials,4);
  assert.equal(a.trials.length,4);
  assert.deepEqual(ROUTE_POLICIES,["exit_only","scavenge"]);
  assert.equal(DEFAULT_TRIALS,20);
  assert.match(a.model,/not human win rates/);
  for(const sample of a.trials){
    assert.ok(sample.actions>0);
    assert.ok(sample.actualTurns>=0);
    assert.ok(sample.steps>=0);
    assert.ok(sample.peakBag<=INVENTORY_LIMIT);
    assert.ok(sample.deepestFloor>=1&&sample.deepestFloor<=3);
    assert.ok(sample.damageTaken>=0&&sample.hpRestored>=0);
    assert.ok(sample.outcome==="recall"||sample.outcome==="extracted"||
      sample.outcome==="budget_exhausted"||sample.outcome==="route_blocked",
      "unexpected simulated engine failure: "+sample.outcome);
    if(sample.outcome==="extracted")assert.equal(sample.stashSecured,true);
    if(sample.outcome==="recall")assert.equal(sample.stashSecured,false);
  }
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(SAVE_KEY,"rogov-web-v1");
});

test("GAME-095D3: short action budget is honest and enforced",()=>{
  const x=runExpeditionTrial({seed:2,policy:"exit_only",maxActions:1});
  assert.equal(x.actions,1);
  assert.equal(x.outcome,"budget_exhausted");
  assert.ok(x.peakBag<=INVENTORY_LIMIT);
  assert.deepEqual(x,runExpeditionTrial({
    seed:2,policy:"exit_only",maxActions:1}));
  for(const config of [{seed:1,policy:"scavenge"},
    {seed:2,policy:"unknown"},{seed:2,policy:"exit_only",maxActions:0}])
    assert.throws(()=>runExpeditionTrial(config),RangeError);
  assert.throws(()=>runExpeditionAudit({start:2,count:101}),RangeError);
});

test("GAME-095D3: every action comes from real game functions",()=>{
  const src=readFileSync(new URL("../tools/expedition-audit.mjs",import.meta.url),"utf8");
  assert.match(src,/move\(state,direction\)/);
  assert.match(src,/toggleDoor\(state,next.x,next.y\)/);
  assert.match(src,/attackTarget\(state\)/);
  assert.match(src,/openChest\(state,destination.x,destination.y\)/);
  assert.match(src,/swapChestReward\(state,destination.x,destination.y,oldItem\)/);
  assert.match(src,/useItem\(state,item\)/);
  assert.match(src,/resolveFloorExit\(state,leave\?"extract":"descend"\)/);
  assert.match(src,/deepRoute/);
  assert.match(src,/not human win rates/);
  assert.doesNotMatch(src,/run\.x\s*=(?!=)/);
  assert.doesNotMatch(src,/run\.hp\s*=(?!=)/);
});

test("GAME-095D3: CLI reports valid deterministic JSON",()=>{
  const cli=new URL("../tools/expedition-audit.mjs",import.meta.url);
  const run=args=>JSON.parse(execFileSync(process.execPath,
    [cli.pathname,...args],{encoding:"utf8",timeout:30000}));
  const a=run(["--count=1","--start=2","--max-actions=15"]);
  const b=run(["--count","1","--start","2","--max-actions","15"]);
  assert.deepEqual(a,b);
  assert.equal(a.engineActionTrials,2);
  const bad=spawnSync(process.execPath,[cli.pathname,"--count=bad"],
    {encoding:"utf8",timeout:30000});
  assert.notEqual(bad.status,0);
});
