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

/** Return exactly two traps on *optional floor*, never on a mandatory exit,
 * chest, enemy, door, rift, or secret. Reject candidates that destroy either
 * independent ordinary return route, treating BOTH traps as blocked.
 */
export function placeOptionalTraps(layout,index,route,twoWays){
  if(!layout?.map||!layout.rooms||!Array.isArray(layout.enemies)||
      !Number.isSafeInteger(index)||index<2)throw new TypeError("Invalid deep trap layout");
  const forbidden=new Set([
    key(layout.start),key(layout.exit),
    ...Object.keys(layout.loot),...layout.enemies.map(key),
    ...layout.doors.map(key),...(layout.secrets||[]).flatMap(s=>[key(s),key(s.clue)])
  ]);
  const trapped=[];
  const safe=(blockers)=>{
    if(!twoWays(layout.map,layout.start,layout.exit,blockers)||
       !route(layout.map,layout.start,layout.exit,new Set([...blockers,...layout.enemies.map(key)])))return false;
    for(const pos of Object.keys(layout.loot)){
      const [x,y]=pos.split(",").map(Number),p={x,y};
      if(!twoWays(layout.map,p,layout.exit,blockers)||
         !route(layout.map,p,layout.exit,new Set([...blockers,...layout.enemies.map(key)]))||
         !route(layout.map,layout.start,p,new Set([...blockers,...layout.enemies.map(key)])))
        return false;
    }
    return true;
  };
  // Side rooms with a non-mandatory public detour. Prefer one near entry,
  // the other deeper in the network. Keep the entrance tutorial untouched.
  const specs=[
    {kind:"alarm_wire",rooms:[9,4,11,7]},
    {kind:"unstable_slab",rooms:[5,10,6,1,2]}
  ];
  for(const {kind,rooms} of specs){
    const candidates=[];
    for(const id of rooms){
      const r=layout.rooms[id];
      for(let y=r.y+1;y<r.y+r.height-1;y++)
        for(let x=r.x+1;x<r.x+r.width-1;x++){
          const p={x,y};
          if(!floor(layout.map,p)||forbidden.has(key(p))||
             dist(p,layout.start)<5||dist(p,layout.exit)<4||
             [...forbidden].some(s=>{
               const [fx,fy]=s.split(",").map(Number);
               return dist(p,{x:fx,y:fy})<2;
             }))continue;
          const clue=adjacent(p).find(q=>floor(layout.map,q)&&
            !forbidden.has(key(q))&&
            !trapped.some(t=>key(t)===key(q)));
          if(clue)candidates.push({p,clue});
        }
    }
    if(!candidates.length)throw new Error("No optional "+kind+" trap candidate");
    const offset=(index*31+(kind==="unstable_slab"?7:13))%candidates.length;
    let chosen=null;
    for(let i=0;i<candidates.length;i++){
      const item=candidates[(i+offset)%candidates.length];
      if(safe(new Set([...trapped.map(key),key(item.p)]))){
        chosen=item;break;
      }
    }
    if(!chosen)throw new Error("No safe "+kind+" trap location");
    const trap={id:"nhal-trap-"+kind+"-01",kind,
      x:chosen.p.x,y:chosen.p.y,
      clue:{x:chosen.clue.x,y:chosen.clue.y},
      status:"hidden",attempts:0};
    trapped.push(trap);forbidden.add(key(trap));forbidden.add(key(trap.clue));
  }
  return trapped;
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
       (run.enemies||[]).some(e=>key(e)===key(trap))||
       Object.keys(run.loot||{}).includes(key(trap)))return false;
  }
  if(run.alarmUntil!==undefined&&
    (!Number.isSafeInteger(run.alarmUntil)||run.alarmUntil<0||
     run.alarmUntil>run.turns+3))return false;
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
