import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  MAX_FLOOR_DEPTH,deepFloorSeed,floorChoiceAvailable,canDescendFurther
} from "../docs/floors.js";
import {
  newGame,beginRun,move,resolveFloorExit,recall,
  validateSave,normalizeJournal,SAVE_KEY,SCHEMA_VERSION,
  inventoryCount,MAX_HP
} from "../docs/game.js";
import {
  generateDeepLayout,validateDeepLayout,deepRoute,deepTwoReturnWays
} from "../docs/deep-dungeon.js";

const key=p=>p.x+","+p.y;
const directions={"1,0":"right","-1,0":"left","0,1":"down","0,-1":"up"};
function startMultifloor(descents=2,gear=[]){
  const hero=newGame();
  hero.meta.descents=descents-1;
  return beginRun(hero,gear,null,{multiFloor:true}).state;
}
function stepOntoExit(original){
  const state=structuredClone(original);
  const exit=state.run.exit;
  const candidates=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({
    x:exit.x-dx,y:exit.y-dy,dir:directions[dx+","+dy]
  })).filter(p=>state.run.map[p.y]?.[p.x]==="." &&
     !(state.run.traps||[]).some(t=>t.x===p.x&&t.y===p.y));
  assert.ok(candidates.length,"Need safe approach to Arche");
  state.run.enemies=[];
  state.run.x=candidates[0].x;
  state.run.y=candidates[0].y;
  const event=move(state,candidates[0].dir);
  assert.equal(event.changed,true);
  return {before:state,after:event.state,event};
}

test("GAME-095B1: first tutorial and direct legacy APIs retain auto extraction",()=>{
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  const tutorial=beginRun(newGame(),[],null,{multiFloor:true}).state;
  assert.equal(tutorial.run.map.length,9);
  assert.equal(tutorial.run.floorDepth,undefined);
  assert.ok(validateSave(tutorial));
  const classic=beginRun({...newGame(),meta:{...newGame().meta,descents:1}}).state;
  assert.equal(classic.run.floorDepth,undefined);
  assert.equal(classic.run.lootPlanVersion,1);
  const exited=stepOntoExit(classic);
  assert.equal(exited.after.run,null,"legacy deep map must still auto-extract");
  assert.equal(exited.after.meta.extractions,1);
  assert.ok(validateSave(exited.after));
});

test("GAME-095B1: opting in creates depth 1 without changing current maps or rewards",()=>{
  const fresh=startMultifloor(2);
  assert.equal(fresh.run.floorDepth,1);
  assert.equal(fresh.meta.bestDepth,1);
  assert.deepEqual(fresh.run.map,generateDeepLayout(2).map);
  assert.deepEqual(fresh.run.loot,generateDeepLayout(2).loot);
  assert.equal(fresh.run.turns,0);
  assert.equal(fresh.run.hp,MAX_HP);
  assert.ok(validateSave(fresh));
  const bad={...newGame(),meta:{...newGame().meta,descents:1}};
  for(const opts of [null,3,[],{multiFloor:"yes"}])
    assert.equal(beginRun(bad,[],null,opts).changed,false);
  assert.equal(bad.run,null);
});

test("GAME-095B1: arrival at Arche is safe, explicit, and free of extra RNG",()=>{
  const initial=startMultifloor(2,["weapon.rusty_sword"]);
  initial.run.hp=7;
  initial.run.endurance=3;
  const {before,after,event}=stepOntoExit(initial);
  assert.equal(after.run.floorDepth,1);
  assert.equal(after.run.map[after.run.y][after.run.x],"E");
  assert.equal(after.run.hp,7);
  assert.equal(after.run.endurance,4,"arrival regenerates one endurance like movement");
  assert.equal(after.run.turns,before.run.turns+1);
  assert.equal(after.run.rngState,before.run.rngState);
  assert.ok(floorChoiceAvailable(after.run));
  assert.ok(canDescendFurther(after.run));
  assert.equal(after.meta.stash["weapon.rusty_sword"],0);
  assert.match(event.message,/ARCHE/);
  assert.ok(validateSave(after));
  const wrong=resolveFloorExit(after,"unknown");
  assert.equal(wrong.changed,false);
  assert.equal(wrong.state,after);
  const blocked=resolveFloorExit(initial,"descend");
  assert.equal(blocked.changed,false);
});

