// GAME-095A3/A4 — loot integration, safety and deterministic balance gates.
import test from "node:test";
import assert from "node:assert/strict";
import {generateDeepLayout,validateDeepLayout,deepRoute,deepTwoReturnWays}
  from "../docs/deep-dungeon.js";
import {planDeepChestLoot,EQUIPMENT_LOOT_POOL,CONSUMABLE_LOOT_POOL}
  from "../docs/loot.js";
import {newGame,beginRun,normalizeJournal,validateSave,openChest,
  extract,recall,ITEMS,SAVE_KEY,SCHEMA_VERSION,INVENTORY_LIMIT}
  from "../docs/game.js";

const optionalIds=[...EQUIPMENT_LOOT_POOL,...CONSUMABLE_LOOT_POOL].map(x=>x.id);
const optionalChest=layout=>Object.entries(layout.loot).find(([,id])=>
  id!=="relic.ashen_fragment"&&id!=="consumable.bandage");
const key=p=>p.x+","+p.y;
const neighbors=(p,map)=>[[0,-1],[1,0],[0,1],[-1,0]]
  .map(([dx,dy])=>({x:p.x+dx,y:p.y+dy}))
  .filter(cell=>!["#","^","$"].includes(map[cell.y]?.[cell.x]??"#"));

function activeRun(n){
  const base=newGame();
  base.meta.descents=n-1;
  return beginRun(base).state;
}

test("GAME-095A3: each fresh deep descent has one of each reward role",()=>{
  const found=new Set(),types={equipment:0,consumable:0};
  for(let n=2;n<=81;n++){
    const layout=generateDeepLayout(n);
    assert.equal(layout.lootPlanVersion,1,"version "+n);
    assert.ok(validateDeepLayout(layout),"generated layout invalid "+n);
    assert.deepEqual(generateDeepLayout(n),layout,"seed changed on replay "+n);
    const ids=Object.values(layout.loot);
    assert.equal(ids.length,3);
    assert.equal(ids.filter(x=>x==="relic.ashen_fragment").length,1);
    assert.equal(ids.filter(x=>x==="consumable.bandage").length,1);
    const optional=optionalChest(layout);
    assert.ok(optional,"optional chest missing "+n);
    assert.equal(optional[1],planDeepChestLoot(n).optional);
    assert.ok(optionalIds.includes(optional[1]));
    assert.ok(ITEMS[optional[1]]);
    found.add(optional[1]);
    if(EQUIPMENT_LOOT_POOL.some(x=>x.id===optional[1]))types.equipment++;
    else types.consumable++;
    // The entry bandage remains accessible and neither the map nor exit rules change.
    const [entryPos]=Object.entries(layout.loot).find(([,id])=>id==="consumable.bandage");
    const [x,y]=entryPos.split(",").map(Number);
    assert.ok(Math.abs(x-layout.start.x)+Math.abs(y-layout.start.y)<=3);
    const blocked=new Set(layout.enemies.map(key));
    assert.ok(deepRoute(layout.map,layout.start,layout.exit,blocked),
      "no safe return "+n);
    assert.ok(deepTwoReturnWays(layout.map,layout.start,layout.exit),
      "extraction articulation "+n);
    assert.equal(layout.doors.length,6);
    assert.equal(layout.map.join("").split("^").length-1,2);
  }
  assert.ok(found.size>=5,"several future items should actually occur");
  assert.ok(types.equipment>40&&types.consumable>8,"diversity drift");
});

test("GAME-095A3: saved new runs preserve their original rewards and combat seed",()=>{
  const state=activeRun(7),expected=generateDeepLayout(7);
  assert.ok(validateSave(state));
  assert.equal(state.run.lootPlanVersion,1);
  assert.deepEqual(state.run.loot,expected.loot);
  const oldSeed=state.run.rngState;
  const serialized=JSON.stringify(state);
  const loaded=normalizeJournal(JSON.parse(serialized));
  assert.deepEqual(loaded.run.map,state.run.map);
  assert.deepEqual(loaded.run.loot,state.run.loot);
  assert.equal(loaded.run.lootPlanVersion,1);
  assert.equal(loaded.run.rngState,oldSeed);
  assert.equal(loaded.run.turns,0);
  assert.ok(validateSave(loaded));
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
});

