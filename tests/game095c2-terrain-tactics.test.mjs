import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newGame,beginRun,shoveTarget,waitTurn,normalizeJournal,
  validateSave,recall,ENEMY_TYPES,SCHEMA_VERSION,SAVE_KEY} from "../docs/game.js";
import {shoveOpportunity,SHOVE_ENDURANCE_COST,SLAB_SHOVE_DAMAGE}
  from "../docs/terrain-tactics.js";
import {TACTICAL_COSTS} from "../docs/combat-rules.js";
import {COMBAT_ACTIONS} from "../docs/combat.js";
import {revealAround} from "../docs/exploration-visibility.js";
import {validateDeepLayout} from "../docs/deep-dungeon.js";

function basic(){
  const s=beginRun(newGame(),["weapon.rusty_sword"]).state;
  s.run.x=1;s.run.y=7;
  s.run.enemies=[{id:"shove-foe",kind:"charognard",x:2,y:7,hp:3,
    tactic:"stalking"}];
  s.run.targetId="shove-foe";
  assert.ok(validateSave(s));
  return s;
}
const foe=s=>s.run.enemies[0];

function findTrapFixture(kind){
  // The optional slab sits near a chest and the alarm on a corridor. Seek
  // an actually traversable three-cell straight line on a real seeded map.
  // Never synthesize mandatory traps or skip the authoritative save validator.
  for(let descent=2;descent<=30;descent++){
    const hero=newGame();hero.meta.descents=descent-1;
    const s=beginRun(hero,["weapon.rusty_sword"],null,{multiFloor:true}).state;
    const trap=s.run.traps?.find(t=>t.kind===kind);
    if(!trap)continue;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const enemyX=trap.x-dx,enemyY=trap.y-dy;
      const playerX=trap.x-2*dx,playerY=trap.y-2*dy;
      if(s.run.map[enemyY]?.[enemyX]!=="."||
         s.run.map[playerY]?.[playerX]!=="."||
         s.run.traps.some(t=>(t.x===enemyX&&t.y===enemyY)||
           (t.x===playerX&&t.y===playerY))||
         s.run.sites.some(site=>[enemyX+","+enemyY,playerX+","+playerY]
           .includes(site.x+","+site.y)))continue;
      s.run.enemies=[{id:"trap-shove",kind:"charognard",
        x:enemyX,y:enemyY,hp:kind==="unstable_slab"?2:3,tactic:"stalking"}];
      s.run.targetId="trap-shove";s.run.x=playerX;s.run.y=playerY;
      trap.status="revealed";
      revealAround(s.run);
      if(validateSave(s)&&shoveOpportunity(s.run,foe(s))?.trapKind===kind)
        return {state:s,trap};
    }
  }
  throw Error("No safe valid "+kind+" environment-shove fixture");
}

test("GAME-095C2: action contract and historic save keys stay compatible",()=>{
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(SHOVE_ENDURANCE_COST,3);
  assert.equal(TACTICAL_COSTS.shove,3);
  assert.equal(SLAB_SHOVE_DAMAGE,2);
  assert.ok(COMBAT_ACTIONS.includes("shove"));
});

test("GAME-095C2: a normal shove costs 3 END and one turn, not RNG/HP",()=>{
  const s=basic(),old=structuredClone(s);
  assert.deepEqual(shoveOpportunity(s.run,foe(s)),{
    x:3,y:7,trapKind:null
  });
  const outcome=shoveTarget(s);
  assert.equal(outcome.changed,true);
  assert.deepEqual(s,old,"engine must not mutate the caller");
  const a=outcome.state;
  assert.equal(a.run.turns,s.run.turns+1);
  assert.equal(a.run.endurance,s.run.endurance-3);
  assert.equal(a.run.rngState,s.run.rngState);
  assert.equal(a.run.hp,s.run.hp);
  assert.equal(a.run.enemies.length,1);
  assert.equal(a.run.enemies[0].hp,3);
  assert.deepEqual({x:foe(a).x,y:foe(a).y},{x:3,y:7});
  assert.equal(foe(a).tactic,"stalking",
    "enemy recovery consumes this phase, with no immediate bite");
  assert.equal(a.run.targetId,"shove-foe");
  assert.equal(a.meta.hero.xp,s.meta.hero.xp);
  assert.ok(validateSave(a));
  assert.equal(shoveTarget(a).changed,false,"can't shove from range two");
  const json=normalizeJournal(JSON.parse(JSON.stringify(a)));
  assert.ok(validateSave(json));
  assert.equal(json.run.enemies[0].x,3);
});

