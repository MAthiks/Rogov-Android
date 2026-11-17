import test from "node:test";
import assert from "node:assert/strict";
import { newGame, beginRun, validateSave, normalizeJournal, recall, extract } from "../docs/game.js";
import {
  RANGES, COMBAT_ACTIONS, DEFENSE_MODES, INTENT_KINDS,
  tileDistance, rangeBand, straightLineClear, currentEnemyIntent,
  selectTarget, clearTarget, validTacticalFields, combatSnapshot
} from "../docs/combat.js";

function expedition() {
  return beginRun(newGame(), ["weapon.rusty_sword"]).state;
}

test("DEV-070: CONTACT / PROCHE / LOIN use orthogonal distance", () => {
  assert.equal(tileDistance({x:1,y:1},{x:2,y:1}),1);
  assert.equal(tileDistance({x:1,y:1},{x:2,y:2}),2);
  assert.equal(tileDistance({x:1,y:1},{x:1,y:4}),3);
  assert.equal(tileDistance({x:1,y:1},{x:5,y:1}),4);
  assert.equal(rangeBand(1),RANGES.CONTACT);
  assert.equal(rangeBand(2),RANGES.PROCHE);
  assert.equal(rangeBand(3),RANGES.PROCHE);
  assert.equal(rangeBand(4),RANGES.LOIN);
  assert.equal(rangeBand(0),null);
  assert.equal(rangeBand(-1),null);
  assert.equal(tileDistance({x:1.5,y:1},{x:1,y:1}),null);
});

test("DEV-070: walls and corners block a straight line", () => {
  assert.equal(straightLineClear({x:4,y:2},{x:6,y:2}),true);
  assert.equal(straightLineClear({x:6,y:2},{x:6,y:4}),false); // wall at 6,3
  assert.equal(straightLineClear({x:2,y:1},{x:3,y:2}),false);
  assert.equal(straightLineClear({x:4,y:2},{x:4,y:2}),false);
});

test("DEV-070: target selection has no turn cost, attack or data mutation", () => {
  const original=expedition();
  const before=JSON.stringify(original);
  const result=selectTarget(original,"nhal-guardian-01");
  assert.equal(result.changed,true);
  assert.equal(JSON.stringify(original),before);
  assert.equal(result.state.run.targetId,"nhal-guardian-01");
  assert.equal(result.state.run.turns,original.run.turns);
  assert.equal(result.state.run.hp,original.run.hp);
  assert.deepEqual(result.state.run.enemies,original.run.enemies);
  assert.deepEqual(result.state.run.carried,original.run.carried);
  assert.deepEqual(result.state.meta,original.meta);
  assert.ok(validateSave(result.state));
  assert.deepEqual(result.state.run.enemies[1],original.run.enemies[1]);
});

test("DEV-070: selecting an unknown or defeated enemy costs no resources", () => {
  const s=expedition();
  const initial=JSON.stringify(s);
  for (const id of ["", "phantom", null]) {
    const result=selectTarget(s,id);
    assert.equal(result.changed,false);
    assert.equal(result.state,s);
    assert.equal(JSON.stringify(s),initial);
  }
  const dead={...s,run:{...s.run,enemies:s.run.enemies.map(e=>e.id==="nhal-guardian-01"?{...e,hp:0}:e)}};
  assert.equal(selectTarget(dead,"nhal-guardian-01").changed,false);
});

test("DEV-070: selection remains a stable, serializable target ID", () => {
  const s=selectTarget(expedition(),"nhal-guardian-01").state;
  const saved=JSON.parse(JSON.stringify(s));
  assert.equal(validateSave(saved),true);
  assert.equal(normalizeJournal(saved).run.targetId,"nhal-guardian-01");
  const snapshot=combatSnapshot(saved);
  assert.equal(snapshot.name,"Gardien déchu");
  assert.equal(snapshot.targetId,"nhal-guardian-01");
  assert.equal(snapshot.distance,15);
  assert.equal(snapshot.band,RANGES.LOIN);
  assert.equal(snapshot.meleeAvailable,false);
  assert.equal(snapshot.hp,5);
  assert.equal(snapshot.defense,"none");
  const cleared=clearTarget(saved);
  assert.equal(cleared.changed,true);
  assert.equal(cleared.state.run.targetId,null);
  assert.equal(combatSnapshot(cleared.state),null);
  assert.equal(clearTarget(cleared.state).changed,false);
});

