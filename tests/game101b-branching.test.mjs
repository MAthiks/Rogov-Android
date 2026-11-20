// GAME-101B — The fork is physical, readable, fair and save-compatible.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {generateDeepLayout,validateDeepLayout,deepRoute} from "../docs/deep-dungeon.js";
import {branchClue,branchOverview} from "../docs/branch-intel.js";
import {ROOM_SITES,nearbyRoomSite} from "../docs/room-events.js";
import {newGame,beginRun,validateSave,normalizeJournal,inspectTile,
  resolveRoomSite,SCHEMA_VERSION,SAVE_KEY} from "../docs/game.js";
import {revealAround,visibleCells,visionKey} from "../docs/exploration-visibility.js";

const key=p=>p.x+","+p.y;
const deep=seed=>{
  const s=newGame();s.meta.descents=seed-1;
  return beginRun(s).state;
};
const src=p=>readFileSync(new URL(p,import.meta.url),"utf8");
test("GAME-101B: generated forks offer east supply, north guarded cache",()=>{
  for(let seed=2;seed<82;seed++){
    const layout=generateDeepLayout(seed);
    assert.deepEqual(generateDeepLayout(seed),layout,"deterministic "+seed);
    assert.ok(validateDeepLayout(layout),String(seed));
    assert.equal(layout.branchPlanVersion,1);
    assert.equal(layout.sites.length,3);
    const entry=layout.rooms.find(r=>r.slot===8);
    const atelier=layout.rooms.find(r=>r.slot===10);
    const guarded=layout.rooms.find(r=>r.slot===4);
    assert.equal(atelier.role,"atelier_abandonne");
    assert.equal(guarded.role,"cache_scellee");
    assert.equal(layout.sites.find(s=>s.kind==="atelier").roomId,atelier.id);
    assert.equal(layout.sites.find(s=>s.kind==="cache").roomId,guarded.id);
    const blocked=new Set([...layout.traps,...layout.enemies].map(key));
    for(const site of layout.sites)
      assert.ok(deepRoute(layout.map,layout.start,site,blocked),
        "optional branch site accessible "+seed+":"+site.kind);
    const entryDoors=layout.doors.filter(d=>d.x>=entry.x&&d.x<entry.x+entry.width&&
      d.y>=entry.y&&d.y<entry.y+entry.height);
    assert.equal(entryDoors.length,2);
    assert.ok(entryDoors.some(d=>d.y===entry.y),"north branch");
    assert.ok(entryDoors.some(d=>d.x===entry.x+entry.width-1),"east branch");
    const preview={...layout,x:layout.start.x,y:layout.start.y,exploration:{seen:[]}};
    for(const d of entryDoors){
      const actuallyVisible=visibleCells(preview).has(visionKey(preview,d.x,d.y));
      assert.equal(Boolean(branchClue(preview,d.x,d.y)),actuallyVisible);
    }
  }
});
test("GAME-101B: clues only describe actually visible doors, not fog content",()=>{
  const s=deep(2),run=s.run,entry=run.rooms.find(r=>r.slot===8);
  assert.ok(validateSave(s));
  const doors=run.doors.filter(d=>d.x>=entry.x&&d.x<entry.x+entry.width&&
    d.y>=entry.y&&d.y<entry.y+entry.height);
  for(const door of doors){
    const cue=branchClue(run,door.x,door.y);
    if(!cue)continue;
    assert.ok(["supply","danger"].includes(cue.kind));
    assert.doesNotMatch(cue.description,/guardian|charognard|shield|x:|y:|\d+,\d+/i);
    assert.match(inspectTile(s,door.x,door.y).description,/Porte ordinaire/);
  }
  assert.equal(branchClue(run,0,0),null);
  const old=structuredClone(s);delete old.run.branchPlanVersion;
  assert.ok(validateSave(old));
  assert.equal(branchOverview(old.run),null);
  assert.equal(branchClue(old.run,doors[0].x,doors[0].y),null);
  const hidden=structuredClone(s);
  hidden.run.x=hidden.run.exit.x;hidden.run.y=hidden.run.exit.y;
  assert.equal(branchOverview(hidden.run),null);
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(SAVE_KEY,"rogov-web-v1");
});
test("GAME-101B: guarded reward is exclusive, consumes 1 turn / 3 END",()=>{
  const s=deep(2),cache=s.run.sites.find(p=>p.kind==="cache");
  assert.ok(cache);
  s.run.enemies=[]; // Isolate the interaction; combat behavior has separate tests.
  const neighbor=[[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dx,dy])=>({x:cache.x+dx,y:cache.y+dy}))
    .find(p=>s.run.map[p.y]?.[p.x]==="."&&
      !s.run.traps.some(t=>key(t)===key(p)));
  assert.ok(neighbor);
  s.run.x=neighbor.x;s.run.y=neighbor.y;revealAround(s.run);
  assert.equal(nearbyRoomSite(s.run)?.id,cache.id);
  assert.ok(validateSave(s));
  const before=JSON.stringify(s),stamina=s.run.endurance;
  const result=resolveRoomSite(s,cache.id,"buckler");
  assert.equal(result.changed,true);
  assert.equal(JSON.stringify(s),before,"input unchanged");
  assert.equal(result.state.run.turns,s.run.turns+1);
  assert.equal(result.state.run.endurance,stamina-3);
  assert.equal(result.state.run.carried["shield.worn_buckler"],1);
  assert.equal(result.state.meta.hero.xp,s.meta.hero.xp+2);
  assert.equal(result.state.run.rngState,s.run.rngState);
  assert.equal(result.state.run.sites.find(p=>p.id===cache.id).choice,"buckler");
  assert.ok(validateSave(result.state));
  const reloaded=normalizeJournal(JSON.parse(JSON.stringify(result.state)));
  assert.ok(validateSave(reloaded));
  assert.equal(resolveRoomSite(reloaded,cache.id,"fragment").changed,false);
  const noStamina=structuredClone(s);noStamina.run.endurance=2;
  assert.equal(resolveRoomSite(noStamina,cache.id,"buckler").changed,false);
  const old=structuredClone(s);delete old.run.branchPlanVersion;
  assert.ok(validateSave(old));
  assert.equal(resolveRoomSite(old,cache.id,"buckler").changed,false);
  const forged=structuredClone(result.state);delete forged.run.branchPlanVersion;
  assert.equal(validateSave(forged),false,"older runs cannot claim new rare option");
});
test("GAME-101B: existing Android/UI and offline entry points are preserved",()=>{
  const html=src("../docs/index.html"),app=src("../docs/app.js"),
    sw=src("../docs/sw.js"),css=src("../docs/game101.css"),
    game=src("../docs/game.js");
  assert.ok(html.includes('id="game101-branch-hint"'));
  assert.ok(app.includes("branchOverview(run)"));
  assert.ok(app.includes('choice==="buckler"'));
  assert.ok(game.includes("branchClue(state.run,x,y)"));
  assert.ok(sw.includes('"./branch-intel.js"'));
  assert.ok(css.includes(".game101-branch-hint"));
  assert.equal(ROOM_SITES.cache.options.buckler.endurance,3);
});
