// GAME-095D3 — full-action, scripted resource audit of the existing engine.
// An oracle route planner knows the generated MAP (not the concealed rewards).
// Every consequential action uses public game functions; there is no teleport,
// artificially restored health or edited combat state after beginRun.
// Results measure these deterministic BOT policies, NOT human win rates.
import {newGame,beginRun,move,attackTarget,defend,waitTurn,toggleDoor,
  openChest,swapChestReward,chestSwapChoices,useItem,equipItem,
  resolveFloorExit,validateSave,inventoryCount,MAX_HP,INVENTORY_LIMIT,
  DIRECTIONS} from "../docs/game.js";
import {deepRoute} from "../docs/deep-dungeon.js";
import {MAX_FLOOR_DEPTH} from "../docs/floors.js";
import {EQUIPMENT_CATALOG} from "../docs/stats.js";

export const EXPEDITION_AUDIT_VERSION=1;
export const ROUTE_POLICIES=Object.freeze(["exit_only","scavenge"]);
export const DEFAULT_TRIALS=20;
export const DEFAULT_MAX_ACTIONS=440;
const round=n=>Math.round(n*100)/100;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const key=(x,y)=>x+","+y;
const directions=Object.entries(DIRECTIONS);
const trapBlocks=run=>new Set((run.traps||[])
  .filter(t=>t.status!=="triggered")
  .map(t=>key(t.x,t.y)));

function routeTo(run,target){
  return deepRoute(run.map,{x:run.x,y:run.y},target,trapBlocks(run));
}
function chooseDestination(run,policy,skipped){
  if(policy==="scavenge"){
    const options=Object.keys(run.loot||{}).filter(id=>
      !run.collected.includes(id)&&!skipped.has(id))
      .map(id=>{
        const [x,y]=id.split(",").map(Number);
        const route=routeTo(run,{x,y});
        return {id,x,y,route};
      }).filter(t=>t.route)
      .sort((a,b)=>a.route.length-b.route.length||a.id.localeCompare(b.id));
    if(options.length)return {...options[0],kind:"chest"};
  }
  return {kind:"exit",x:run.exit.x,y:run.exit.y,
    route:routeTo(run,run.exit)};
}
function adjacentEnemy(run){
  return (run.enemies||[]).filter(e=>e.hp>0&&distance(e,run)===1)
    .sort((a,b)=>a.id.localeCompare(b.id))[0]||null;
}
function directionTo(a,b){
  return directions.find(([,v])=>a.x+v[0]===b.x&&a.y+v[1]===b.y)?.[0]||null;
}
function possibleEquipment(run){
  if(!run.loadout)return null;
  for(const [id,count] of Object.entries(run.carried)){
    const entry=EQUIPMENT_CATALOG[id];
    if(count>0&&entry?.slot&&entry.slot!=="mainHand"&&!run.loadout[entry.slot])
      return id;
  }
  return null;
}
function disposable(run){
  // Never peek at run.loot rewards; retain scarce supplies and equipped gear.
  const protectedItems=new Set(Object.values(run.loadout||{}));
  return chestSwapChoices(run)
    .filter(id=>!protectedItems.has(id))
    .sort((a,b)=>{
      const rank=id=>id==="relic.ashen_fragment"?3:
        id.startsWith("consumable.")?2:id.startsWith("weapon.")?1:0;
      return rank(a)-rank(b)||a.localeCompare(b);
    })[0]||null;
}
function initialWorld(seed){
  const world=newGame();
  world.meta.descents=seed-1; // Only fixture setup, before the game starts.
  const result=beginRun(world,{"weapon.rusty_sword":1,"consumable.bandage":2},
    null,{multiFloor:true});
  if(!result.changed||!validateSave(result.state))
    throw new Error("GAME-095D3 initial state invalid for seed "+seed);
  return result.state;
}

/** A complete series of engine actions from Veyr to extraction, Rappel,
 * route failure, or explicit budget exhaustion. The model is scripted and
 * omniscient about GEOMETRY: outcomes are not representative of players.
 */
