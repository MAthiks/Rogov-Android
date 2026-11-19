// GAME-095D1 — deterministic, reproducible balance laboratory.
// This is NOT an autonomous player, real end-to-end dungeon clearing, or an
// estimate of human win rates. Surveys generated 3-floor expeditions and
// separately tests isolated melee encounters via the ACTUAL game API.
// Usage: node tools/balance-lab.mjs --count=100 --start=2
import {newGame,beginRun,resolveFloorExit,attackTarget,defend,waitTurn,
  validateSave,MAX_HP,INVENTORY_LIMIT} from "../docs/game.js";
import {deepRoute,deepTwoReturnWays} from "../docs/deep-dungeon.js";
import {revealAround} from "../docs/exploration-visibility.js";
import {MAX_FLOOR_DEPTH} from "../docs/floors.js";

export const BALANCE_LAB_VERSION=1;
export const BALANCE_LAB_DEFAULT_COUNT=100;
export const LAB_POLICIES=Object.freeze(["attack","telegraph_dodge"]);
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const key=p=>p.x+","+p.y;
const round=n=>Math.round(n*100)/100;
const defaultMeasure=()=>({fights:0,wins:0,recalls:0,timeouts:0,
  hpLost:0,turns:0,waits:0,enduranceLeft:0});

/** A verified setup in a real generated layout. The opponent is isolated
 * so measures answer "what does this enemy do alone?" rather than pretending
 * to model human pathfinding, tactical scouting or multiple monster threats.
 */
export function isolatedEncounter(world,enemy){
  const run=world?.run;
  if(!run||!enemy||enemy.hp<=0)return null;
  for(const [dx,dy] of DIRS){
    const x=enemy.x+dx,y=enemy.y+dy;
    if(run.map[y]?.[x]!=="."||
       (run.traps||[]).some(t=>t.x===x&&t.y===y)||
       (run.sites||[]).some(t=>t.x===x&&t.y===y)||
       (run.secrets||[]).some(t=>t.x===x&&t.y===y&&t.revealed))continue;
    const s=structuredClone(world);
    s.run.x=x;s.run.y=y;
    s.run.enemies=[structuredClone(enemy)];
    s.run.targetId=enemy.id;
    s.run.hp=MAX_HP;
    s.run.endurance=s.run.enduranceMax;
    s.run.defense="none";s.run.alarmUntil=0;
    // Starting at turn 0 avoids arbitrary rift pulse offsets.
    s.run.turns=0;
    revealAround(s.run);
    if(validateSave(s))return s;
  }
  return null;
}
export function runIsolatedDuel(scenario,policy,limit=24){
  if(!LAB_POLICIES.includes(policy)||!Number.isInteger(limit)||limit<1)
    throw new RangeError("Invalid balance policy or turn limit");
  let state=structuredClone(scenario),waits=0,actions=0;
  const initialEndurance=state.run.endurance;
  const enemyId=state.run.targetId;
  for(let i=0;i<limit;i++){
    const e=state.run?.enemies?.find(e=>e.id===enemyId&&e.hp>0);
    if(!e)break;
    const run=state.run;
    // This is an intentionally simple baseline. A reactive stance is used
    // only against an actually announced Guardian heavy at CONTACT.
    const react=policy==="telegraph_dodge"&&e.kind==="guardian"&&
      e.tactic==="winding"&&run.endurance>=2;
    let outcome;
    if(react)outcome=defend(state,"dodge");
    else if(run.endurance<1){
      outcome=waitTurn(state);waits++;
    }else outcome=attackTarget(state);
    if(!outcome.changed)break;
    state=outcome.state;
    actions++;
    if(!state.run)break; // Actual Rappel / permanent lost bag.
  }
  const wins=Boolean(state.run&&
    !(state.run.enemies||[]).some(e=>e.id===enemyId&&e.hp>0));
  return {
    outcome:wins?"win":!state.run?"recall":"timeout",
    hpLost:MAX_HP-(state.run?.hp??0),
    turns:state.run?.turns??actions,
    waits,
    initialEndurance,
    enduranceLeft:state.run?.endurance??0,
    actions
  };
}
function summarize(measure){
  const fights=measure.fights||1;
  return {
    fights:measure.fights,wins:measure.wins,recalls:measure.recalls,
    timeouts:measure.timeouts,winRatePct:round(measure.wins*100/fights),
    avgHpLost:round(measure.hpLost/fights),
    avgTurns:round(measure.turns/fights),
    avgWaits:round(measure.waits/fights),
    avgEnduranceLeft:round(measure.enduranceLeft/fights)
  };
}
const selectedEnemies=run=>{
  const kinds=["charognard","guardian","rift_larva"];
  return kinds.map(kind=>(run.enemies||[]).find(e=>e.kind===kind)).filter(Boolean);
};
/** Floors are actual layouts and transitions, not generated toy maps.
 * Route lengths are geometry upper bounds: enemies, traps and doors still
 * have turn costs, so these are NOT estimates of traversal duration.
 */
