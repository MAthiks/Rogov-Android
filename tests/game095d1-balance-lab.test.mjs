// GAME-095D1: measure the EXISTING game, do not bake subjective goals
// or human success rates into green tests.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {execFileSync,spawnSync} from "node:child_process";
import {runBalanceLab,isolatedEncounter,runIsolatedDuel,LAB_POLICIES,
  BALANCE_LAB_VERSION,BALANCE_LAB_DEFAULT_COUNT}
  from "../tools/balance-lab.mjs";
import {beginRun,newGame,validateSave,SCHEMA_VERSION,SAVE_KEY,MAX_HP}
  from "../docs/game.js";

test("GAME-095D1: reproducible 3-floor survey of actual generated expeditions",()=>{
  const sample=runBalanceLab({start:2,count:5});
  const repeated=runBalanceLab({start:2,count:5});
  assert.deepEqual(sample,repeated);
  assert.equal(sample.labVersion,2);
  assert.equal(sample.expeditionSamples,5);
  assert.equal(sample.generatedFloors,15);
  assert.equal(sample.floors.length,3);
  assert.equal(sample.distinctLayouts>10,true);
  assert.equal(sample.bagOverflowIfCollectAll,5,
    "one sword plus 9 unopened chest rewards exceed 8 bag slots");
  for(const row of sample.floors){
    assert.equal(row.generated,5);
    assert.equal(row.routeBlocked,0);
    assert.equal(row.missingReturnPath,0);
    assert.equal(row.chests,15);
    assert.equal(row.bandageClose,5);
    assert.equal(row.encounterSlots,20);
    assert.equal(row.healingOptional+row.equipmentOptional,5);
    assert.ok(row.averageSafeRouteSteps>1);
    assert.ok(row.duelsSkipped>=0&&row.duelsSkipped<=row.encounterSlots);
  }
  assert.match(sample.model,/not human win rates/);
});

test("GAME-095D1: every profile is a real combat path with sound metrics",()=>{
  const sample=runBalanceLab({start:11,count:4});
  const names=Object.keys(sample.encounters);
  assert.ok(names.length>=12,"observed real combat scenarios across 3 floors");
  for(const id of names){
    const row=sample.encounters[id];
    assert.ok(row.fights>0&&row.fights<=8,id); // 4 seeds × up to 2 Guardians/Larvae
    assert.equal(row.wins+row.recalls+row.timeouts,row.fights,id);
    assert.ok(row.winRatePct>=0&&row.winRatePct<=100,id);
    assert.ok(row.avgHpLost>=0&&row.avgHpLost<=MAX_HP,id);
    assert.ok(row.avgTurns>=0&&row.avgTurns<=24,id);
    assert.ok(row.avgWaits>=0&&row.avgWaits<=24,id);
    assert.ok(row.avgEnduranceLeft>=0,id);
  }
  assert.deepEqual(LAB_POLICIES,["attack","telegraph_dodge"]);
  assert.equal(BALANCE_LAB_VERSION,2);
  assert.equal(BALANCE_LAB_DEFAULT_COUNT,100);
});

test("GAME-095D1: isolated duel does not mutate state or fake a reward",()=>{
  const seed=newGame();seed.meta.descents=14;
  const world=beginRun(seed,["weapon.rusty_sword"],null,{multiFloor:true}).state;
  assert.ok(validateSave(world));
  const enemy=world.run.enemies.find(e=>e.kind==="guardian");
  const duel=isolatedEncounter(world,enemy);
  assert.ok(duel,"guardian should permit a safe adjacent arena");
  assert.ok(validateSave(duel));
  const before=structuredClone(duel),original=structuredClone(world);
  const one=runIsolatedDuel(duel,"attack");
  assert.deepEqual(duel,before,"lab cannot mutate game scenario");
  assert.deepEqual(world,original,"lab cannot alter the real generated map");
  assert.deepEqual(runIsolatedDuel(duel,"attack"),one);
  assert.ok(["win","recall","timeout"].includes(one.outcome));
  assert.ok(one.actions<=24);
  const defensive=runIsolatedDuel(duel,"telegraph_dodge");
  assert.ok(["win","recall","timeout"].includes(defensive.outcome));
  assert.ok(defensive.actions<=24);
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  for(const opts of [{start:1,count:4},{start:2,count:0},{start:2,count:301},
    {start:2,count:1.3}])assert.throws(()=>runBalanceLab(opts),RangeError);
  assert.throws(()=>runIsolatedDuel(duel,"cheat"),RangeError);
});

test("GAME-095D1: analysis uses true engine and keeps PWA game unchanged",()=>{
  const src=readFileSync(new URL("../tools/balance-lab.mjs",import.meta.url),"utf8");
  const pkg=readFileSync(new URL("../package.json",import.meta.url),"utf8");
  assert.match(src,/attackTarget\(state\)/);
  assert.match(src,/defend\(state,"dodge"\)/);
  assert.match(src,/resolveFloorExit\(atExit,"descend"\)/);
  assert.match(src,/deepTwoReturnWays/);
  assert.match(src,/not human win rates/);
  assert.match(pkg,/tools\/balance-lab\.mjs/);
  assert.match(pkg,/tests\/game095d1-balance-lab\.test\.mjs/);
});

test("GAME-095D1: CLI accepts equals and separated arguments, JSON cannot be empty",()=>{
  const cli=new URL("../tools/balance-lab.mjs",import.meta.url);
  const run=args=>JSON.parse(execFileSync(process.execPath,
    [cli.pathname,...args],{encoding:"utf8",timeout:30000}));
  const a=run(["--count=2","--start=2"]);
  const b=run(["--count","2","--start","2"]);
  assert.deepEqual(a,b);
  assert.equal(a.expeditionSamples,2);
  assert.equal(a.generatedFloors,6);
  assert.equal(a.floors[0].encounterSlots,8);
  const bad=spawnSync(process.execPath,[cli.pathname,"--count","bad"],
    {encoding:"utf8",timeout:30000});
  assert.notEqual(bad.status,0);
});
