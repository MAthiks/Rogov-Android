import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  MAP,ITEMS,newGame,beginRun,move,recall,extract,validateSave,
  normalizeJournal,attackTarget,waitTurn
} from "../docs/game.js";
import {selectTarget,currentEnemyIntent} from "../docs/combat.js";

const SAFE_EXTRACT_ROUTE=["up","right","right",...Array(9).fill("right"),"down"];
const start=(state=newGame(),gear=[])=>beginRun(state,gear).state;

function safeLootExtract(state,gear=[]){
  let s=start(state,gear);
  const startHp=s.run.hp;
  let peakThreat=0;
  for(const [i,direction] of SAFE_EXTRACT_ROUTE.entries()){
    const before=s.run?.turns;
    const result=move(s,direction);
    assert.equal(result.changed,true,"safe route step "+i+" must succeed");
    s=result.state;
    if(s.run){
      assert.equal(s.run.turns,before+1,"step "+i+" spends one turn");
      assert.equal(s.run.hp,startHp,"safe route step "+i+" does not hurt hero");
      peakThreat=Math.max(peakThreat,startHp-s.run.hp);
    }
  }
  assert.equal(s.run,null,"safe route ends in a successful extraction");
  assert.equal(s.journal[0].type,"extraction");
  return {state:s,damageTaken:peakThreat};
}

test("QA-074: two consecutive runs have exactly the same geometry, spawns and loot",()=>{
  let s=start();
  const first={map:MAP.slice(),enemies:s.run.enemies.map(e=>[e.kind,e.x,e.y]),
    bag:s.run.collected.slice(),hp:s.run.hp};
  s=recall(s).state;
  s=start(s);
  const second={map:MAP.slice(),enemies:s.run.enemies.map(e=>[e.kind,e.x,e.y]),
    bag:s.run.collected.slice(),hp:s.run.hp};
  assert.deepEqual(second,first);
  assert.notEqual(s.run.rngState,undefined);
  // This is an objective *quality gap*, not a success criterion:
  // RNG affects combat rolls but does not generate layout/spawns/loot.
});

test("QA-074: three consecutive risk-free relic extractions are mechanically identical",()=>{
  let state=newGame();
  for(let i=1;i<=3;i++){
    const {state:after,damageTaken}=safeLootExtract(state);
    state=after;
    assert.equal(damageTaken,0);
    assert.equal(state.meta.extractions,i);
    assert.equal(state.meta.recalls,0);
    assert.equal(state.meta.hero.xp,i*3); // One loot XP + two extraction XP.
    assert.equal(state.meta.stash["relic.ashen_fragment"],i);
    assert.equal(state.meta.stash["weapon.rusty_sword"],1);
    assert.ok(validateSave(state));
  }
});

test("QA-074: carrying the starting sword is not necessary for the fixed safe extraction",()=>{
  const without=safeLootExtract(newGame()).state;
  const withSword=safeLootExtract(newGame(),["weapon.rusty_sword"]).state;
  assert.equal(without.meta.hero.xp,3);
  assert.equal(withSword.meta.hero.xp,3);
  assert.equal(without.meta.stash["relic.ashen_fragment"],1);
  assert.equal(withSword.meta.stash["relic.ashen_fragment"],1);
  assert.equal(withSword.meta.stash["weapon.rusty_sword"],1);
  assert.equal(withSword.meta.recalls,0);
});

test("QA-074: extracted fragment has no available usage rule or equipment profile yet",()=>{
  const gameSource=readFileSync(new URL("../docs/game.js",import.meta.url),"utf8");
  const statsSource=readFileSync(new URL("../docs/stats.js",import.meta.url),"utf8");
  assert.equal(ITEMS["relic.ashen_fragment"].type,"Relique");
  assert.match(gameSource,/"relic\.ashen_fragment"/);
  assert.doesNotMatch(statsSource,/"relic\.ashen_fragment"\s*:/);
  assert.match(gameSource,/HEALING_ITEMS/);
  assert.match(gameSource,/export function useItem/);
  // Important: this test documents the current lack of a use case; it
  // deliberately does not treat the gap as an 8/10 acceptance pass.
});

