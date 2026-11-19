import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ITEMS,SAVE_KEY,SCHEMA_VERSION,INVENTORY_LIMIT,newGame,beginRun,recall,
  extract,validateSave,normalizeJournal} from "../docs/game.js";
import {EQUIPMENT_CATALOG,DEFAULT_HERO_STATS,EMPTY_LOADOUT,
  deriveStats,validLoadout} from "../docs/stats.js";
import {damageFromStats} from "../docs/combat-rules.js";
import {generateDeepLayout} from "../docs/deep-dungeon.js";
import {BASE_LOOT} from "../docs/dungeon.js";
import {DEEP_CHEST_GUARANTEES,OPTIONAL_LOOT_ODDS,EQUIPMENT_LOOT_POOL,
  CONSUMABLE_LOOT_POOL,planDeepChestLoot} from "../docs/loot.js";

const gearIds=[
  "weapon.bone_dagger","weapon.iron_mace","shield.worn_buckler",
  "armor.scavenged_cuirass","armor.broken_plate"
];
const allNewIds=[...gearIds,"consumable.vigor_salts"];

test("GAME-095A1: six candidate objects have registered IDs, unique names and correct slots",()=>{
  assert.equal(allNewIds.length,6);
  assert.equal(new Set(allNewIds).size,6);
  for(const id of allNewIds){
    assert.ok(ITEMS[id]?.name,id+" missing from inventory catalog");
    assert.ok(ITEMS[id]?.symbol,id+" needs ASCII fallback");
    assert.ok(!Object.hasOwn(newGame().meta.stash,id),
      id+" must not spawn at the refuge during A1");
  }
  for(const id of gearIds){
    const item=EQUIPMENT_CATALOG[id];
    assert.ok(item,id+" missing equipment stats");
    assert.equal(item.quality,0);
    assert.ok(validLoadout({...EMPTY_LOADOUT,[item.slot]:id}));
  }
  assert.equal(EQUIPMENT_CATALOG["weapon.bone_dagger"].slot,"mainHand");
  assert.equal(EQUIPMENT_CATALOG["weapon.iron_mace"].slot,"mainHand");
  assert.equal(EQUIPMENT_CATALOG["shield.worn_buckler"].slot,"offHand");
  assert.equal(EQUIPMENT_CATALOG["armor.scavenged_cuirass"].slot,"body");
  assert.equal(EQUIPMENT_CATALOG["armor.broken_plate"].slot,"body");
  assert.equal(EQUIPMENT_CATALOG["consumable.vigor_salts"],undefined);
});

test("GAME-095A1: weapons change accuracy/critical vs damage, without changing old formulas",()=>{
  const a=DEFAULT_HERO_STATS;
  const defender=deriveStats(a);
  const rusty=EQUIPMENT_CATALOG["weapon.rusty_sword"];
  const dagger=EQUIPMENT_CATALOG["weapon.bone_dagger"];
  const mace=EQUIPMENT_CATALOG["weapon.iron_mace"];
  const d=deriveStats(a,{...EMPTY_LOADOUT,mainHand:"weapon.bone_dagger"});
  const m=deriveStats(a,{...EMPTY_LOADOUT,mainHand:"weapon.iron_mace"});
  const r=deriveStats(a,{...EMPTY_LOADOUT,mainHand:"weapon.rusty_sword"});
  assert.ok(d.accuracy>r.accuracy);
  assert.ok(d.criticalChance>r.criticalChance);
  assert.ok(m.accuracy<r.accuracy);
  assert.ok(damageFromStats(dagger.baseDamage,d,defender)<
    damageFromStats(rusty.baseDamage,r,defender));
  assert.ok(damageFromStats(mace.baseDamage,m,defender)>
    damageFromStats(rusty.baseDamage,r,defender));
  assert.equal(ITEMS["weapon.ashen_blade"].name,"Lame cendrée");
  assert.equal(EQUIPMENT_CATALOG["weapon.ashen_blade"].baseDamage,4);
});

test("GAME-095A1: shield and two armor tiers create real tradeoffs in existing resolver",()=>{
  const a=DEFAULT_HERO_STATS;
  const base=deriveStats(a);
  const shield=deriveStats(a,{...EMPTY_LOADOUT,offHand:"shield.worn_buckler"});
  const cuirass=deriveStats(a,{...EMPTY_LOADOUT,body:"armor.scavenged_cuirass"});
  const plate=deriveStats(a,{...EMPTY_LOADOUT,body:"armor.broken_plate"});
  assert.ok(shield.blockChance>base.blockChance);
  assert.ok(shield.blockAbsorb>base.blockAbsorb);
  assert.ok(shield.dodgeChance<base.dodgeChance);
  assert.equal(cuirass.armor,3);
  assert.equal(plate.armor,6);
  assert.ok(plate.dodgeChance<cuirass.dodgeChance);
  const attacker=deriveStats(a);
  assert.equal(damageFromStats(8,attacker,cuirass),7);
  assert.equal(damageFromStats(8,attacker,plate),6);
});

