// GAME-095A2 — count preparation, active equipment and recovery remain
// deterministic, save-safe, and turn-based across the full extraction loop.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newGame,beginRun,normalizeJournal,validateSave,recall,extract,
  equipItem,unequipItem,discardItem,useItem,MAX_HP,SCHEMA_VERSION,SAVE_KEY} from "../docs/game.js";
import {heroDerivedStats,EMPTY_LOADOUT} from "../docs/stats.js";

const withoutFoes=state=>{
  state.run.enemies=[];
  return state;
};

test("GAME-095A2: legacy equipment array remains strict, count record allows multiple bandages",()=>{
  const original=newGame();
  const before=JSON.stringify(original);
  const duplicate=beginRun(original,["consumable.bandage","consumable.bandage"]);
  assert.equal(duplicate.changed,false);
  assert.equal(duplicate.state,original);
  assert.equal(JSON.stringify(original),before);
  const prepared=beginRun(original,{
    "consumable.bandage":2,"weapon.rusty_sword":1
  });
  assert.equal(prepared.changed,true);
  assert.equal(prepared.state.run.carried["consumable.bandage"],2);
  assert.equal(prepared.state.meta.stash["consumable.bandage"],0);
  assert.equal(prepared.state.run.loadout.mainHand,"weapon.rusty_sword");
  assert.equal(prepared.state.run.turns,0);
  assert.ok(validateSave(prepared.state));
});

test("GAME-095A2: invalid quantities, missing stash, oversized bags have no side effects",()=>{
  const s=newGame();s.meta.stash["consumable.bandage"]=10;
  const before=JSON.stringify(s);
  for(const selection of [
    null,7,"bad",{"consumable.bandage":0},{"consumable.bandage":-1},
    {"consumable.bandage":1.5},{"consumable.bandage":"2"},
    {"consumable.bandage":9},{"consumable.bandage":11},
    {"unknown.item":1},{"consumable.bandage":Infinity}
  ]){
    const result=beginRun(s,selection);
    assert.equal(result.changed,false,JSON.stringify(selection));
    assert.equal(result.state,s);
    assert.equal(JSON.stringify(s),before);
  }
  const full=beginRun(s,{"consumable.bandage":8});
  assert.equal(full.changed,true);
  assert.equal(full.state.run.carried["consumable.bandage"],8);
  assert.equal(full.state.meta.stash["consumable.bandage"],2);
  assert.ok(validateSave(full.state));
});

test("GAME-095A2: explicit loadout at refuge controls stats, costs no turn, rejects unavailable item",()=>{
  const base=newGame();
  for(const id of ["weapon.bone_dagger","weapon.iron_mace",
    "shield.worn_buckler","armor.scavenged_cuirass"] )base.meta.stash[id]=1;
  const selection={
    "weapon.bone_dagger":1,"weapon.iron_mace":1,
    "shield.worn_buckler":1,"armor.scavenged_cuirass":1
  };
  const choice={...EMPTY_LOADOUT,
    mainHand:"weapon.bone_dagger",offHand:"shield.worn_buckler",
    body:"armor.scavenged_cuirass"};
  const state=beginRun(base,selection,choice).state;
  assert.deepEqual(state.run.loadout,choice);
  assert.equal(state.run.turns,0);
  assert.equal(state.run.carried["weapon.iron_mace"],1);
  const hero=heroDerivedStats(state);
  assert.ok(hero.blockAbsorb>1);
  assert.equal(hero.armor,3);
  assert.ok(validateSave(state));
  const invalid=beginRun(base,selection,{
    ...EMPTY_LOADOUT,mainHand:"weapon.ashen_blade"
  });
  assert.equal(invalid.changed,false);
  assert.equal(invalid.state,base);
  assert.equal(base.meta.stash["weapon.bone_dagger"],1);
});

test("GAME-095A2: swapping weapons consumes one enemy phase without changing bag ownership",()=>{
  const s=newGame();
  s.meta.stash["weapon.iron_mace"]=1;
  let run=withoutFoes(beginRun(s,{
    "weapon.rusty_sword":1,"weapon.iron_mace":1
  }).state);
  const before=JSON.stringify(run.run.carried);
  const first=heroDerivedStats(run);
  const swapped=equipItem(run,"weapon.iron_mace");
  assert.equal(swapped.changed,true);
  assert.equal(swapped.state.run.turns,1);
  assert.equal(swapped.state.run.loadout.mainHand,"weapon.iron_mace");
  assert.equal(JSON.stringify(swapped.state.run.carried),before);
  assert.ok(heroDerivedStats(swapped.state).accuracy<first.accuracy);
  assert.equal(swapped.state.run.rngState,run.run.rngState);
  assert.equal(equipItem(swapped.state,"weapon.iron_mace").changed,false);
  assert.equal(equipItem(swapped.state,"weapon.ashen_blade").changed,false);
  assert.equal(equipItem(swapped.state,"shield.prototype_ward").changed,false);
  assert.ok(validateSave(swapped.state));
});

test("GAME-095A2: removal costs a turn; dropping last equipped copy is prohibited",()=>{
  const s=newGame();s.meta.stash["armor.broken_plate"]=1;
  let state=withoutFoes(beginRun(s,{"armor.broken_plate":1}).state);
  assert.equal(state.run.loadout.body,"armor.broken_plate");
  assert.equal(discardItem(state,"armor.broken_plate").changed,false);
  const original=JSON.stringify(state);
  assert.equal(unequipItem(state,"mainHand").changed,false);
  assert.equal(JSON.stringify(state),original);
  const removed=unequipItem(state,"body");
  assert.equal(removed.changed,true);
  assert.equal(removed.state.run.turns,1);
  assert.equal(removed.state.run.loadout.body,null);
  assert.equal(removed.state.run.carried["armor.broken_plate"],1);
  const discarded=discardItem(removed.state,"armor.broken_plate");
  assert.equal(discarded.changed,true);
  assert.equal(discarded.state.run.turns,2);
  assert.equal(discarded.state.run.carried["armor.broken_plate"],undefined);
  assert.equal(discarded.state.meta.stash["armor.broken_plate"],0);
  assert.ok(validateSave(discarded.state));
});

