// GAME-095B1 — bounded, reproducible floors within one expedition.
// No runtime RNG is consumed and no previous floor is regenerated on load.
export const MAX_FLOOR_DEPTH=3;

/** Floor 1 preserves the published GAME-095A3 seed exactly.
 * Deeper floors receive distinct deterministic seeds, separate from combat RNG.
 */
export function deepFloorSeed(descentNumber,depth){
  if(!Number.isSafeInteger(descentNumber)||descentNumber<2||
     !Number.isSafeInteger(depth)||depth<1||depth>MAX_FLOOR_DEPTH)
    throw new RangeError("Invalid deep expedition floor");
  if(depth===1)return descentNumber;
  const mixed=(Math.imul(descentNumber,4099)+Math.imul(depth,7919))>>>0;
  return mixed<2?mixed+2:mixed;
}

export function floorChoiceAvailable(run){
  return Boolean(run&&Number.isSafeInteger(run.floorDepth)&&
    run.floorDepth>=1&&run.floorDepth<=MAX_FLOOR_DEPTH&&
    Array.isArray(run.map)&&run.map[run.y]?.[run.x]==="E");
}
export function canDescendFurther(run){
  return floorChoiceAvailable(run)&&run.floorDepth<MAX_FLOOR_DEPTH;
}
