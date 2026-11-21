// DEV-085 — doors are meaningful framed thresholds, never duplicated for one corridor.
import test from "node:test";
import assert from "node:assert/strict";
import {generateDeepLayout,validateDeepLayout,deepRoute,deepTwoReturnWays} from "../docs/deep-dungeon.js";
import {newGame,beginRun,toggleDoor,move,validateSave,inspectTile} from "../docs/game.js";
import {visibleCells,visionKey} from "../docs/exploration-visibility.js";

const key=p=>p.x+","+p.y;
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const tile=(map,p)=>map[p.y]?.[p.x]??"#";
const orientation=(r,p)=>p.x===r.x||p.x===r.x+r.width-1?"v":
  p.y===r.y||p.y===r.y+r.height-1?"h":null;
const border=(r,p)=>p.x>=r.x&&p.x<r.x+r.width&&
  p.y>=r.y&&p.y<r.y+r.height&&Boolean(orientation(r,p));

function thresholdList(layout){
  const found=[];
  for(const r of layout.rooms){
    for(let y=r.y;y<r.y+r.height;y++)for(let x=r.x;x<r.x+r.width;x++){
      const p={x,y};
      if(!border(r,p)||![".","+"].includes(tile(layout.map,p)))continue;
      const type=orientation(r,p);
      // Threshold on exactly one axis, away from room corners.
      assert.ok(type);
      assert.ok(type==="v"?(y>=r.y+2&&y<=r.y+r.height-3):
        (x>=r.x+2&&x<=r.x+r.width-3));
      assert.equal(tile(layout.map,type==="v"?{x:x,y:y-1}:{x:x-1,y:y}),"#");
      assert.equal(tile(layout.map,type==="v"?{x:x,y:y+1}:{x:x+1,y:y}),"#");
      found.push({room:r.id,x,y,door:tile(layout.map,p)==="+"});
    }
  }
  return found;
}
test("DEV-089C: 240 variable graphs retain two architectural mouths per link and 6 deliberate doors",()=>{
  const layouts=new Set();
  for(let seed=2;seed<=241;seed++){
    const l=generateDeepLayout(seed);
    assert.equal(l.doorPlanVersion,1);
    assert.ok(validateDeepLayout(l),"invalid map "+seed);
    assert.ok(l.rooms.length>=8&&l.rooms.length<=12);
    assert.equal(l.doors.length,6);
    const thresholds=thresholdList(l);
    assert.equal(thresholds.length,l.links.length*2,"2 framed mouths per graph link, seed "+seed);
    assert.equal(thresholds.filter(p=>p.door).length,6);
    assert.ok(l.rooms.every(r=>r.width>=7&&r.width<=9&&
      r.height>=7&&r.height<=9));
    const caps=new Map();
    for(const d of l.doors){
      const owner=thresholds.find(t=>t.x===d.x&&t.y===d.y);
      assert.ok(owner,"door without a room wall "+seed);
      caps.set(owner.room,(caps.get(owner.room)||0)+1);
    }
    assert.ok([...caps.values()].every(count=>count<=2));
    const entrance=l.rooms.find(r=>r.slot===8);
    const entryDoors=thresholds.filter(t=>t.room===entrance.id&&t.door);
    assert.equal(entryDoors.length,2,"entry has two visible choices, "+seed);
    const blockers=new Set(l.enemies.map(key));
    assert.ok(deepTwoReturnWays(l.map,l.start,l.exit),"two public routes "+seed);
    assert.ok(deepRoute(l.map,l.start,l.exit,blockers),"no forced combat "+seed);
    for(const pos of Object.keys(l.loot)){
      const [x,y]=pos.split(",").map(Number),p={x,y};
      assert.ok(deepTwoReturnWays(l.map,p,l.exit),"loot must have two exits "+seed);
      assert.ok(deepRoute(l.map,l.start,p,blockers),"no mandatory combat at chest "+seed);
    }
    const initial=visibleCells({
      ...l,x:l.start.x,y:l.start.y,
      exploration:{seen:[]}
    });
    const nearFoe=l.enemies.find(e=>dist(e,l.start)>=4&&dist(e,l.start)<=5);
    assert.ok(nearFoe&&initial.has(visionKey(l,nearFoe.x,nearFoe.y)),
      "first encounter must be visible "+seed);
    assert.ok(Object.keys(l.loot).some(k=>{
      const [x,y]=k.split(",").map(Number);
      return initial.has(visionKey(l,x,y));
    }),"entry chest visible "+seed);
    assert.ok(l.map.some((row,y)=>[...row].some((ch,x)=>
      ch==="^"&&initial.has(visionKey(l,x,y)))),"entry rift visible "+seed);
    assert.deepEqual(generateDeepLayout(seed),l,"determinism "+seed);
    layouts.add(l.map.join(""));
  }
  assert.ok(layouts.size>=220,"new corridors must still vary");
});
test("DEV-085: framed door closes and reopens explicitly, spent turns and save are consistent",()=>{
  const s=newGame();s.meta.descents=1;
  let state=beginRun(s).state;
  assert.ok(validateSave(state));
  const d=state.run.doors[0];
  const neighbor=[[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dx,dy])=>({x:d.x+dx,y:d.y+dy}))
    .find(p=>!["#","^"].includes(tile(state.run.map,p)));
  assert.ok(neighbor);
  state.run.x=neighbor.x;state.run.y=neighbor.y;
  state.run.enemies=[]; // geometry tested separately from combat
  assert.equal(inspectTile(state,d.x,d.y).kind,"door");
  assert.ok(validateSave(state));
  const closed=toggleDoor(state,d.x,d.y).state;
  assert.equal(closed.run.turns,1);
  assert.equal(closed.run.doors.find(door=>key(door)===key(d)).open,false);
  assert.ok(validateSave(closed));
  const reloaded=JSON.parse(JSON.stringify(closed));
  assert.ok(validateSave(reloaded));
  const vector={"1,0":"right","-1,0":"left","0,1":"down","0,-1":"up"};
  const dir=vector[(d.x-neighbor.x)+","+(d.y-neighbor.y)];
  assert.equal(move(reloaded,dir).changed,false,"closed door blocks travel without a turn");
  const opened=toggleDoor(reloaded,d.x,d.y).state;
  assert.equal(opened.run.turns,2);
  assert.ok(validateSave(opened));
  const crossed=move(opened,dir).state;
  assert.equal(crossed.run.x,d.x);assert.equal(crossed.run.y,d.y);
  assert.equal(crossed.run.turns,3);
});
test("DEV-085: corrupt new threshold position or plan version is rejected",()=>{
  const s=generateDeepLayout(2);
  const changed=structuredClone(s);
  changed.doorPlanVersion=2;
  assert.equal(validateDeepLayout(changed),false);
  changed.doorPlanVersion=1;
  const d=changed.doors[0];
  changed.map[d.y]=changed.map[d.y].slice(0,d.x)+"."+changed.map[d.y].slice(d.x+1);
  assert.equal(validateDeepLayout(changed),false);
  assert.ok(validateDeepLayout(s),"original map not mutated");
});
test("DEV-085: legacy deep save with 34 doors remains loadable, without regeneration",()=>{
  const s=newGame();s.meta.descents=1;
  const state=beginRun(s).state;
  const width=44,height=32,columns=4,rows=3;
  const grid=Array.from({length:height},()=>Array(width).fill("#"));
  const rooms=[];
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const id=row*columns+col,cx=6+10*col,cy=5+10*row;
    const r={id,cx,cy,x:cx-2,y:cy-2,width:5,height:5,
      role:id===8?"vestibule":id===3?"extraction":"ruines"};
    rooms.push(r);
    for(let y=r.y;y<r.y+5;y++)for(let x=r.x;x<r.x+5;x++)grid[y][x]=".";
  }
  const doors=[];
  function connect(a,b){
    if(a.cy===b.cy){
      const y=a.cy;
      for(let x=a.x+4;x<=b.x;x++)grid[y][x]=".";
      for(const x of [a.x+4,b.x]){grid[y][x]="+";doors.push({x,y,open:true});}
    }else{
      const x=a.cx;
      for(let y=a.y+4;y<=b.y;y++)grid[y][x]=".";
      for(const y of [a.y+4,b.y]){grid[y][x]="+";doors.push({x,y,open:true});}
    }
  }
  for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
    const id=row*columns+col;
    if(col<3)connect(rooms[id],rooms[id+1]);
    if(row<2)connect(rooms[id],rooms[id+4]);
  }
  const start={x:6,y:25},exit={x:36,y:5};
  const fragment={x:16,y:15},tonic={x:26,y:25};
  for(const [p,ch] of [[start,"S"],[exit,"E"],[fragment,"$"],[tonic,"$"]])
    grid[p.y][p.x]=ch;
  const old=structuredClone(state);
  old.run.map=grid.map(row=>row.join(""));
  old.run.rooms=rooms;old.run.doors=doors;
  old.run.start=start;old.run.exit=exit;
  delete old.run.doorPlanVersion;delete old.run.geometryVersion; // Pre-089A save.
  delete old.run.topologyVersion;delete old.run.links;delete old.run.networkKind; // Pre-089C.
  delete old.run.branchPlanVersion; // GAME-101B only exists on newly generated maps.
  delete old.run.scoutingPlanVersion; // GAME-101C only exists on newly generated maps.
  delete old.run.encounterPlanVersion;delete old.run.encounters; // GAME-101D new floors only.
  delete old.run.combatOpeningVersion; // GAME-101E not present in simulated older saves.
  delete old.run.pursuitPlanVersion; // GAME-101F is absent from historical runs.
  delete old.run.reliquaryPlanVersion;delete old.run.reliquary; // Pre-GAME-101G.
  delete old.run.lootPlanVersion; // Pre-GAME-095A3 legacy chest IDs.
  delete old.run.secrets;delete old.run.traps;
  delete old.run.sites; // DEV-087: legacy 34-door runs predate special sites.
  old.run.loot={ [key(fragment)]:"relic.ashen_fragment",
    [key(tonic)]:"consumable.dusk_tonic" };
  old.run.enemies=[];old.run.exploration={seen:[]};
  old.run.x=start.x;old.run.y=start.y;
  assert.equal(old.run.doors.length,34);
  assert.ok(validateSave(old),"DEV-080/081/082 old run retained without topology version");
  const restored=JSON.parse(JSON.stringify(old));
  assert.ok(validateSave(restored));
  assert.deepEqual(restored.run.map,old.run.map);
  assert.equal(restored.run.doors.length,34);
});
