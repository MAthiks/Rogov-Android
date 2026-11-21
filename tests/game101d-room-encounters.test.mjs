// GAME-101D: real optional encounters, risk/reward and legacy saves.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {generateDeepLayout,validateDeepLayout,deepRoute,deepTwoReturnWays} from "../docs/deep-dungeon.js";
import {ROOM_SITES,roomSiteAppearance,nearbyRoomSite,validRoomSites} from "../docs/room-events.js";
import {encounterRoomPlan,validRoomEncounters} from "../docs/room-encounters.js";
import {newGame,beginRun,resolveRoomSite,inspectTile,validateSave,normalizeJournal,
  mapText,MAX_HP,SAVE_KEY,SCHEMA_VERSION,INVENTORY_LIMIT} from "../docs/game.js";
import {revealAround,minimapText,explorationState,validExploration} from "../docs/exploration-visibility.js";
import {validTraps} from "../docs/traps.js";
import {validSecrets} from "../docs/secrets.js";
import {retreatSketchCells} from "../docs/route-survey.js";
import {expeditionReport} from "../docs/expedition-report.js";

const key=p=>p.x+","+p.y;
const src=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const deep=(seed=2)=>{const state=newGame();state.meta.descents=seed-1;return beginRun(state).state;};
function beside(kind,seed=2){
  const state=structuredClone(deep(seed)),site=state.run.encounters.find(s=>s.kind===kind);
  state.run.enemies=[]; // Isolate site actions from existing combat AI.
  const p=[[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dx,dy])=>({x:site.x+dx,y:site.y+dy}))
    .find(pos=>state.run.map[pos.y]?.[pos.x]==="."&&
      !state.run.traps.some(t=>key(t)===key(pos)));
  assert.ok(p,kind+" approachable");
  state.run.x=p.x;state.run.y=p.y;revealAround(state.run);
  assert.equal(nearbyRoomSite(state.run)?.id,site.id);
  assert.ok(validateSave(state));
  return {state,site};
}
test("GAME-101D: 80 seeds keep 3 historical sites plus 2 distinct safe encounters",()=>{
  const positions=new Set(),campRooms=new Set();
  for(let seed=2;seed<82;seed++){
    const layout=generateDeepLayout(seed);
    assert.ok(validateDeepLayout(layout),"seed "+seed);
    assert.equal(layout.encounterPlanVersion,1);
    assert.equal(layout.sites.length,3);
    assert.equal(layout.encounters.length,2);
    assert.deepEqual(layout.encounters.map(s=>s.kind),["camp","signal"]);
    assert.deepEqual(generateDeepLayout(seed),layout,"determinism");
    const planned=encounterRoomPlan(layout,seed);
    assert.deepEqual(layout.encounters.map(s=>s.roomId),planned.map(p=>p.room.id));
    const blocked=new Set([...layout.enemies,...layout.traps].map(key));
    for(const s of layout.encounters){
      assert.equal(s.status,"untouched");
      assert.equal(layout.map[s.y][s.x],".");
      assert.ok(!layout.sites.some(old=>key(old)===key(s)));
      assert.ok(!layout.traps.some(t=>key(t)===key(s)));
      assert.ok(!Object.hasOwn(layout.loot,key(s)));
      assert.ok(deepRoute(layout.map,layout.start,s,blocked));
      assert.ok(deepRoute(layout.map,s,layout.exit,blocked));
      assert.ok(deepTwoReturnWays(layout.map,s,layout.exit));
      positions.add(s.kind+":"+key(s));
    }
    campRooms.add(layout.rooms[layout.encounters[0].roomId].slot);
  }
  assert.ok(campRooms.size>=2,"camp migrates between rooms");
  assert.ok(positions.size>=12,"sites vary across seeds");
});
test("GAME-101D: camp healing or bandage is a paid, exclusive, persistent choice",()=>{
  const {state,site}=beside("camp");state.run.hp=7;
  assert.ok(validateSave(state));
  const before=JSON.stringify(state),endurance=state.run.endurance;
  const result=resolveRoomSite(state,site.id,"treat");
  assert.equal(result.changed,true);
  assert.equal(JSON.stringify(state),before);
  assert.equal(result.state.run.hp,10);
  assert.equal(result.state.run.turns,1);
  assert.equal(result.state.run.endurance,endurance-2);
  assert.equal(result.state.meta.hero.xp,state.meta.hero.xp+1);
  assert.equal(result.state.run.rngState,state.run.rngState);
  assert.equal(result.state.run.encounters[0].choice,"treat");
  assert.ok(validateSave(result.state));
  const persisted=normalizeJournal(JSON.parse(JSON.stringify(result.state)));
  assert.ok(validateSave(persisted));
  assert.equal(resolveRoomSite(persisted,site.id,"gather").changed,false);
  const full=structuredClone(state);full.run.hp=MAX_HP;
  assert.equal(resolveRoomSite(full,site.id,"treat").changed,false);
  const resource=resolveRoomSite(full,site.id,"gather");
  assert.equal(resource.changed,true);
  assert.equal(resource.state.run.carried["consumable.bandage"],1);
  assert.ok(validateSave(resource.state));
});
test("GAME-101D: signal rewards quiet salvage or a five-turn Charognard alarm",()=>{
  let quietRun;
  for(const [choice,expected] of Object.entries({
    quiet:{item:"consumable.vigor_salts",xp:1,endurance:1,alarm:undefined},
    alarm:{item:"relic.ashen_fragment",xp:2,endurance:3,alarm:6}
  })){
    const {state,site}=beside("signal"),rng=state.run.rngState;
    const result=resolveRoomSite(state,site.id,choice);
    assert.equal(result.changed,true);
    assert.equal(result.state.run.turns,1);
    assert.equal(result.state.run.endurance,state.run.endurance-expected.endurance);
    assert.equal(result.state.run.carried[expected.item],1);
    assert.equal(result.state.meta.hero.xp,state.meta.hero.xp+expected.xp);
    assert.equal(result.state.run.alarmUntil,expected.alarm);
    assert.equal(result.state.run.rngState,rng);
    assert.equal(result.state.run.encounters[1].choice,choice);
    assert.ok(validTraps(result.state.run),"Paid alarm or quiet choice must pass trap save validation");
    const forgedLong=structuredClone(result.state);
    forgedLong.run.alarmUntil=forgedLong.run.turns+6;
    assert.equal(validateSave(forgedLong),false,
      "No signal may forge more than five alert turns");
    if(choice==="quiet"){
      const forgedOld=structuredClone(result.state);
      forgedOld.run.alarmUntil=forgedOld.run.turns+4;
      assert.equal(validateSave(forgedOld),false,
        "A quiet signal cannot grant extended Charognard alert");
    }
    assert.ok(validateSave(result.state),JSON.stringify({
      choice,siteStatus:result.state.run.encounters[1],
      validSites:validRoomSites(result.state.run),
      validTraps:validTraps(result.state.run),
      validSecrets:validSecrets(result.state.run),
      validExploration:validExploration(result.state.run),
      twoReturn:deepTwoReturnWays(result.state.run.map,result.state.run.start,result.state.run.exit),
      diff:quietRun?Object.keys(result.state.run).filter(k=>JSON.stringify(result.state.run[k])!==JSON.stringify(quietRun[k])):[],
      validEncounters:validRoomEncounters(result.state.run),
      validLayout:validateDeepLayout(result.state.run,true),
      run: {turns:result.state.run.turns,hp:result.state.run.hp,
        endurance:result.state.run.endurance,alarmUntil:result.state.run.alarmUntil,
        carried:result.state.run.carried},
      hero:result.state.meta.hero,journal:result.state.journal[0]
    }));
    if(choice==="quiet")quietRun=structuredClone(result.state.run);
    assert.equal(resolveRoomSite(result.state,site.id,choice).changed,false);
  }
});
test("GAME-101D: refusal and tampered new site data never spend free turns",()=>{
  const {state,site}=beside("signal");
  const low=structuredClone(state);low.run.endurance=2;
  assert.equal(resolveRoomSite(low,site.id,"alarm").changed,false);
  const full=structuredClone(state);full.run.carried={"consumable.bandage":INVENTORY_LIMIT};
  assert.ok(validateSave(full));
  assert.equal(resolveRoomSite(full,site.id,"quiet").changed,false);
  const remote=structuredClone(state);remote.run.x=remote.run.start.x;
  remote.run.y=remote.run.start.y;revealAround(remote.run);
  assert.equal(resolveRoomSite(remote,site.id,"quiet").changed,false);
  const forged=structuredClone(state);forged.run.encounters[0].x=0;
  assert.equal(validateSave(forged),false);
  const missing=structuredClone(state);delete missing.run.encounters;
  assert.equal(validateSave(missing),false);
  const legacy=structuredClone(state);
  delete legacy.run.encounterPlanVersion;delete legacy.run.encounters;
  delete legacy.run.combatOpeningVersion;
  delete legacy.run.pursuitPlanVersion; // GAME-101F is absent from historical runs.
  delete legacy.run.reliquaryPlanVersion;
  delete legacy.run.reliquary;
  assert.ok(validateSave(legacy));
  assert.equal(resolveRoomSite(legacy,site.id,"quiet").changed,false);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
});
test("GAME-101D: hidden markers stay hidden; ASCII and minimap reveal local sites",()=>{
  const fresh=deep(),signal=fresh.run.encounters[1];
  assert.equal(explorationState(fresh.run,signal.x,signal.y),"unknown");
  assert.equal(inspectTile(fresh,signal.x,signal.y).kind,"unknown");
  assert.equal(roomSiteAppearance(fresh.run,signal.x,signal.y),null);
  assert.equal(minimapText(fresh.run).split("\n")[signal.y][signal.x]," ");
  assert.equal(retreatSketchCells(fresh.run).some(p=>key(p)===key(signal)),false);
  const {state,site}=beside("signal");
  assert.equal(roomSiteAppearance(state.run,site.x,site.y).sprite,"site_signal");
  assert.equal(inspectTile(state,site.x,site.y).kind,"room-site");
  assert.equal(mapText(state).split("\n")[site.y][site.x],"g");
  assert.equal(minimapText(state.run).split("\n")[site.y][site.x],"g");
  const all=structuredClone(state);
  all.run.exploration.seen=Array.from(
    {length:all.run.map.length*all.run.map[0].length},(_,i)=>i);
  assert.equal(expeditionReport(all).knownSites,6);
  assert.equal(validRoomEncounters(all.run),true);
});
test("GAME-101D: artwork, UI, cache and old interactions remain wired",()=>{
  const art=src("../docs/interaction-art.js"),tiles=src("../docs/tiles.js");
  const sw=src("../docs/sw.js"),app=src("../docs/app.js");
  for(const name of ["site_camp","site_signal"]){
    assert.ok(art.includes(name));
    assert.ok(tiles.includes(name));
  }
  assert.ok(app.includes("rule.requiresDamage&&state.run.hp>=MAX_HP"));
  assert.ok(sw.includes('"./room-encounters.js"'));
  assert.equal(ROOM_SITES.camp.options.treat.heal,3);
  assert.equal(ROOM_SITES.signal.options.alarm.alarmTurns,5);
});
