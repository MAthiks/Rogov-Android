// GAME-101G — one optional larva-side reward, meaningful combat/no-combat choice.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {generateDeepLayout,deepRoute,deepTwoReturnWays,validateDeepLayout} from "../docs/deep-dungeon.js";
import {RELIQUARY_PLAN_VERSION,RELIQUARY_WARDEN_ID,validReliquary,reliquaryWardenAlive}
  from "../docs/reliquary.js";
import {newGame,beginRun,resolveRoomSite,validateSave,normalizeJournal,
  SAVE_KEY,SCHEMA_VERSION,INVENTORY_LIMIT,inspectTile,mapText} from "../docs/game.js";
import {revealAround,explorationState,minimapText} from "../docs/exploration-visibility.js";
import {nearbyRoomSite,roomSiteAppearance} from "../docs/room-events.js";
import {expeditionReport} from "../docs/expedition-report.js";
const key=p=>p.x+","+p.y;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const directions=[[1,0],[-1,0],[0,1],[0,-1]];
function fresh(seed=2){
  const s=newGame();s.meta.descents=seed-1;
  return beginRun(s,["weapon.rusty_sword"]).state;
}
function approach(seed=2){
  const state=fresh(seed),reliquary=state.run.reliquary;
  const at=directions.map(([dx,dy])=>({x:reliquary.x+dx,y:reliquary.y+dy}))
    .find(p=>state.run.map[p.y]?.[p.x]==="."&&
      !state.run.traps.some(t=>key(t)===key(p))&&
      !state.run.enemies.some(e=>key(e)===key(p)));
  assert.ok(at,"one safe adjacent approach");
  state.run.x=at.x;state.run.y=at.y;revealAround(state.run);
  assert.equal(nearbyRoomSite(state.run)?.id,reliquary.id);
  assert.ok(validateSave(state));
  return state;
}
test("GAME-101G: 50 seeded maps preserve optional paths and four enemies",()=>{
  const rooms=new Set();
  assert.equal(RELIQUARY_PLAN_VERSION,1);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  for(let seed=2;seed<52;seed++){
    const layout=generateDeepLayout(seed);
    assert.equal(layout.reliquaryPlanVersion,1);
    assert.equal(layout.sites.length,3);
    assert.equal(layout.encounters.length,2);
    assert.equal(layout.enemies.length,4);
    assert.ok(validateDeepLayout(layout),"seed "+seed);
    assert.deepEqual(generateDeepLayout(seed),layout);
    const s=layout.reliquary,enemy=layout.enemies.find(e=>e.id===RELIQUARY_WARDEN_ID);
    assert.ok(s&&enemy);
    assert.equal(s.status,"untouched");
    assert.equal(distance(s,enemy)>=2&&distance(s,enemy)<=4,true);
    assert.ok(![...layout.sites,...layout.encounters].some(x=>key(x)===key(s)));
    assert.ok(!layout.traps.some(x=>key(x)===key(s)));
    assert.ok(!layout.secrets.some(x=>key(x)===key(s)));
    const blocked=new Set([...layout.enemies,...layout.traps].map(key));
    assert.ok(deepRoute(layout.map,layout.start,s,blocked));
    assert.ok(deepRoute(layout.map,s,layout.exit,blocked));
    assert.ok(deepTwoReturnWays(layout.map,s,layout.exit));
    rooms.add(s.roomId);
  }
  assert.ok(rooms.size>=2,"side room varies among generated layouts");
});
test("GAME-101G: salvage is one turn, bandage once, +1 XP, no automatic combat",()=>{
  const s=approach(),before=JSON.stringify(s);
  const site=s.run.reliquary;
  assert.ok(reliquaryWardenAlive(s.run));
  const result=resolveRoomSite(s,site.id,"salvage");
  assert.equal(result.changed,true);
  assert.equal(JSON.stringify(s),before);
  assert.equal(result.state.run.turns,1);
  assert.equal(result.state.run.endurance,s.run.endurance+1);
  assert.equal(result.state.run.carried["consumable.bandage"],1);
  assert.equal(result.state.meta.hero.xp,s.meta.hero.xp+1);
  assert.equal(result.state.run.reliquary.choice,"salvage");
  assert.equal(result.state.run.reliquary.status,"resolved");
  assert.equal(resolveRoomSite(result.state,site.id,"unseal").changed,false);
  assert.ok(validateSave(result.state));
  assert.ok(validateSave(normalizeJournal(JSON.parse(JSON.stringify(result.state)))));
});
test("GAME-101G: fight the real warden before the rare fragment; no free bypass",()=>{
  const s=approach(),site=s.run.reliquary;
  assert.equal(resolveRoomSite(s,site.id,"unseal").changed,false);
  const won=structuredClone(s);
  won.run.enemies=won.run.enemies.filter(e=>e.id!==RELIQUARY_WARDEN_ID);
  assert.ok(validateSave(won));
  assert.equal(reliquaryWardenAlive(won.run),false);
  const before=JSON.stringify(won);
  const result=resolveRoomSite(won,site.id,"unseal");
  assert.equal(result.changed,true);
  assert.equal(JSON.stringify(won),before);
  assert.equal(result.state.run.turns,1);
  assert.equal(result.state.run.endurance,won.run.endurance-2);
  assert.equal(result.state.run.carried["relic.ashen_fragment"],1);
  assert.equal(result.state.meta.hero.xp,won.meta.hero.xp+2);
  assert.equal(result.state.run.reliquary.choice,"unseal");
  assert.ok(validateSave(result.state));
  assert.equal(resolveRoomSite(result.state,site.id,"salvage").changed,false);
});
test("GAME-101G: full bag, low stamina, old save, invalid fields and hidden action denied",()=>{
  const state=approach(),site=state.run.reliquary;
  const full=structuredClone(state);full.run.carried={"consumable.bandage":INVENTORY_LIMIT};
  assert.equal(resolveRoomSite(full,site.id,"salvage").changed,false);
  const won=structuredClone(state);
  won.run.enemies=won.run.enemies.filter(e=>e.id!==RELIQUARY_WARDEN_ID);
  won.run.endurance=1;
  assert.equal(resolveRoomSite(won,site.id,"unseal").changed,false);
  const far=fresh();assert.equal(resolveRoomSite(far,far.run.reliquary.id,"salvage").changed,false);
  const old=structuredClone(state);
  delete old.run.reliquaryPlanVersion;delete old.run.reliquary;
  assert.ok(validateSave(old));
  assert.equal(resolveRoomSite(old,site.id,"salvage").changed,false);
  const malformed=structuredClone(state);
  malformed.run.reliquaryPlanVersion=2;
  assert.equal(validateSave(malformed),false);
  const forged=structuredClone(state);forged.run.reliquary.x=0;
  assert.equal(validateSave(forged),false);
});
test("GAME-101G: fog, map, report and sprites expose no hidden reward",()=>{
  const hidden=fresh(),site=hidden.run.reliquary;
  assert.equal(explorationState(hidden.run,site.x,site.y),"unknown");
  assert.equal(inspectTile(hidden,site.x,site.y).kind,"unknown");
  assert.equal(roomSiteAppearance(hidden.run,site.x,site.y),null);
  assert.equal(minimapText(hidden.run).split("\n")[site.y][site.x]," ");
  const seen=approach();
  assert.equal(roomSiteAppearance(seen.run,seen.run.reliquary.x,seen.run.reliquary.y).sprite,"site_reliquary");
  assert.equal(mapText(seen).split("\n")[seen.run.reliquary.y][seen.run.reliquary.x],"r");
  assert.equal(minimapText(seen.run).split("\n")[seen.run.reliquary.y][seen.run.reliquary.x],"r");
  assert.ok(expeditionReport(seen).knownSites>=1);
  assert.ok(validReliquary(seen.run));
});
test("GAME-101G: UI choice is gated, service worker keeps new SVG offline",()=>{
  const src=p=>readFileSync(new URL("../docs/"+p,import.meta.url),"utf8");
  const app=src("app.js"),sw=src("sw.js"),art=src("interaction-art.js"),tiles=src("tiles.js");
  assert.match(app,/rule.requiresWardenDefeated&&reliquaryWardenAlive/);
  assert.match(sw,/"\.\/reliquary\.js"/);
  assert.match(sw,/game101g-reliquary/);
  assert.match(art,/site_reliquary/);
  assert.match(tiles,/site_reliquary/);
});
