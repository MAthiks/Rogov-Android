// GAME-095C2 — pure, fog-safe one-cell shove geometry.
// Environment is optional tactical leverage, never a forced combat gate.
// The target is an adjacent, visible Charognard; Guardians and Rift larvae
// are anchored and cannot be moved by this action.
import {explorationState} from "./exploration-visibility.js";
import {TACTICAL_COSTS} from "./combat-rules.js";

export const SHOVE_ENDURANCE_COST=TACTICAL_COSTS.shove;
export const SLAB_SHOVE_DAMAGE=2;

export function shoveOpportunity(run,enemy){
  if(!run?.map||enemy?.kind!=="charognard"||enemy.hp<=0||
     !Number.isInteger(run.x)||!Number.isInteger(run.y)||
     !Number.isInteger(enemy.x)||!Number.isInteger(enemy.y))return null;
  const dx=enemy.x-run.x,dy=enemy.y-run.y;
  if(Math.abs(dx)+Math.abs(dy)!==1)return null;
  const x=enemy.x+dx,y=enemy.y+dy;
  // No wall, door, chest, rift, exit, start, unknown floor or site.
  if(run.map[y]?.[x]!=="."||
     explorationState(run,enemy.x,enemy.y)!=="visible"||
     explorationState(run,x,y)!=="visible"||
     (run.enemies||[]).some(other=>other.id!==enemy.id&&other.hp>0&&
       other.x===x&&other.y===y)||
     (run.sites||[]).some(site=>site.x===x&&site.y===y)||
     (run.secrets||[]).some(secret=>secret.x===x&&secret.y===y&&
       secret.revealed))return null;
  const trap=(run.traps||[]).find(t=>t.x===x&&t.y===y)||null;
  // An unrecognized trap is not exploited or exposed by a preview.
  if(trap&&trap.status==="hidden")return null;
  return Object.freeze({x,y,trapKind:trap?.status==="revealed"?trap.kind:null});
}
