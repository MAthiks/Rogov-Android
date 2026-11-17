import test from "node:test";
import assert from "node:assert/strict";
import {beginRun,newGame,waitTurn,move,defend,attackTarget,extract,
  normalizeJournal,validateSave} from "../docs/game.js";
import {selectTarget,currentEnemyIntent,combatSnapshot} from "../docs/combat.js";
import {guardianDecision,guardianIntent,guardianTactic,validEnemyTactic,
  GUARDIAN_TACTICS,GUARDIAN_HEAVY_BONUS} from "../docs/enemy-ai.js";
import {hitChance,nextRandom,defenseChance} from "../docs/combat-rules.js";
import {heroDerivedStats,enemyDerivedStats} from "../docs/stats.js";
import {readFileSync} from "node:fs";

const run=(eq=[])=>beginRun(newGame(),eq).state;
const engage=(eq=[])=>{
  let s=run(eq);
  s.run.enemies=[{id:"guardian-test",kind:"guardian",x:2,y:7,hp:5,tactic:"ready"}];
  s=selectTarget(s,"guardian-test").state;
  return s;
};
function findSeed(condition){
  for(let seed=0;seed<30000;seed++){
    let r=seed;const rolls=[];
    for(let i=0;i<4;i++){const next=nextRandom(r);rolls.push(next.roll);r=next.seed;}
    if(condition(rolls))return seed;
  }
  throw Error("No seed matches test condition");
}

test("DEV-073C: guardian state machine and forecast share the same contract",()=>{
  assert.deepEqual(GUARDIAN_TACTICS,["ready","winding","guarding"]);
  assert.equal(GUARDIAN_HEAVY_BONUS,1);
  for(const tactic of GUARDIAN_TACTICS)assert.ok(validEnemyTactic({kind:"guardian",tactic}));
  assert.equal(validEnemyTactic({kind:"guardian",tactic:"infinite"}),false);
  assert.equal(validEnemyTactic({kind:"charognard",tactic:"winding"}),false);
  assert.equal(guardianDecision({tactic:"ready"},1),"prepare");
  assert.equal(guardianDecision({tactic:"winding"},1),"heavy");
  assert.equal(guardianDecision({tactic:"guarding"},1),"prepare");
  assert.equal(guardianDecision({tactic:"winding"},2),"interrupt");
  assert.equal(guardianTactic({kind:"guardian"}),"legacy");
  assert.equal(guardianDecision({kind:"guardian"},1),"legacy_attack");
  assert.equal(guardianIntent({tactic:"guarding"},1).kind,"guardian_guard");
});

test("DEV-073C: first contact telegraphs rather than dealing instant damage",()=>{
  let s=engage();
  const firstSeed=s.run.rngState;
  const before=s.run.hp;
  assert.equal(currentEnemyIntent(s.run,s.run.enemies[0]).kind,"guardian_prepare");
  s=waitTurn(s).state;
  assert.equal(s.run.turns,1);
  assert.equal(s.run.hp,before);
  assert.equal(s.run.enemies[0].tactic,"winding");
  assert.equal(s.run.rngState,firstSeed);
  assert.equal(currentEnemyIntent(s.run,s.run.enemies[0]).kind,"guardian_heavy");
  assert.match(combatSnapshot(s).intent.label,/Coup lourd imminent/);
  assert.ok(s.journal.some(e=>e.type==="danger"&&e.text.includes("COUP LOURD")));
  assert.equal(validateSave(s),true);
});

test("DEV-073C: heavy strike hits next turn, then guardian raises guard",()=>{
  let s=engage();s.run.rngState=1;
  s=waitTurn(s).state; // preparation
  s=waitTurn(s).state; // hit 49, no critical 68
  assert.equal(s.run.hp,8); // heavy base 2+1 + force bonus 1
  assert.equal(s.run.enemies[0].tactic,"guarding");
  assert.equal(currentEnemyIntent(s.run,s.run.enemies[0]).kind,"guardian_guard");
  assert.ok(validateSave(s));
});

test("DEV-073C: dodging a telegraphed heavy strike genuinely avoids it",()=>{
  let s=engage();s.run.rngState=1;
  s=waitTurn(s).state;
  s=defend(s,"dodge").state;
  assert.equal(s.run.hp,12);
  assert.equal(s.run.turns,2);
  assert.equal(s.run.enemies[0].tactic,"guarding");
  assert.ok(s.journal.some(e=>e.text.includes("Esquive réussie")));
});

