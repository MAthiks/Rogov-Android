import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  ITEMS,newGame,craftAtRefuge,beginRun,recall,extract,validateSave,
  normalizeJournal,attackTarget,defend,move
} from "../docs/game.js";
import {RECIPES,RESOURCE_ID,canCraft,craftingPreview} from "../docs/economy.js";
import {EQUIPMENT_CATALOG,heroDerivedStats} from "../docs/stats.js";
import {selectTarget} from "../docs/combat.js";

const fragment=(s,n)=>{s.meta.stash[RESOURCE_ID]=n;return s;};
const files=(name)=>readFileSync(new URL("../docs/"+name,import.meta.url),"utf8");

test("ECO-078: the fragment has two real, distinct refuge uses",()=>{
  assert.equal(RESOURCE_ID,"relic.ashen_fragment");
  assert.deepEqual(Object.keys(RECIPES),["forge.ashen_blade","supply.bandages"]);
  assert.deepEqual(RECIPES["forge.ashen_blade"].costs,{[RESOURCE_ID]:2});
  assert.deepEqual(RECIPES["forge.ashen_blade"].yields,{"weapon.ashen_blade":1});
  assert.deepEqual(RECIPES["supply.bandages"].costs,{[RESOURCE_ID]:1});
  assert.deepEqual(RECIPES["supply.bandages"].yields,{"consumable.bandage":2});
  assert.equal(ITEMS["weapon.ashen_blade"].name,"Lame cendrée");
  assert.equal(EQUIPMENT_CATALOG["weapon.ashen_blade"].baseDamage,4);
});

test("ECO-078: forge consumes exactly 2 secured fragments and produces 1 sword",()=>{
  const s=fragment(newGame(),2),before=JSON.stringify(s);
  const forged=craftAtRefuge(s,"forge.ashen_blade");
  assert.equal(forged.changed,true);
  assert.equal(JSON.stringify(s),before);
  assert.equal(forged.state.meta.stash[RESOURCE_ID],0);
  assert.equal(forged.state.meta.stash["weapon.ashen_blade"],1);
  assert.equal(forged.state.meta.stash["weapon.rusty_sword"],1);
  assert.equal(forged.state.meta.hero.xp,0);
  assert.equal(forged.state.meta.descents,0);
  assert.equal(forged.state.journal[0].type,"loot");
  assert.equal(forged.state.journal[0].turn,null);
  assert.ok(validateSave(forged.state));
});

test("ECO-078: medical recipe spends one fragment and adds exactly two bandages",()=>{
  const original=fragment(newGame(),1);
  const crafted=craftAtRefuge(original,"supply.bandages");
  assert.equal(crafted.changed,true);
  assert.equal(crafted.state.meta.stash[RESOURCE_ID],0);
  assert.equal(crafted.state.meta.stash["consumable.bandage"],4);
  assert.equal(crafted.state.meta.stash["weapon.ashen_blade"],undefined);
  assert.ok(validateSave(crafted.state));
});

test("ECO-078: no resources or unknown recipe do not change save",()=>{
  let s=newGame();
  const before=JSON.stringify(s);
  for(const id of ["forge.ashen_blade","supply.bandages","weapon.ashen_blade","",null]){
    const result=craftAtRefuge(s,id);
    assert.equal(result.changed,false,id);
    assert.equal(result.state,s);
    assert.equal(JSON.stringify(s),before);
  }
  assert.equal(canCraft(s.meta.stash,"forge.ashen_blade"),false);
  assert.equal(canCraft(s.meta.stash,"supply.bandages"),false);
});

test("ECO-078: cannot forge during a run or spend carried fragments",()=>{
  let s=beginRun(fragment(newGame(),2),["relic.ashen_fragment"]).state;
  // The bag is not currency for the Veyr forge.
  assert.equal(s.meta.stash[RESOURCE_ID],1);
  assert.equal(s.run.carried[RESOURCE_ID],1);
  const before=JSON.stringify(s);
  const forged=craftAtRefuge(s,"supply.bandages");
  assert.equal(forged.changed,false);
  assert.equal(JSON.stringify(s),before);
  assert.equal(forged.state.run.turns,0);
  assert.equal(forged.state.meta.stash["consumable.bandage"],2);
});