test("GAME-095A2: discarding spare copies leaves an equipped copy intact",()=>{
  const s=newGame();s.meta.stash["shield.worn_buckler"]=2;
  let run=withoutFoes(beginRun(s,{"shield.worn_buckler":2}).state);
  assert.equal(run.run.loadout.offHand,"shield.worn_buckler");
  run=discardItem(run,"shield.worn_buckler").state;
  assert.equal(run.run.carried["shield.worn_buckler"],1);
  assert.equal(run.run.loadout.offHand,"shield.worn_buckler");
  assert.equal(discardItem(run,"shield.worn_buckler").changed,false);
  assert.ok(validateSave(run));
});

test("GAME-095A2: vigor salts restore at most six Endurance, consume one item and one turn",()=>{
  const s=newGame();s.meta.stash["consumable.vigor_salts"]=2;
  let run=withoutFoes(beginRun(s,{"consumable.vigor_salts":2}).state);
  const max=run.run.enduranceMax;
  assert.equal(useItem(run,"consumable.vigor_salts").changed,false,
    "full resource should never waste a consumable");
  assert.equal(run.run.turns,0);
  run.run.endurance=3;
  const restored=useItem(run,"consumable.vigor_salts");
  assert.equal(restored.changed,true);
  assert.equal(restored.state.run.endurance,Math.min(max,9));
  assert.equal(restored.state.run.carried["consumable.vigor_salts"],1);
  assert.equal(restored.state.run.turns,1);
  assert.equal(restored.state.run.hp,MAX_HP);
  assert.ok(validateSave(restored.state));
  const full=structuredClone(restored.state);
  full.run.endurance=full.run.enduranceMax-2;
  const capped=useItem(full,"consumable.vigor_salts").state;
  assert.equal(capped.run.endurance,capped.run.enduranceMax);
  assert.equal(capped.run.carried["consumable.vigor_salts"],undefined);
  assert.equal(capped.run.turns,2);
  assert.ok(validateSave(capped));
});

test("GAME-095A2: old bandages/tonics and invalid items retain established contracts",()=>{
  let s=withoutFoes(beginRun(newGame(),["consumable.bandage"]).state);
  assert.equal(useItem(s,"consumable.bandage").changed,false);
  assert.equal(useItem(s,"consumable.vigor_salts").changed,false);
  s.run.hp=7;
  const result=useItem(s,"consumable.bandage");
  assert.equal(result.state.run.hp,11);
  assert.equal(result.state.run.turns,1);
  assert.equal(result.state.run.carried["consumable.bandage"],undefined);
  assert.ok(validateSave(result.state));
});

test("GAME-095A2: death erases carried gear, extraction retains full quantities, echo metadata intact",()=>{
  const starter=newGame();starter.meta.stash["armor.scavenged_cuirass"]=1;
  starter.meta.echoFindings=["buried_city"];
  let run=beginRun(starter,{
    "consumable.bandage":2,"armor.scavenged_cuirass":1
  }).state;
  run.run.enemies=[];
  assert.ok(validateSave(run));
  const persisted=normalizeJournal(JSON.parse(JSON.stringify(run)));
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  assert.deepEqual(persisted.run.carried,run.run.carried);
  const loss=recall(persisted).state;
  assert.equal(loss.run,null);
  assert.equal(loss.meta.stash["consumable.bandage"],0);
  assert.equal(loss.meta.stash["armor.scavenged_cuirass"],0);
  assert.deepEqual(loss.meta.echoFindings,["buried_city"]);
  assert.ok(validateSave(loss));
  run.run.x=12;run.run.y=7;
  const extracted=extract(run).state;
  assert.equal(extracted.meta.stash["consumable.bandage"],2);
  assert.equal(extracted.meta.stash["armor.scavenged_cuirass"],1);
  assert.deepEqual(extracted.meta.echoFindings,["buried_city"]);
  assert.ok(validateSave(extracted));
});

test("GAME-095A2: Android/PWA controls exist with no schema or generator edits",()=>{
  const source=p=>readFileSync(new URL("../docs/"+p,import.meta.url),"utf8");
  const html=source("index.html"),app=source("app.js"),css=source("style.css"),sw=source("sw.js");
  for(const id of ["prep-summary","prep-mainHand","prep-offHand","prep-body",
    "bag-equipped","bag-items","start-btn"])assert.ok(html.includes('id="'+id+'"'));
  assert.match(app,/beginRun\(state,preparationCounts\(\),preparedChoice\(\)\)/);
  assert.match(app,/window\.confirm\("Abandonner définitivement/);
  assert.match(app,/equipItem\(state,id\)/);
  assert.match(app,/useItem\(state,id\)/);
  assert.match(css,/GAME-095A2/);
  assert.match(sw,/rogov-v0\.7f-game095a[2-9]-[a-z0-9-]+/,
    "Offline PWA cache must be versioned for A2 and subsequent gameplay updates");
  assert.match(source("deep-dungeon.js"),/consumable\.dusk_tonic/);
  assert.equal(SCHEMA_VERSION,1);
});
