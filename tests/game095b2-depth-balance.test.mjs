// GAME-095B2 — encounter composition, reward relevance and saved-run safety.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {balanceDepthLayout,planDepthReward,depthIntel,DEEP_REWARD_POOLS,
  DEPTH_BALANCE_VERSION} from "../docs/depth-balance.js";
import {deepFloorSeed,MAX_FLOOR_DEPTH} from "../docs/floors.js";
import {generateDeepLayout,validateDeepLayout,deepRoute,deepTwoReturnWays}
  from "../docs/deep-dungeon.js";
import {newGame,beginRun,resolveFloorExit,openChest,extract,recall,
  normalizeJournal,validateSave,ENEMY_TYPES,ITEMS,SCHEMA_VERSION,SAVE_KEY}
  from "../docs/game.js";
import {ENEMY_LOADOUTS,ENEMY_STATS} from "../docs/stats.js";

const entry=descent=>{
  const s=newGame();s.meta.descents=descent-1;
  return beginRun(s,["weapon.rusty_sword"],null,{multiFloor:true}).state;
};
function nextFloor(state){
  const s=structuredClone(state);
  s.run.enemies=[];s.run.x=s.run.exit.x;s.run.y=s.run.exit.y;
  assert.ok(validateSave(s),"Arche fixture is valid");
  const result=resolveFloorExit(s,"descend");
  assert.equal(result.changed,true,result.message);
  assert.ok(validateSave(result.state),"transition created invalid save");
  return result.state;
}
const sum=pool=>pool.reduce((n,item)=>n+item.weight,0);
const count=layout=>Object.fromEntries(
  ["charognard","guardian","rift_larva"].map(kind=>[
    kind,layout.enemies.filter(e=>e.kind===kind).length]));
const key=p=>p.x+","+p.y;

test("GAME-095B2: bounded profiles and meaningful floor choice hints",()=>{
  assert.equal(MAX_FLOOR_DEPTH,3);
  assert.equal(DEPTH_BALANCE_VERSION,1);
  assert.equal(sum(DEEP_REWARD_POOLS[2]),100);
  assert.equal(sum(DEEP_REWARD_POOLS[3]),100);
  assert.equal(depthIntel(1),null);
  assert.match(depthIntel(2).risk,/Faille/);
  assert.match(depthIntel(3).risk,/sentinelles/);
  assert.match(depthIntel(2).prize,/soins/);
  assert.match(depthIntel(3).prize,/équipements/);
  for(const n of [0,1,4,2.5,"3",null]){
    assert.throws(()=>planDepthReward(4,n),RangeError);
    assert.throws(()=>balanceDepthLayout({},4,n),RangeError);
  }
});

test("GAME-095B2: original floor 1 layout remains bit-for-bit identical",()=>{
  const original=generateDeepLayout(2);
  const state=entry(2);
  assert.deepEqual(state.run.enemies.map(e=>({id:e.id,kind:e.kind,hp:e.hp})),
    original.enemies.map(e=>({id:e.id,kind:e.kind,hp:e.hp})));
  assert.deepEqual(state.run.loot,original.loot);
  assert.equal(state.run.depthBalanceVersion,undefined);
  assert.equal(state.run.floorDepth,1);
  assert.ok(validateSave(state));
});

