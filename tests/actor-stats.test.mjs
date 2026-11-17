import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newGame,beginRun,normalizeJournal,validateSave,attackTarget,move,recall,extract} from "../docs/game.js";
import {
  STAT_KEYS,STAT_LABELS,ARCHETYPES,GEAR_SLOTS,DEFAULT_HERO_STATS,ENEMY_STATS,
  EQUIPMENT_CATALOG,validAttributes,validClassId,validLoadout,playerLoadout,
  migrateHero,migrateEnemy,migrateRunStats,deriveStats,heroDerivedStats,enemyDerivedStats
} from "../docs/stats.js";
import {selectTarget} from "../docs/combat.js";

const run=(equipment=[])=>beginRun(newGame(),equipment).state;
const asset=(name)=>readFileSync(new URL("../docs/"+name,import.meta.url),"utf8");

test("DEV-073A: all six original attributes are represented with stable labels",()=>{
  assert.deepEqual(STAT_KEYS,["strength","agility","constitution","perception","willpower","intellect"]);
  assert.deepEqual(STAT_KEYS.map(k=>STAT_LABELS[k]),["FOR","AGI","CON","PER","VOL","INT"]);
  assert.ok(validAttributes(DEFAULT_HERO_STATS));
  assert.deepEqual(Object.keys(ARCHETYPES).length,11);
  for(const id of Object.keys(ARCHETYPES))assert.ok(validClassId(id));
  assert.equal(validClassId(null),true);
  assert.equal(validClassId("inventedClass"),false);
});
test("DEV-073A: a fresh hero keeps persistent primary attributes and no assumed class",()=>{
  const s=newGame();
  assert.ok(validAttributes(s.meta.hero.attributes));
  assert.deepEqual(s.meta.hero.attributes,DEFAULT_HERO_STATS);
  assert.equal(s.meta.hero.classId,null);
  assert.equal(s.meta.hero.level,1);
  assert.equal(s.meta.stash["weapon.rusty_sword"],1);
  assert.equal(validateSave(s),true);
});
test("DEV-073A: three enemy kinds have distinct profiles with same six-attribute schema",()=>{
  const s=run();
  for(const enemy of s.run.enemies){
    assert.ok(validAttributes(enemy.attributes),enemy.kind);
    assert.deepEqual(enemy.attributes,ENEMY_STATS[enemy.kind]);
    assert.ok(validLoadout(enemy.loadout),enemy.kind);
    assert.ok(enemyDerivedStats(enemy));
  }
  assert.notDeepEqual(ENEMY_STATS.charognard,ENEMY_STATS.guardian);
  assert.notDeepEqual(ENEMY_STATS.guardian,ENEMY_STATS.rift_larva);
  const guardian=enemyDerivedStats(s.run.enemies.find(x=>x.kind==="guardian"));
  const larva=enemyDerivedStats(s.run.enemies.find(x=>x.kind==="rift_larva"));
  assert.equal(guardian.armor,3);
  assert.equal(larva.arcaneResistance,6);
  assert.equal(validateSave(s),true);
});
test("DEV-073A: main hand is backed by carried equipment, never safe stash",()=>{
  const plain=run();
  const armed=run(["weapon.rusty_sword"]);
  assert.equal(plain.run.loadout.mainHand,null);
  assert.equal(armed.run.loadout.mainHand,"weapon.rusty_sword");
  assert.equal(armed.run.carried["weapon.rusty_sword"],1);
  assert.equal(armed.meta.stash["weapon.rusty_sword"],0);
  assert.equal(validLoadout(armed.run.loadout,armed.run.carried),true);
  const forged={...armed.run.loadout,offHand:"shield.prototype_ward"};
  assert.equal(validLoadout(forged,armed.run.carried),false);
  assert.equal(validLoadout({...armed.run.loadout,mainHand:"natural.charognard_claws"},armed.run.carried),false);
  assert.equal(validLoadout({...armed.run.loadout,mainHand:"shield.prototype_ward"}),false);
  assert.equal(validLoadout({...armed.run.loadout,other:"nothing"}),false);
});
test("DEV-073A: pure derived stats react to weapon and armor without mutating actor data",()=>{
  const attributes={...DEFAULT_HERO_STATS};
  const base=deriveStats(attributes);
  const weapon=deriveStats(attributes,{mainHand:"weapon.rusty_sword"});
  const armored=deriveStats(attributes,{mainHand:"weapon.rusty_sword",body:"armor.prototype_leather"});
  const shield=deriveStats(attributes,{mainHand:"weapon.rusty_sword",offHand:"shield.prototype_ward"});
  assert.equal(base.parryChance,0);
  assert.ok(weapon.parryChance>base.parryChance);
  assert.ok(weapon.attackPower>base.attackPower);
  assert.ok(weapon.criticalChance>base.criticalChance);
  assert.equal(armored.armor,base.armor+1);
  assert.ok(shield.blockChance>weapon.blockChance);
  assert.ok(shield.blockAbsorb>weapon.blockAbsorb);
  assert.deepEqual(attributes,DEFAULT_HERO_STATS);
  assert.equal(EQUIPMENT_CATALOG["shield.prototype_ward"].name.includes("non disponible"),true);
});
test("DEV-073A: increasing attributes changes relevant derived outcomes with bounded values",()=>{
  const strong={...DEFAULT_HERO_STATS,strength:10};
  const agile={...DEFAULT_HERO_STATS,agility:10};
  const alert={...DEFAULT_HERO_STATS,perception:10};
  const tough={...DEFAULT_HERO_STATS,constitution:10};
  assert.ok(deriveStats(strong).attackPower>deriveStats(DEFAULT_HERO_STATS).attackPower);
  assert.ok(deriveStats(agile).dodgeChance>deriveStats(DEFAULT_HERO_STATS).dodgeChance);
  assert.ok(deriveStats(alert).criticalChance>deriveStats(DEFAULT_HERO_STATS).criticalChance);
  assert.ok(deriveStats(tough).enduranceMax>deriveStats(DEFAULT_HERO_STATS).enduranceMax);
  const extreme={strength:20,agility:20,constitution:20,perception:20,willpower:20,intellect:20};
  const stats=deriveStats(extreme,{mainHand:"weapon.rusty_sword"});
  assert.ok(stats.criticalChance<=30);
  assert.ok(stats.dodgeChance<=45);
  assert.ok(stats.parryChance<=50);
  assert.ok(stats.blockChance<=60);
});
test("DEV-073A: legacy v0.6 saves migrate without changing hero XP, stash or enemies",()=>{
  const original=run(["weapon.rusty_sword"]);
  original.meta.hero.level=3;original.meta.hero.xp=10;
  original.run.hp=7;original.run.turns=17;original.run.targetId="nhal-guardian-01";
  original.run.collected.push("3,6");original.run.carried["relic.ashen_fragment"]=1;
  delete original.meta.hero.attributes;delete original.meta.hero.classId;
  delete original.run.loadout;
  for(const enemy of original.run.enemies){delete enemy.attributes;delete enemy.loadout;}
  assert.ok(validateSave(original));
  const before=JSON.stringify(original);
  const restored=normalizeJournal(original);
  assert.equal(JSON.stringify(original),before);
  assert.equal(restored.meta.hero.xp,10);
  assert.equal(restored.meta.hero.level,3);
  assert.equal(restored.run.hp,7);
  assert.equal(restored.run.turns,17);
  assert.equal(restored.run.targetId,"nhal-guardian-01");
  assert.equal(restored.run.collected[0],"3,6");
  assert.equal(restored.run.carried["relic.ashen_fragment"],1);
  assert.equal(restored.run.carried["weapon.rusty_sword"],1);
  assert.equal(restored.run.enemies.length,3);
  assert.equal(restored.run.loadout.mainHand,"weapon.rusty_sword");
  assert.ok(restored.run.enemies.every(e=>validAttributes(e.attributes)));
  assert.ok(restored.run.enemies.every(e=>validLoadout(e.loadout)));
  assert.ok(validateSave(restored));
});
test("DEV-073A: old saves with absent enemy list remain empty, never respawn enemies",()=>{
  const old=run();
  delete old.run.enemies;delete old.run.loadout;delete old.meta.hero.attributes;
  assert.ok(validateSave(old));
  const next=normalizeJournal(old);
  assert.deepEqual(next.run.enemies,[]);
  assert.ok(validLoadout(next.run.loadout,next.run.carried));
  assert.ok(validateSave(next));
});
test("DEV-073A: invalid attributes, loadouts and classes are safely rejected",()=>{
  let s=run(["weapon.rusty_sword"]);
  s.meta.hero.attributes.agility=999;
  assert.equal(validateSave(s),false);
  s=run(["weapon.rusty_sword"]);
  s.meta.hero.classId="customMage";
  assert.equal(validateSave(s),false);
  s=run(["weapon.rusty_sword"]);
  s.run.loadout.mainHand="shield.prototype_ward";
  assert.equal(validateSave(s),false);
  s=run(["weapon.rusty_sword"]);
  s.run.enemies[0].attributes.agility=0;
  assert.equal(validateSave(s),false);
  assert.equal(validAttributes({...DEFAULT_HERO_STATS,luck:15}),false);
  assert.equal(validAttributes(null),false);
});
test("DEV-073A: actor stats are serializable and do not change v0.7a attack outcomes",()=>{
  let s=run(["weapon.rusty_sword"]);
  const heroBefore=heroDerivedStats(s);
  assert.ok(heroBefore);
  assert.ok(heroBefore.attackPower>5);
  s.run.x=10;s.run.y=2;
  s.run.enemies=[{id:"g",kind:"guardian",x:11,y:2,hp:5,attributes:{...ENEMY_STATS.guardian},loadout:{...{mainHand:"weapon.guardian_ritual_blade",body:"armor.guardian_stone"}}}];
  s=selectTarget(s,"g").state;
  s=attackTarget(s).state;
  // In DEV-073B the guardian armor reduces 3 base sword damage to 2.
  assert.equal(s.run.enemies[0].hp,3);
  assert.ok(validateSave(s));
  const copy=JSON.parse(JSON.stringify(s));
  assert.deepEqual(heroDerivedStats(copy),heroDerivedStats(s));
  assert.ok(enemyDerivedStats(copy.run.enemies[0]));
});
test("DEV-073A: Rappel preserves the new hero attributes, loses carried gear",()=>{
  let s=run(["weapon.rusty_sword"]);
  const attributes={...s.meta.hero.attributes};
  s=recall(s).state;
  assert.equal(s.run,null);
  assert.deepEqual(s.meta.hero.attributes,attributes);
  assert.equal(s.meta.hero.classId,null);
  assert.equal(s.meta.stash["weapon.rusty_sword"],0);
  assert.equal(heroDerivedStats(s).attackPower,5);
  assert.ok(validateSave(s));
});
test("DEV-073A: extraction preserves the new hero attributes and returns gear",()=>{
  let s=run(["weapon.rusty_sword"]);
  s.run.x=12;s.run.y=7;
  const attributes={...s.meta.hero.attributes};
  s=extract(s).state;
  assert.deepEqual(s.meta.hero.attributes,attributes);
  assert.equal(s.meta.stash["weapon.rusty_sword"],1);
  assert.equal(s.meta.hero.xp,2);
  assert.ok(validateSave(s));
});
test("DEV-073A: UI shows actor stats and enemy stats as previews, cache includes stats",()=>{
  const html=asset("index.html");
  const app=asset("app.js");
  const sw=asset("sw.js");
  const pkg=JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8"));
  for(const id of ["actor-stats-sheet","actor-stat-values","actor-derived-values","actor-class-label","combat-target-profile"]){
    assert.ok(html.includes('id="'+id+'"'),id+" missing");
  }
  assert.match(html,/Caractéristiques actives/);
  assert.match(app,/heroDerivedStats\(state\)/);
  assert.match(app,/enemyDerivedStats\(enemy\)/);
  assert.match(app,/renderActorStats\(\)/);
  assert.match(sw,/rogov-v0\.7c/);
  assert.match(sw,/"\.\/stats\.js"/);
  assert.match(html,/app\.js\?v=0\.7c/);
  assert.match(html,/style\.css\?v=0\.7c/);
  assert.match(pkg.scripts["test:web"],/actor-stats\.test\.mjs/);
});
