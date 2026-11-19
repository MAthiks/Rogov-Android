// GAME-095D3B — non-spoiler snapshot of concurrent combat pressure.
// Uses the SAME visible cells and threat intentions as the Android PWA.
// Analysis only: never changes gameplay, saved state, combat RNG or visibility.
import {hasFog,visibleCells,visionKey} from "../docs/exploration-visibility.js";
import {currentEnemyIntent} from "../docs/combat.js";

export const PRESSURE_AUDIT_VERSION=1;
export const DANGEROUS_INTENTS=Object.freeze([
  "melee","guardian_heavy","charognard_lunge","rift_pulse"
]);
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);

/** Counts only creatures genuinely visible to the hero now.
 * "Nearby" is geometric CONTACT/PROCHE (<=3); a forecasted attack has
 * its own category because distance alone does not imply actual damage.
 * A remembered enemy must NEVER become a present-time warning.
 */
export function pressureSnapshot(run){
  if(!run?.map||!Array.isArray(run.enemies))return Object.freeze({
    visible:0,contact:0,nearby:0,imminent:0,
    guardianHeavy:0,charognardLunge:0,riftPulse:0
  });
  const sight=visibleCells(run),fog=hasFog(run);
  const out={visible:0,contact:0,nearby:0,imminent:0,
    guardianHeavy:0,charognardLunge:0,riftPulse:0};
  for(const enemy of run.enemies){
    if(enemy.hp<=0)continue;
    if(fog&&!sight.has(visionKey(run,enemy.x,enemy.y)))continue;
    out.visible++;
    const d=distance(run,enemy);
    if(d===1)out.contact++;
    if(d<=3)out.nearby++;
    const kind=currentEnemyIntent(run,enemy)?.kind;
    if(DANGEROUS_INTENTS.includes(kind)){
      out.imminent++;
      if(kind==="guardian_heavy")out.guardianHeavy++;
      if(kind==="charognard_lunge")out.charognardLunge++;
      if(kind==="rift_pulse")out.riftPulse++;
    }
  }
  return Object.freeze(out);
}

export function emptyPressure(){
  return {observedTurns:0,visibleTurns:0,contactTurns:0,nearbyTurns:0,
    multipleNearbyTurns:0,multipleContactTurns:0,imminentTurns:0,
    simultaneousImminentTurns:0,peakVisible:0,peakNearby:0,
    damageDuringMultipleNearby:0,damageDuringImminent:0,
    healingUnderContact:0,chestActionsNearEnemies:0};
}

/** Feed a successful, time-consuming engine action into the observer.
 * Health is NET HP change per action (not a fabricated count of attacks).
 */
export function notePressure(ledger,snapshot,{kind,hpBefore,hpAfter}){
  ledger.observedTurns++;
  if(snapshot.visible>0)ledger.visibleTurns++;
  if(snapshot.contact>0)ledger.contactTurns++;
  if(snapshot.nearby>0)ledger.nearbyTurns++;
  if(snapshot.nearby>=2)ledger.multipleNearbyTurns++;
  if(snapshot.contact>=2)ledger.multipleContactTurns++;
  if(snapshot.imminent>0)ledger.imminentTurns++;
  if(snapshot.imminent>=2)ledger.simultaneousImminentTurns++;
  ledger.peakVisible=Math.max(ledger.peakVisible,snapshot.visible);
  ledger.peakNearby=Math.max(ledger.peakNearby,snapshot.nearby);
  const lost=Math.max(0,hpBefore-hpAfter);
  if(snapshot.nearby>=2)ledger.damageDuringMultipleNearby+=lost;
  if(snapshot.imminent>0)ledger.damageDuringImminent+=lost;
  if(kind==="heal"&&snapshot.contact>0)ledger.healingUnderContact++;
  if(["chest","swap"].includes(kind)&&snapshot.nearby>0)
    ledger.chestActionsNearEnemies++;
  return ledger;
}
