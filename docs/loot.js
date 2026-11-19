// GAME-095A3 — pure, deterministic deep-chest rewards for new descents.
// Integrated only during generation; saved runs retain their original reward IDs.
// Uses its own seed: never consumes or mutates the saved combat RNG.
import {descentSeed,nextRandom} from "./combat-rules.js";

export const DEEP_CHEST_GUARANTEES=Object.freeze([
  "relic.ashen_fragment","consumable.bandage"
]);
export const OPTIONAL_LOOT_ODDS=Object.freeze({equipment:70,consumable:30});

export const EQUIPMENT_LOOT_POOL=Object.freeze([
  Object.freeze({id:"weapon.bone_dagger",weight:30}),
  Object.freeze({id:"weapon.iron_mace",weight:20}),
  Object.freeze({id:"shield.worn_buckler",weight:20}),
  Object.freeze({id:"armor.scavenged_cuirass",weight:20}),
  Object.freeze({id:"armor.broken_plate",weight:10})
]);
export const CONSUMABLE_LOOT_POOL=Object.freeze([
  Object.freeze({id:"consumable.dusk_tonic",weight:50}),
  Object.freeze({id:"consumable.vigor_salts",weight:50})
]);

function weightedPick(pool,roll){
  for(const entry of pool){
    roll-=entry.weight;
    if(roll<=0)return entry.id;
  }
  throw new RangeError("Invalid loot table: weights must sum to 100");
}

/** Return a reward plan, not a mutation of layout, state, or live loot.
 * Calling this before or after combat cannot change any combat RNG outcome.
 * A3 stores the optional reward in run.loot once, when a new descent starts.
 */
export function planDeepChestLoot(descentNumber){
  if(!Number.isSafeInteger(descentNumber)||descentNumber<2)
    throw new RangeError("Deep loot needs a valid descent >= 2");
  const seed=descentSeed((Math.imul(descentNumber,65537)+95001)>>>0);
  const category=nextRandom(seed);
  const pool=category.roll<=OPTIONAL_LOOT_ODDS.equipment
    ?EQUIPMENT_LOOT_POOL:CONSUMABLE_LOOT_POOL;
  const choice=nextRandom(category.seed);
  const optional=weightedPick(pool,choice.roll);
  const guaranteed=[...DEEP_CHEST_GUARANTEES];
  return {guaranteed,optional,rewards:[...guaranteed,optional]};
}