test("DEV-073C: failing to dodge does not magically erase the heavy",()=>{
  let s=engage();
  const def=heroDerivedStats(s),att=enemyDerivedStats(s.run.enemies[0]);
  const chance=defenseChance("dodge",def,att);
  const hit=hitChance(att,def);
  s.run.rngState=findSeed(r=>r[0]<=hit&&r[1]>att.criticalChance&&r[2]>chance);
  s=waitTurn(s).state;
  s=defend(s,"dodge").state;
  assert.equal(s.run.hp,8);
  assert.ok(s.journal.some(e=>e.text.includes("Défense échouée")));
});

test("DEV-073C: stepping out of CONTACT interrupts the charged attack",()=>{
  let s=engage();s.run.rngState=1;
  s=waitTurn(s).state;
  const rng=s.run.rngState;
  s=move(s,"up").state; // (1,6), no longer adjacent
  assert.equal(s.run.hp,12);
  assert.equal(s.run.enemies[0].tactic,"ready");
  assert.equal(s.run.rngState,rng);
  assert.ok(s.journal.some(e=>e.text.includes("interrompu")));
  assert.equal(currentEnemyIntent(s.run,s.run.enemies[0]).kind,"idle");
});

test("DEV-073C: an already armed guardian cancels if the target withdraws",()=>{
  let s=engage();s.run.enemies[0].tactic="winding";
  s.run.x=1;s.run.y=6;
  const next=currentEnemyIntent(s.run,s.run.enemies[0]);
  assert.equal(next.kind,"idle");
  assert.match(next.label,/interrompu/);
  s=waitTurn(s).state;
  assert.equal(s.run.enemies[0].tactic,"ready");
});

test("DEV-073C: guarded enemy has a seeded defensive chance using its equipment",()=>{
  let s=engage(["weapon.rusty_sword"]);
  s.run.enemies[0].tactic="guarding";
  const hero=heroDerivedStats(s),enemy=enemyDerivedStats(s.run.enemies[0]);
  const hit=hitChance(hero,enemy);
  const block=defenseChance("block",enemy,hero);
  s.run.rngState=findSeed(r=>r[0]<=hit&&r[1]>hero.criticalChance&&r[2]<=block);
  s=attackTarget(s).state;
  assert.equal(s.run.enemies[0].hp,4); // 3 sword -1 armor -1 guarded absorption
  assert.equal(s.run.enemies[0].tactic,"winding");
  assert.ok(s.journal.some(e=>e.text.includes("Garde du Gardien réussie")));
  assert.equal(s.run.hp,12); // the guardian prepares, but cannot strike immediately
});

test("DEV-073C: a failed high guard allows the full normal attack",()=>{
  let s=engage(["weapon.rusty_sword"]);
  s.run.enemies[0].tactic="guarding";
  const hero=heroDerivedStats(s),enemy=enemyDerivedStats(s.run.enemies[0]);
  const chance=defenseChance("block",enemy,hero);
  s.run.rngState=findSeed(r=>r[0]<=hitChance(hero,enemy)&&r[1]>hero.criticalChance&&r[2]>chance);
  s=attackTarget(s).state;
  assert.equal(s.run.enemies[0].hp,3); // 3 sword -1 armor, no shield reduction
  assert.ok(s.journal.some(e=>e.text.includes("Garde du Gardien échouée")));
});

test("DEV-073C: a missed hero attack does not secretly roll a guardian block",()=>{
  let s=engage(["weapon.rusty_sword"]);
  s.run.enemies[0].tactic="guarding";
  const hero=heroDerivedStats(s),enemy=enemyDerivedStats(s.run.enemies[0]);
  const seed=findSeed(r=>r[0]>hitChance(hero,enemy));
  s.run.rngState=seed;
  s=attackTarget(s).state;
  assert.equal(s.run.enemies[0].hp,5);
  assert.equal(s.run.rngState,nextRandom(seed).seed);
  assert.ok(s.journal.some(e=>e.text.includes("Tu manques")));
});

