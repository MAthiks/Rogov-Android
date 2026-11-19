// ROGOV DEV-073B — pure, seeded RPG combat resolution (no DOM).
// All probabilities are provisional and deliberately capped for mobile playtests.
import {clamp} from "./stats.js";

export const TACTICAL_COSTS=Object.freeze({attack:1,dodge:2,parry:2,block:2,shove:3});
export const MAX_ROLL=100;
export const RNG_MAX=4294967295;

/** Initial PRNG seed: stable for a given descent, different across descents. */
export function descentSeed(index=1){
  const value=(Math.imul((Number.isInteger(index)?index:1)>>>0, 2654435761)+1013904223)>>>0;
  return value||0x9e3779b9;
}
export function validSeed(value){
  return Number.isSafeInteger(value)&&value>=0&&value<=RNG_MAX;
}
/** One advancement consumes exactly one 32-bit LCG step. Never use Math.random. */
export function nextRandom(seed){
  if(!validSeed(seed)) throw new RangeError("Invalid saved combat RNG state");
  const next=(Math.imul(seed,1664525)+1013904223)>>>0;
  return {seed:next,roll:(next%100)+1};
}
export function roll(state){
  const outcome=nextRandom(state.run.rngState);
  state.run.rngState=outcome.seed;
  return outcome.roll;
}
/** Chance of landing a hit against an opponent's mobility. */
export function hitChance(attacker,defender){
  return clamp(Math.round(35+attacker.accuracy-defender.dodgeChance*.75),35,95);
}
/** Enemy uses same core offensive formula as the player. */
export function damageFromStats(base,attacker,defender,{critical=false,source="melee"}={}){
  if(source==="rift"){
    return Math.max(0,Math.ceil(base*(critical?1.5:1))-Math.floor(defender.arcaneResistance/5));
  }
  const bonus=clamp(Math.floor((attacker.attackPower-5)/5),-1,3);
  const raw=Math.max(1,base+bonus);
  const beforeArmor=critical?raw+Math.max(1,Math.ceil(raw/2)):raw;
  // GAME-095A4: a landed physical hit always inflicts at least 1 damage.
  // Only an active dodge/parry/block may fully negate it. Prevents even
  // the rarest armor from turning common Nhal enemies into zero-risk fodder.
  return Math.max(1,beforeArmor-Math.floor(defender.armor/3));
}
export function resolveStrike(state,attacker,defender,base,{source="melee"}={}){
  const accuracy=hitChance(attacker,defender);
  const hit=roll(state)<=accuracy;
  if(!hit)return {hit:false,critical:false,damage:0,accuracy,criticalChance:attacker.criticalChance};
  const critical=roll(state)<=attacker.criticalChance;
  return {hit:true,critical,damage:damageFromStats(base,attacker,defender,{critical,source}),
    accuracy,criticalChance:attacker.criticalChance};
}
export function defenseChance(mode,defender,attacker,source="melee"){
  if(source!=="melee" && mode!=="block")return 0;
  if(mode==="dodge")return clamp(48+defender.dodgeChance-Math.floor((attacker.accuracy-50)/5),20,90);
  if(mode==="parry")return defender.parryChance>0?
    clamp(49+defender.parryChance-Math.floor((attacker.attackPower-5)/3),20,90):0;
  if(mode==="block")return clamp(55+defender.blockChance,30,92);
  return 0;
}
/** Defense consumes a matching active stance, success or failure. */
export function resolveActiveDefense(state,mode,defender,attacker,source){
  const chance=defenseChance(mode,defender,attacker,source);
  if(!chance)return {attempted:false,success:false,chance:0};
  const success=roll(state)<=chance;
  return {attempted:true,success,chance};
}
export function regenEndurance(state,amount){
  const run=state.run;
  if(!run)return;
  run.endurance=clamp(run.endurance+amount,0,run.enduranceMax);
}