test("GAME-095B2: deterministic encounters change roles, not positions or damage",()=>{
  for(let n=2;n<=41;n++){
    for(const depth of [2,3]){
      const seed=deepFloorSeed(n,depth),base=generateDeepLayout(seed);
      const raw=JSON.stringify(base);
      const layout=balanceDepthLayout(base,n,depth);
      assert.equal(JSON.stringify(base),raw,"no base-map mutation");
      assert.deepEqual(balanceDepthLayout(base,n,depth),layout);
      assert.ok(validateDeepLayout(layout),"procedural safety at "+n+"/"+depth);
      assert.deepEqual(layout.map,base.map);
      assert.deepEqual(layout.start,base.start);
      assert.deepEqual(layout.exit,base.exit);
      assert.deepEqual(layout.doors,base.doors);
      assert.deepEqual(layout.rooms,base.rooms);
      assert.deepEqual(layout.traps,base.traps);
      assert.deepEqual(layout.secrets,base.secrets);
      assert.deepEqual(layout.sites,base.sites);
      assert.equal(layout.enemies.length,4);
      assert.equal(layout.depthBalanceVersion,1);
      // D3C relocates at most the ORIGINAL Guardian to the optional atelier
      // chest; no additional enemy, map change or mandatory corridor blocker.
      assert.deepEqual(
        layout.enemies.filter(e=>e.id!=="nhal-guardian-01").map(key),
        base.enemies.filter(e=>e.id!=="nhal-guardian-01").map(key),
        "the scout, vault guard and Larva keep their generated positions");
      const oldGuardian=base.enemies.find(e=>e.id==="nhal-guardian-01");
      const guardian=layout.enemies.find(e=>e.id==="nhal-guardian-01");
      if(key(guardian)!==key(oldGuardian)){
        const atelier=layout.rooms.find(r=>r.slot===10);
        assert.ok(atelier);
        assert.ok(guardian.x>atelier.x&&guardian.x<atelier.x+atelier.width-1);
        assert.ok(guardian.y>atelier.y&&guardian.y<atelier.y+atelier.height-1);
      }
      assert.equal(layout.enemies.find(e=>e.id==="nhal-charognard-scout-01")?.kind,
        "charognard","starting scout must not be strengthened");
      assert.deepEqual(count(layout),depth===2
        ?{charognard:1,guardian:1,rift_larva:2}
        :{charognard:1,guardian:2,rift_larva:1});
      for(const foe of layout.enemies){
        assert.equal(foe.hp,ENEMY_TYPES[foe.kind].hp,
          "no inflated hit points, only regular enemy archetypes");
        assert.ok(ENEMY_STATS[foe.kind]);
      }
      const ids=Object.values(layout.loot);
      assert.equal(ids.filter(id=>id==="relic.ashen_fragment").length,1);
      assert.equal(ids.filter(id=>id==="consumable.bandage").length,1);
      assert.equal(ids.length,3);
      assert.ok(ITEMS[ids.find(id=>id!=="relic.ashen_fragment"&&
        id!=="consumable.bandage")]);
      const entryBandage=Object.entries(layout.loot)
        .find(([,id])=>id==="consumable.bandage");
      const [x,y]=entryBandage[0].split(",").map(Number);
      assert.ok(Math.abs(x-layout.start.x)+Math.abs(y-layout.start.y)<=3);
      const blocked=new Set(layout.enemies.map(key));
      assert.ok(deepRoute(layout.map,layout.start,layout.exit,blocked));
      assert.ok(deepTwoReturnWays(layout.map,layout.start,layout.exit));
      for(const chest of Object.keys(layout.loot)){
        const [cx,cy]=chest.split(",").map(Number);
        assert.ok(deepRoute(layout.map,layout.start,{x:cx,y:cy},blocked));
      }
      assert.notEqual(layout.layoutId,null);
      if(depth===2){
        assert.ok(layout.enemies.some(e=>e.id==="nhal-rift-larva-vault-01"));
      }else{
        assert.ok(layout.enemies.some(e=>e.id==="nhal-guardian-vault-01"&&
          e.tactic==="ready"));
      }
    }
  }
});

