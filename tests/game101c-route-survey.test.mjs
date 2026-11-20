// GAME-101C — A paid, one-shot sketch gives retreat information, not radar.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {generateDeepLayout,validateDeepLayout} from "../docs/deep-dungeon.js";
import {retreatSketchCells,RETREAT_SKETCH_LIMIT} from "../docs/route-survey.js";
import {ROOM_SITES,nearbyRoomSite} from "../docs/room-events.js";
import {newGame,beginRun,resolveRoomSite,inspectTile,validateSave,normalizeJournal,
  mapText,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";
import {revealAround,visibleCells,visionKey,minimapText} from "../docs/exploration-visibility.js";

const key=p=>p.x+","+p.y;
const original=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const deep=seed=>{const s=newGame();s.meta.descents=seed-1;return beginRun(s).state;};
function workshop(seed=2){
  const state=structuredClone(deep(seed)),site=state.run.sites.find(s=>s.kind==="atelier");
  state.run.enemies=[]; // Enemy phase is separately tested; keep outcome deterministic.
  const adjacent=[[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dx,dy])=>({x:site.x+dx,y:site.y+dy}))
    .find(p=>state.run.map[p.y]?.[p.x]==="."&&
      !state.run.traps.some(t=>key(t)===key(p)));
  assert.ok(adjacent,"workshop must be reachable");
  state.run.x=adjacent.x;state.run.y=adjacent.y;
  revealAround(state.run);
  assert.ok(validateSave(state));
  assert.equal(nearbyRoomSite(state.run)?.id,site.id);
  return {state,site};
}
test("GAME-101C: 80 procedurally generated sketches follow walkable geometry without information leaks",()=>{
  for(let seed=2;seed<82;seed++){
    const layout=generateDeepLayout(seed);
    assert.ok(validateDeepLayout(layout),String(seed));
    assert.equal(layout.scoutingPlanVersion,1);
    assert.deepEqual(generateDeepLayout(seed),layout,"deterministic "+seed);
    const s=deep(seed),run=s.run;
    assert.equal(run.scoutingPlanVersion,1);
    const before=JSON.stringify(run),cells=retreatSketchCells(run);
    assert.equal(JSON.stringify(run),before,"pure route planner");
    assert.ok(cells.length>0&&cells.length<=RETREAT_SKETCH_LIMIT,seed);
    const unique=new Set(cells.map(key));
    assert.equal(unique.size,cells.length);
    for(const p of cells){
      assert.equal(run.map[p.y][p.x],".","only neutral floors");
      assert.ok(!run.sites.some(site=>key(site)===key(p)),"never reveal event sites");
      assert.ok(!Object.hasOwn(run.loot,key(p)),"never reveal a chest");
      assert.ok(!run.doors.some(door=>key(door)===key(p)),"never reveal a door");
    }
  }
});
test("GAME-101C: sketch is exclusive, costs one exposed turn and persists under the fog",()=>{
  const {state,site}=workshop(2);
  const before=JSON.stringify(state),start=state.run.endurance;
  const known=new Set(state.run.exploration.seen),visible=visibleCells(state.run);
  const outcome=resolveRoomSite(state,site.id,"cartographie");
  assert.ok(outcome.changed);
  assert.equal(JSON.stringify(state),before);
  assert.equal(outcome.state.run.turns,state.run.turns+1);
  assert.equal(outcome.state.run.endurance,start-2);
  assert.equal(outcome.state.meta.hero.xp,state.meta.hero.xp+1);
  assert.equal(outcome.state.run.rngState,state.run.rngState);
  assert.equal(outcome.state.run.sites.find(s=>s.id===site.id).choice,"cartographie");
  const newly=outcome.state.run.exploration.seen.filter(n=>!known.has(n));
  assert.ok(newly.length>0,"newly annotated corridor");
  const mini=minimapText(outcome.state.run).split("\n");
  const glyph=mapText(outcome.state).split("\n");
  const width=outcome.state.run.map[0].length;
  for(const n of newly){
    const x=n%width,y=Math.floor(n/width);
    assert.equal(outcome.state.run.map[y][x],".");
    if(!visible.has(n)){
      assert.equal(mini[y][x],":","remembered-only minimap");
      assert.equal(glyph[y][x],":","remembered-only ASCII map");
      assert.equal(inspectTile(outcome.state,x,y).kind,"memory");
    }
  }
  assert.ok(validateSave(outcome.state));
  const reload=normalizeJournal(JSON.parse(JSON.stringify(outcome.state)));
  assert.ok(validateSave(reload));
  assert.deepEqual(reload.run.exploration.seen,outcome.state.run.exploration.seen);
  assert.equal(resolveRoomSite(reload,site.id,"bandage").changed,false);
});
test("GAME-101C: legacy saved descents and invalid interactions fail without a turn",()=>{
  const {state,site}=workshop(2);
  const missing=structuredClone(state);delete missing.run.scoutingPlanVersion;
  delete missing.run.encounterPlanVersion;delete missing.run.encounters; // Historical run.
  assert.ok(validateSave(missing));
  assert.equal(resolveRoomSite(missing,site.id,"cartographie").changed,false);
  const exhausted=structuredClone(state);exhausted.run.endurance=1;
  assert.ok(validateSave(exhausted));
  assert.equal(resolveRoomSite(exhausted,site.id,"cartographie").changed,false);
  const remote=structuredClone(state);remote.run.x=remote.run.start.x;
  remote.run.y=remote.run.start.y;revealAround(remote.run);
  assert.equal(resolveRoomSite(remote,site.id,"cartographie").changed,false);
  const chosen=resolveRoomSite(state,site.id,"cartographie").state;
  const forged=structuredClone(chosen);delete forged.run.scoutingPlanVersion;
  assert.equal(validateSave(forged),false);
  const fake=structuredClone(state);fake.run.scoutingPlanVersion=2;
  assert.equal(validateSave(fake),false);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
});
test("GAME-101C: UI gating, offline module and existing workshop alternatives",()=>{
  assert.equal(ROOM_SITES.atelier.options.cartographie.endurance,2);
  assert.equal(ROOM_SITES.atelier.options.cartographie.item,null);
  const app=original("../docs/app.js"),game=original("../docs/game.js");
  const sw=original("../docs/sw.js"),pkg=original("../package.json");
  assert.ok(app.includes('choice==="cartographie"'));
  assert.ok(game.includes('surveyRetreatSketch(s.run)'));
  assert.ok(sw.includes('"./route-survey.js"'));
  assert.ok(pkg.includes('tests/game101c-route-survey.test.mjs'));
  assert.ok(ROOM_SITES.atelier.options.bandage);
  assert.ok(ROOM_SITES.atelier.options.fragment);
});
