import test from "node:test";
import assert from "node:assert/strict";
import {
  DEEP_WIDTH,DEEP_HEIGHT,generateDeepLayout,validateDeepLayout,
  deepRoute,deepTwoReturnWays,isDeepMap
} from "../docs/deep-dungeon.js";

const key=p=>p.x+","+p.y;
const count=(layout,symbol)=>layout.map.join("").split(symbol).length-1;

test("DEV-080: 240 deterministic seeds build real rooms, corridors and doors",()=>{
  const distinct=new Set();
  for(let n=2;n<=241;n++){
    const l=generateDeepLayout(n);
    assert.ok(validateDeepLayout(l),"invalid deep map "+n);
    assert.equal(l.map.length,DEEP_HEIGHT);
    assert.equal(l.map[0].length,DEEP_WIDTH);
    assert.equal(l.rooms.length,12);
    assert.equal(l.doors.length,34);
    assert.equal(count(l,"+"),34);
    assert.equal(count(l,"S"),1);
    assert.equal(count(l,"E"),1);
    assert.deepEqual(generateDeepLayout(n),l,"seed mismatch "+n);
    distinct.add(l.map.join(""));
    for(const door of l.doors)assert.equal(l.map[door.y][door.x],"+");
    assert.ok(l.rooms.some(r=>r.role==="vestibule"));
    assert.ok(l.rooms.some(r=>r.role==="extraction"));
  }
  assert.ok(distinct.size>=220,"plans do not vary sufficiently");
});

test("DEV-080: two independent public return paths without forced combat",()=>{
  for(const n of [2,3,4,5,29,99,120,241,1001,82001,999999]){
    const l=generateDeepLayout(n);
    const blockers=new Set(l.enemies.map(key));
    assert.ok(deepTwoReturnWays(l.map,l.start,l.exit),"start articulation "+n);
    assert.ok(deepRoute(l.map,l.start,l.exit,blockers),"enemy-blocked extraction "+n);
    for(const pos of Object.keys(l.loot)){
      const [x,y]=pos.split(",").map(Number),p={x,y};
      assert.ok(deepTwoReturnWays(l.map,p,l.exit),"loot articulation "+n+":"+pos);
      assert.ok(deepRoute(l.map,p,l.exit,blockers),"mandatory combat at loot "+n);
      assert.ok(deepRoute(l.map,l.start,p,blockers),"mandatory combat to loot "+n);
    }
    // Non-secret open doorways never count as traps or one-way passages.
    assert.ok(l.doors.every(d=>d.open===true));
  }
});

test("DEV-080: invalid maps fail validation, original objects stay untouched",()=>{
  const l=generateDeepLayout(12);
  const original=JSON.stringify(l);
  const bad=structuredClone(l);
  bad.map[0]=".".repeat(DEEP_WIDTH);
  assert.equal(validateDeepLayout(bad),false);
  bad.map[0]=l.map[0];bad.doors.pop();
  assert.equal(validateDeepLayout(bad),false);
  assert.equal(JSON.stringify(l),original);
  assert.equal(isDeepMap(["##"]),false);
  assert.throws(()=>generateDeepLayout(1),RangeError);
});

import {newGame,beginRun,recall,move,toggleDoor,inspectTile,validateSave,
  normalizeJournal,mapText,mapViewportText,cameraBounds} from "../docs/game.js";

test("DEV-080: second descent is deep; tutorial and started old saves remain original",()=>{
  let s=beginRun(newGame()).state;
  assert.equal(s.run.map.length,9);
  const old=structuredClone(s);
  delete old.run.map;delete old.run.loot;delete old.run.layoutId;
  assert.ok(validateSave(old));
  assert.equal(normalizeJournal(old).run.map,undefined);
  s=recall(s).state;
  s=beginRun(s).state;
  const l=generateDeepLayout(2);
  assert.deepEqual(s.run.map,l.map);
  assert.deepEqual(s.run.rooms,l.rooms);
  assert.deepEqual(s.run.doors,l.doors);
  assert.ok(validateSave(s));
  assert.equal(s.run.map.length,32);
  assert.equal(mapText(s).split("\n").length,32);
  assert.equal(mapViewportText(s).split("\n").length,11);
});

test("DEV-080: camera follows the hero, clamps at edges and shares ASCII coordinates",()=>{
  const base=newGame();base.meta.descents=1;
  const s=beginRun(base).state;
  assert.deepEqual(cameraBounds(s.run),{left:1,top:20,width:11,height:11});
  assert.equal(mapViewportText(s).split("\n")[5][5],"@");
  s.run.x=22;s.run.y=16;
  assert.deepEqual(cameraBounds(s.run),{left:17,top:11,width:11,height:11});
  assert.equal(mapViewportText(s).split("\n")[5][5],"@");
  s.run.x=43;s.run.y=31;
  assert.deepEqual(cameraBounds(s.run),{left:33,top:21,width:11,height:11});
  assert.equal(mapViewportText(s).split("\n")[10][10],"@");
});