test("ECO-078: when only one fragment is secured, sword is unavailable but bandages work",()=>{
  const s=fragment(newGame(),1);
  const preview=craftingPreview(s.meta.stash);
  assert.equal(preview.length,2);
  assert.equal(preview.find(p=>p.id==="forge.ashen_blade").available,false);
  assert.equal(preview.find(p=>p.id==="supply.bandages").available,true);
  assert.equal(preview.find(p=>p.id==="forge.ashen_blade").costFragments,2);
  assert.ok(preview.every(p=>p.description.length>20));
});

test("ECO-078: crafted blade can be brought into Nhal and improves combat statistics",()=>{
  const plain=beginRun(newGame(),["weapon.rusty_sword"]).state;
  let s=fragment(newGame(),2);
  s=craftAtRefuge(s,"forge.ashen_blade").state;
  s=beginRun(s,["weapon.ashen_blade"]).state;
  assert.equal(s.meta.stash["weapon.ashen_blade"],0);
  assert.equal(s.run.carried["weapon.ashen_blade"],1);
  assert.equal(s.run.loadout.mainHand,"weapon.ashen_blade");
  const basic=heroDerivedStats(plain);
  const upgraded=heroDerivedStats(s);
  assert.ok(upgraded.criticalChance>basic.criticalChance);
  assert.ok(upgraded.parryChance>basic.parryChance);
  assert.ok(upgraded.accuracy>basic.accuracy);
  assert.ok(validateSave(s));
});

test("ECO-078: enhanced blade deals more than rusty sword under identical deterministic roll",()=>{
  let rusty=beginRun(newGame(),["weapon.rusty_sword"]).state;
  let c=fragment(newGame(),2);
  c=craftAtRefuge(c,"forge.ashen_blade").state;
  let ash=beginRun(c,["weapon.ashen_blade"]).state;
  const adjust=s=>{
    s.run.enemies=[{id:"g",kind:"guardian",x:2,y:7,hp:5,tactic:"ready"}];
    s.run.rngState=0; // first roll succeeds; regular hit against guardian stone
    return selectTarget(s,"g").state;
  };
  rusty=attackTarget(adjust(rusty)).state;
  ash=attackTarget(adjust(ash)).state;
  assert.equal(rusty.run.enemies[0].hp,3);
  assert.equal(ash.run.enemies[0].hp,2);
  assert.ok(validateSave(ash));
});

test("ECO-078: the upgraded weapon supports the same explicit parry rules",()=>{
  let s=fragment(newGame(),2);
  s=craftAtRefuge(s,"forge.ashen_blade").state;
  s=beginRun(s,["weapon.ashen_blade"]).state;
  s.run.enemies=[{id:"g",kind:"guardian",x:2,y:7,hp:5}];
  const outcome=defend(s,"parry");
  assert.equal(outcome.changed,true);
  assert.equal(outcome.state.run.turns,1);
  assert.ok(validateSave(outcome.state));
});

test("ECO-078: a crafted blade stays secure when left in Veyr during Rappel",()=>{
  let s=fragment(newGame(),2);
  s=craftAtRefuge(s,"forge.ashen_blade").state;
  s=beginRun(s,[]).state;
  s=recall(s).state;
  assert.equal(s.meta.stash["weapon.ashen_blade"],1);
  assert.equal(s.meta.stash[RESOURCE_ID],0);
  assert.equal(s.run,null);
});

test("ECO-078: carrying forged blade risks total permanent loss on Rappel",()=>{
  let s=fragment(newGame(),2);
  s=craftAtRefuge(s,"forge.ashen_blade").state;
  s=beginRun(s,["weapon.ashen_blade"]).state;
  assert.equal(s.meta.stash["weapon.ashen_blade"],0);
  s=recall(s).state;
  assert.equal(s.meta.recalls,1);
  assert.equal(s.meta.stash["weapon.ashen_blade"],0);
  assert.equal(s.meta.stash["weapon.rusty_sword"],1);
  assert.ok(validateSave(s));
});

