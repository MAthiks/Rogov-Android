// DEV-083 — Optional, warned, persistent traps in new deep descents.
// This file has no dependency on game.js or RNG used by combat.
import {visibleCells,visionKey} from "./exploration-visibility.js";

export const TRAP_KINDS=Object.freeze({
  unstable_slab:Object.freeze({
    name:"Dalle instable",
    clue:"La poussière révèle de petites fissures autour d'une dalle affaissée.",
    description:"Une dalle fragilisée peut infliger jusqu'à 2 PV si tu choisis de marcher dessus."
  }),
  alarm_wire:Object.freeze({
    name:"Fil d'alarme",
    clue:"Un fil sombre relie deux pierres. De fines marques rayent le sol.",
    description:"Un fil tendu peut alerter les Charognards proches pendant 3 tours, sans infliger de dégâts."
  })
});
const key=(p)=>p.x+","+p.y;
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const tile=(map,p)=>map[p.y]?.[p.x]??"#";
const adjacent=(p)=>[
  {x:p.x,y:p.y-1},{x:p.x+1,y:p.y},
  {x:p.x,y:p.y+1},{x:p.x-1,y:p.y}
];
const floor=(map,p)=>tile(map,p)===".";

/** DEV-086: place an alarm across a real corridor and a pressure slab beside
 * an optional deep chest. Both must offer a visible, reachable warning tile.
 * Any proposed pair is treated as BLOCKED for extraction and loot validation:
 * there is always a reasonable route that does not require taking the risk.
 * Existing run.traps are never regenerated or migrated.
 */
export function placeOptionalTraps(layout,index,route,twoWays){
  if(!layout?.map||!Array.isArray(layout.rooms)||!Array.isArray(layout.enemies)||
      !Number.isSafeInteger(index)||index<2)throw new TypeError("Invalid deep trap layout");
  const {map,start,exit,rooms,enemies}=layout;
  const lootPoints=Object.entries(layout.loot).map(([pos,item])=>{
    const [x,y]=pos.split(",").map(Number);return {x,y,item};
  });
  const forbidden=new Set([
    key(start),key(exit),
    ...Object.keys(layout.loot),...enemies.map(key),
    ...layout.doors.map(key),
    ...(layout.secrets||[]).flatMap(s=>[key(s),key(s.clue)])
  ]);
  const enemyKeys=enemies.map(key);
  const deepChests=lootPoints.filter(p=>p.item!=="consumable.bandage");
  // Traffic is where a player would naturally walk to extract or reach loot.
  // Unlike DEV-083 we deliberately allow traps on these routes, provided
  // independent, trap-free alternatives remain available.
  const traffic=new Set();
  const approaches=new Map();
  for(const [from,to] of [[start,exit],
      ...lootPoints.flatMap(p=>[[start,p],[p,exit]])]){
    const path=route(map,from,to)||[];
    for(const p of path)traffic.add(key(p));
    if(from===start&&deepChests.includes(to))
      approaches.set(key(to),new Set(path.map(key)));
  }
  const insideRoom=p=>rooms.some(r=>p.x>=r.x&&p.x<r.x+r.width&&
    p.y>=r.y&&p.y<r.y+r.height);
  // Corridor floor is a genuine inter-room connector, NOT a room threshold
  // or a door tile. Never place hazards on the first safe entry chamber.
  const corridor=p=>floor(map,p)&&!insideRoom(p);
  const noise=p=>(p.x*97+p.y*389+index*131)%101;
  function option(p){
    if(!floor(map,p)||forbidden.has(key(p))||
        dist(p,start)<5||dist(p,exit)<4||
        enemies.some(e=>dist(e,p)<2))return null;
    const blockers=new Set([...enemyKeys,key(p)]);
    // Reachability is tested without stepping onto the trap or an enemy.
    // Choose the closest accessible hint tile, making the warning visible
    // from the safe side of the approach rather than behind the mechanism.
    const clues=adjacent(p).filter(q=>floor(map,q)&&!forbidden.has(key(q)))
      .sort((a,b)=>dist(a,start)-dist(b,start)||noise(a)-noise(b));
    // Most candidates have a safe approach on the first side; test them
    // lazily rather than calculating up to four full BFS routes per tile.
    const clue=clues.find(q=>route(map,start,q,blockers));
    return clue?{p,clue}:null;
  }
  const alarms=[],slabs=[];
  for(let y=1;y<map.length-1;y++)for(let x=1;x<map[y].length-1;x++){
    const p={x,y};
    if(corridor(p)){
      const candidate=option(p);
      if(candidate){
        candidate.score=(traffic.has(key(p))?1000:0)+
          (traffic.has(key(candidate.clue))?100:0)+noise(p);
        alarms.push(candidate);
      }
    }
  }
  for(const chest of deepChests){
    for(const p of adjacent(chest)){
      if(insideRoom(p)){
        const candidate=option(p);
        if(candidate){
          candidate.score=(approaches.get(key(chest))?.has(key(p))?1000:0)+
            (chest.item==="relic.ashen_fragment"?50:0)+noise(p);
          slabs.push(candidate);
        }
      }
    }
  }
  alarms.sort((a,b)=>b.score-a.score||key(a.p).localeCompare(key(b.p)));
  slabs.sort((a,b)=>b.score-a.score||key(a.p).localeCompare(key(b.p)));
  function safePair(a,b){
    const positions=new Set([key(a.p),key(b.p)]);
    const noCombat=new Set([...positions,...enemyKeys]);
    if(dist(a.p,b.p)<3||
        positions.has(key(a.clue))||positions.has(key(b.clue))||
        key(a.clue)===key(b.clue)||
        !route(map,start,a.clue,noCombat)||
        !route(map,start,b.clue,noCombat)||
        !route(map,start,exit,noCombat)||
        !twoWays(map,start,exit,positions))return false;
    return lootPoints.every(chest=>
      twoWays(map,chest,exit,positions)&&
      route(map,start,chest,noCombat)&&
      route(map,chest,exit,noCombat));
  }
  for(const alarm of alarms)for(const slab of slabs){
    if(!safePair(alarm,slab))continue;
    const result=[
      {kind:"alarm_wire",...alarm},
      {kind:"unstable_slab",...slab}
    ];
    return result.map(t=>({
      id:"nhal-trap-"+t.kind+"-01",kind:t.kind,x:t.p.x,y:t.p.y,
      clue:{x:t.clue.x,y:t.clue.y},status:"hidden",attempts:0
    }));
  }
  // The caller can try the next deterministic layout, rather than ever
  // falling back to invisible, meaningless or mandatory trap placements.
  throw new Error("No safe DEV-086 corridor and chest trap pair");
}