export function runBalanceLab({start=2,count=BALANCE_LAB_DEFAULT_COUNT}={}){
  if(!Number.isSafeInteger(start)||start<2||
     !Number.isSafeInteger(count)||count<1||count>300)
    throw new RangeError("Balance lab supports 1..300 reproducible descents");
  const floors=[],fights=new Map(),maps=new Set();
  for(let depth=1;depth<=MAX_FLOOR_DEPTH;depth++)
    floors.push({depth,generated:0,invalid:0,routeBlocked:0,
      missingReturnPath:0,routeSteps:0,chests:0,
      healingOptional:0,equipmentOptional:0,
      bandageClose:0,encounterSlots:0,duelsSkipped:0});
  let bagOverflowIfCollectAll=0;
  for(let descent=start;descent<start+count;descent++){
    const source=newGame();
    source.meta.descents=descent-1;
    let world=beginRun(source,["weapon.rusty_sword"],null,{multiFloor:true}).state;
    let theoreticalBag=1;
    for(let depth=1;depth<=MAX_FLOOR_DEPTH;depth++){
      if(!world?.run||world.run.floorDepth!==depth||
         !validateSave(world))throw new Error("Invalid depth "+depth+" descent "+descent);
      const run=world.run,entry=floors[depth-1];
      entry.generated++;
      maps.add(run.map.join(""));
      const enemies=new Set(run.enemies.map(key));
      const traps=new Set((run.traps||[]).map(key));
      const route=deepRoute(run.map,run.start,run.exit,
        new Set([...enemies,...traps]));
      if(!route)entry.routeBlocked++;
      else entry.routeSteps+=route.length-1;
      if(!deepTwoReturnWays(run.map,run.start,run.exit,traps))
        entry.missingReturnPath++;
      const ids=Object.values(run.loot);
      entry.chests+=ids.length;
      theoreticalBag+=ids.length;
      const optional=ids.find(id=>id!=="relic.ashen_fragment"&&
        id!=="consumable.bandage");
      if(!optional)throw new Error("Missing optional reward "+descent+"/"+depth);
      if(optional.startsWith("consumable."))entry.healingOptional++;
      else entry.equipmentOptional++;
      const bandage=Object.entries(run.loot).find(([,id])=>
        id==="consumable.bandage");
      if(!bandage)throw new Error("Missing bandage "+descent+"/"+depth);
      const [x,y]=bandage[0].split(",").map(Number);
      if(Math.abs(x-run.start.x)+Math.abs(y-run.start.y)<=3)
        entry.bandageClose++;
      const slots=selectedEnemies(run);
      entry.encounterSlots+=slots.length;
      for(const enemy of slots){
        const scenario=isolatedEncounter(world,enemy);
        if(!scenario){entry.duelsSkipped++;continue;}
        for(const policy of LAB_POLICIES){
          const id=depth+"/"+enemy.kind+"/"+policy;
          const m=fights.get(id)||defaultMeasure();
          const sample=runIsolatedDuel(scenario,policy);
          m.fights++;
          if(sample.outcome==="win")m.wins++;
          if(sample.outcome==="recall")m.recalls++;
          if(sample.outcome==="timeout")m.timeouts++;
          m.hpLost+=sample.hpLost;
          m.turns+=sample.turns;
          m.waits+=sample.waits;
          m.enduranceLeft+=sample.enduranceLeft;
          fights.set(id,m);
        }
      }
      if(depth<MAX_FLOOR_DEPTH){
        // Move to the exit ONLY to sample the canonical floor transition.
        // This is a fixture, not an invented navigation algorithm.
        const atExit=structuredClone(world);
        atExit.run.x=atExit.run.exit.x;
        atExit.run.y=atExit.run.exit.y;
        atExit.run.enemies=[];
        const result=resolveFloorExit(atExit,"descend");
        if(!result.changed)throw new Error("Transition failed "+descent+"/"+depth);
        world=result.state;
      }
    }
    if(theoreticalBag>INVENTORY_LIMIT)bagOverflowIfCollectAll++;
  }
  return Object.freeze({
    labVersion:BALANCE_LAB_VERSION,seedStart:start,expeditionSamples:count,
    generatedFloors:count*MAX_FLOOR_DEPTH,distinctLayouts:maps.size,
    model:"generated-floor safety survey + isolated seeded encounters, not human win rates",
    bagOverflowIfCollectAll,
    floors:floors.map(f=>({...f,
      averageSafeRouteSteps:round(f.routeSteps/(f.generated||1)),
      optionalConsumablePct:round(f.healingOptional*100/(f.generated||1))})),
    encounters:Object.fromEntries([...fights.entries()]
      .sort(([a],[b])=>a.localeCompare(b))
      .map(([k,m])=>[k,summarize(m)]))
  });
}
function main(){
  const opts={};
  for(let i=2;i<process.argv.length;i++){
    const arg=process.argv[i];
    if(arg==="--count"||arg==="--start"){
      const next=process.argv[++i];
      if(next===undefined)throw new Error("Missing value for "+arg);
      opts[arg.slice(2)]=Number(next);
    }else if(arg.startsWith("--count=")||arg.startsWith("--start=")){
      const [option,value]=arg.split("=",2);
      if(!value)throw new Error("Missing value for "+option);
      opts[option.slice(2)]=Number(value);
    }else throw new Error("Usage: node tools/balance-lab.mjs --count N --start N");
  }
  const report=runBalanceLab(opts);
  console.log(JSON.stringify(report,null,2));
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href)
  main();