test("ECO-078: a forged weapon is recovered at extraction, not duplicated",()=>{
  let s=fragment(newGame(),2);
  s=craftAtRefuge(s,"forge.ashen_blade").state;
  s=beginRun(s,["weapon.ashen_blade"]).state;
  s.run.x=12;s.run.y=7; // tutorial gate E
  s=extract(s).state;
  assert.equal(s.meta.stash["weapon.ashen_blade"],1);
  assert.equal(s.meta.extractions,1);
  assert.equal(s.meta.hero.xp,2);
  assert.ok(validateSave(s));
  s=beginRun(s,["weapon.ashen_blade"]).state;
  assert.equal(s.meta.stash["weapon.ashen_blade"],0);
});

test("ECO-078: a player with no rusty sword can still forge a useful weapon",()=>{
  const s=fragment(newGame(),2);
  s.meta.stash["weapon.rusty_sword"]=0;
  const result=craftAtRefuge(s,"forge.ashen_blade");
  assert.equal(result.changed,true);
  assert.equal(result.state.meta.stash["weapon.ashen_blade"],1);
  assert.equal(result.state.meta.stash["weapon.rusty_sword"],0);
});

test("ECO-078: existing saves migrate unchanged and recognize new recipe rewards",()=>{
  let s=fragment(newGame(),2);
  delete s.meta.hero.attributes;delete s.meta.hero.classId;
  const before=JSON.stringify(s);
  const restored=normalizeJournal(s);
  assert.equal(JSON.stringify(s),before);
  assert.equal(restored.meta.stash[RESOURCE_ID],2);
  const crafted=craftAtRefuge(restored,"forge.ashen_blade").state;
  assert.equal(crafted.meta.stash["weapon.ashen_blade"],1);
  assert.ok(validateSave(crafted));
});

test("ECO-078: saving and resuming does not duplicate consumed fragments or rewards",()=>{
  let s=craftAtRefuge(fragment(newGame(),2),"forge.ashen_blade").state;
  const loaded=normalizeJournal(JSON.parse(JSON.stringify(s)));
  assert.deepEqual(loaded.meta.stash,s.meta.stash);
  assert.equal(craftAtRefuge(loaded,"forge.ashen_blade").changed,false);
  assert.equal(loaded.meta.stash["weapon.ashen_blade"],1);
  assert.equal(loaded.meta.stash[RESOURCE_ID],0);
});

test("ECO-078: sequential choices consume the proper combined resource cost",()=>{
  let s=fragment(newGame(),3);
  s=craftAtRefuge(s,"supply.bandages").state;
  s=craftAtRefuge(s,"forge.ashen_blade").state;
  assert.equal(s.meta.stash[RESOURCE_ID],0);
  assert.equal(s.meta.stash["consumable.bandage"],4);
  assert.equal(s.meta.stash["weapon.ashen_blade"],1);
  assert.equal(craftAtRefuge(s,"supply.bandages").changed,false);
  assert.ok(validateSave(s));
});

test("ECO-078: refuge controls are actionable, accessible and offline-cache-ready",()=>{
  const html=files("index.html"),app=files("app.js"),sw=files("sw.js");
  for(const id of ["veyr-forge","forge-title","forge-fragments","forge-blade","forge-bandages"]){
    assert.ok(html.includes('id="'+id+'"'),id);
  }
  assert.match(html,/data-recipe="forge\.ashen_blade"/);
  assert.match(html,/data-recipe="supply\.bandages"/);
  assert.match(app,/craftAtRefuge\(state,button\.dataset\.recipe\)/);
  assert.match(app,/button\.disabled=!canCraft\(state\.meta\.stash,id\)/);
  assert.match(sw,/rogov-v0\.7f/);
  assert.match(sw,/"\.\/economy\.js"/);
});