test("DEV-073C: the Charognard advertises its approach then contact bite",()=>{
  let s=run();
  s.run.enemies=[{id:"c",kind:"charognard",x:3,y:7,hp:3}];
  let e=s.run.enemies[0];
  assert.equal(currentEnemyIntent(s.run,e).kind,"approach");
  s=waitTurn(s).state;
  assert.equal(s.run.enemies[0].x,2);
  assert.equal(currentEnemyIntent(s.run,s.run.enemies[0]).kind,"melee");
});

test("DEV-073C: the Larva warning aligns with the actual third-turn pulse",()=>{
  let s=run();s.run.x=4;s.run.y=2;s.run.turns=2;s.run.rngState=1;
  s.run.enemies=[{id:"l",kind:"rift_larva",x:6,y:2,hp:4}];
  assert.equal(currentEnemyIntent(s.run,s.run.enemies[0]).kind,"rift_pulse");
  s=waitTurn(s).state;
  assert.equal(s.run.turns,3);
  assert.ok(s.journal.some(e=>e.text.includes("onde")));
});

test("DEV-073C: old saves gain ready guardian state without adding enemies",()=>{
  const s=engage(["weapon.rusty_sword"]);
  delete s.run.enemies[0].tactic;
  const before=JSON.stringify(s);
  assert.ok(validateSave(s));
  const after=normalizeJournal(s);
  assert.equal(JSON.stringify(s),before);
  assert.equal(after.run.enemies.length,1);
  assert.equal(after.run.enemies[0].tactic,"ready");
  assert.equal(after.run.rngState,s.run.rngState);
  assert.equal(after.run.endurance,s.run.endurance);
  assert.deepEqual(after.meta.stash,s.meta.stash);
  assert.ok(validateSave(after));
});

test("DEV-073C: paused windup survives saving and produces the same heavy hit",()=>{
  let s=engage(["weapon.rusty_sword"]);
  s.run.rngState=1;
  s=normalizeJournal(waitTurn(s).state);
  const restored=normalizeJournal(JSON.parse(JSON.stringify(s)));
  const one=defend(s,"block").state,two=defend(restored,"block").state;
  assert.deepEqual(one,two);
  assert.equal(one.run.enemies[0].tactic,"guarding");
});

test("DEV-073C: invalid guardian tactic is rejected without erasing the save",()=>{
  let s=engage();
  s.run.enemies[0].tactic="permanent_invulnerable";
  assert.equal(validateSave(s),false);
  s=run();s.run.enemies[0].tactic="guardian_guard";
  assert.equal(validateSave(s),false); // charognard never has sentinel stance
});

test("DEV-073C: lethal prepared attack still recalls and destroys only carried bag",()=>{
  let s=engage(["weapon.rusty_sword"]);
  s.run.rngState=1;s.run.hp=3;
  s=waitTurn(s).state;
  s=waitTurn(s).state;
  assert.equal(s.run,null);
  assert.equal(s.meta.recalls,1);
  assert.equal(s.meta.stash["weapon.rusty_sword"],0);
  assert.equal(s.meta.stash["consumable.bandage"],2);
  assert.equal(s.journal[0].type,"recall");
});

test("DEV-073C: extraction does not import enemy AI state into the hero",()=>{
  let s=engage(["weapon.rusty_sword"]);
  s.run.x=12;s.run.y=7;
  s.run.enemies[0].tactic="winding";
  s=extract(s).state;
  assert.equal(s.run,null);
  assert.equal(s.meta.stash["weapon.rusty_sword"],1);
  assert.equal(s.meta.extractions,1);
});

test("DEV-073C: Android UI exposes imminent warnings, guard and charge colors",()=>{
  const app=readFileSync(new URL("../docs/app.js",import.meta.url),"utf8");
  const html=readFileSync(new URL("../docs/index.html",import.meta.url),"utf8");
  const css=readFileSync(new URL("../docs/style.css",import.meta.url),"utf8");
  const sw=readFileSync(new URL("../docs/sw.js",import.meta.url),"utf8");
  assert.match(app,/function renderThreatForecast/);
  assert.match(app,/renderThreatForecast\(\)/);
  assert.match(app,/currentEnemyIntent\(run,enemy\)/);
  assert.match(html,/id="threat-forecast"/);
  assert.match(html,/aria-live="polite"/);
  assert.match(css,/guardian_heavy/);
  assert.match(css,/target-choice\.threat-imminent/);
  assert.match(sw,/rogov-v0\.7d/);
  assert.match(sw,/"\.\/enemy-ai\.js"/);
});
