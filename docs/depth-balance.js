// GAME-095B2 — depth-specific encounter pressure and meaningful rewards.
// B1 maps remain the source of geometry; all changes happen only when a
// NEW multi-floor expedition enters levels 2 and 3. Never patch saved runs.
// No combat RNG, extra enemies, inflated statistics or forced path blockers.
import {descentSeed,nextRandom} from "./combat-rules.js";
import {MAX_FLOOR_DEPTH} from "./floors.js";

export const DEPTH_BALANCE_VERSION=1;
export const DEEP_REWARD_POOLS=Object.freeze({
  2:Object.freeze([
    Object.freeze({id:"consumable.dusk_tonic",weight:32}),
    Object.freeze({id:"consumable.vigor_salts",weight:13}),
    Object.freeze({id:"weapon.iron_mace",weight:14}),
    Object.freeze({id:"shield.worn_buckler",weight:14}),
    Object.freeze({id:"armor.scavenged_cuirass",weight:17}),
    Object.freeze({id:"armor.broken_plate",weight:10})
  ]),
  3:Object.freeze([
    Object.freeze({id:"consumable.dusk_tonic",weight:15}),
    Object.freeze({id:"weapon.iron_mace",weight:18}),
    Object.freeze({id:"shield.worn_buckler",weight:18}),
    Object.freeze({id:"armor.scavenged_cuirass",weight:27}),
    Object.freeze({id:"armor.broken_plate",weight:22})
  ])
});
export const DEPTH_INTEL=Object.freeze({
  2:Object.freeze({
    name:"Résonances de la Faille",
    risk:"Des échos de Faille rendent certains détours plus dangereux.",
    prize:"Un nouveau coffre privilégie les soins et les outils utiles."
  }),
  3:Object.freeze({
    name:"Veille de pierre",
    risk:"Des sentinelles gardent davantage les salles précieuses.",
    prize:"Un nouveau coffre privilégie les équipements résistants."
  })
});

/** Only broad tactical hints are public; neither enemy coordinates nor
 * concealed rewards/secret locations appear in the interface.
 */
export function depthIntel(depth){
  return Object.hasOwn(DEPTH_INTEL,depth)?DEPTH_INTEL[depth]:null;
}

/** Deterministic floor-specific optional reward; always consumes a private
 * seed and never advances the saved combat RNG. Exactly one item replaces
 * the optional chest; Fragment and entry Bandage remain guaranteed.
 */
export function planDepthReward(descentNumber,depth){
  if(!Number.isSafeInteger(descentNumber)||descentNumber<2||
     !Number.isInteger(depth)||depth<2||depth>MAX_FLOOR_DEPTH)
    throw new RangeError("Invalid depth reward request");
  const pool=DEEP_REWARD_POOLS[depth];
  const seed=descentSeed((Math.imul(descentNumber,81173)+
    Math.imul(depth,131071)+95231)>>>0);
  let chance=nextRandom(seed).roll;
  for(const entry of pool){
    chance-=entry.weight;
    if(chance<=0)return entry.id;
  }
  throw new Error("Depth rewards must total 100");
}

/** Tactical escalation via ENEMY COMPOSITION, not stat scaling:
 * depth 2: a vault scavenger is replaced with a stationary ranged larva
 * depth 3: the same vault is guarded by a telegraphed heavy sentinel.
 * The starting scavenger, all enemy coordinates, attack stats, hazards,
 * two routes to extraction and the bandage near entrance are unchanged.
 */
export function balanceDepthLayout(layout,descentNumber,depth){
  if(!Number.isSafeInteger(depth)||depth<2||depth>MAX_FLOOR_DEPTH||
     !Number.isSafeInteger(descentNumber)||descentNumber<2)
    throw new RangeError("Invalid balanced depth");
  if(!layout||!layout.loot||!Array.isArray(layout.enemies)||
     layout.lootPlanVersion!==1)
    throw new TypeError("Expected a complete generated A3 deep layout");
  const optional=Object.entries(layout.loot).filter(([,id])=>
    id!=="relic.ashen_fragment"&&id!=="consumable.bandage");
  const original=layout.enemies.filter(e=>e.id==="nhal-charognard-01"&&
    e.kind==="charognard");
  if(optional.length!==1||original.length!==1)
    throw new Error("Missing optional chest or vault guard");
  const kind=depth===2?"rift_larva":"guardian";
  const guard={
    id:depth===2?"nhal-rift-larva-vault-01":"nhal-guardian-vault-01",
    kind,x:original[0].x,y:original[0].y,hp:depth===2?4:5,
    ...(depth===3?{tactic:"ready"}:{})
  };
  return {
    ...layout,
    loot:{...layout.loot,[optional[0][0]]:planDepthReward(descentNumber,depth)},
    // Only freshly generated B2 floors opt the vestibule scout into C1.
    // Existing saved B2 and B1 enemies have no tactic and never change.
    enemies:layout.enemies.map(e=>e===original[0]?guard:
      e.kind==="charognard"&&e.id==="nhal-charognard-scout-01"
        ?{...e,tactic:"stalking"}:{...e}),
    depthBalanceVersion:DEPTH_BALANCE_VERSION
  };
}
