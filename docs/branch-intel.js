// GAME-101B — Local trail clues, not an omniscient loot or enemy radar.
// Both exits are actual corridors. No RNG, storage, or geometry mutation.
import {visibleCells,visionKey} from "./exploration-visibility.js";

const ROUTES=Object.freeze({
  north:Object.freeze({
    kind:"danger",label:"voie risquée",
    description:"De profondes entailles strient les pierres vers le nord. Une présence lourde a emprunté cette galerie ; quelque chose semble y être gardé, sans garantie de butin."
  }),
  east:Object.freeze({
    kind:"supply",label:"voie de ravitaillement",
    description:"Des copeaux de métal et de vieilles traces d'outils filent vers l'est. Cette galerie paraît plus propice au ravitaillement, sans être sûre."
  })
});
const entryRoom=run=>run?.branchPlanVersion===1&&run.topologyVersion===1?
  run.rooms?.find(r=>r.slot===8&&r.role==="vestibule"):null;
function entryDoors(run){
  const room=entryRoom(run);
  if(!room||!Array.isArray(run.doors)||!Array.isArray(run.map))return [];
  return run.doors.filter(d=>run.map[d.y]?.[d.x]==="+"&&
    d.x>=room.x&&d.x<room.x+room.width&&
    d.y>=room.y&&d.y<room.y+room.height).map(d=>{
      const direction=d.y===room.y?"north":
        d.x===room.x+room.width-1?"east":null;
      return direction?{...d,direction}:null;
    }).filter(Boolean);
}
/** Same visibility constraints as tapping a tile in the UI. */
export function branchClue(run,x,y){
  const door=entryDoors(run).find(d=>d.x===x&&d.y===y);
  if(!door||!visibleCells(run).has(visionKey(run,x,y)))return null;
  return ROUTES[door.direction]??null;
}
/** One short, zero-turn warning only when BOTH entry exits are visible. */
export function branchOverview(run){
  const room=entryRoom(run);
  if(!room||!(run.x>room.x&&run.x<room.x+room.width-1&&
    run.y>room.y&&run.y<room.y+room.height-1))return null;
  const exits=entryDoors(run);
  if(exits.length!==2||
    !exits.some(d=>d.direction==="north")||
    !exits.some(d=>d.direction==="east")||
    !exits.every(d=>branchClue(run,d.x,d.y)))return null;
  return "BIFURCATION — Nord : traces de garde, risque élevé. Est : outils anciens, piste de ravitaillement. Examine une porte pour choisir.";
}
