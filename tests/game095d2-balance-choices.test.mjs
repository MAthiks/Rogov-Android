// GAME-095D2 — actual engine outcomes, never fabricated difficulty scores.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newGame,beginRun,defend,swapChestReward,chestSwapChoices,
  openChest,extract,recall,normalizeJournal,validateSave,
  inventoryCount,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";
import {EQUIPMENT_CATALOG} from "../docs/stats.js";
import {runBalanceLab} from "../tools/balance-lab.mjs";

function guardian({weapon=true,tactic="winding",hp=5,seed=1}={}){
  const s=beginRun(newGame(),weapon?["weapon.rusty_sword"]:[]).state;
  s.run.enemies=[{id:"guardian-test",kind:"guardian",x:2,y:7,hp,
    ...(tactic?{tactic}:{})}];
  s.run.targetId="guardian-test";
  s.run.rngState=seed;
  assert.ok(validateSave(s));
  return s;
}
function fullChest(){
  const initial=newGame();
  initial.meta.descents=1;
  const s=beginRun(initial,["weapon.rusty_sword"],null,
    {multiFloor:true}).state;
  const id=Object.entries(s.run.loot)
    .find(([,reward])=>reward==="consumable.bandage")[0];
  const [cx,cy]=id.split(",").map(Number);
  const neighbor=[[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dx,dy])=>({x:cx+dx,y:cy+dy}))
    .find(p=>s.run.map[p.y]?.[p.x]==="."&&
      !(s.run.traps||[]).some(t=>t.x===p.x&&t.y===p.y));
  assert.ok(neighbor);
  s.run.x=neighbor.x;s.run.y=neighbor.y;
  s.run.enemies=[];
  s.run.carried={
    "weapon.rusty_sword":1,
    "weapon.iron_mace":1,
    "consumable.bandage":2,
    "consumable.dusk_tonic":1,
    "consumable.vigor_salts":1,
    "armor.scavenged_cuirass":1,
    "relic.ashen_fragment":1
  };
  assert.equal(inventoryCount(s),8);
  assert.ok(validateSave(s));
  return {s,cx,cy};
}

test("GAME-095D2: telegraphed dodge counter is deterministic and earned",()=>{
  let armed=0,ripostes=0,successes=0;
  for(let seed=0;seed<130;seed++){
    const s=guardian({seed});
    const original=structuredClone(s);
    const result=defend(s,"dodge");
    assert.equal(result.changed,true);
    assert.deepEqual(s,original);
    const after=result.state;
    assert.ok(validateSave(after));
    assert.equal(after.run.turns,1);
    assert.equal(after.run.endurance,s.run.endurance-2);
    armed++;
    const log=after.journal.map(x=>x.text).join(" | ");
    if(log.includes("Esquive réussie"))successes++;
    if(log.includes("RIPOSTE D'ESQUIVE")){
      ripostes++;
      assert.ok(after.run.enemies.length<1||
        after.run.enemies[0].hp<=5);
      if(after.run.enemies.length)
        assert.equal(after.run.enemies[0].tactic,"ready",
          "a counter opens the guardian's high guard");
      const reloaded=normalizeJournal(JSON.parse(JSON.stringify(after)));
      assert.ok(validateSave(reloaded));
      assert.deepEqual(reloaded.run.enemies.map(e=>({
        id:e.id,kind:e.kind,hp:e.hp,tactic:e.tactic
      })),after.run.enemies.map(e=>({
        id:e.id,kind:e.kind,hp:e.hp,tactic:e.tactic
      })),"normalization can add default stats, not change persisted combat state");
      assert.equal(reloaded.run.rngState,after.run.rngState);
    }
  }
  assert.equal(armed,130);
  assert.ok(successes>=25,"some defensive rolls should succeed");
  assert.ok(ripostes>=30,"forecasted strikes must create real counter opportunities");
});

test("GAME-095D2: no weapon, non-telegraphed attack or failed defense gives no free counter",()=>{
  const unarmed=defend(guardian({weapon:false}),"dodge").state;
  assert.ok(validateSave(unarmed));
  assert.equal(unarmed.journal.some(e=>e.text.includes("RIPOSTE D'ESQUIVE")),false);
  for(const tactic of ["ready",null]){
    const s=guardian({tactic});
    const after=defend(s,"dodge").state;
    assert.ok(validateSave(after));
    assert.equal(after.journal.some(e=>e.text.includes("RIPOSTE D'ESQUIVE")),false);
  }
  let failures=0;
  for(let seed=0;seed<150;seed++){
    const after=defend(guardian({seed}),"dodge").state;
    if(after.journal.some(e=>/Défense échouée/.test(e.text))){
      failures++;
      assert.equal(after.journal.some(e=>e.text.includes("RIPOSTE D'ESQUIVE")),false);
    }
  }
  assert.ok(failures>15);
});

