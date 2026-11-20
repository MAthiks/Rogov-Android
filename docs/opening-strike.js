// GAME-101E — pure, fog-safe tactical opening with no random rolls.
import {explorationState} from "./exploration-visibility.js";
export const COMBAT_OPENING_VERSION=1;
export const OPENING_STRIKE_ENDURANCE_COST=3;

/** A real, visible positional advantage. Never leak unexplored terrain.
 * A heavy windup is risky: the Guardian still strikes if it survives.
 */
export function openingOpportunity(run,enemy){
  if(!run||run.combatOpeningVersion!==COMBAT_OPENING_VERSION||
     !enemy||enemy.hp<=0||!["charognard","guardian"].includes(enemy.kind)||
     !Number.isInteger(run.x)||!Number.isInteger(run.y)||
     !Number.isInteger(enemy.x)||!Number.isInteger(enemy.y)||
     Math.abs(enemy.x-run.x)+Math.abs(enemy.y-run.y)!==1||
     explorationState(run,enemy.x,enemy.y)!=="visible")return null;
  if(enemy.kind==="charognard"&&enemy.tactic==="recovering")
    return Object.freeze({kind:"recovery",bonus:2,xpBonus:0,
      description:"Récupération du Charognard : +2 dégâts sur touche."});
  if(enemy.kind==="guardian"&&enemy.tactic==="winding")
    return Object.freeze({kind:"windup",bonus:2,xpBonus:1,
      description:"Coup lourd annoncé : +2 dégâts sur touche, +1 XP si vaincu ; riposte possible."});
  const x=enemy.x+(enemy.x-run.x),y=enemy.y+(enemy.y-run.y);
  if(explorationState(run,x,y)!=="visible")return null;
  const tile=run.map?.[y]?.[x];
  if(tile==="#"||(tile==="+"&&run.doors?.some(d=>d.x===x&&d.y===y&&!d.open)))
    return Object.freeze({kind:"pinned",bonus:1,xpBonus:0,
      description:"Ennemi acculé devant une paroi visible : +1 dégât sur touche."});
  return null;
}
