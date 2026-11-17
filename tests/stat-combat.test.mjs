import test from "node:test";
import assert from "node:assert/strict";
import {beginRun,newGame,normalizeJournal,validateSave,move,waitTurn,
  attackTarget,defend,extract,recall} from "../docs/game.js";
import {selectTarget} from "../docs/combat.js";
import {heroDerivedStats,enemyDerivedStats,ENEMY_STATS,DEFAULT_HERO_STATS,deriveStats} from "../docs/stats.js";
import {descentSeed,nextRandom,validSeed,hitChance,damageFromStats,defenseChance,
  resolveStrike,resolveActiveDefense,TACTICAL_COSTS} from "../docs/combat-rules.js";

const expedition=(gear=[])=>beginRun(newGame(),gear).state;
function guardian(s,hp=5){
  s.run.enemies=[{id:"g",kind:"guardian",x:2,y:7,hp}];
  return selectTarget(s,"g").state;
}
function rolls(seed,count=4){
  let cursor=seed,result=[];
  for(let i=0;i<count;i++){const r=nextRandom(cursor);result.push(r.roll);cursor=r.seed;}
  return result;
}
function findSeed(test){
  for(let i=0;i<50000;i++)if(test(rolls(i,6)))return i;
  throw new Error("No deterministic test seed matches the requested pattern");
}

test("DEV-073B: RNG is stable, full-width, bounded and does not use Math.random",()=>{
  const s=descentSeed(1);
  assert.ok(validSeed(s));
  assert.notEqual(s,descentSeed(2));
  assert.deepEqual(nextRandom(s),nextRandom(s));
  assert.ok(nextRandom(s).roll>=1&&nextRandom(s).roll<=100);
  assert.ok(validSeed(0));
  assert.ok(validSeed(4294967295));
  assert.equal(validSeed(-1),false);
  assert.equal(validSeed(4294967296),false);
  assert.equal(validSeed(1.5),false);
  assert.throws(()=>nextRandom(-1));
});

test("DEV-073B: hit/crit/armor depend on both actor stat blocks",()=>{
  const hero=deriveStats(DEFAULT_HERO_STATS,{mainHand:"weapon.rusty_sword"});
  const bare=deriveStats(DEFAULT_HERO_STATS);
  const guardianStats=deriveStats(ENEMY_STATS.guardian,{mainHand:"weapon.guardian_ritual_blade",body:"armor.guardian_stone"});
  const charognard=deriveStats(ENEMY_STATS.charognard,{mainHand:"natural.charognard_claws"});
  assert.ok(hero.criticalChance>bare.criticalChance);
  assert.ok(hitChance(hero,guardianStats)>hitChance(hero,charognard));
  assert.ok(hitChance(hero,guardianStats)>=35&&hitChance(hero,guardianStats)<=95);
  assert.equal(damageFromStats(3,hero,guardianStats),2);
  assert.ok(damageFromStats(3,hero,guardianStats,{critical:true})>
    damageFromStats(3,hero,guardianStats));
  assert.ok(damageFromStats(2,charognard,bare)>=1);
  assert.ok(damageFromStats(1,charognard,guardianStats,{source:"rift"})>=0);
});

test("DEV-073B: a miss costs a turn and stamina but never damages the target",()=>{
  let s=guardian(expedition(["weapon.rusty_sword"]));
  const stats=heroDerivedStats(s),defender=enemyDerivedStats(s.run.enemies[0]);
  s.run.rngState=findSeed(r=>r[0]>hitChance(stats,defender));
  const originalRng=s.run.rngState;
  const stamina=s.run.endurance;
  s=attackTarget(s).state;
  assert.equal(s.run.turns,1);
  assert.equal(s.run.enemies[0].hp,5);
  assert.equal(s.run.endurance,stamina-TACTICAL_COSTS.attack);
  assert.notEqual(s.run.rngState,originalRng);
  assert.ok(s.journal.some(e=>e.text.includes("Tu manques Gardien")));
  assert.ok(validateSave(s));
});

test("DEV-073B: a normal strike applies enemy armor and a critical deals extra",()=>{
  const base=guardian(expedition(["weapon.rusty_sword"]));
  const att=heroDerivedStats(base),def=enemyDerivedStats(base.run.enemies[0]);
  const hit=hitChance(att,def),crit=att.criticalChance;
  const normalSeed=findSeed(r=>r[0]<=hit&&r[1]>crit);
  const critSeed=findSeed(r=>r[0]<=hit&&r[1]<=crit);
  const normal=attackTarget({...base,run:{...base.run,rngState:normalSeed}}).state;
  const critical=attackTarget({...base,run:{...base.run,rngState:critSeed}}).state;
  assert.equal(normal.run.enemies[0].hp,5-damageFromStats(3,att,def));
  assert.ok(critical.run.enemies.length<normal.run.enemies.length ||
    critical.run.enemies[0].hp<normal.run.enemies[0].hp);
  assert.ok(critical.journal.some(e=>e.text.includes("COUP CRITIQUE")));
  assert.equal(normal.run.turns,1);
  assert.ok(validateSave(normal));
  assert.ok(validateSave(critical));
});

