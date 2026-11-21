// GAME-101F — predictable Charognard detours and true backward compatibility.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newGame,beginRun,waitTurn,validateSave,normalizeJournal,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";
import {generateDeepLayout,validateDeepLayout} from "../docs/deep-dungeon.js";
import {CHAMBER_PURSUIT_VERSION,chamberPursuitStep} from "../docs/chamber-pursuit.js";
import {currentEnemyIntent} from "../docs/combat.js";
import {revealAround} from "../docs/exploration-visibility.js";
const key=p=>p.x+","+p.y;
const dx=(p,q)=>Math.abs(p.x-q.x)+Math.abs(p.y-q.y);
function synthetic(){
  return {pursuitPlanVersion:1,doorPlanVersion:1,turns:0,alarmUntil:0,
    map:["#########","#.......#","#...#...#","#.......#","#.......#","#.......#","#########"],
    rooms:[{id:0,x:0,y:0,width:9,height:7}],
    x:5,y:2,enemies:[{id:"c",kind:"charognard",hp:3,tactic:"stalking",x:3,y:2}],
    traps:[],sites:[],encounters:[],secrets:[]};
}
function realPillar(){
  for(let seed=2;seed<=14;seed++){
    const meta=newGame();meta.meta.descents=seed-1;
    const s=beginRun(meta,["weapon.rusty_sword"]).state;
    const room=s.run.rooms?.find(r=>r.shape==="pillar");
    if(!room)continue;
    for(const [dx,dy] of [[1,0],[0,1]]){
      const hero={x:room.cx+dx,y:room.cy+dy};
      const foe={x:room.cx-dx,y:room.cy-dy};
      if([hero,foe].some(p=>s.run.map[p.y]?.[p.x]!=="."||
        s.run.traps.some(t=>key(t)===key(p))||
        s.run.sites.some(t=>key(t)===key(p))||
        s.run.encounters.some(t=>key(t)===key(p))||
        s.run.secrets.some(t=>key(t)===key(p))))continue;
      s.run.x=hero.x;s.run.y=hero.y;
      s.run.enemies=[{id:"game101f-char",kind:"charognard",hp:3,
        x:foe.x,y:foe.y,tactic:"stalking"}];
      s.run.targetId=null;
      revealAround(s.run);
      if(validateSave(s)&&chamberPursuitStep(s.run,s.run.enemies[0]))
        return s;
    }
  }
  throw Error("No safe room with a real pillar found in 13 seeded descents");
}

test("GAME-101F: planner contours a pillar, deterministically, one cell at a time",()=>{
  const run=synthetic(),enemy=run.enemies[0];
  const expected={x:3,y:1,detour:true,routeLength:4};
  assert.deepEqual(chamberPursuitStep(run,enemy),expected);
  assert.deepEqual(chamberPursuitStep(run,enemy),expected);
  assert.equal(dx(expected,enemy),1);
  assert.equal(dx(expected,run),3);
  assert.equal(currentEnemyIntent(run,enemy)?.kind,"approach");
  assert.match(currentEnemyIntent(run,enemy)?.label,/détour/);
  // A paid alarm increases detection range, not route length or safety.
  run.x=7;run.y=2;
  assert.equal(chamberPursuitStep(run,enemy),null);
  run.alarmUntil=5;
  assert.ok(chamberPursuitStep(run,enemy));
});

test("GAME-101F: never crosses two traps, other enemies, doors or chamber bounds",()=>{
  const run=synthetic(),enemy=run.enemies[0];
  run.traps=[{x:3,y:1},{x:3,y:3}];
  assert.equal(chamberPursuitStep(run,enemy),null);
  run.traps=[];
  run.enemies.push({id:"b",kind:"guardian",hp:5,x:3,y:1});
  assert.deepEqual({x:chamberPursuitStep(run,enemy).x,y:chamberPursuitStep(run,enemy).y},{x:3,y:3});
  run.enemies.pop();
  run.map[1]="#..+....#";
  assert.deepEqual({x:chamberPursuitStep(run,enemy).x,y:chamberPursuitStep(run,enemy).y},{x:3,y:3});
  run.map[1]="#.......#";
  run.rooms=[{id:0,x:0,y:0,width:5,height:7}];
  assert.equal(chamberPursuitStep(run,enemy),null);
  run.rooms=[{id:0,x:0,y:0,width:9,height:7}];
  const old=structuredClone(run);delete old.pursuitPlanVersion;
  assert.equal(chamberPursuitStep(old,old.enemies[0]),null);
  const prepared=structuredClone(run);prepared.enemies[0].tactic="winding";
  assert.equal(chamberPursuitStep(prepared,prepared.enemies[0]),null);
});

test("GAME-101F: actual Nhal pillar changes an enemy turn without changing RNG or saving rules",()=>{
  const before=realPillar();
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(CHAMBER_PURSUIT_VERSION,1);
  const enemy=before.run.enemies[0],planned=chamberPursuitStep(before.run,enemy);
  assert.ok(planned.detour);
  const original=structuredClone(before);
  const result=waitTurn(before);
  assert.equal(result.changed,true);
  assert.deepEqual(before,original,"simulation must not mutate input");
  assert.equal(result.state.run.turns,1);
  assert.deepEqual({x:result.state.run.enemies[0].x,
    y:result.state.run.enemies[0].y},{x:planned.x,y:planned.y});
  assert.equal(result.state.run.hp,before.run.hp);
  assert.equal(result.state.run.rngState,before.run.rngState);
  assert.ok(validateSave(result.state));
  assert.ok(validateSave(normalizeJournal(JSON.parse(JSON.stringify(result.state)))));
  const old=structuredClone(before);
  delete old.run.pursuitPlanVersion;
  delete old.run.reliquaryPlanVersion;
  delete old.run.reliquary;
  assert.ok(validateSave(old));
  assert.equal(chamberPursuitStep(old.run,old.run.enemies[0]),null);
  const oldTurn=waitTurn(old);
  assert.deepEqual({x:oldTurn.state.run.enemies[0].x,
    y:oldTurn.state.run.enemies[0].y},{x:enemy.x,y:enemy.y});
  assert.ok(validateSave(oldTurn.state));
});

test("GAME-101F: new floor opt-in and tampered state rejected, old tutorial untouched",()=>{
  const first=beginRun(newGame(),["weapon.rusty_sword"]).state;
  assert.equal(first.run.pursuitPlanVersion,undefined);
  for(let seed=2;seed<9;seed++){
    const layout=generateDeepLayout(seed);
    assert.equal(layout.pursuitPlanVersion,1);
    assert.ok(validateDeepLayout(layout));
    assert.deepEqual(generateDeepLayout(seed),layout);
    const broken=structuredClone(layout);
    broken.pursuitPlanVersion=2;
    assert.equal(validateDeepLayout(broken),false);
    delete broken.combatOpeningVersion;
    broken.pursuitPlanVersion=1;
    assert.equal(validateDeepLayout(broken),false);
  }
});

test("GAME-101F: forecast and offline assets share one safe planner",()=>{
  const read=p=>readFileSync(new URL("../docs/"+p,import.meta.url),"utf8");
  const engine=read("game.js"),ui=read("combat.js"),sw=read("sw.js");
  assert.match(engine,/chamberPursuitStep\(run,enemy\)/);
  assert.match(ui,/chamberPursuitStep\(run,enemy\)/);
  assert.match(sw,/"\.\/chamber-pursuit\.js"/);
  assert.match(sw,/game101f-chamber-pursuit/);
});
