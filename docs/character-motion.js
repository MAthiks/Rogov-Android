// ART-097B2: ephemeral render-only movement cue.
// It never reads enemies, fog, RNG, inventory, or persistent state and it
// cannot create a turn. Both returned flags are presentation hints only.
export function characterMotionForTurn(before,after){
  if(!before||!after)return null;
  // Moving between runs/floors is a screen change, not a step animation.
  if(before.floorDepth!==after.floorDepth||
      before.layoutId!==after.layoutId)return null;
  if(!Number.isInteger(before.turns)||!Number.isInteger(after.turns)||
      after.turns<=before.turns)return null;
  const dx=after.x-before.x,dy=after.y-before.y;
  // A cardinal step is real iff it moved exactly one tile.
  const step=Math.abs(dx)+Math.abs(dy)===1;
  return Object.freeze({step,foeTurn:true});
}