test("DEV-073B: enemy attacks can miss or critically hit using the same rules",()=>{
  const base=guardian(expedition());
  const att=enemyDerivedStats(base.run.enemies[0]),def=heroDerivedStats(base);
  const hit=hitChance(att,def),crit=att.criticalChance;
  const missSeed=findSeed(r=>r[0]>hit);
  const critSeed=findSeed(r=>r[0]<=hit&&r[1]<=crit);
  let miss=waitTurn({...base,run:{...base.run,rngState:missSeed}}).state;
  let critical=waitTurn({...base,run:{...base.run,rngState:critSeed}}).state;
  assert.equal(miss.run.hp,12);
  assert.ok(miss.journal.some(e=>e.text.includes("manque son attaque")));
  assert.ok(critical.run.hp<12);
  assert.ok(critical.journal.some(e=>e.text.includes("CRITIQUE")));
});

test("DEV-073B: dodge is a tested chance and a deliberate cost, not invulnerability",()=>{
  const base=guardian(expedition());
  const att=enemyDerivedStats(base.run.enemies[0]),def=heroDerivedStats(base);
  const hit=hitChance(att,def),chance=defenseChance("dodge",def,att);
  const successSeed=findSeed(r=>r[0]<=hit&&r[1]>att.criticalChance&&r[2]<=chance);
  const failureSeed=findSeed(r=>r[0]<=hit&&r[1]>att.criticalChance&&r[2]>chance);
  const success=defend({...base,run:{...base.run,rngState:successSeed}},"dodge").state;
  const failure=defend({...base,run:{...base.run,rngState:failureSeed}},"dodge").state;
  assert.equal(success.run.hp,12);
  assert.ok(failure.run.hp<12);
  assert.equal(success.run.endurance,base.run.endurance-2);
  assert.equal(failure.run.endurance,base.run.endurance-2);
  assert.equal(success.run.defense,"none");
  assert.ok(success.journal.some(e=>e.text.includes("Esquive réussi")));
  assert.ok(failure.journal.some(e=>e.text.includes("Défense échouée")));
});

test("DEV-073B: sword permits parry with variable outcome and a riposte",()=>{
  let base=guardian(expedition(["weapon.rusty_sword"]));
  const att=enemyDerivedStats(base.run.enemies[0]),def=heroDerivedStats(base);
  const hit=hitChance(att,def),chance=defenseChance("parry",def,att);
  assert.ok(chance>0);
  const seed=findSeed(r=>r[0]<=hit&&r[1]>att.criticalChance&&r[2]<=chance);
  base.run.rngState=seed;
  const result=defend(base,"parry").state;
  assert.ok(result.run.hp<12);
  assert.equal(result.run.enemies[0].hp,4);
  assert.ok(result.journal.some(e=>e.text.includes("Parade réussi")));
  assert.equal(defend(guardian(expedition()),"parry").changed,false);
});

test("DEV-073B: block uses gear and is less potent without a shield",()=>{
  const base=guardian(expedition());
  const att=enemyDerivedStats(base.run.enemies[0]),def=heroDerivedStats(base);
  const shield=deriveStats(DEFAULT_HERO_STATS,{offHand:"shield.prototype_ward"});
  const chance=defenseChance("block",def,att);
  const better=defenseChance("block",shield,att);
  assert.ok(better>chance);
  assert.ok(shield.blockAbsorb>def.blockAbsorb);
  const seed=findSeed(r=>r[0]<=hitChance(att,def)&&r[1]>att.criticalChance&&r[2]<=chance);
  base.run.rngState=seed;
  const result=defend(base,"block").state;
  assert.equal(result.run.hp,12-damageFromStats(2,att,def)+def.blockAbsorb);
  assert.ok(result.journal.some(e=>e.text.includes("Blocage réussi")));
});

test("DEV-073B: a rift cannot be dodged or parried but can be blocked",()=>{
  let base=expedition();
  base.run.x=4;base.run.y=2;base.run.turns=2;
  base.run.enemies=[{id:"l",kind:"rift_larva",x:6,y:2,hp:4}];
  const attacker=enemyDerivedStats(base.run.enemies[0]),defender=heroDerivedStats(base);
  const hit=hitChance(attacker,defender);
  const bchance=defenseChance("block",defender,attacker,"rift");
  const seed=findSeed(r=>r[0]<=hit&&r[1]>attacker.criticalChance&&r[2]<=bchance);
  const dodge=defend({...base,run:{...base.run,rngState:seed}},"dodge").state;
  const block=defend({...base,run:{...base.run,rngState:seed}},"block").state;
  assert.ok(dodge.run.hp<12);
  assert.equal(block.run.hp,12);
  assert.equal(defenseChance("dodge",defender,attacker,"rift"),0);
  assert.equal(defenseChance("parry",defender,attacker,"rift"),0);
});

