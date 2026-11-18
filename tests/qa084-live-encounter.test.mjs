// QA-084 — full high-risk route with genuine spawned enemies and real combat AI.
// No enemy removal, teleportation, forced RNG outcomes, or retroactive save edits.
import test from "node:test";
import assert from "node:assert/strict";
import {newGame,beginRun,move,attackTarget,waitTurn,useItem,validateSave,
  normalizeJournal} from "../docs/game.js";
import {selectTarget} from "../docs/combat.js";
import {deepRoute} from "../docs/deep-dungeon.js";

const key=p=>p.x+","+p.y;
const directions={"1,0":"right","-1,0":"left","0,1":"down","0,-1":"up"};
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const asPoint=key=>{const [x,y]=key.split(",").map(Number);return {x,y};};
// DEV-086: real movement includes warned traps on corridor/chest approaches.
// Preserve full AI and trap state; choose safe public alternatives instead.
const safeBlockers=run=>new Set([...run.enemies,...(run.traps||[])].map(key));

function routeAvoidingCreatures(run,target){
  const blocked=safeBlockers(run);
  return deepRoute(run.map,{x:run.x,y:run.y},target,blocked);
}
function approachLiveTarget(run,enemy){
  const blocked=safeBlockers(run);
  const choices=[[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dx,dy])=>({x:enemy.x+dx,y:enemy.y+dy}))
    .map(p=>deepRoute(run.map,{x:run.x,y:run.y},p,blocked))
    .filter(Boolean).sort((a,b)=>a.length-b.length);
  return choices[0]||null;
}
function moveOne(state,to){
  const direction=directions[(to.x-state.run.x)+","+(to.y-state.run.y)];
  assert.ok(direction,"Next move must be one orthogonal square");
  const before=state.run.turns;
  const result=move(state,direction);
  assert.ok(result.changed,"A legitimate step must be available");
  assert.ok(result.state.run||to.x===state.run.exit.x&&to.y===state.run.exit.y,
    "No unexpected recall or permadeath");
  if(result.state.run){
    assert.deepEqual([result.state.run.x,result.state.run.y],[to.x,to.y],
      "The normal engine must take the proposed step");
    assert.equal(result.state.run.turns,before+1);
  }
  return result.state;
}
function walkReplanning(state,destination,limit=150){
  let moves=0,previous=null,plan=null;
  const history=[];
  while(state.run && (state.run.x!==destination.x||state.run.y!==destination.y)){
    history.push({at:[state.run.x,state.run.y],turn:state.run.turns,enemies:state.run.enemies.map(e=>[e.x,e.y])});
    assert.ok(moves++<limit,"Unable to find safe public route with active enemies; destination="+key(destination)+" recent="+JSON.stringify(history.slice(-12)));
    const current={x:state.run.x,y:state.run.y};
    const blocked=safeBlockers(state.run);
    // Keep a valid chosen corridor instead of switching to every new shortest
    // path when a territorial Charognard shifts by one tile. Replan only when
    // a real obstruction appears on the next square.
    if(!plan||plan.length<2||key(plan[0])!==key(current)||
        blocked.has(key(plan[1]))){
      plan=routeAvoidingCreatures(state.run,destination);
    }
    assert.ok(plan&&plan.length>=2,"Genuine public route lost because of enemies");
    let next=plan[1];
    if(previous&&key(next)===key(previous)){
      const alternateBlocked=new Set(blocked);
      alternateBlocked.add(key(previous));
      const alternative=deepRoute(state.run.map,current,destination,alternateBlocked);
      if(alternative?.length>=2){plan=alternative;next=alternative[1];}
    }
    previous=current;
    state=moveOne(state,next);
    if(state.run)plan=plan.slice(1);
    if(state.run&&state.run.hp<=7&&(state.run.carried["consumable.bandage"]||0)>0)
      state=useItem(state,"consumable.bandage").state;
  }
  return {state,moves};
}

test("QA-084: actual charognard combat, public loot and extraction with all spawned enemies active",()=>{
  const setup=newGame();
  setup.meta.descents=1; // tutorial already completed; deep sector is next
  let state=beginRun(setup,["weapon.rusty_sword","consumable.bandage"]).state;
  assert.ok(validateSave(state));
  assert.equal(state.run.enemies.length,4,"All four generated enemies must remain active");
  const originalEnemies=state.run.enemies.map(e=>e.id);
  const foeId=state.run.enemies.find(e=>e.id==="nhal-charognard-scout-01")?.id;
  assert.ok(foeId,"Deep dungeon must have a live charognard");
  const startXp=state.meta.hero.xp;
  const seenHP=[];
  let combatActions=0,steps=0;
  for(let attempts=0;attempts<120;attempts++){
    if(!state.run)assert.fail("Died/returned to Veyr while seeking first encounter");
    assert.ok(validateSave(state),"Save integrity after combat/movement");
    const enemy=state.run.enemies.find(e=>e.id===foeId);
    if(!enemy)break; // genuinely killed through attackTarget
    seenHP.push(enemy.hp);
    if(dist(state.run,enemy)===1){
      if(state.run.targetId!==foeId){
        const selected=selectTarget(state,foeId);
        assert.ok(selected.changed,"Visible contact enemy can be targeted");
        state=selected.state;
      }
      if((state.run.endurance||0)<1){
        state=waitTurn(state).state;
      }else{
        const before=state.run.turns;
        const action=attackTarget(state);
        assert.ok(action.changed,"Combat consumes a real player turn");
        state=action.state;
        assert.ok(state.run,"Hero must survive the encounter");
        assert.equal(state.run.turns,before+1);
        combatActions++;
      }
    }else{
      const route=approachLiveTarget(state.run,enemy);
      assert.ok(route&&route.length>=2,"Approach target by public floors only");
      state=moveOne(state,route[1]);
      steps++;
    }
  }
  assert.ok(state.run,"Hero survives initial encounter");
  assert.ok(!state.run.enemies.some(e=>e.id===foeId),"Charognard must be genuinely defeated");
  assert.ok(combatActions>=1,"The live fight must consume an attack");
  assert.ok(state.meta.hero.xp>startXp,"Victory XP is earned from actual combat");
  assert.ok(originalEnemies.includes(foeId));
  assert.ok(validateSave(normalizeJournal(JSON.parse(JSON.stringify(state)))),
    "Save/reload retains combat rewards and remaining enemies");

  const lootPos=Object.entries(state.run.loot)
    .find(([,item])=>item==="relic.ashen_fragment")?.[0];
  assert.ok(lootPos);
  const lootTrip=walkReplanning(state,asPoint(lootPos));
  state=lootTrip.state;
  assert.ok(state.run);
  assert.equal(state.run.carried["relic.ashen_fragment"],1,
    "Public fragment is picked up with all enemies active");
  const returnTrip=walkReplanning(state,state.run.exit);
  state=returnTrip.state;
  assert.equal(state.run,null,"Extraction succeeds through ordinary corridors");
  assert.equal(state.meta.extractions,1);
  assert.equal(state.meta.recalls,0);
  assert.equal(state.meta.stash["relic.ashen_fragment"],1);
  assert.equal(state.meta.stash["weapon.rusty_sword"],1);
  assert.ok(validateSave(state));
  console.log("QA-084 LIVE COMBAT: "+combatActions+" attack(s), "+
    (steps+lootTrip.moves+returnTrip.moves)+" movement(s), HP path "+
    seenHP.join(",")+", extraction and persisted loot PASS");
});