test("GAME-095D2: defending a telegraphed strike can kill once, never duplicate XP",()=>{
  let example=null;
  for(let seed=0;seed<300;seed++){
    const attempt=defend(guardian({seed,hp:2}),"dodge").state;
    if(attempt.run?.enemies.length===0){example=attempt;break;}
  }
  assert.ok(example,"successful melee counterstrike should be able to kill");
  assert.equal(example.meta.hero.xp,4);
  assert.equal(example.run.targetId,null);
  assert.ok(validateSave(example));
  const reloaded=normalizeJournal(JSON.parse(JSON.stringify(example)));
  assert.ok(validateSave(reloaded));
  assert.equal(reloaded.meta.hero.xp,4);
  const recalled=recall(reloaded).state;
  assert.equal(recalled.meta.hero.xp,4);
  assert.equal(recalled.meta.recalls,1);
});

test("GAME-095D2: full bag trades exactly one item for one unknown chest reward",()=>{
  const {s,cx,cy}=fullChest(),original=JSON.stringify(s);
  assert.equal(openChest(s,cx,cy).changed,false);
  assert.ok(chestSwapChoices(s.run).includes("weapon.iron_mace"));
  assert.ok(!chestSwapChoices(s.run).includes("weapon.rusty_sword"),
    "the only equipped sword can never be discarded");
  const reward=s.run.loot[cx+","+cy];
  const result=swapChestReward(s,cx,cy,"weapon.iron_mace");
  assert.equal(result.changed,true);
  assert.equal(JSON.stringify(s),original);
  const after=result.state;
  assert.equal(inventoryCount(after),8);
  assert.equal(after.run.carried["weapon.iron_mace"],undefined);
  assert.equal(after.run.carried[reward],s.run.carried[reward]+1);
  assert.equal(after.run.loadout.mainHand,"weapon.rusty_sword");
  assert.deepEqual(after.run.collected,[cx+","+cy]);
  assert.equal(after.run.turns,s.run.turns+1);
  assert.equal(after.run.endurance,s.run.enduranceMax);
  assert.equal(after.run.rngState,s.run.rngState);
  assert.equal(after.meta.hero.xp,s.meta.hero.xp+1);
  assert.equal(swapChestReward(after,cx,cy,"consumable.bandage").changed,false);
  assert.equal(openChest(after,cx,cy).changed,false);
  assert.ok(validateSave(after));
  const copy=normalizeJournal(JSON.parse(JSON.stringify(after)));
  assert.ok(validateSave(copy));
  assert.equal(copy.run.carried[reward],after.run.carried[reward]);
  const exit=structuredClone(copy);
  exit.run.x=exit.run.exit.x;exit.run.y=exit.run.exit.y;
  const saved=extract(exit).state;
  assert.ok(validateSave(saved));
  assert.equal(saved.meta.stash["weapon.iron_mace"]||0,0);
  assert.equal(saved.meta.stash[reward],
    (s.meta.stash[reward]||0)+after.run.carried[reward],
    "extraction adds carried reward to existing secured stash");
});

test("GAME-095D2: invalid swaps never cost a turn or spoil unseen loot",()=>{
  const {s,cx,cy}=fullChest(),old=JSON.stringify(s);
  for(const discardId of ["weapon.rusty_sword","missing.item",null,""]){
    const r=swapChestReward(s,cx,cy,discardId);
    assert.equal(r.changed,false);
    assert.equal(r.state,s);
    assert.equal(JSON.stringify(s),old);
  }
  const legacy=structuredClone(s);
  delete legacy.run.loadout;
  assert.ok(validateSave(legacy));
  assert.ok(!chestSwapChoices(legacy.run).includes("weapon.rusty_sword"),
    "legacy auto-equipped sword must remain protected without loadout");
  const free=structuredClone(s);
  free.run.carried["consumable.vigor_salts"]=0;
  delete free.run.carried["consumable.vigor_salts"];
  assert.equal(inventoryCount(free),7);
  assert.equal(swapChestReward(free,cx,cy,"weapon.iron_mace").changed,false);
  const distant=structuredClone(s);
  distant.run.x=distant.run.start.x;distant.run.y=distant.run.start.y;
  // if initial chest is adjacent to start, choose a far safe cell.
  distant.run.x=distant.run.exit.x;distant.run.y=distant.run.exit.y;
  assert.equal(swapChestReward(distant,cx,cy,"weapon.iron_mace").changed,false);
  assert.ok(validateSave(s));
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  assert.ok(EQUIPMENT_CATALOG["weapon.rusty_sword"]);
});

test("GAME-095D2: existing lab still measures actual engine without faking humans",()=>{
  const result=runBalanceLab({start:2,count:5});
  assert.equal(result.generatedFloors,15);
  assert.equal(result.floors.every(x=>x.routeBlocked===0),true);
  assert.match(result.model,/not human win rates/);
});

test("GAME-095D2: Android controls and offline update are present",()=>{
  const get=name=>readFileSync(new URL("../docs/"+name,import.meta.url),"utf8");
  const app=get("app.js"),html=get("index.html"),sw=get("sw.js");
  assert.match(html,/id="chest-swap-panel"/);
  assert.match(html,/id="chest-swap-item"/);
  assert.match(html,/id="chest-swap-action"/);
  assert.match(app,/swapChestReward\(state,chest\.x,chest\.y,discardId\)/);
  assert.match(app,/chestSwapChoices\(state\.run\)/);
  assert.match(sw,/game095(d2|d3c)/);
});