test("DEV-073B: stamina spends on action, regains on wait and normal move",()=>{
  let s=guardian(expedition(["weapon.rusty_sword"]));
  const max=s.run.enduranceMax;
  assert.equal(s.run.endurance,max);
  s=defend(s,"block").state;
  assert.equal(s.run.endurance,max-2);
  s=waitTurn(s).state;
  assert.equal(s.run.endurance,max);
  s.run.endurance=1;
  const invalid=defend(s,"block");
  assert.equal(invalid.changed,false);
  assert.equal(invalid.state,s);
  s=move(s,"up").state;
  assert.equal(s.run.endurance,2);
  assert.ok(validateSave(s));
});

test("DEV-073B: saved RNG state preserves exact future combat after reload",()=>{
  let s=guardian(expedition(["weapon.rusty_sword"]));
  s.run.rngState=89231213;
  s=normalizeJournal(attackTarget(s).state);
  const saved=JSON.stringify(s);
  const loaded=normalizeJournal(JSON.parse(saved));
  const nextA=defend(s,"block");
  const nextB=defend(loaded,"block");
  assert.deepEqual(nextA.state,nextB.state);
  assert.deepEqual(nextA.message,nextB.message);
  assert.equal(validateSave(loaded),true);
});

test("DEV-073B: old v0.7b save gains a deterministic seed and stamina",()=>{
  let s=expedition(["weapon.rusty_sword"]);
  delete s.run.rngState;delete s.run.endurance;delete s.run.enduranceMax;
  assert.equal(validateSave(s),true);
  const loaded=normalizeJournal(s);
  assert.ok(validSeed(loaded.run.rngState));
  assert.equal(loaded.run.rngState,descentSeed(loaded.meta.descents));
  assert.equal(loaded.run.endurance,loaded.run.enduranceMax);
  assert.equal(loaded.meta.stash["weapon.rusty_sword"],0);
  assert.equal(loaded.run.enemies.length,3);
  assert.equal(validateSave(loaded),true);
});

test("DEV-073B: tampered RNG and negative stamina are rejected",()=>{
  let s=expedition();
  s.run.rngState=-1;
  assert.equal(validateSave(s),false);
  s=expedition();
  s.run.endurance=-1;
  assert.equal(validateSave(s),false);
  s=expedition();
  s.run.endurance=s.run.enduranceMax+1;
  assert.equal(validateSave(s),false);
});

test("DEV-073B: invalid tactical actions cannot reroll a seeded outcome",()=>{
  let s=expedition();
  const before=JSON.stringify(s);
  assert.equal(attackTarget(s).changed,false);
  assert.equal(defend(s,"parry").changed,false);
  assert.equal(JSON.stringify(s),before);
});

test("DEV-073B: fatal enemy crit retains the Rappel equipment contract",()=>{
  let base=guardian(expedition(["weapon.rusty_sword"]));
  const att=enemyDerivedStats(base.run.enemies[0]),def=heroDerivedStats(base);
  base.run.hp=1;
  base.run.rngState=findSeed(r=>r[0]<=hitChance(att,def)&&r[1]<=att.criticalChance);
  const result=waitTurn(base).state;
  assert.equal(result.run,null);
  assert.equal(result.meta.recalls,1);
  assert.equal(result.meta.stash["weapon.rusty_sword"],0);
  assert.equal(result.meta.stash["consumable.bandage"],2);
  assert.equal(result.meta.hero.xp,0);
  assert.equal(result.journal[0].type,"recall");
});

test("DEV-073B: extraction secures carried gear after multiple RNG outcomes",()=>{
  let s=expedition(["weapon.rusty_sword"]);
  s.run.rngState=descentSeed(42);
  s.run.x=12;s.run.y=7;
  s.run.carried["relic.ashen_fragment"]=1;
  s=extract(s).state;
  assert.equal(s.run,null);
  assert.equal(s.meta.extractions,1);
  assert.equal(s.meta.stash["weapon.rusty_sword"],1);
  assert.equal(s.meta.stash["relic.ashen_fragment"],1);
});

test("DEV-073B: support seed zero and no hidden browser-time randomness",()=>{
  const s=guardian(expedition(["weapon.rusty_sword"]));
  s.run.rngState=0;
  assert.ok(validateSave(s));
  const result=attackTarget(s);
  assert.equal(result.changed,true);
  assert.ok(validSeed(result.state.run.rngState));
});
