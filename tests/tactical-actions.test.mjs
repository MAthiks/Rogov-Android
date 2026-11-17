import test from "node:test";
import assert from "node:assert/strict";
import { beginRun, newGame, move, attackTarget, defend, retreat, waitTurn,
  validateSave, normalizeJournal, extract } from "../docs/game.js";
import {selectTarget, combatSnapshot} from "../docs/combat.js";

const run=(gear=[])=>beginRun(newGame(),gear).state;
const nearbyGuardian=(s,hp=5)=> {
  s.run.enemies=[{id:"g",kind:"guardian",x:2,y:7,hp}];
  return s;
};

test("DEV-072: collision selects with no turn, damage, loot or XP",()=>{
  let s=nearbyGuardian(run(["weapon.rusty_sword"]));
  const original=JSON.stringify(s);
  const result=move(s,"right");
  assert.equal(result.changed,true);
  assert.equal(JSON.stringify(s),original);
  assert.equal(result.state.run.targetId,"g");
  assert.equal(result.state.run.turns,0);
  assert.equal(result.state.run.hp,12);
  assert.equal(result.state.run.enemies[0].hp,5);
  assert.equal(result.state.meta.hero.xp,0);
  assert.equal(result.state.run.x,1);
  assert.ok(validateSave(result.state));
  assert.equal(move(result.state,"right").changed,false);
});
test("DEV-072: an invalid attack never spends a turn",()=>{
  const s=nearbyGuardian(run());
  assert.equal(attackTarget(s).changed,false);
  assert.equal(s.run.turns,0);
  s.run.targetId="g";
  s.run.x=1;s.run.y=6; // diagonal distance 2
  assert.equal(attackTarget(s).changed,false);
  assert.equal(s.run.hp,12);
  assert.equal(s.run.enemies[0].hp,5);
  assert.equal(s.run.turns,0);
  assert.equal(attackTarget(newGame()).changed,false);
});
test("DEV-072: explicit attacks use the weapon and award XP on a kill",()=>{
  let s=nearbyGuardian(run(["weapon.rusty_sword"]),2);
  s=selectTarget(s,"g").state;
  s.run.rngState=0; // first roll hits; normal attack beats armor.
  s=attackTarget(s).state;
  assert.equal(s.run.turns,1);
  assert.equal(s.run.enemies.length,0);
  assert.equal(s.run.targetId,null);
  assert.equal(s.meta.hero.xp,4);
  assert.equal(s.run.hp,12);
  assert.ok(validateSave(s));
});
test("DEV-072: attacking without a weapon still works but does less damage",()=>{
  let s=nearbyGuardian(run());
  s=selectTarget(s,"g").state;
  s.run.rngState=0;
  s=attackTarget(s).state;
  assert.equal(s.run.enemies[0].hp,4); // bare fists 2, stone armor 1.
  assert.equal(s.run.turns,1);
  assert.equal(s.run.hp,12); // guardian's next strike misses with seed 0.
});
test("DEV-072: dodge negates the next contact strike without teleporting",()=>{
  let s=nearbyGuardian(run());
  s.run.rngState=1; // hit, no crit, successful dodge.
  s=defend(s,"dodge").state;
  assert.equal(s.run.hp,12);
  assert.equal(s.run.turns,1);
  assert.equal(s.run.x,1);
  assert.equal(s.run.defense,"none");
  assert.ok(s.journal.some(e=>e.type==="defense" && e.text.includes("Esquive réussie")));
  s=waitTurn(s).state;
  assert.equal(s.run.hp,9);
});
test("DEV-072: parry requires sword; with sword reduces damage and retaliates",()=>{
  let s=nearbyGuardian(run());
  assert.equal(defend(s,"parry").changed,false);
  assert.equal(s.run.turns,0);
  s=nearbyGuardian(run(["weapon.rusty_sword"]));
  s.run.rngState=1;
  s=defend(s,"parry").state;
  assert.equal(s.run.hp,10);
  assert.equal(s.run.enemies[0].hp,4);
  assert.equal(s.run.turns,1);
  assert.ok(s.journal.some(e=>e.type==="defense" && e.text.includes("Parade")));
  assert.equal(s.run.defense,"none");
});
test("DEV-072: parry kills wounded foe, awards XP and clears selection",()=>{
  let s=nearbyGuardian(run(["weapon.rusty_sword"]),1);
  s=selectTarget(s,"g").state;
  s.run.rngState=1;
  s=defend(s,"parry").state;
  assert.equal(s.run.enemies.length,0);
  assert.equal(s.run.targetId,null);
  assert.equal(s.meta.hero.xp,4);
  assert.equal(s.run.hp,10);
  assert.ok(validateSave(s));
});
test("DEV-072: block absorbs one point of either melee or rift damage",()=>{
  let s=nearbyGuardian(run());
  s.run.rngState=1;
  s=defend(s,"block").state;
  assert.equal(s.run.hp,10); // 3 damage - 1 absorbed, no shield.
  assert.equal(s.run.turns,1);
  s=run();
  s.run.x=4;s.run.y=2;
  s.run.turns=2;
  s.run.enemies=[{id:"l",kind:"rift_larva",x:6,y:2,hp:4}];
  s.run.rngState=1;
  s=defend(s,"block").state;
  assert.equal(s.run.hp,12); // supernatural pulse absorbed
  assert.equal(s.run.turns,3);
  assert.ok(s.journal.some(e=>e.text.includes("Blocage")));
});
test("DEV-072: dodge does not negate a supernatural pulse",()=>{
  let s=run();
  s.run.x=4;s.run.y=2;s.run.turns=2;
  s.run.enemies=[{id:"l",kind:"rift_larva",x:6,y:2,hp:4}];
  s.run.rngState=1;
  s=defend(s,"dodge").state;
  assert.equal(s.run.hp,11);
});
test("DEV-072: defensive posture blocks only first matching hit per turn",()=>{
  let s=run();
  s.run.enemies=[
    {id:"g1",kind:"guardian",x:2,y:7,hp:5},
    {id:"g2",kind:"guardian",x:1,y:6,hp:5}
  ];
  s.run.rngState=1;
  s=defend(s,"dodge").state;
  assert.equal(s.run.hp,9); // first dodged, second hits for 3
  assert.equal(s.run.defense,"none");
});
test("DEV-072: retreat increases distance and costs one turn",()=>{
  let s=nearbyGuardian(run());
  s=selectTarget(s,"g").state;
  s=retreat(s).state;
  assert.equal(s.run.x,1);
  assert.equal(s.run.y,6);
  assert.equal(s.run.turns,1);
  assert.equal(s.run.hp,12);
  assert.ok(s.journal.some(e=>e.type==="combat"&&e.text.includes("Repli")));
  assert.ok(validateSave(s));
});
test("DEV-072: retreat cannot walk into wall, lethal rift or occupied cells",()=>{
  let s=run();
  s.run.enemies=[
    {id:"g",kind:"guardian",x:2,y:7,hp:5},
    {id:"block-up",kind:"guardian",x:1,y:6,hp:5}
  ];
  s=selectTarget(s,"g").state;
  const before=JSON.stringify(s);
  const result=retreat(s);
  assert.equal(result.changed,false);
  assert.equal(JSON.stringify(s),before);
  assert.equal(s.run.turns,0);
  assert.equal(retreat(newGame()).changed,false);
});
test("DEV-072: invalid actions never alter the save",()=>{
  const s=run();
  const before=JSON.stringify(s);
  for(const result of [defend(s,"wrong"),retreat(s),attackTarget(s)]){
    assert.equal(result.changed,false);
    assert.equal(result.state,s);
  }
  assert.equal(JSON.stringify(s),before);
  const loaded=JSON.parse(before);
  assert.ok(validateSave(loaded));
  assert.equal(normalizeJournal(loaded).run.hp,12);
});
test("DEV-072: a selected old save remains compatible with tactical actions",()=>{
  let s=run(["weapon.rusty_sword"]);
  delete s.run.defense;
  s.run.targetId="nhal-guardian-01";
  const restored=normalizeJournal(JSON.parse(JSON.stringify(s)));
  assert.ok(validateSave(restored));
  assert.equal(combatSnapshot(restored).targetId,"nhal-guardian-01");
  assert.equal(defend(restored,"block").changed,true);
});
test("DEV-072: fatal attack follows Rappel contract, keeps hero/stash but loses bag",()=>{
  let s=nearbyGuardian(run(["weapon.rusty_sword"]));
  s.run.hp=2;
  s.run.rngState=1;
  s=selectTarget(s,"g").state;
  s=attackTarget(s).state;
  assert.equal(s.run,null);
  assert.equal(s.meta.recalls,1);
  assert.equal(s.meta.stash["weapon.rusty_sword"],0);
  assert.equal(s.meta.stash["consumable.bandage"],2);
  assert.equal(s.meta.hero.xp,0);
  assert.equal(s.journal[0].type,"recall");
});
test("DEV-072: extraction after tactical selection still secures the bag",()=>{
  let s=run(["weapon.rusty_sword"]);
  s=selectTarget(s,"nhal-charognard-01").state;
  s.run.x=12;s.run.y=7;
  s.run.carried["relic.ashen_fragment"]=1;
  s=extract(s).state;
  assert.equal(s.run,null);
  assert.equal(s.meta.extractions,1);
  assert.equal(s.meta.stash["weapon.rusty_sword"],1);
  assert.equal(s.meta.stash["relic.ashen_fragment"],1);
  assert.equal(s.meta.hero.xp,2);
});