test("GAME-095B1: descending transfers gear, injuries, turns and RNG; wipes local floor flags",()=>{
  const initial=startMultifloor(2,["weapon.rusty_sword"]);
  const {after:atExit}=stepOntoExit(initial);
  atExit.run.hp=6;
  atExit.run.endurance=2;
  atExit.run.carried["consumable.bandage"]=2;
  atExit.run.collected=["7,7"];
  atExit.run.defense="parry";
  atExit.run.targetId="target-from-floor-one";
  atExit.run.alarmUntil=1234;
  assert.equal(validateSave(atExit),true);
  const old={map:atExit.run.map,loot:atExit.run.loot,rooms:atExit.run.rooms,
    hp:atExit.run.hp,carried:structuredClone(atExit.run.carried),
    turns:atExit.run.turns,rng:atExit.run.rngState};
  const output=resolveFloorExit(atExit,"descend");
  assert.equal(output.changed,true);
  const deep=output.state;
  assert.equal(deep.run.floorDepth,2);
  assert.equal(deep.meta.bestDepth,2);
  assert.equal(deep.run.hp,old.hp);
  assert.equal(deep.run.endurance,2);
  assert.equal(deep.run.enduranceMax,atExit.run.enduranceMax);
  assert.equal(deep.run.turns,old.turns);
  assert.equal(deep.run.rngState,old.rng);
  assert.deepEqual(deep.run.carried,old.carried);
  assert.equal(deep.run.loadout.mainHand,"weapon.rusty_sword");
  assert.deepEqual(deep.run.collected,[]);
  assert.equal(deep.run.targetId,null);
  assert.equal(deep.run.defense,"none");
  assert.equal(deep.run.alarmUntil,0);
  assert.ok(!deep.run.secrets.some(x=>x.revealed));
  assert.ok(!deep.run.traps.some(x=>x.status!=="hidden"));
  assert.ok(deep.run.sites.every(x=>x.status==="untouched"));
  assert.equal(deep.run.map[deep.run.y][deep.run.x],"S");
  assert.notDeepEqual(deep.run.map,old.map);
  assert.notDeepEqual(deep.run.loot,old.loot);
  assert.deepEqual(deep.run.map,generateDeepLayout(deepFloorSeed(2,2)).map);
  assert.equal(deep.meta.hero.xp,atExit.meta.hero.xp+1);
  assert.ok(inventoryCount(deep)>0);
  assert.ok(validateSave(deep));
  assert.equal(JSON.stringify(atExit.run.loot),JSON.stringify(old.loot),
    "transition cannot mutate previous run");
  const replay=normalizeJournal(JSON.parse(JSON.stringify(deep)));
  assert.equal(replay.run.floorDepth,2);
  assert.deepEqual(replay.run.map,deep.run.map);
  assert.deepEqual(replay.run.loot,deep.run.loot);
  assert.ok(validateSave(replay));
});

test("GAME-095B1: third floor is terminal, extraction secures all carried quantities",()=>{
  const run=startMultifloor(2,["weapon.rusty_sword"]);
  const one=stepOntoExit(run).after;
  const two=resolveFloorExit(one,"descend").state;
  const twoAtExit=stepOntoExit(two).after;
  const three=resolveFloorExit(twoAtExit,"descend").state;
  assert.equal(three.run.floorDepth,3);
  assert.equal(three.meta.bestDepth,3);
  const saved=normalizeJournal(JSON.parse(JSON.stringify(three)));
  assert.ok(validateSave(saved));
  const last=stepOntoExit(saved).after;
  assert.ok(floorChoiceAvailable(last.run));
  assert.equal(canDescendFurther(last.run),false);
  const forbidden=resolveFloorExit(last,"descend");
  assert.equal(forbidden.changed,false);
  assert.equal(forbidden.state,last);
  const won=resolveFloorExit(last,"extract");
  assert.equal(won.changed,true);
  assert.equal(won.state.run,null);
  assert.equal(won.state.meta.extractions,1);
  assert.equal(won.state.meta.bestDepth,3);
  assert.equal(won.state.meta.stash["weapon.rusty_sword"],1);
  assert.equal(won.state.meta.hero.xp,three.meta.hero.xp+2);
  assert.ok(validateSave(won.state));
});

