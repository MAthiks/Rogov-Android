// GAME-101C — A miner's paper sketch, not live vision or an enemy/loot radar.
// Only static floor cells along one deterministic, walkable retreat path
// become remembered. Doors, rifts, loot, secrets and live entities stay hidden.
import {hasFog,visionKey} from "./exploration-visibility.js";

export const RETREAT_SKETCH_LIMIT=48;
const WALKABLE=new Set([".","S","E","+","$"]);
const STEPS=[[0,-1],[1,0],[0,1],[-1,0]];
const key=(x,y)=>x+","+y;
const floorAt=(run,x,y)=>run.map[y]?.[x]??"#";

/** Pure BFS: no combat RNG, no mutation, no trust in unseen enemy locations. */
export function retreatSketchCells(run){
  if(run?.scoutingPlanVersion!==1||!hasFog(run)||
     !Array.isArray(run.map)||!run.exit)return [];
  const atelier=run.sites?.find(s=>s.kind==="atelier");
  if(!atelier)return [];
  const origin=key(atelier.x,atelier.y),goal=key(run.exit.x,run.exit.y);
  const queue=[{x:atelier.x,y:atelier.y}],parents=new Map([[origin,null]]);
  for(let i=0;i<queue.length&&i<run.map.length*run.map[0].length;i++){
    const current=queue[i],currentKey=key(current.x,current.y);
    if(currentKey===goal)break;
    for(const [dx,dy] of STEPS){
      const x=current.x+dx,y=current.y+dy,k=key(x,y);
      if(!parents.has(k)&&WALKABLE.has(floorAt(run,x,y))){
        parents.set(k,currentKey);queue.push({x,y});
      }
    }
  }
  if(!parents.has(goal))return [];
  const trail=[];
  for(let k=goal;k!==null;k=parents.get(k)){
    const [x,y]=k.split(",").map(Number);
    trail.push({x,y});
  }
  trail.reverse();
  const sites=new Set([...(run.sites||[]),...(run.encounters||[])]
    .map(s=>key(s.x,s.y)));
  // Do not reveal chests, doors, exit, site markers or any hidden hazard
  // annotation: the discovered drawing contains exclusively plain floor.
  return trail.filter(p=>floorAt(run,p.x,p.y)==="."&&
    !sites.has(key(p.x,p.y))).slice(0,RETREAT_SKETCH_LIMIT);
}

/** Call only on the copied run after a paid, one-shot workshop interaction. */
export function surveyRetreatSketch(run){
  const cells=retreatSketchCells(run);
  if(!cells.length)return 0;
  const seen=new Set(run.exploration.seen);
  let added=0;
  for(const p of cells){
    const position=visionKey(run,p.x,p.y);
    if(!seen.has(position)){seen.add(position);added++;}
  }
  run.exploration.seen=[...seen].sort((a,b)=>a-b);
  return added;
}