export function runExpeditionTrial({seed,policy,maxActions=DEFAULT_MAX_ACTIONS}={}){
  if(!Number.isSafeInteger(seed)||seed<2||
     !ROUTE_POLICIES.includes(policy)||
     !Number.isSafeInteger(maxActions)||maxActions<1||maxActions>3000)
    throw new RangeError("Invalid expedition audit seed/policy/budget");
  let state=initialWorld(seed),outcome="budget_exhausted";
  let currentFloor=1,skipped=new Set();
  const data={seed,policy,outcome:null,deepestFloor:1,actions:0,
    actualTurns:0,steps:0,attacks:0,dodges:0,doorsOpened:0,
    waits:0,healingUsed:0,vigorUsed:0,equipmentChanges:0,
    openedChests:0,chestSwaps:0,freeSelections:0,
    peakBag:inventoryCount(state),damageTaken:0,hpRestored:0,
    finalHp:null,stashSecured:false};

  const apply=(result,kind)=>{
    if(!result?.changed)return false;
    const prev=state.run,oldHp=prev?.hp??0,oldTurns=prev?.turns??0;
    const oldCollected=prev?.collected?.length??0;
    state=result.state;
    const next=state.run;
    if(next&&next.floorDepth===prev?.floorDepth){
      data.damageTaken+=Math.max(0,oldHp-next.hp);
      data.hpRestored+=Math.max(0,next.hp-oldHp);
      data.openedChests+=Math.max(0,(next.collected?.length??0)-oldCollected);
    }
    data.actions++;
    if(next){
      data.actualTurns=next.turns;
      data.peakBag=Math.max(data.peakBag,inventoryCount(state));
      data.deepestFloor=Math.max(data.deepestFloor,next.floorDepth||1);
      if(!validateSave(state))
        throw new Error("GAME-095D3 invalid run after "+kind+" seed "+seed);
    } else {
      // A lethal enemy phase still consumed the triggering action's turn.
      // Extraction from an Arche and a free target selection consume none.
      data.actualTurns=oldTurns+(kind==="floor"||kind==="select"?0:1);
      if(state.meta.recalls>0)data.damageTaken+=oldHp;
    }
    if(kind==="move"&&next&&
       (prev.x!==next.x||prev.y!==next.y))data.steps++;
    if(kind==="attack")data.attacks++;
    if(kind==="dodge")data.dodges++;
    if(kind==="door")data.doorsOpened++;
    if(kind==="wait")data.waits++;
    if(kind==="heal")data.healingUsed++;
    if(kind==="vigor")data.vigorUsed++;
    if(kind==="equip")data.equipmentChanges++;
    if(kind==="swap")data.chestSwaps++;
    if(kind==="select")data.freeSelections++;
    return true;
  };

  for(let attempt=0;attempt<maxActions;attempt++){
    const run=state.run;
    if(!run){
      outcome=state.meta.recalls>0?"recall":"extracted";
      data.stashSecured=outcome==="extracted";
      break;
    }
    if(run.floorDepth!==currentFloor){
      currentFloor=run.floorDepth;
      skipped=new Set();
    }
    if(run.x===run.exit.x&&run.y===run.exit.y){
      data.finalHp=run.hp;
      const leave=run.floorDepth===MAX_FLOOR_DEPTH||
        (run.hp<=4&&!run.carried["consumable.bandage"]&&
         !run.carried["consumable.dusk_tonic"]);
      const result=resolveFloorExit(state,leave?"extract":"descend");
      if(!apply(result,"floor")){outcome="exit_rejected";break;}
      continue;
    }

    // Explicit resource use always consumes a real turn and enemy phase.
    if(run.hp<=MAX_HP-4){
      const item=run.carried["consumable.bandage"]?"consumable.bandage":
        run.carried["consumable.dusk_tonic"]?"consumable.dusk_tonic":null;
      if(item){
        if(!apply(useItem(state,item),"heal")){outcome="invalid_heal";break;}
        continue;
      }
    }
    if(policy==="scavenge"&&run.endurance<=run.enduranceMax-6&&
       run.carried["consumable.vigor_salts"]){
      if(!apply(useItem(state,"consumable.vigor_salts"),"vigor")){
        outcome="invalid_vigor";break;
      }
      continue;
    }

    const enemy=adjacentEnemy(run);
    if(enemy){
      const direction=directionTo(run,enemy);
      if(run.targetId!==enemy.id){
        const before=run.turns;
        const selected=move(state,direction);
        if(!apply(selected,"select")||state.run?.turns!==before){
          outcome="invalid_target";break;
        }
      }else if(policy==="scavenge"&&enemy.kind==="guardian"&&
               enemy.tactic==="winding"&&run.endurance>=2){
        if(!apply(defend(state,"dodge"),"dodge")){
          outcome="invalid_dodge";break;
        }
      }else if(run.endurance<1){
        if(!apply(waitTurn(state),"wait")){outcome="invalid_wait";break;}
      }else if(!apply(attackTarget(state),"attack")){
        outcome="invalid_attack";break;
      }
      continue;
    }

    if(policy==="scavenge"){
      const equipment=possibleEquipment(run);
      if(equipment){
        if(!apply(equipItem(state,equipment),"equip")){
          outcome="invalid_equipment";break;
        }
        continue;
      }
    }

    const destination=chooseDestination(run,policy,skipped);
    if(!destination.route){outcome="route_blocked";break;}
    if(destination.kind==="chest"&&distance(run,destination)<=1){
      let result,kind="chest";
      if(inventoryCount(state)<INVENTORY_LIMIT)
        result=openChest(state,destination.x,destination.y);
      else {
        const oldItem=disposable(run);
        if(oldItem){
          result=swapChestReward(state,destination.x,destination.y,oldItem);
          kind="swap";
        }
      }
      if(result?.changed){
        if(!apply(result,kind)){outcome="invalid_chest";break;}
      }else skipped.add(destination.id);
      continue;
    }

    const next=destination.route[1];
    if(!next){
      // At the exit branch above, or at an unopened chest with no
      // permitted swap: advance to the next destination, never spin.
      if(destination.kind==="chest"){skipped.add(destination.id);continue;}
      outcome="no_route_step";break;
    }
    const direction=directionTo(run,next);
    if(!direction){outcome="invalid_route_step";break;}
    if(run.map[next.y]?.[next.x]==="+"&&
       !run.doors?.find(d=>d.x===next.x&&d.y===next.y)?.open){
      if(!apply(toggleDoor(state,next.x,next.y),"door")){
        outcome="door_rejected";break;
      }
    }else{
      const result=move(state,direction);
      if(!apply(result,"move")){outcome="move_rejected";break;}
    }
  }
  if(!state.run){
    outcome=state.meta.recalls>0?"recall":"extracted";
    data.stashSecured=outcome==="extracted";
  }
  data.outcome=outcome;
  data.finalHp=state.run?.hp??(state.meta.recalls>0?0:data.finalHp);
  if(data.peakBag>INVENTORY_LIMIT)
    throw new Error("GAME-095D3 bag overflow");
  return Object.freeze(data);
}
function summarize(rows){
  const n=rows.length;
  const avg=field=>round(rows.reduce((s,r)=>s+r[field],0)/n);
  return {trials:n,extracted:rows.filter(r=>r.outcome==="extracted").length,
    recalls:rows.filter(r=>r.outcome==="recall").length,
    incomplete:rows.filter(r=>!["extracted","recall"].includes(r.outcome)).length,
    avgDeepestFloor:avg("deepestFloor"),avgTurns:avg("actualTurns"),
    avgDamageTaken:avg("damageTaken"),avgHpRestored:avg("hpRestored"),
    avgOpenedChests:avg("openedChests"),avgHealingUsed:avg("healingUsed"),
    avgChestSwaps:avg("chestSwaps"),avgEquipmentChanges:avg("equipmentChanges"),
    avgPeakBag:avg("peakBag")};
}
export function runExpeditionAudit({start=2,count=DEFAULT_TRIALS,
  maxActions=DEFAULT_MAX_ACTIONS}={}){
  if(!Number.isSafeInteger(start)||start<2||
     !Number.isSafeInteger(count)||count<1||count>100||
     !Number.isSafeInteger(maxActions)||maxActions<1||maxActions>3000)
    throw new RangeError("GAME-095D3: invalid audit options");
  const trials=[];
  for(let seed=start;seed<start+count;seed++)
    for(const policy of ROUTE_POLICIES)
      trials.push(runExpeditionTrial({seed,policy,maxActions}));
  return {auditVersion:EXPEDITION_AUDIT_VERSION,seedStart:start,
    expeditionSeeds:count,engineActionTrials:trials.length,
    model:"scripted full-map-oracle route + actual engine actions; not human win rates",
    policies:Object.fromEntries(ROUTE_POLICIES.map(policy=>
      [policy,summarize(trials.filter(r=>r.policy===policy))])),
    trials};
}
if(process.argv[1]&&import.meta.url===new URL("file://"+process.argv[1]).href){
  const opts={};
  for(let i=2;i<process.argv.length;i++){
    const arg=process.argv[i];
    const match=/^--(count|start|max-actions)(?:=(.*))?$/.exec(arg);
    if(!match)throw new Error("Usage: expedition-audit.mjs --count N --start N --max-actions N");
    const value=match[2]??process.argv[++i];
    if(!value||!/^[0-9]+$/.test(value))throw new RangeError("Invalid "+match[1]);
    opts[match[1]==="max-actions"?"maxActions":match[1]]=Number(value);
  }
  console.log(JSON.stringify(runExpeditionAudit(opts),null,2));
}