test("DEV-070: removing a target makes an old selection harmless", () => {
  const s=selectTarget(expedition(),"nhal-guardian-01").state;
  const withGone={...s,run:{...s.run,enemies:s.run.enemies.filter(e=>e.id!=="nhal-guardian-01")}};
  assert.equal(combatSnapshot(withGone),null);
  assert.equal(validateSave(withGone),true);
});

test("DEV-070: adjacent target preview shows CONTACT and an attack", () => {
  const s=expedition();
  s.run.x=10;s.run.y=2;
  const selected=selectTarget(s,"nhal-guardian-01").state;
  const snapshot=combatSnapshot(selected);
  assert.equal(snapshot.distance,1);
  assert.equal(snapshot.band,RANGES.CONTACT);
  assert.equal(snapshot.meleeAvailable,true);
  assert.equal(snapshot.intent.kind,"melee");
});

test("DEV-070: the Larva charge and pulse reflect the CURRENT enemy rhythm", () => {
  let s=expedition();
  s.run.x=4;s.run.y=2;
  const larva=s.run.enemies.find(e=>e.kind==="rift_larva");
  assert.equal(currentEnemyIntent(s.run,larva).kind,"rift_charge");
  s.run.turns=2;
  assert.equal(currentEnemyIntent(s.run,larva).kind,"rift_pulse");
  const selected=selectTarget(s,larva.id).state;
  assert.equal(combatSnapshot(selected).intent.kind,"rift_pulse");
  selected.run.x=6;selected.run.y=4; // blocked by a wall at y=3
  assert.equal(currentEnemyIntent(selected.run,larva).kind,"idle");
  selected.run.x=5;selected.run.y=1; // diagonal
  assert.equal(currentEnemyIntent(selected.run,larva).kind,"idle");
});

test("DEV-070: an enemy beyond its aggro range is not falsely announced as attacking", () => {
  let s=expedition();
  const scavenger=s.run.enemies.find(e=>e.kind==="charognard");
  assert.equal(currentEnemyIntent(s.run,scavenger).kind,"idle");
  s.run.x=2;s.run.y=3; // Manhattan 2 to (3,2)
  assert.equal(currentEnemyIntent(s.run,scavenger).kind,"approach");
  s.run.x=3;s.run.y=3;
  assert.equal(currentEnemyIntent(s.run,scavenger).kind,"melee");
});

test("DEV-070: defensive states and action identifiers are explicit and guarded", () => {
  assert.deepEqual(DEFENSE_MODES,["none","dodge","parry","block"]);
  assert.deepEqual(COMBAT_ACTIONS,["attack","dodge","parry","block","retreat"]);
  for (const kind of ["idle","approach","melee","rift_charge","rift_pulse"]) {
    assert.ok(INTENT_KINDS.includes(kind));
  }
  const s=expedition();
  assert.equal(validTacticalFields(s.run),true);
  assert.equal(validTacticalFields({...s.run,defense:"parry",targetId:null}),true);
  assert.equal(validTacticalFields({...s.run,defense:"unknown"}),false);
  assert.equal(validTacticalFields({...s.run,targetId:""}),false);
});

test("DEV-070: v0.6.1 game is unchanged by the new opt-in combat contract", () => {
  let s=expedition();
  const prior=JSON.stringify(s);
  assert.equal(s.run.targetId,undefined);
  assert.equal(s.run.defense,undefined);
  assert.equal(combatSnapshot(s),null);
  assert.equal(validateSave(s),true);
  assert.equal(JSON.stringify(s),prior);
  s=recall(s).state;
  assert.equal(s.run,null);
  assert.equal(s.meta.recalls,1);
  assert.equal(s.meta.stash["weapon.rusty_sword"],0);
  assert.equal(combatSnapshot(s),null);
});

test("DEV-070: snapshot returns null outside active combat without raising errors", () => {
  assert.equal(combatSnapshot(newGame()),null);
  assert.equal(combatSnapshot(null),null);
  assert.equal(selectTarget(newGame(),"target").changed,false);
  assert.equal(clearTarget(newGame()).changed,false);
});
