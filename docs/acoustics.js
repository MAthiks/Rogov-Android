// GAME-101A — Deliberate, approximate acoustic scouting in the deep dungeon.
// No RNG, DOM, storage, map mutation or revealed coordinates. A closed door
// muffles sound; solid walls stop it. The response is a bearing, not a ping.
import {hasFog,visibleCells,visionKey} from "./exploration-visibility.js";

export const LISTEN_ENDURANCE_COST=2;
export const SOUND_RANGE=8;
const DIRECTIONS=[[1,0],[-1,0],[0,1],[0,-1]];
const key=(x,y)=>x+","+y;

function acousticCosts(run){
  const distance=new Map([[key(run.x,run.y),0]]);
  const pending=[{x:run.x,y:run.y,cost:0}];
  while(pending.length){
    pending.sort((a,b)=>b.cost-a.cost);
    const at=pending.pop();
    if(at.cost!==distance.get(key(at.x,at.y)))continue;
    for(const [dx,dy] of DIRECTIONS){
      const x=at.x+dx,y=at.y+dy,tile=run.map[y]?.[x];
      if(!tile||tile==="#")continue;
      // Shut doors conduct a muffled sound without exposing the far room.
      const closed=tile==="+"&&!run.doors?.some(d=>d.x===x&&d.y===y&&d.open);
      const next=at.cost+(closed?3:1),k=key(x,y);
      if(next>SOUND_RANGE||(distance.has(k)&&distance.get(k)<=next))continue;
      distance.set(k,next);
      pending.push({x,y,cost:next});
    }
  }
  return distance;
}
function bearing(run,enemy){
  const dx=enemy.x-run.x,dy=enemy.y-run.y;
  return Math.abs(dx)>=Math.abs(dy)
    ? (dx<0?"l'ouest":"l'est")
    : (dy<0?"le nord":"le sud");
}
/** A single fleeting, intentionally vague signal for threats outside LOS.
 * Exact enemies, types, counts, positions, undiscovered geometry and loot
 * never enter the message. Listening does not permanently reveal fog.
 */
export function acousticReading(run){
  if(!hasFog(run)||!Array.isArray(run?.map))return null;
  const audible=acousticCosts(run),visible=visibleCells(run);
  const hidden=(run.enemies||[]).filter(e=>e.hp>0&&
    !visible.has(visionKey(run,e.x,e.y))&&audible.has(key(e.x,e.y)))
    .map(e=>({cost:audible.get(key(e.x,e.y)),bearing:bearing(run,e)}))
    .sort((a,b)=>a.cost-b.cost||a.bearing.localeCompare(b.bearing));
  if(!hidden.length)
    return "ÉCOUTE — Aucun mouvement distinct hors de vue dans les galeries proches. Ce silence ne garantit rien.";
  const closest=hidden[0],intensity=closest.cost<=3?"tout près":
    closest.cost<=6?"dans les galeries proches":"au loin";
  return "ÉCOUTE — "+(hidden.length>1?"Des bruits étouffés":"Un bruit étouffé")+
    " vers "+closest.bearing+", "+intensity+
    ". Indice approximatif : la menace peut bouger pendant ce tour.";
}