test("QA-074: failure after carrying earned loot loses the bag, not the hero/stash",()=>{
  let s=start();
  for(const direction of ["up","right","right"]){s=move(s,direction).state;}
  assert.equal(s.run.carried["relic.ashen_fragment"],1);
  assert.equal(s.meta.hero.xp,1);
  s=recall(s).state;
  assert.equal(s.run,null);
  assert.equal(s.meta.recalls,1);
  assert.equal(s.meta.hero.xp,1);
  assert.equal(s.meta.stash["relic.ashen_fragment"]||0,0);
  assert.equal(s.meta.stash["weapon.rusty_sword"],1);
  assert.ok(validateSave(s));
});

test("QA-074: legacy no-attributes no-enemies run can resume without retroactive enemies",()=>{
  const original=start();
  original.run.enemies=undefined;
  delete original.meta.hero.attributes;
  delete original.meta.hero.classId;
  delete original.run.rngState;
  delete original.run.loadout;
  delete original.run.endurance;
  delete original.run.enduranceMax;
  assert.ok(validateSave(original));
  const migrated=normalizeJournal(JSON.parse(JSON.stringify(original)));
  assert.deepEqual(migrated.run.enemies,[]);
  assert.equal(migrated.run.x,original.run.x);
  assert.equal(migrated.run.hp,original.run.hp);
  assert.equal(migrated.meta.hero.xp,original.meta.hero.xp);
  assert.ok(validateSave(migrated));
});

test("QA-074: selection is harmless and the guardian heavy must be telegraphed",()=>{
  let s=start(newGame(),["weapon.rusty_sword"]);
  s.run.x=10;s.run.y=2;
  const guardian=s.run.enemies.find(e=>e.kind==="guardian");
  const originalHp=s.run.hp,turn=s.run.turns;
  s=selectTarget(s,guardian.id).state;
  assert.equal(s.run.hp,originalHp);
  assert.equal(s.run.turns,turn);
  assert.equal(currentEnemyIntent(s.run,guardian).kind,"guardian_prepare");
  s=waitTurn(s).state;
  assert.equal(s.run.hp,originalHp);
  assert.equal(currentEnemyIntent(s.run,guardian).kind,"guardian_heavy");
});

test("QA-074: retreating from a prepared guardian preserves the option to extract",()=>{
  let s=start(newGame(),["weapon.rusty_sword"]);
  s.run.x=10;s.run.y=2;
  const guardian=s.run.enemies.find(e=>e.kind==="guardian");
  s=selectTarget(s,guardian.id).state;
  s=waitTurn(s).state;
  const hp=s.run.hp;
  s=move(s,"left").state;
  assert.equal(s.run.hp,hp);
  assert.equal(s.run.enemies.find(e=>e.id===guardian.id).tactic,"ready");
  assert.ok(validateSave(s));
});

test("QA-074: multiple runs retain distinct seeded combat RNG while preserving a fixed map",()=>{
  let s=start();
  const seed1=s.run.rngState;
  s=recall(s).state;
  s=start(s);
  const seed2=s.run.rngState;
  assert.notEqual(seed1,seed2);
  assert.deepEqual(s.run.enemies.map(e=>[e.kind,e.x,e.y]),
    start().run.enemies.map(e=>[e.kind,e.x,e.y]));
});

test("QA-074: PWA has explicit touch controls and a cached game engine",()=>{
  const html=readFileSync(new URL("../docs/index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../docs/app.js",import.meta.url),"utf8");
  const sw=readFileSync(new URL("../docs/sw.js",import.meta.url),"utf8");
  for(const id of ["title-screen","combat-panel","combat-attack","combat-parry",
    "combat-block","combat-dodge","combat-retreat","threat-forecast"])
    assert.ok(html.includes('id="'+id+'"'),id);
  assert.match(app,/touchstart/);
  assert.match(app,/touchend/);
  assert.match(sw,/"\.\/enemy-ai\.js"/);
  assert.match(sw,/rogov-v0\.7d/);
  // Presence of elements is NOT a viewport/ergonomic test on a real Samsung.
});