test("GAME-095B2: floor 2/3 balances provide differentiated reward odds",()=>{
  const out={2:new Map(),3:new Map()};
  for(let n=2;n<=1001;n++){
    for(const depth of [2,3]){
      const id=planDepthReward(n,depth);
      assert.ok(DEEP_REWARD_POOLS[depth].some(x=>x.id===id));
      out[depth].set(id,(out[depth].get(id)||0)+1);
      assert.equal(planDepthReward(n,depth),id);
      assert.notEqual(id,"weapon.bone_dagger",
        "deepest rewards exclude low-tier dagger");
    }
  }
  const all=n=>[...out[n].values()].reduce((a,b)=>a+b,0);
  assert.equal(all(2),1000);assert.equal(all(3),1000);
  const consumables=n=>(out[n].get("consumable.dusk_tonic")||0)+
    (out[n].get("consumable.vigor_salts")||0);
  assert.ok(consumables(2)>340&&consumables(2)<560,
    "depth 2 should keep substantial recovery options");
  assert.ok(consumables(3)>80&&consumables(3)<230,
    "depth 3 should prioritize equipment without deleting the heal");
  assert.ok(out[3].get("armor.broken_plate")>120,
    "rare armor should be meaningfully attainable");
  assert.ok(out[2].size>=5&&out[3].size>=4,
    "reward candidates should vary between expeditions");
});

test("GAME-095B2: depth 2 and 3 new runs get composition, safe seeds, correct loadouts",()=>{
  const initial=entry(8);
  const seed=initial.run.rngState;
  const two=nextFloor(initial);
  assert.equal(two.run.floorDepth,2);
  assert.equal(two.run.depthBalanceVersion,1);
  assert.equal(two.run.rngState,seed);
  assert.deepEqual(count(two.run),{charognard:1,guardian:1,rift_larva:2});
  const larva=two.run.enemies.find(e=>e.id==="nhal-rift-larva-vault-01");
  assert.equal(larva.loadout.body,ENEMY_LOADOUTS.rift_larva.body);
  assert.deepEqual(larva.attributes,ENEMY_STATS.rift_larva);
  const three=nextFloor(two);
  assert.equal(three.run.floorDepth,3);
  assert.equal(three.run.depthBalanceVersion,1);
  assert.equal(three.run.rngState,seed);
  assert.deepEqual(count(three.run),{charognard:1,guardian:2,rift_larva:1});
  const guard=three.run.enemies.find(e=>e.id==="nhal-guardian-vault-01");
  assert.equal(guard.tactic,"ready");
  assert.equal(guard.loadout.body,ENEMY_LOADOUTS.guardian.body);
  assert.deepEqual(guard.attributes,ENEMY_STATS.guardian);
  assert.equal(three.meta.bestDepth,3);
  assert.ok(validateSave(three));
  const saved=normalizeJournal(JSON.parse(JSON.stringify(three)));
  assert.deepEqual(saved.run.loot,three.run.loot);
  assert.deepEqual(saved.run.enemies,three.run.enemies);
  assert.equal(saved.run.depthBalanceVersion,1);
  assert.ok(validateSave(saved));
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(SAVE_KEY,"rogov-web-v1");
});

test("GAME-095B2: optional chest loot can be secured or lost, never duplicated",()=>{
  const two=nextFloor(entry(17));
  const reward=Object.entries(two.run.loot).find(([,id])=>
    id!=="relic.ashen_fragment"&&id!=="consumable.bandage");
  assert.ok(reward);
  const [x,y]=reward[0].split(",").map(Number);
  const pos=[[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dx,dy])=>({x:x+dx,y:y+dy}))
    .find(p=>two.run.map[p.y]?.[p.x]===".");
  assert.ok(pos);
  two.run.enemies=[];two.run.x=pos.x;two.run.y=pos.y;
  const opened=openChest(two,x,y);
  assert.equal(opened.changed,true);
  assert.equal(opened.state.run.carried[reward[1]],1);
  const round=normalizeJournal(JSON.parse(JSON.stringify(opened.state)));
  assert.equal(openChest(round,x,y).changed,false);
  assert.equal(round.run.carried[reward[1]],1);
  const extracted=structuredClone(round);
  extracted.run.x=extracted.run.exit.x;extracted.run.y=extracted.run.exit.y;
  const won=extract(extracted);
  assert.equal(won.changed,true);
  assert.equal(won.state.meta.stash[reward[1]],1);
  assert.equal(won.state.run,null);
  assert.ok(validateSave(won.state));
  const lost=recall(round);
  assert.equal(lost.state.meta.stash[reward[1]]||0,0);
  assert.ok(validateSave(lost.state));
});

