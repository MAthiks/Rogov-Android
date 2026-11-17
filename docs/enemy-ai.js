// ROGOV DEV-073C — pure enemy intent contract shared by gameplay and UI.
// Statuses live on each enemy, not in ephemeral UI state, so saves replay exactly.
export const GUARDIAN_TACTICS=Object.freeze(["ready","winding","guarding"]);
export const GUARDIAN_HEAVY_BONUS=1;
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
  if(!enemy || enemy.kind!=="guardian") return enemy?.tactic===undefined;
  if(enemy.tactic===undefined)return true; // original saves remain valid
  return GUARDIAN_TACTICS.includes(enemy.tactic);
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