test("GAME-095A3: legacy deep saves without a version preserve tonic and geometry",()=>{
  const state=activeRun(17);
  const entry=optionalChest(state.run);
  assert.ok(entry);
  state.run.loot[entry[0]]="consumable.dusk_tonic";
  delete state.run.lootPlanVersion;
  const oldState=JSON.stringify(state);
  assert.equal(validateSave(state),true);
  const restored=normalizeJournal(JSON.parse(oldState));
  assert.equal(validateSave(restored),true);
  assert.equal(JSON.stringify(restored.run.loot),JSON.stringify(state.run.loot));
  assert.equal(restored.run.lootPlanVersion,undefined);
  assert.equal(restored.run.map.join(""),state.run.map.join(""));
  assert.equal(restored.run.rngState,state.run.rngState);
  assert.equal(restored.run.loot[entry[0]],"consumable.dusk_tonic");
  // A new descent for the same index is free to have the A3 reward.
  assert.equal(generateDeepLayout(17).loot[entry[0]],planDeepChestLoot(17).optional);
});

test("GAME-095A3: malformed loot version and forged rewards are rejected",()=>{
  const original=activeRun(19);
  const badVersion=structuredClone(original);
  badVersion.run.lootPlanVersion=2;
  assert.equal(validateSave(badVersion),false);
  const [,reward]=optionalChest(original.run);
  const pos=optionalChest(original.run)[0];
  const tampered=structuredClone(original);
  tampered.run.loot[pos]="weapon.ashen_blade";
  assert.equal(validateSave(tampered),false,
    "forge-only blade must never enter the procedural pool");
  const duplicate=structuredClone(original);
  duplicate.run.loot[pos]="relic.ashen_fragment";
  assert.equal(validateSave(duplicate),false);
  const legacy=structuredClone(original);
  delete legacy.run.lootPlanVersion;
  assert.equal(validateSave(legacy),false,
    "old loot format cannot silently take the new item pool");
  assert.ok(reward&&ITEMS[reward]);
});

test("GAME-095A3: opening a new equipment chest costs a turn and is saved once",()=>{
  const n=Array.from({length:70},(_,i)=>i+2).find(index=>
    EQUIPMENT_LOOT_POOL.some(x=>x.id===planDeepChestLoot(index).optional));
  assert.ok(n);
  const state=activeRun(n);
  const [pos,id]=optionalChest(state.run);
  const [x,y]=pos.split(",").map(Number);
  const neighbor=neighbors({x,y},state.run.map)[0];
  assert.ok(neighbor);
  state.run.x=neighbor.x;state.run.y=neighbor.y;
  state.run.enemies=[];
  const oldSeed=state.run.rngState;
  const opened=openChest(state,x,y);
  assert.equal(opened.changed,true);
  assert.equal(opened.state.run.carried[id],1);
  assert.equal(opened.state.run.turns,1);
  assert.equal(opened.state.run.collected.filter(x=>x===pos).length,1);
  assert.equal(opened.state.run.rngState,oldSeed);
  assert.ok(validateSave(opened.state));
  const resumed=normalizeJournal(JSON.parse(JSON.stringify(opened.state)));
  const repeated=openChest(resumed,x,y);
  assert.equal(repeated.changed,false,"chest cannot duplicate loot after reload");
  assert.equal(resumed.run.carried[id],1);
  assert.equal(resumed.run.turns,1);
  assert.equal(opened.state.meta.stash[id],undefined);
  const secured=structuredClone(resumed);
  secured.run.x=secured.run.exit.x;secured.run.y=secured.run.exit.y;
  const out=extract(secured);
  assert.equal(out.changed,true);
  assert.equal(out.state.meta.stash[id],1,"optional equipment must be secured");
  assert.equal(out.state.run,null);
  assert.ok(validateSave(out.state));
  const lost=recall(resumed);
  assert.equal(lost.state.meta.stash[id],undefined,
    "unextracted loot is destroyed on Rappel");
  assert.ok(validateSave(lost.state));
});

test("GAME-095A4: deterministic candidate distribution has useful diversity",()=>{
  const count=new Map();
  const total=4000;
  for(let n=2;n<2+total;n++){
    const optional=planDeepChestLoot(n).optional;
    count.set(optional,(count.get(optional)||0)+1);
  }
  const gear=EQUIPMENT_LOOT_POOL.reduce((total,entry)=>
    total+(count.get(entry.id)||0),0);
  const tonic=count.get("consumable.dusk_tonic")||0;
  const salts=count.get("consumable.vigor_salts")||0;
  assert.equal([...count.values()].reduce((a,b)=>a+b,0),total);
  assert.equal(count.size,7,"seven accessible optional reward IDs");
  assert.ok(gear>=total*0.62&&gear<=total*0.78,"equipment frequency out of range");
  assert.ok(tonic>200&&salts>200,"consumables too rare");
  assert.ok(count.get("armor.broken_plate")>70,"rare armor absent from long-run samples");
  assert.ok(count.get("weapon.bone_dagger")>300,"dagger absent from long-run samples");
  assert.equal(INVENTORY_LIMIT,8);
});