test("GAME-095A1: deep reward proposal is deterministic and its pools are validated",()=>{
  assert.deepEqual(DEEP_CHEST_GUARANTEES,["relic.ashen_fragment","consumable.bandage"]);
  assert.equal(OPTIONAL_LOOT_ODDS.equipment+OPTIONAL_LOOT_ODDS.consumable,100);
  for(const pool of [EQUIPMENT_LOOT_POOL,CONSUMABLE_LOOT_POOL]){
    assert.equal(pool.reduce((total,entry)=>total+entry.weight,0),100);
    assert.ok(pool.every(entry=>entry.weight>0&&ITEMS[entry.id]));
  }
  const options=new Set([...EQUIPMENT_LOOT_POOL,...CONSUMABLE_LOOT_POOL].map(x=>x.id));
  for(const n of [2,3,4,11,27,99,1000]){
    const p=planDeepChestLoot(n);
    assert.deepEqual(p,planDeepChestLoot(n));
    assert.equal(p.rewards.length,3);
    assert.deepEqual(p.rewards.slice(0,2),DEEP_CHEST_GUARANTEES);
    assert.equal(p.optional,p.rewards[2]);
    assert.ok(options.has(p.optional));
  }
  for(const n of [-1,0,1,NaN,2.5,Infinity,Number.MAX_SAFE_INTEGER+1])
    assert.throws(()=>planDeepChestLoot(n),RangeError);
});

test("GAME-095A1: 1000 proposed descents produce varied loot without combat RNG state changes",()=>{
  const count={equipment:0,consumable:0};
  const found=new Set();
  const s=beginRun(newGame()).state;
  const before=JSON.stringify(s);
  for(let n=2;n<=1001;n++){
    const p=planDeepChestLoot(n);
    found.add(p.optional);
    if(EQUIPMENT_LOOT_POOL.some(item=>item.id===p.optional))count.equipment++;
    else count.consumable++;
  }
  assert.equal(count.equipment+count.consumable,1000);
  assert.ok(count.equipment>=620&&count.equipment<=780,
    "distribution drift: "+JSON.stringify(count));
  assert.deepEqual(found,new Set([...EQUIPMENT_LOOT_POOL,...CONSUMABLE_LOOT_POOL].map(x=>x.id)));
  assert.equal(JSON.stringify(s),before,"loot must not advance combat seed or alter a run");
});

test("GAME-095A1: old maps and first descent keep their published loot rules",()=>{
  const one=beginRun(newGame()).state;
  assert.deepEqual(one.run.loot,BASE_LOOT);
  assert.equal(one.run.map.length,9);
  const expected={
    "relic.ashen_fragment":1,
    "consumable.dusk_tonic":1,
    "consumable.bandage":1
  };
  const deep=generateDeepLayout(2);
  const counts=Object.values(deep.loot).reduce((out,id)=>{
    out[id]=(out[id]||0)+1;return out;
  },{});
  assert.deepEqual(counts,expected);
  for(const n of [2,3,17,104])
    assert.deepEqual(generateDeepLayout(n),generateDeepLayout(n));
});

test("GAME-095A1: legacy saves and carried new IDs obey existing extraction/recall rules",()=>{
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(INVENTORY_LIMIT,8);
  const legacy=beginRun(newGame(),["weapon.rusty_sword"]).state;
  const legacyText=JSON.stringify(legacy);
  assert.ok(validateSave(legacy));
  const restored=normalizeJournal(JSON.parse(legacyText));
  assert.ok(validateSave(restored));
  assert.deepEqual(restored.meta.stash,legacy.meta.stash);
  assert.deepEqual(restored.run.loot,legacy.run.loot);
  assert.deepEqual(restored.run.rngState,legacy.run.rngState);
  const withLoot=newGame();
  withLoot.meta.stash["weapon.bone_dagger"]=1;
  withLoot.meta.stash["consumable.vigor_salts"]=1;
  assert.ok(validateSave(withLoot));
  let carried=beginRun(withLoot,["weapon.bone_dagger","consumable.vigor_salts"]).state;
  assert.ok(validateSave(carried));
  // A2 will implement deliberate equipping. A1 must not silently auto-equip.
  assert.equal(carried.run.loadout.mainHand,null);
  assert.equal(carried.run.carried["weapon.bone_dagger"],1);
  const lost=recall(carried).state;
  assert.equal(lost.meta.stash["weapon.bone_dagger"],0);
  assert.equal(lost.meta.stash["consumable.vigor_salts"],0);
  assert.ok(validateSave(lost));
  carried=beginRun(withLoot,["weapon.bone_dagger","consumable.vigor_salts"]).state;
  carried.run.x=12;carried.run.y=7;
  const secured=extract(carried).state;
  assert.equal(secured.meta.stash["weapon.bone_dagger"],1);
  assert.equal(secured.meta.stash["consumable.vigor_salts"],1);
  assert.ok(validateSave(secured));
});

test("GAME-095A1: test and syntax commands include the new pure loot module",()=>{
  const pkg=JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8"));
  assert.match(pkg.scripts["test:web"],/game095a1-loot\.test\.mjs/);
  assert.match(pkg.scripts["check:web"],/node --check docs\/loot\.js/);
  const loot=readFileSync(new URL("../docs/loot.js",import.meta.url),"utf8");
  assert.doesNotMatch(loot,/Math\.random|localStorage|document\./);
});
