// GAME-101F — bounded, deterministic, one-step pursuit inside an occupied room.
// Optional new-floor behavior; never opens doors, crosses traps or rolls RNG.
export const CHAMBER_PURSUIT_VERSION=1;
const OFFSETS=Object.freeze([[0,-1],[1,0],[0,1],[-1,0]]);
const key=p=>p.x+","+p.y;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const inside=(p,r)=>p.x>r.x&&p.y>r.y&&
  p.x<r.x+r.width-1&&p.y<r.y+r.height-1;

/** Return one legal step, or null to use the historical pursuit.
 * A Charognard can track the nearby player around a pillar IN THE SAME
 * chamber, never through a doorway or any (even unrevealed) trap.
 * An active alarm expands the pursuit radius from 3 to 4 cells.
 * At most seven orthogonal steps are planned in the small chamber.
 */
export function chamberPursuitStep(run,enemy){
  if(run?.pursuitPlanVersion!==CHAMBER_PURSUIT_VERSION||
     run?.doorPlanVersion!==1||!Array.isArray(run.rooms)||
     !Array.isArray(run.map)||enemy?.kind!=="charognard"||
     enemy.hp<=0||enemy.tactic!=="stalking"||
     ![run.x,run.y,enemy.x,enemy.y].every(Number.isInteger))
    return null;
  const direct=distance(run,enemy);
  const alerted=(run.alarmUntil??0)>run.turns;
  if(direct<2||direct>(alerted?4:3))return null;
  const room=run.rooms.find(r=>inside(run,r)&&inside(enemy,r));
  if(!room)return null;
  const forbidden=new Set([
    ...(run.enemies||[]).filter(e=>e.hp>0&&e.id!==enemy.id).map(key),
    ...(run.traps||[]).map(key),
    ...(run.sites||[]).map(key),
    ...(run.encounters||[]).map(key),
    ...(run.secrets||[]).map(key)
  ]);
  const start=key(enemy),goal=key(run);
  const queue=[{x:enemy.x,y:enemy.y}],parent=new Map([[start,null]]);
  const positions=new Map([[start,queue[0]]]);
  for(let i=0;i<queue.length;i++){
    const cell=queue[i],current=key(cell);
    if(current===goal)break;
    for(const [dx,dy] of OFFSETS){
      const next={x:cell.x+dx,y:cell.y+dy},id=key(next);
      if(parent.has(id)||!inside(next,room)||forbidden.has(id)||
         (id!==goal&&run.map[next.y]?.[next.x]!=="."))continue;
      parent.set(id,current);positions.set(id,next);queue.push(next);
    }
  }
  if(!parent.has(goal))return null;
  let cursor=goal,length=0;
  while(cursor!==start){
    length++;
    if(length>7)return null;
    const previous=parent.get(cursor);
    if(previous===start)break;
    cursor=previous;
  }
  const step=positions.get(cursor);
  if(!step||key(step)===goal)return null;
  return Object.freeze({x:step.x,y:step.y,
    detour:distance(step,run)>=direct,routeLength:length});
}
