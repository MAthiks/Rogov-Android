import test from "node:test";
import assert from "node:assert/strict";
import {generateDeepLayout} from "../docs/deep-dungeon.js";
import {newGame,beginRun,move,toggleDoor,validateSave,inspectTile,
  mapText,mapViewportText} from "../docs/game.js";
import {VISION_RADIUS,hasFog,validExploration,visibleCells,visionKey,
  lineOfSight,revealAround,explorationState,minimapText} from "../docs/exploration-visibility.js";

function fixture(){
  const map=["#######","#.....#","###+###","#.....#","#######"];
  return {map,x:3,y:1,rooms:[{id:1}],doors:[{x:3,y:2,open:false}],
    exploration:{seen:[]},enemies:[],collected:[]};
}
test("DEV-081: closed door is observable, room behind it remains completely dark",()=>{
  const run=fixture();
  assert.equal(VISION_RADIUS,5);
  assert.ok(lineOfSight(run,3,2));
  assert.equal(lineOfSight(run,3,3),false);
  const visible=visibleCells(run);
  assert.ok(visible.has(visionKey(run,3,2)));
  assert.ok(!visible.has(visionKey(run,3,3)));
  revealAround(run);
  assert.equal(explorationState(run,3,2),"visible");
  assert.equal(explorationState(run,3,3),"unknown");
  assert.ok(!minimapText(run).split("\n")[3].includes("."));
  run.doors[0].open=true;
  assert.equal(lineOfSight(run,3,3),true);
  assert.equal(explorationState(run,3,3),"visible");
  revealAround(run);
  run.doors[0].open=false;
  assert.equal(explorationState(run,3,3),"remembered");
  assert.ok(validExploration(run));
});
test("DEV-081: wall blocks vision, diagonally sealed corner is not transparent",()=>{
  const run=fixture();
  assert.equal(lineOfSight(run,1,3),false);
  const corner={map:["#####","#.#.#","##..#","#...#","#####"],x:1,y:1,
    rooms:[{id:1}],doors:[],exploration:{seen:[]}};
  assert.equal(lineOfSight(corner,2,2),false,"two opaque sides seal diagonal");
  assert.equal(lineOfSight(corner,2,1),true,"opaque wall itself is visible");
});
test("DEV-081: 220 generated descents start with valid private knowledge, not a full map",()=>{
  for(let i=2;i<222;i++){
    const layout=generateDeepLayout(i);
    const run={...layout,x:layout.start.x,y:layout.start.y,exploration:{seen:[]}};
    revealAround(run);
    assert.ok(validExploration(run),"invalid memory seed "+i);
    assert.ok(run.exploration.seen.length<layout.map.length*layout.map[0].length/3,
      "initial full-map reveal seed "+i);
    const visible=visibleCells(run);
    assert.ok(visible.has(visionKey(run,run.x,run.y)));
    assert.ok(!run.exploration.seen.some((n,i,a)=>i>0&&n<=a[i-1]));
    assert.equal(minimapText(run).split("\n").length,32);
  }
});
test("DEV-081: legacy active deep runs remain fully readable, without retroactive fog",()=>{
  const original=newGame();original.meta.descents=1;
  const state=beginRun(original).state;
  const old=structuredClone(state);
  delete old.run.exploration;
  delete old.run.scoutingPlanVersion; // An actual pre-DEV-081 legacy run predates GAME-101C.
  delete old.run.encounterPlanVersion;delete old.run.encounters; // And GAME-101D.
  assert.ok(validateSave(old));
  assert.equal(hasFog(old.run),false);
  assert.equal(explorationState(old.run,0,0),"visible");
  assert.ok(mapText(old).includes("E"));
  assert.equal(minimapText(old.run),"");
});
test("DEV-081: unseen extraction and unseen creatures cannot be inspected or revealed",()=>{
  const initial=newGame();initial.meta.descents=1;
  const state=beginRun(initial).state;
  const run=state.run;
  assert.ok(hasFog(run));
  assert.ok(validateSave(state));
  assert.equal(explorationState(run,run.exit.x,run.exit.y),"unknown");
  const inspection=inspectTile(state,run.exit.x,run.exit.y);
  assert.deepEqual(inspection,{kind:"unknown",name:"Obscurité",
    description:"Cette zone n'a pas encore été explorée."});
  const ascii=mapText(state);
  assert.equal(ascii[run.exit.y*(run.map[0].length+1)+run.exit.x]," ");
  const mini=minimapText(run);
  assert.equal(mini.split("\n")[run.exit.y][run.exit.x]," ");
  assert.equal(mapViewportText(state).split("\n").length,11);
});
test("DEV-081: memory stores no mobile enemy marker, even after an enemy leaves view",()=>{
  const source=newGame();source.meta.descents=1;
  const state=beginRun(source).state,run=state.run;
  const enemy=run.enemies[0];
  run.x=enemy.x;run.y=enemy.y;
  run.enemies=[]; // use an isolated static exploration position
  revealAround(run);
  run.enemies=[enemy];
  // Enemy is now in view and can appear on the map, unless same tile as hero.
  run.x=run.start.x;run.y=run.start.y;
  revealAround(run);
  const mini=minimapText(run);
  assert.ok(!mini.includes("c")&&!mini.includes("G")&&!mini.includes("L"),
    "minimap must not expose any moving enemies");
  if(explorationState(run,enemy.x,enemy.y)==="remembered"){
    const symbol=mapText(state).split("\n")[enemy.y][enemy.x];
    assert.notEqual(symbol,"c");
    assert.notEqual(symbol,"G");
    assert.notEqual(symbol,"L");
    assert.equal(inspectTile(state,enemy.x,enemy.y).kind,"memory");
  }
});
test("DEV-081: exploration persists after legitimate move and door turn, save remains valid",()=>{
  const source=newGame();source.meta.descents=1;
  let state=beginRun(source).state;
  state.run.enemies=[];
  const seenAtStart=state.run.exploration.seen.length;
  const moveDir=[["up",0,-1],["down",0,1],["left",-1,0],["right",1,0]].find(([,dx,dy])=>{
    const x=state.run.x+dx,y=state.run.y+dy;
    return state.run.map[y]?.[x] && !["#","^","E"].includes(state.run.map[y][x]);
  });
  assert.ok(moveDir,"safe adjacent tile");
  state=move(state,moveDir[0]).state;
  assert.ok(state.run);
  assert.ok(state.run.exploration.seen.length>=seenAtStart);
  assert.ok(validateSave(state));
  const deep=structuredClone(state);
  const closed=deep.run.doors[0];
  const xy=[[-1,0],[1,0],[0,-1],[0,1]].map(([dx,dy])=>({x:closed.x+dx,y:closed.y+dy}))
    .find(p=>deep.run.map[p.y]?.[p.x]&&deep.run.map[p.y][p.x]!=="#");
  assert.ok(xy);
  deep.run.x=xy.x;deep.run.y=xy.y;
  revealAround(deep.run);
  const changed=toggleDoor(deep,closed.x,closed.y);
  assert.ok(changed.changed);
  assert.ok(validateSave(changed.state));
  const restored=JSON.parse(JSON.stringify(changed.state));
  assert.ok(validateSave(restored));
  assert.deepEqual(restored.run.exploration.seen,changed.state.run.exploration.seen);
});
test("DEV-081: corrupt, duplicate or out-of-range knowledge is rejected",()=>{
  const base=newGame();base.meta.descents=1;
  const state=beginRun(base).state;
  for(const invalid of [[-1],[999999],[4,4],[6,5],["1"],[3.14]]){
    const copy=structuredClone(state);
    copy.run.exploration.seen=invalid;
    assert.equal(validateSave(copy),false,"invalid "+JSON.stringify(invalid));
  }
  assert.ok(validateSave(state));
});