test("GAME-095B1: recall loses entire multi-floor bag but keeps permanent depth record",()=>{
  const run=stepOntoExit(startMultifloor(3,["weapon.rusty_sword"])).after;
  const atTwo=resolveFloorExit(run,"descend").state;
  assert.equal(atTwo.meta.stash["weapon.rusty_sword"],0);
  const lost=recall(atTwo);
  assert.equal(lost.state.run,null);
  assert.equal(lost.state.meta.stash["weapon.rusty_sword"],0);
  assert.equal(lost.state.meta.bestDepth,2);
  assert.equal(lost.state.meta.recalls,1);
  assert.ok(validateSave(lost.state));
});

test("GAME-095B1: malformed optional depth markers are rejected; old saves are untouched",()=>{
  const original=startMultifloor(4);
  for(const floorDepth of [0,-1,4,1.5,"2",null]){
    const bad=structuredClone(original);
    bad.run.floorDepth=floorDepth;
    assert.equal(validateSave(bad),false,String(floorDepth));
  }
  const wrongMap=structuredClone(original);
  wrongMap.run.lootPlanVersion=undefined;
  assert.equal(validateSave(wrongMap),false);
  const badRecord=structuredClone(original);
  badRecord.meta.bestDepth=9;
  assert.equal(validateSave(badRecord),false);
  const old=beginRun({...newGame(),meta:{...newGame().meta,descents:2}}).state;
  assert.equal(old.run.floorDepth,undefined);
  assert.equal(old.meta.bestDepth,undefined);
  assert.ok(validateSave(old));
  assert.deepEqual(normalizeJournal(JSON.parse(JSON.stringify(old))).run.loot,old.run.loot);
});

test("GAME-095B1: 32 two-floor seed paths remain deterministic, extractable and distinct",()=>{
  const keys=new Set();
  for(let n=2;n<=33;n++){
    const first=generateDeepLayout(deepFloorSeed(n,1));
    const second=generateDeepLayout(deepFloorSeed(n,2));
    const third=generateDeepLayout(deepFloorSeed(n,3));
    const ids=[first.layoutId,second.layoutId,third.layoutId];
    assert.equal(new Set(ids).size,3,"distinct layout IDs "+n);
    for(const layout of [first,second,third]){
      assert.ok(validateDeepLayout(layout));
      assert.ok(deepRoute(layout.map,layout.start,layout.exit,
        new Set(layout.enemies.map(key))));
      assert.ok(deepTwoReturnWays(layout.map,layout.start,layout.exit));
      keys.add(layout.map.join(""));
    }
  }
  assert.ok(keys.size>75,"multi-floor topology should remain varied");
});

test("GAME-095B1: Android controls and PWA asset are wired",()=>{
  const read=name=>readFileSync(new URL("../docs/"+name,import.meta.url),"utf8");
  const html=read("index.html"),app=read("app.js"),sw=read("sw.js");
  for(const id of ["floor-choice","floor-choice-title","floor-extract",
    "floor-descend","floor-hud","floor-depth","refuge-depth-record"])
    assert.ok(html.includes('id="'+id+'"'),"missing UI "+id);
  assert.match(app,/beginRun\(state,preparationCounts\(\),preparedChoice\(\),\{multiFloor:true\}\)/);
  assert.match(app,/resolveFloorExit\(state,"descend"\)/);
  assert.match(app,/resolveFloorExit\(state,"extract"\)/);
  assert.match(sw,/"\.\/floors\.js"/);
  assert.equal(MAX_FLOOR_DEPTH,3);
});