export function validTraps(run){
  if(run?.traps===undefined)return true; // Legacy saves are never retrofitted.
  if(!Array.isArray(run.traps)||run.traps.length!==2||!run.rooms||
    !Array.isArray(run.map)||run.map.length!==32)return false;
  if(run.traps[0]?.kind!=="alarm_wire"||run.traps[1]?.kind!=="unstable_slab")return false;
  const occupied=new Set();
  for(const trap of run.traps){
    if(!trap||trap.id!=="nhal-trap-"+trap.kind+"-01"||
       !TRAP_KINDS[trap.kind]||!Number.isInteger(trap.x)||!Number.isInteger(trap.y)||
       !Number.isInteger(trap.clue?.x)||!Number.isInteger(trap.clue?.y)||
       dist(trap,trap.clue)!==1||
       !["hidden","revealed","disabled","triggered"].includes(trap.status)||
       !Number.isSafeInteger(trap.attempts)||trap.attempts<0||
       !floor(run.map,trap)||!floor(run.map,trap.clue)||
       occupied.has(key(trap))||occupied.has(key(trap.clue)))return false;
    occupied.add(key(trap));occupied.add(key(trap.clue));
    if(key(run.start)===key(trap)||key(run.exit)===key(trap)||
       run.doors?.some(d=>key(d)===key(trap))||
       (!["disabled","triggered"].includes(trap.status)&&
         (run.enemies||[]).some(e=>key(e)===key(trap)))||
       Object.keys(run.loot||{}).includes(key(trap)))return false;
  }
  // GAME-101D: a risk/reward signal can legitimately set a five-turn alarm.
  // Historical trap wires, shove noise and legacy saves retain the three-turn
  // limit. Never accept a forged longer alarm without the paid, resolved choice.
  const signalAlert=run.encounterPlanVersion===1&&
    run.encounters?.some(site=>site.kind==="signal"&&
      site.status==="resolved"&&site.choice==="alarm");
  const alarmLimit=signalAlert?5:3;
  if(run.alarmUntil!==undefined&&
    (!Number.isSafeInteger(run.alarmUntil)||run.alarmUntil<0||
     run.alarmUntil>run.turns+alarmLimit))return false;
  return true;
}
export const trapAt=(run,x,y)=>run?.traps?.find(t=>t.x===x&&t.y===y)||null;
export function trapVisible(run,trap){
  return Boolean(run?.exploration&&trap&&
    visibleCells(run).has(visionKey(run,trap.x,trap.y)));
}
/** Player must see the actual ground. Hidden traps expose only environmental
 * traces; the type is never leaked into inspection or the DOM ahead of LOS.
 */
export function trapAppearance(run,x,y){
  const t=trapAt(run,x,y);
  if(!t||!trapVisible(run,t))return null;
  if(t.status==="hidden"&&dist(run,t)>3)return null;
  return t.status==="disabled"?{symbol:"x",sprite:"trap_disabled",name:"Piège désamorcé"}:
    t.status==="triggered"?{symbol:";",sprite:"trap_triggered",name:"Piège déclenché"}:
    t.status==="revealed"?{symbol:"!",sprite:"trap_revealed",name:TRAP_KINDS[t.kind].name}:
    {symbol:"~",sprite:"trap_clue",name:"Sol suspect"};
}
export function nearbyTrapHint(run,perception=5){
  if(!run?.traps)return null;
  const sight=visibleCells(run),range=perception>=7?4:3;
  return run.traps.filter(t=>["hidden","revealed"].includes(t.status))
    .filter(t=>dist(run,t)<=range&&
      sight.has(visionKey(run,t.x,t.y))&&
      sight.has(visionKey(run,t.clue.x,t.clue.y)))
    .sort((a,b)=>dist(run,a)-dist(run,b))[0]||null;
}
export function trapHintText(trap){
  if(!trap)return "";
  return trap.status==="hidden"
    ?TRAP_KINDS[trap.kind].clue+" Fouille à côté pour identifier le risque (1 tour)."
    :TRAP_KINDS[trap.kind].name+" — "+TRAP_KINDS[trap.kind].description+
      " Tu peux contourner ou tenter un désamorçage (1 tour, risque d'échec sans déclenchement).";
}
