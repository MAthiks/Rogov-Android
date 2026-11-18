import test from "node:test";
import assert from "node:assert/strict";
import {newGame,beginRun,recall,move,extract,normalizeJournal,validateSave,mapText,inspectTile} from "../docs/game.js";
import {BASE_MAP,BASE_LOOT,generateLayout,validateLayout,safeRoute,twoReturnWays} from "../docs/dungeon.js";
import {generateDeepLayout,deepRoute} from "../docs/deep-dungeon.js";

const point=p=>p.split(",").map(Number);
const key=p=>p.x+","+p.y;
const exitCell=map=>{
  for(let y=0;y<map.length;y++){
    const x=map[y].indexOf("E");if(x>=0)return {x,y};
  }
  return null;
};
const directions={"1,0":"right","-1,0":"left","0,1":"down","0,-1":"up"};

test("VAR-077: first descent is a legible introduction and old saves use the unchanged original map",()=>{
  const one=generateLayout(1);
  assert.deepEqual(one.map,BASE_MAP);
  assert.deepEqual(one.loot,BASE_LOOT);
  const live=beginRun(newGame()).state;
  assert.deepEqual(live.run.map,BASE_MAP);
  const old=structuredClone(live);
  delete old.run.map;delete old.run.loot;delete old.run.layoutId;
  assert.ok(validateSave(old));
  const restored=normalizeJournal(old);
  assert.equal(restored.run.map,undefined);
  assert.equal(restored.run.loot,undefined);
  assert.equal(mapText(restored),mapText({...live,run:{...live.run}}));
  assert.equal(inspectTile(restored,3,6).kind,"loot");
});

test("VAR-077: seeded generation yields different maps, rewards and enemy positions",()=>{
  const variants=[1,2,3,4,5,6].map(generateLayout);
  assert.equal(variants.length,6);
  const sig=v=>JSON.stringify([v.map,v.loot,v.enemies]);
  assert.ok(new Set(variants.map(sig)).size>=5);
  for(const n of [2,3,11,27,99])assert.deepEqual(generateLayout(n),generateLayout(n));
  assert.notDeepEqual(variants[1].loot,variants[0].loot);
  assert.notDeepEqual(variants[1].enemies.map(key),variants[0].enemies.map(key));
});

test("VAR-077: generated layouts never create a compulsory lethal or monster-blocked extraction",()=>{
  for(let n=2;n<=120;n++){
    const l=generateLayout(n);
    assert.ok(validateLayout(l.map,l.loot),"layout invalid "+n);
    assert.equal(l.map.length,9);
    assert.equal(l.map[0].length,15);
    assert.equal(l.map[7][1],"S");
    assert.equal(l.map.join("").split("E").length-1,1);
    assert.ok(twoReturnWays(l.map,l.start,l.exit),"no alternate extraction "+n);
    const occupied=new Set(l.enemies.map(key));
    assert.ok(safeRoute(l.map,l.start,l.exit,occupied),"mandatory combat to exit "+n);
    for(const [pos,id] of Object.entries(l.loot)){
      const [x,y]=point(pos),p={x,y};
      assert.ok(["relic.ashen_fragment","consumable.dusk_tonic"].includes(id));
      assert.ok(twoReturnWays(l.map,p,l.exit),"one-way loot corridor "+n+" "+pos);
      assert.ok(safeRoute(l.map,p,l.exit,occupied),"blocked return from loot "+n);
      assert.ok(safeRoute(l.map,l.start,p,occupied),"loot requires fight "+n);
    }
    assert.equal(l.enemies.length,3);
    assert.equal(new Set(l.enemies.map(key)).size,3);
    for(const enemy of l.enemies){
      assert.equal(l.map[enemy.y][enemy.x],".","enemy must spawn on open floor");
      assert.ok(Math.abs(enemy.x-1)+Math.abs(enemy.y-7)>=4,"no unfair spawn next to entry");
    }
  }
});

