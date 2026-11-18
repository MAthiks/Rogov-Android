import test from "node:test";
import assert from "node:assert/strict";
import {generateDeepLayout,validateDeepLayout,deepRoute} from "../docs/deep-dungeon.js";
import {ROOM_SITES,validRoomSites,nearbyRoomSite,roomSiteAppearance} from "../docs/room-events.js";
import {newGame,beginRun,resolveRoomSite,inspectTile,validateSave,normalizeJournal,mapText,
  INVENTORY_LIMIT} from "../docs/game.js";
import {revealAround} from "../docs/exploration-visibility.js";

const key=p=>p.x+","+p.y;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const at=(seed=2)=>{
  const s=newGame();s.meta.descents=seed-1;
  return beginRun(s).state;
};
const ready=(kind,seed=2)=>{
  const state=structuredClone(at(seed)),site=state.run.sites.find(s=>s.kind===kind);
  // Isolate choices from the combat AI, which is covered by its own suites.
  state.run.enemies=[];
  const neighbors=[[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dx,dy])=>({x:site.x+dx,y:site.y+dy}))
    .filter(p=>state.run.map[p.y]?.[p.x]==="."&&
      !state.run.traps.some(t=>key(t)===key(p)));
  assert.ok(neighbors.length>0);
  state.run.x=neighbors[0].x;state.run.y=neighbors[0].y;
  revealAround(state.run);
  assert.equal(nearbyRoomSite(state.run)?.id,site.id);
  assert.ok(validateSave(state));
  return {state,site};
};

test("DEV-087: 200 procedural deep descents contain three distinct, optional, reachable special sites",()=>{
  const positions=new Set();
  for(let seed=2;seed<202;seed++){
    const l=generateDeepLayout(seed);
    assert.ok(validateDeepLayout(l),"invalid layout "+seed);
    assert.equal(l.sites.length,3);
    assert.deepEqual(l.sites.map(s=>s.kind),["atelier","echo","cache"]);
    assert.ok(validRoomSites({...l,turns:0}));
    const blocked=new Set([...l.traps,...l.enemies].map(key));
    for(const site of l.sites){
      assert.equal(site.status,"untouched");
      assert.equal(site.choice,null);
      assert.equal(l.map[site.y][site.x],".");
      assert.ok(deepRoute(l.map,l.start,site,blocked),
        "special site accessible without combat or trap "+seed+":"+site.kind);
      assert.ok(!l.traps.some(t=>key(t)===key(site)||key(t.clue)===key(site)));
      assert.ok(!Object.keys(l.loot).includes(key(site)));
      positions.add(site.kind+":"+key(site));
    }
    if([2,37,89,170].includes(seed))
      assert.deepEqual(generateDeepLayout(seed),l,"seed reproducibility "+seed);
  }
  assert.ok(positions.size>=100,"special site positions should vary across seeds");
});

test("DEV-087: visible-only hint, free inspection and one-turn choice cannot farm",()=>{
  const original=at(2),site=original.run.sites.find(s=>s.kind==="atelier");
  assert.ok(validateSave(original));
  assert.equal(nearbyRoomSite(original.run),null);
  assert.equal(roomSiteAppearance(original.run,site.x,site.y),null);
  assert.equal(inspectTile(original,site.x,site.y).kind,"unknown");
  const {state,site:near}=ready("atelier");
  const before=JSON.stringify(state);
  const desc=inspectTile(state,near.x,near.y);
  assert.equal(desc.kind,"room-site");
  assert.equal(desc.name,ROOM_SITES.atelier.name);
  assert.equal(state.run.turns,0,"inspection must not spend turns");
  assert.equal(roomSiteAppearance(state.run,near.x,near.y).symbol,"a");
  const outcome=resolveRoomSite(state,near.id,"fragment");
  assert.ok(outcome.changed);
  assert.equal(JSON.stringify(state),before,"game state is immutable");
  assert.equal(outcome.state.run.turns,1);
  assert.equal(outcome.state.run.sites[0].status,"resolved");
  assert.equal(outcome.state.run.sites[0].choice,"fragment");
  assert.equal(outcome.state.run.carried["relic.ashen_fragment"],1);
  assert.equal(outcome.state.meta.hero.xp,1);
  assert.equal(roomSiteAppearance(outcome.state.run,near.x,near.y).symbol,"v");
  assert.ok(validateSave(outcome.state));
  const restored=normalizeJournal(JSON.parse(JSON.stringify(outcome.state)));
  assert.ok(validateSave(restored));
  assert.equal(nearbyRoomSite(restored.run),null);
  assert.equal(resolveRoomSite(restored,near.id,"bandage").changed,false,
    "choice is exclusive and can never be repeated");
});