test("DEV-080: door inspection is free; deliberate toggle takes a turn and survives reload",()=>{
  const base=newGame();base.meta.descents=1;
  let s=beginRun(base).state;
  const d=s.run.doors[0];
  s.run.x=d.x-1;s.run.y=d.y;
  if(s.run.map[s.run.y]?.[s.run.x]==="#"){
    s.run.x=d.x+1;s.run.y=d.y;
  }
  assert.equal(Math.abs(s.run.x-d.x)+Math.abs(s.run.y-d.y),1);
  assert.equal(inspectTile(s,d.x,d.y).kind,"door");
  assert.equal(s.run.turns,0);
  s.run.enemies=[]; // isolate geometry / door actions from AI
  const close=toggleDoor(s,d.x,d.y);
  assert.ok(close.changed);
  s=close.state;
  assert.equal(s.run.turns,1);
  assert.equal(s.run.doors[0].open,false);
  assert.ok(validateSave(s));
  s=normalizeJournal(JSON.parse(JSON.stringify(s)));
  assert.equal(s.run.doors[0].open,false);
  const direction=d.x>s.run.x?"right":d.x<s.run.x?"left":d.y>s.run.y?"down":"up";
  const blocked=move(s,direction);
  assert.equal(blocked.changed,false);
  assert.equal(blocked.state.run.turns,1);
  s=toggleDoor(s,d.x,d.y).state;
  assert.equal(s.run.turns,2);
  assert.ok(s.run.doors[0].open);
  assert.ok(validateSave(s));
});

test("DEV-080: a full non-secret path reaches extraction and secures the bag",()=>{
  const base=newGame();base.meta.descents=1;
  let s=beginRun(base,["weapon.rusty_sword"]).state;
  const l=generateDeepLayout(2);
  s.run.enemies=[]; // validate the geography independently of enemy initiative
  const route=deepRoute(l.map,l.start,l.exit);
  assert.ok(route);
  const dirs={"1,0":"right","-1,0":"left","0,1":"down","0,-1":"up"};
  for(let i=1;i<route.length;i++){
    const dx=route[i].x-route[i-1].x;
    const dy=route[i].y-route[i-1].y;
    const step=move(s,dirs[dx+","+dy]);
    assert.ok(step.changed,"step "+i);
    s=step.state;
  }
  assert.equal(s.run,null);
  assert.equal(s.meta.extractions,1);
  assert.equal(s.meta.stash["weapon.rusty_sword"],1);
  assert.ok(validateSave(s));
});

test("DEV-080: both rendering modes use a bounded mobile viewport",async()=>{
  const {drawTileMap}=await import("../docs/tiles.js");
  const {readFileSync}=await import("node:fs");
  const html=readFileSync(new URL("../docs/index.html",import.meta.url),"utf8");
  const app=readFileSync(new URL("../docs/app.js",import.meta.url),"utf8");
  assert.match(html,/id="door-select"/);
  assert.match(html,/id="door-action"/);
  assert.match(app,/mapViewportText\(state\)/);
  assert.match(app,/selectNextDoor\(\)/);
  class Element {
    constructor(){this.children=[];this.dataset={};this.style={};
      this.classList={add:()=>{}};}
    append(...parts){this.children.push(...parts);}
    replaceChildren(){this.children=[];}
  }
  const old=globalThis.document;
  globalThis.document={
    createElement:()=>new Element(),
    createDocumentFragment:()=>new Element()
  };
  try {
    const game=newGame();game.meta.descents=1;
    const s=beginRun(game).state;
    const host=new Element();
    drawTileMap(s,host);
    assert.equal(host.children.length,1);
    assert.equal(host.children[0].children.length,121);
    const view=cameraBounds(s.run);
    assert.ok(host.children[0].children.every(cell=>
      Number(cell.dataset.x)>=view.left&&Number(cell.dataset.x)<view.left+view.width&&
      Number(cell.dataset.y)>=view.top&&Number(cell.dataset.y)<view.top+view.height));
  } finally {globalThis.document=old;}
});

test("DEV-080: a creature can occupy an opened door without corrupting saves",()=>{
  const game=newGame();game.meta.descents=1;
  const s=beginRun(game).state;
  const doorway=s.run.doors[0];
  assert.equal(doorway.open,true);
  assert.equal(s.run.map[doorway.y][doorway.x],"+");
  s.run.enemies[0].x=doorway.x;s.run.enemies[0].y=doorway.y;
  assert.equal(validateSave(s),true);
  const restored=normalizeJournal(JSON.parse(JSON.stringify(s)));
  assert.equal(validateSave(restored),true);
  const closed=structuredClone(restored);
  closed.run.doors[0].open=false;
  assert.equal(validateSave(closed),false,"enemy cannot occupy a closed door");
});
