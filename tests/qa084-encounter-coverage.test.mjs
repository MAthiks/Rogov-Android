import test from "node:test";
import assert from "node:assert/strict";
import {generateDeepLayout,validateDeepLayout,deepRoute,deepTwoReturnWays} from "../docs/deep-dungeon.js";
import {newGame,beginRun,openChest,move,validateSave,inspectTile,mapViewportText,MAP} from "../docs/game.js";
import {visibleCells,minimapText,visionKey} from "../docs/exploration-visibility.js";

const key=p=>p.x+","+p.y;
const d=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const direction=(a,b)=>({"1,0":"right","-1,0":"left","0,1":"down","0,-1":"up"})[
  (b.x-a.x)+","+(b.y-a.y)];
function newDeep(seed=2){
  const s=newGame();s.meta.descents=seed-1;
  return beginRun(s).state;
}
test("QA-084 regression: 240 seeds visibly generate enemies, chests, cracks and safe extraction",()=>{
  for(let seed=2;seed<242;seed++){
    const layout=generateDeepLayout(seed);
    assert.ok(validateDeepLayout(layout),"layout "+seed);
    const start=layout.start;
    assert.equal(layout.enemies.length,4,"hostiles "+seed);
    assert.equal(Object.keys(layout.loot).length,3,"chests "+seed);
    assert.equal(layout.map.join("").split("^").length-1,2,"rifts "+seed);
    const nearFoe=layout.enemies.find(e=>d(e,start)>=4&&d(e,start)<=5);
    assert.ok(nearFoe,"no entry encounter "+seed);
    const nearChest=Object.entries(layout.loot).find(([pos,id])=>{
      const [x,y]=pos.split(",").map(Number);
      return id==="consumable.bandage"&&d({x,y},start)<=3;
    });
    assert.ok(nearChest,"no entry chest "+seed);
    assert.ok(layout.map.some((row,y)=>[...row].some((tile,x)=>
      tile==="^"&&d({x,y},start)>=2&&d({x,y},start)<=4)),"no entry rift "+seed);
    assert.ok(deepTwoReturnWays(layout.map,start,layout.exit),"blocked public returns "+seed);
    const blocked=new Set(layout.enemies.map(key));
    assert.ok(deepRoute(layout.map,start,layout.exit,blocked),"forced enemy fight "+seed);
    for(const pos of Object.keys(layout.loot)){
      const [x,y]=pos.split(",").map(Number),from={x,y};
      assert.ok(deepRoute(layout.map,start,from,blocked),"inaccessible chest "+seed);
      assert.ok(deepRoute(layout.map,from,layout.exit,blocked),"unextractable loot "+seed);
      assert.ok(deepTwoReturnWays(layout.map,from,layout.exit),"single loot route "+seed);
    }
  }
});
test("QA-084: initial viewport actually shows a chest, a crack, and an enemy",()=>{
  for(const seed of [2,3,6,42,99]){
    const state=newDeep(seed);
    assert.ok(validateSave(state),"save "+seed);
    const {run}=state;
    const sight=visibleCells(run);
    const nearest=run.enemies.find(e=>d(e,run)>=4&&d(e,run)<=5);
    assert.ok(sight.has(visionKey(run,nearest.x,nearest.y)),"enemy in initial sight "+seed);
    assert.ok(Object.keys(run.loot).some(k=>{
      const [x,y]=k.split(",").map(Number);
      return sight.has(visionKey(run,x,y));
    }),"chest in initial sight "+seed);
    assert.ok(run.map.some((row,y)=>[...row].some((t,x)=>
      t==="^"&&sight.has(visionKey(run,x,y)))),"rift in initial sight "+seed);
    const viewport=mapViewportText(state);
    assert.match(viewport,/C/,"chest in camera "+seed);
    assert.match(viewport,/\^/,"rift in camera "+seed);
    assert.match(viewport,/c/,"hostile in camera "+seed);
    assert.match(minimapText(run),/C/,"chest in discovered minimap "+seed);
    assert.match(minimapText(run),/\^/,"rift in discovered minimap "+seed);
  }
});
test("QA-084: explicit adjacent chest opening costs one turn and survives reload exactly once",()=>{
  let state=newDeep(2);
  state.run.enemies=[]; // isolate chest transaction from combat
  const entry=Object.entries(state.run.loot).find(([,item])=>item==="consumable.bandage")[0];
  const [x,y]=entry.split(",").map(Number),chest={x,y};
  assert.equal(openChest(state,x,y).changed,false,"chests cannot open from a distance");
  const route=deepRoute(state.run.map,{x:state.run.x,y:state.run.y},chest);
  assert.ok(route?.length>=3);
  for(const point of route.slice(1,-1)){
    const current={x:state.run.x,y:state.run.y};
    state=move(state,direction(current,point)).state;
  }
  assert.equal(d(state.run,chest),1);
  assert.equal(inspectTile(state,x,y).kind,"chest");
  const turns=state.run.turns;
  const original=JSON.stringify(state);
  const opened=openChest(state,x,y);
  assert.ok(opened.changed);
  assert.equal(opened.state.run.turns,turns+1);
  assert.equal(opened.state.run.carried["consumable.bandage"],1);
  assert.ok(opened.state.run.collected.includes(entry));
  assert.equal(JSON.stringify(state),original,"immutable state");
  assert.ok(validateSave(opened.state));
  const reloaded=JSON.parse(JSON.stringify(opened.state));
  assert.equal(openChest(reloaded,x,y).changed,false,"never duplicate");
  state=move(reloaded,direction(reloaded.run,chest)).state;
  assert.equal(state.run.carried["consumable.bandage"],1,"walking through opened chest never duplicates");
  assert.ok(validateSave(state));
});
test("QA-084: entering a visible rift triggers the documented Recall and preserves the stash",()=>{
  const s=newDeep(2);
  const p=[];
  s.run.map.forEach((row,y)=>[...row].forEach((t,x)=>{if(t==="^")p.push({x,y});}));
  assert.equal(p.length,2);
  const target=p[0];
  const near=[[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dx,dy])=>({x:target.x+dx,y:target.y+dy}))
    .find(q=>s.run.map[q.y]?.[q.x]===".");
  assert.ok(near,"visible rift has a safe approach");
  s.run.x=near.x;s.run.y=near.y;s.run.enemies=[];
  const before={...s.meta.stash};
  const result=move(s,direction(near,target)).state;
  assert.equal(result.run,null);
  assert.equal(result.meta.recalls,1);
  assert.deepEqual(result.meta.stash,before);
  assert.ok(validateSave(result));
});
test("QA-084: started DEV-080/081 saves with 2 loot, 3 enemies and no rifts still load",()=>{
  const state=newDeep(2);
  const run=state.run;
  run.map=run.map.map(row=>row.replaceAll("^","."));
  const entry=Object.keys(run.loot).find(k=>run.loot[k]==="consumable.bandage");
  const [x,y]=entry.split(",").map(Number);
  run.map[y]=run.map[y].slice(0,x)+"."+run.map[y].slice(x+1);
  delete run.loot[entry];
  run.enemies=run.enemies.filter(e=>e.id!=="nhal-charognard-scout-01");
  delete run.secrets;
  assert.equal(Object.keys(run.loot).length,2);
  assert.equal(run.enemies.length,3);
  assert.ok(validateSave(state),"legacy deep run retained");
});