test("GAME-095C2: invalid, blocked or exhausted shoves cost nothing",()=>{
  const base=basic();
  const cases=[()=>newGame(),()=>{
    const s=basic();s.run.targetId=null;return s;
  },()=>{
    const s=basic();s.run.endurance=2;return s;
  },()=>{
    const s=basic();s.run.enemies[0].kind="guardian";
    s.run.enemies[0].hp=5;s.run.enemies[0].tactic="ready";return s;
  },()=>{
    const s=basic();s.run.enemies[0].kind="rift_larva";
    s.run.enemies[0].hp=4;delete s.run.enemies[0].tactic;return s;
  },()=>{
    const s=basic();s.run.map[7]=s.run.map[7].slice(0,3)+"#"+
      s.run.map[7].slice(4);return s;
  },()=>{
    const s=basic();s.run.enemies.push({id:"occupant",kind:"charognard",
      x:3,y:7,hp:3});return s;
  }];
  for(const make of cases){
    const s=make(),before=JSON.stringify(s),output=shoveTarget(s);
    assert.equal(output.changed,false);
    assert.equal(output.state,s);
    assert.equal(JSON.stringify(s),before);
  }
  const s=basic();s.run.enemies[0].tactic="winding";
  // A shove cancels the old windup by moving and recovering.
  const pushed=shoveTarget(s).state;
  assert.equal(pushed.run.hp,s.run.hp);
  assert.equal(pushed.run.rngState,s.run.rngState);
  assert.ok(validateSave(pushed));
});

test("GAME-095C2: a revealed slab can kill a shoved foe, single activation, XP",()=>{
  const {state,trap}=findTrapFixture("unstable_slab");
  assert.equal(trap.status,"revealed");
  assert.ok(validateDeepLayout(state.run,true));
  const before=JSON.stringify(state);
  const rng=state.run.rngState,endurance=state.run.endurance,turns=state.run.turns;
  const result=shoveTarget(state);
  assert.equal(result.changed,true,result.message);
  assert.equal(JSON.stringify(state),before);
  const s=result.state;
  assert.equal(s.run.enemies.length,0,"2 damage takes down a wounded foe");
  assert.equal(s.run.targetId,null);
  assert.equal(s.run.traps.find(t=>t.kind==="unstable_slab").status,"triggered");
  assert.equal(s.run.endurance,endurance-3);
  assert.equal(s.run.turns,turns+1);
  assert.equal(s.run.rngState,rng,"environmental shove is deterministic");
  assert.equal(s.meta.hero.xp,state.meta.hero.xp+ENEMY_TYPES.charognard.xp);
  assert.match(result.message,/DALLE INSTABLE/);
  assert.equal(shoveTarget(s).changed,false,"no additional XP from the spent slab");
  assert.ok(validateSave(s));
  const resumed=normalizeJournal(JSON.parse(JSON.stringify(s)));
  assert.ok(validateSave(resumed));
  assert.equal(resumed.run.traps.find(t=>t.kind==="unstable_slab").status,
    "triggered");
});

test("GAME-095C2: an alarm wire triggers once and also exposes a downside",()=>{
  const {state}=findTrapFixture("alarm_wire");
  assert.ok(validateSave(state));
  const rng=state.run.rngState,originalXp=state.meta.hero.xp;
  const result=shoveTarget(state),s=result.state;
  assert.equal(result.changed,true);
  assert.match(result.message,/FIL D'ALARME/);
  assert.equal(s.run.traps.find(t=>t.kind==="alarm_wire").status,"triggered");
  assert.equal(s.run.alarmUntil,s.run.turns+3);
  assert.equal(s.run.rngState,rng);
  assert.equal(s.meta.hero.xp,originalXp);
  assert.equal(s.run.enemies.length,1);
  assert.deepEqual([s.run.enemies[0].x,s.run.enemies[0].y],
    [state.run.traps.find(t=>t.kind==="alarm_wire").x,
      state.run.traps.find(t=>t.kind==="alarm_wire").y]);
  assert.ok(validateSave(s),"spent trap may safely host a living enemy");
  const reloaded=normalizeJournal(JSON.parse(JSON.stringify(s)));
  assert.ok(validateSave(reloaded));
  assert.equal(reloaded.run.alarmUntil,s.run.alarmUntil);
  const afterRecall=recall(reloaded).state;
  assert.equal(afterRecall.run,null);
  assert.ok(validateSave(afterRecall));
});

test("GAME-095C2: hidden traps cannot be exploited or disclosed by the preview",()=>{
  const {state}=findTrapFixture("unstable_slab");
  const trap=state.run.traps.find(t=>t.kind==="unstable_slab");
  trap.status="hidden";
  const old=JSON.stringify(state);
  assert.equal(shoveOpportunity(state.run,foe(state)),null);
  assert.equal(shoveTarget(state).changed,false);
  assert.equal(JSON.stringify(state),old);
  trap.status="disabled";
  assert.equal(shoveOpportunity(state.run,foe(state)).trapKind,null);
  const pushed=shoveTarget(state).state;
  assert.ok(validateSave(pushed));
  assert.equal(pushed.run.traps.find(t=>t.kind==="unstable_slab").status,
    "disabled");
  assert.equal(foe(pushed).hp,2);
});

test("GAME-095C2: Android combat action is wired and fully cached offline",()=>{
  const read=path=>readFileSync(new URL("../docs/"+path,import.meta.url),"utf8");
  const app=read("app.js"),html=read("index.html"),sw=read("sw.js");
  assert.match(html,/id="combat-shove"/);
  assert.match(html,/id="combat-shove-hint"/);
  assert.match(app,/shoveOpportunity\(state\.run,enemy\)/);
  assert.match(app,/\$\("combat-shove"\)\.disabled/);
  assert.match(app,/act\(shoveTarget\(state\)\)/);
  assert.match(app,/"g":"shove"/);
  assert.match(sw,/game095c2-shove-traps/);
  assert.match(sw,/"\.\/terrain-tactics\.js"/);
});
