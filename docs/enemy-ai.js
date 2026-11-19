// ROGOV DEV-073C — pure enemy intent contract shared by gameplay and UI.
// Statuses live on each enemy, not in ephemeral UI state, so saves replay exactly.
export const GUARDIAN_TACTICS=Object.freeze(["ready","winding","guarding"]);
export const GUARDIAN_HEAVY_BONUS=1;
// GAME-095C1: opt-in only on newly generated B2 scout encounters.
// Existing saved/legacy Charognards have no tactic and still bite normally.
export const CHAROGNARD_TACTICS=Object.freeze(["stalking","winding","recovering"]);
export const INTENTS=Object.freeze({
  GUARD_PREPARE:"guardian_prepare",
  GUARD_HEAVY:"guardian_heavy",
  GUARD_GUARD:"guardian_guard",
  RIFT_CHARGE:"rift_charge",
  RIFT_PULSE:"rift_pulse",
  MELEE:"melee",
  APPROACH:"approach",
  IDLE:"idle"
});
export function guardianTactic(enemy){
  // Legacy test/direct-state fixtures may omit the field; loaded saves
  // receive "ready" through migration, so real encounters use the new cycle.
  return enemy?.tactic??"legacy";
}
export function validEnemyTactic(enemy){
  if(!enemy)return false;
  if(enemy.kind==="guardian")
    return enemy.tactic===undefined||GUARDIAN_TACTICS.includes(enemy.tactic);
  if(enemy.kind==="charognard")
    return enemy.tactic===undefined||CHAROGNARD_TACTICS.includes(enemy.tactic);
  return enemy.tactic===undefined; // Larvae and historical enemies do not charge.
}

/** Find the one-step lunge destination without mutating the map or enemies.
 * A charge exists only across two collinear cells with CLEAR floor between.
 * Doors, traps, other enemies and chamber thresholds block the charge.
 * Its forecast and execution both call this exact function.
 */
export function charognardLane(run,enemy){
  if(!run?.map||enemy?.kind!=="charognard"||
     !Number.isInteger(run.x)||!Number.isInteger(run.y))return null;
  const dx=run.x-enemy.x,dy=run.y-enemy.y;
  if(Math.abs(dx)+Math.abs(dy)!==2|| (dx!==0&&dy!==0))return null;
  const x=enemy.x+Math.sign(dx),y=enemy.y+Math.sign(dy);
  if(run.map[y]?.[x]!=="."||
     (run.traps||[]).some(trap=>trap.x===x&&trap.y===y)||
     (run.enemies||[]).some(other=>other.id!==enemy.id&&other.hp>0&&
       other.x===x&&other.y===y))return null;
  if(run.doorPlanVersion===1&&Array.isArray(run.rooms)){
    const chamber=run.rooms.find(r=>enemy.x>r.x&&
      enemy.x<r.x+r.width-1&&enemy.y>r.y&&enemy.y<r.y+r.height-1);
    if(!chamber||!(x>chamber.x&&x<chamber.x+chamber.width-1&&
      y>chamber.y&&y<chamber.y+chamber.height-1))return null;
  }
  return {x,y};
}

/** Forecast one phase, without rolling any RNG. Moving off-axis or
 * approaching into contact cancels a windup; a successful lunge always
 * exposes one recovery phase afterward.
 */
export function charognardDecision(enemy,run){
  if(enemy?.kind!=="charognard"||enemy.tactic===undefined)return "legacy";
  if(enemy.tactic==="recovering")return "recover";
  const lane=charognardLane(run,enemy);
  if(enemy.tactic==="winding")return lane?"lunge":"interrupt";
  return lane?"prepare":"legacy";
}

export function charognardIntent(enemy,run){
  const decision=charognardDecision(enemy,run);
  if(decision==="prepare")
    return {kind:"charognard_prepare",label:"Le Charognard prend appui : charge annoncée dans l'axe",danger:false};
  if(decision==="lunge")
    return {kind:"charognard_lunge",label:"⚠ Charge imminente ! Quitte l'axe ou prépare une défense",danger:true};
  if(decision==="interrupt")
    return {kind:"idle",label:"Charge interrompue : l'axe est rompu",danger:false};
  if(decision==="recover")
    return {kind:"idle",label:"Le Charognard se relève après sa charge",danger:false};
  return null; // Historical pursuit or bite handled by the existing forecast.
}
/**
 * The decision is made at the end of the upcoming player turn.
 * "guarding" reduces the player's incoming attack during that turn; it then
 * becomes a windup, not an unannounced strike.
 */
export function guardianDecision(enemy,distance){
  const tactic=guardianTactic(enemy);
  if(distance!==1) return tactic==="winding"?"interrupt":"hold";
  if(tactic==="legacy")return "legacy_attack";
  if(tactic==="winding")return "heavy";
  return "prepare";
}
export function guardianIntent(enemy,distance){
  const tactic=guardianTactic(enemy);
  const decision=guardianDecision(enemy,distance);
  if(decision==="interrupt")return {kind:INTENTS.IDLE,label:"Coup lourd interrompu : hors de portée",danger:false};
  if(decision==="legacy_attack")return {kind:INTENTS.MELEE,label:"Attaque de contact (ancienne rencontre)",danger:true};
  if(decision==="hold")return {kind:INTENTS.IDLE,label:"Sentinelle immobile",danger:false};
  if(decision==="heavy")return {kind:INTENTS.GUARD_HEAVY,label:"⚠ Coup lourd imminent ! Esquiver, parer, bloquer ou reculer",danger:true};
  if(tactic==="guarding")return {kind:INTENTS.GUARD_GUARD,label:"Garde haute : blocage possible, puis nouvelle préparation",danger:false};
  return {kind:INTENTS.GUARD_PREPARE,label:"Le Gardien arme son coup lourd (attaque au tour suivant)",danger:false};
}