test("VAR-077: a charognard threatens the valuable relic, without sealing its return",()=>{
  for(let n=2;n<=65;n++){
    const l=generateLayout(n);
    const [pos]=Object.entries(l.loot).find(([,id])=>id==="relic.ashen_fragment");
    const [x,y]=point(pos);
    const hunter=l.enemies.find(e=>e.kind==="charognard");
    assert.ok(Math.abs(hunter.x-x)+Math.abs(hunter.y-y)<=2,
      "valuable loot must require a meaningful danger choice "+n);
    assert.ok(twoReturnWays(l.map,{x,y},l.exit));
  }
});

test("VAR-077: dynamic ASCII, tile inspection and extraction use run.map and run.loot",()=>{
  let s=newGame();
  s.meta.descents=1; // next entry is generated, not tutorial
  s=beginRun(s).state;
  const l=generateDeepLayout(2);
  assert.deepEqual(s.run.map,l.map);
  assert.deepEqual(s.run.loot,l.loot);
  assert.equal(mapText(s).split("\n").length,32);
  for(const [pos,id] of Object.entries(l.loot)){
    const [x,y]=point(pos);
    // DEV-081: inspection from the entrance cannot disclose distant loot.
    if(inspectTile(s,x,y).kind==="unknown")
      assert.equal(mapText(s).split("\n")[y][x]," ");
    const neighbour=[[0,-1],[0,1],[-1,0],[1,0]].map(([dx,dy])=>({x:x+dx,y:y+dy}))
      .find(p=>l.map[p.y]?.[p.x] && l.map[p.y][p.x]!=="#");
    assert.ok(neighbour);
    const probe=structuredClone(s);
    probe.run.x=neighbour.x;probe.run.y=neighbour.y;
    assert.equal(inspectTile(probe,x,y).name,"Coffre de Nhal",
      "Deep loot now appears as an explicit, inspectable chest");
  }
  // DEV-086: navigation test must avoid active traps rather than force their trigger.
  const route=deepRoute(l.map,l.start,l.exit,
    new Set([...s.run.enemies,...(s.run.traps||[])].map(key)));
  assert.ok(route);
  s.run.enemies=[]; // isolate geometry from the combat AI
  for(let i=1;i<route.length;i++){
    const dx=route[i].x-route[i-1].x,dy=route[i].y-route[i-1].y;
    const step=move(s,directions[dx+","+dy]);
    assert.ok(step.changed,"route step "+i);
    s=step.state;
  }
  assert.equal(s.run,null);
  assert.equal(s.meta.extractions,1);
  assert.ok(validateSave(s));
});

test("VAR-077: lethal hazards are optional and fixed before entry, never spawned mid-run",()=>{
  for(let n=2;n<=30;n++){
    const l=generateDeepLayout(n),grid=JSON.stringify(l.map);
    let s=newGame();s.meta.descents=n-1;s=beginRun(s).state;
    for(let i=0;i<3;i++) {
      const next=move(s,"up");
      if(next.changed&&next.state.run)s=next.state;
    }
    if(s.run)assert.equal(JSON.stringify(s.run.map),grid);
    assert.deepEqual(generateDeepLayout(n).map,l.map);
  }
});

test("VAR-077: malformed dynamic maps and loot cannot corrupt a save",()=>{
  let s=newGame();s.meta.descents=1;s=beginRun(s).state;
  assert.ok(validateSave(s));
  s.run.map[0]="invalid";assert.equal(validateSave(s),false);
  s=newGame();s.meta.descents=1;s=beginRun(s).state;
  s.run.loot={"8,8":"relic.ashen_fragment"};
  assert.equal(validateSave(s),false);
});

test("VAR-077: Rappel keeps the character/stash, re-entry generates a different area",()=>{
  let s=beginRun(newGame(),["weapon.rusty_sword"]).state;
  s=recall(s).state;
  assert.equal(s.meta.stash["weapon.rusty_sword"],0);
  assert.equal(s.meta.recalls,1);
  const next=beginRun(s).state;
  assert.ok(validateSave(next));
  assert.notDeepEqual(next.run.map,BASE_MAP);
  assert.equal(next.meta.hero.xp,0);
  assert.equal(next.run.carried["weapon.rusty_sword"],undefined);
});