test("GAME-095B2: old B1 level-2 saves never regenerate enemies or rewards",()=>{
  const input=entry(19);
  const vanilla=generateDeepLayout(deepFloorSeed(19,2));
  const existing=structuredClone(input);
  // Reproduce historical B1 transition, without the new balance marker.
  existing.run={...existing.run,
    x:vanilla.start.x,y:vanilla.start.y,
    floorDepth:2,layoutId:vanilla.layoutId,
    map:vanilla.map,loot:vanilla.loot,lootPlanVersion:1,
    rooms:vanilla.rooms,doors:vanilla.doors,doorPlanVersion:vanilla.doorPlanVersion,
    geometryVersion:vanilla.geometryVersion,
    topologyVersion:vanilla.topologyVersion,
    links:vanilla.links,networkKind:vanilla.networkKind,
    start:vanilla.start,exit:vanilla.exit,
    enemies:vanilla.enemies,exploration:{seen:[]},
    secrets:vanilla.secrets,traps:vanilla.traps,sites:vanilla.sites};
  // The B1 save was recorded before GAME-101D introduced extra encounters.
  // Its simulated old floor must not inherit current-floor encounter markers.
  delete existing.run.encounterPlanVersion;
  delete existing.run.encounters;
  existing.meta.bestDepth=2;
  assert.equal(existing.run.depthBalanceVersion,undefined);
  assert.ok(validateSave(existing));
  const json=JSON.stringify(existing);
  const restored=normalizeJournal(JSON.parse(json));
  assert.ok(validateSave(restored));
  assert.deepEqual(restored.run.loot,vanilla.loot);
  assert.equal(restored.run.enemies.filter(e=>e.kind==="charognard").length,2);
  assert.equal(restored.run.depthBalanceVersion,undefined);
  assert.deepEqual(restored.run.map,vanilla.map);
  // A future descent is balanced, but an old current floor is never touched.
  const resumed=nextFloor(restored);
  assert.equal(resumed.run.depthBalanceVersion,1);
  assert.equal(resumed.run.floorDepth,3);
});

test("GAME-095B2: malformed balance markers fail closed without modifying state",()=>{
  const active=nextFloor(entry(2));
  for(const version of [null,-1,0,2,"1",{},[]]){
    const bad=structuredClone(active);
    bad.run.depthBalanceVersion=version;
    assert.equal(validateSave(bad),false,"marker "+JSON.stringify(version));
  }
  const shallow=structuredClone(active);
  shallow.run.floorDepth=1;
  assert.equal(validateSave(shallow),false);
  const tutorial=beginRun(newGame()).state;
  tutorial.run.depthBalanceVersion=1;
  assert.equal(validateSave(tutorial),false);
  assert.equal(active.run.depthBalanceVersion,1);
  assert.ok(validateSave(active));
});

test("GAME-095B2: Android forecast, offline PWA and programmatic tests stay in sync",()=>{
  const file=path=>readFileSync(new URL("../docs/"+path,import.meta.url),"utf8");
  const app=file("app.js"),sw=file("sw.js");
  assert.match(app,/depthIntel\(run\.floorDepth\+1\)/);
  assert.match(app,/forecast\.risk/);
  assert.match(app,/forecast\.prize/);
  assert.match(sw,/"\.\/depth-balance\.js"/);
  const packageJson=readFileSync(new URL("../package.json",import.meta.url),"utf8");
  assert.match(packageJson,/game095b2-depth-balance\.test\.mjs/);
});
