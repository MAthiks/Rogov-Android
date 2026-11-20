// GAME-101D — Two optional, physically distinct encounters on fresh deep floors.
// No geometry, combat RNG, old three-site array or existing saves are mutated.
import {ROOM_SITES} from "./room-events.js";
export const ROOM_ENCOUNTER_PLAN_VERSION=1;
const key=p=>p.x+","+p.y;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const ignoredRoles=new Set(["vestibule","extraction","atelier_abandonne","cache_scellee","chambre_echo"]);
const inside=(p,r)=>p.x>r.x&&p.x<r.x+r.width-1&&
  p.y>r.y&&p.y<r.y+r.height-1;
const tile=(map,p)=>map[p.y]?.[p.x]??"#";

/** One camp in an otherwise quiet room; a signal in the occupied ruins. */
export function encounterRoomPlan(layout,index){
  if(!Number.isSafeInteger(index)||index<2||!Array.isArray(layout?.rooms))
    throw new TypeError("Invalid GAME-101D room plan");
  const signal=layout.rooms.find(r=>r.slot===7&&r.role==="ruines_occupees");
  const camps=layout.rooms.filter(r=>![8,3,7,10,4].includes(r.slot)&&
    !ignoredRoles.has(r.role)).sort((a,b)=>a.slot-b.slot);
  if(!signal||!camps.length)throw new Error("No safe GAME-101D room encounter");
  return [{kind:"camp",room:camps[(index*5+Math.floor(index/3))%camps.length]},
    {kind:"signal",room:signal}];
}

/** Places encounters only on safe, reachable interior floor cells. */
export function placeRoomEncounters(layout,index,route,returnRoutes){
  if(!layout?.map||!Array.isArray(layout.sites)||!Array.isArray(layout.traps)||
     typeof route!=="function"||typeof returnRoutes!=="function")
    throw new TypeError("Incomplete GAME-101D dungeon");
  const reserved=new Set([key(layout.start),key(layout.exit),
    ...Object.keys(layout.loot),...layout.enemies.map(key),...layout.doors.map(key),
    ...layout.sites.map(key),
    ...(layout.traps||[]).flatMap(t=>[key(t),key(t.clue)]),
    ...(layout.secrets||[]).flatMap(s=>[key(s),key(s.clue)])]);
  const blocked=new Set([...layout.enemies,...layout.traps].map(key));
  const result=[];
  for(const {kind,room} of encounterRoomPlan(layout,index)){
    const candidates=[];
    for(let y=room.y+1;y<room.y+room.height-1;y++)
      for(let x=room.x+1;x<room.x+room.width-1;x++){
        const p={x,y};
        if(tile(layout.map,p)!=="."||reserved.has(key(p))||
          layout.enemies.some(e=>distance(e,p)<2)||
          layout.traps.some(t=>distance(t,p)<2)||
          (layout.secrets||[]).some(t=>distance(t,p)<2)||
          !route(layout.map,layout.start,p,blocked)||
          !route(layout.map,p,layout.exit,blocked)||
          !returnRoutes(layout.map,p,layout.exit))continue;
        candidates.push({p,score:distance(p,{x:room.cx,y:room.cy})*4+
          (x*31+y*17+index*13+room.id*7)%9});
      }
    candidates.sort((a,b)=>a.score-b.score||key(a.p).localeCompare(key(b.p)));
    if(!candidates.length)throw new Error("No safe GAME-101D room encounter");
    const p=candidates[0].p;
    result.push({id:"nhal-encounter-"+kind+"-01",kind,roomId:room.id,
      x:p.x,y:p.y,status:"untouched",choice:null});
    reserved.add(key(p));
  }
  return result;
}

/** Full persisted-state validation; historical runs omit both fields. */
export function validRoomEncounters(run){
  if(run?.encounterPlanVersion===undefined)return run?.encounters===undefined;
  if(run.encounterPlanVersion!==ROOM_ENCOUNTER_PLAN_VERSION||
     run.scoutingPlanVersion!==1||!Array.isArray(run.rooms)||
     !Array.isArray(run.sites)||!Array.isArray(run.encounters)||
     run.encounters.length!==2||!Array.isArray(run.map))return false;
  const historical=new Set(run.sites.map(key)),seen=new Set();
  return ["camp","signal"].every((kind,i)=>{
    const s=run.encounters[i],r=run.rooms[s?.roomId];
    if(!s||!r||s.id!=="nhal-encounter-"+kind+"-01"||
       s.kind!==kind||!Number.isInteger(s.x)||!Number.isInteger(s.y)||
       !inside(s,r)||tile(run.map,s)!=="."||
       (kind==="signal"?(r.slot!==7||r.role!=="ruines_occupees"):
         ([8,3,7,10,4].includes(r.slot)||ignoredRoles.has(r.role)))||
       seen.has(key(s))||historical.has(key(s))||
       !["untouched","resolved"].includes(s.status)||
       (s.status==="untouched"?s.choice!==null:
         !Object.hasOwn(ROOM_SITES[kind].options,s.choice))||
       Object.hasOwn(run.loot||{},key(s))||
       run.doors?.some(d=>key(d)===key(s))||
       run.traps?.some(t=>key(t)===key(s)||key(t.clue)===key(s))||
       run.secrets?.some(t=>key(t)===key(s)||key(t.clue)===key(s)))
      return false;
    seen.add(key(s));return true;
  });
}