test("DEV-087: all three encounters offer genuinely exclusive, balanced choices",()=>{
  for(const kind of ["atelier","echo","cache"]){
    for(const [choice,option] of Object.entries(ROOM_SITES[kind].options)){
      const {state,site}=ready(kind);
      const stamina=state.run.endurance,turn=state.run.turns;
      const rng=state.run.rngState,initialXP=state.meta.hero.xp;
      const result=resolveRoomSite(state,site.id,choice);
      assert.ok(result.changed,kind+":"+choice);
      assert.equal(result.state.run.turns,turn+1);
      assert.equal(result.state.meta.hero.xp,initialXP+option.xp);
      assert.equal(result.state.run.endurance,
        Math.min(stamina+1,state.run.enduranceMax)-(option.endurance?option.endurance+1:0));
      assert.equal(result.state.run.rngState,rng,"events do not consume combat RNG");
      assert.equal(result.state.run.sites.find(s=>s.id===site.id).choice,choice);
      if(option.item)assert.equal(result.state.run.carried[option.item],1);
      assert.ok(validateSave(result.state));
    }
  }
});

test("DEV-087: full bag, insufficient stamina and remote choices are rejected free",()=>{
  const {state,site}=ready("atelier");
  const full=structuredClone(state);
  full.run.carried={"consumable.bandage":INVENTORY_LIMIT};
  assert.ok(validateSave(full));
  assert.equal(resolveRoomSite(full,site.id,"fragment").changed,false);
  assert.equal(full.run.turns,0);
  assert.equal(resolveRoomSite(state,site.id,"nonexistent").changed,false);
  const remote=structuredClone(state);
  remote.run.x=remote.run.start.x;remote.run.y=remote.run.start.y;
  revealAround(remote.run);
  assert.equal(resolveRoomSite(remote,site.id,"fragment").changed,false);
  const {state:echo,site:echoSite}=ready("echo");
  echo.run.endurance=1;
  assert.ok(validateSave(echo));
  assert.equal(resolveRoomSite(echo,echoSite.id,"resonance").changed,false);
  assert.equal(echo.run.sites[1].status,"untouched");
});

test("DEV-087: legacy saves never gain room sites; tampered choices cannot enter game",()=>{
  const old=at(2);delete old.run.sites;
  assert.ok(validateSave(old),"older active deep save remains valid");
  assert.equal(nearbyRoomSite(old.run),null);
  assert.ok(validateSave(normalizeJournal(JSON.parse(JSON.stringify(old)))));
  const intro=beginRun(newGame()).state;
  assert.equal(intro.run.sites,undefined);
  assert.ok(validateSave(intro));
  const baseline=at(2);
  for(const mutate of [
    t=>t[0].kind="unknown",
    t=>t[0].x=0,
    t=>t[0].roomId=1,
    t=>t[0].status="resolved",
    t=>{t[0].status="resolved";t[0].choice="another_choice";},
    t=>{t[0].choice="fragment";},
    t=>t[1].x=t[0].x,
    t=>t.pop()
  ]){
    const forged=structuredClone(baseline);
    mutate(forged.run.sites);
    assert.equal(validateSave(forged),false,"malformed room site rejected");
  }
});
