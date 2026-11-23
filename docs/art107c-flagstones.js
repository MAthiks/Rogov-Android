// ART-107C — four truly different 24×24 floor stone arrangements for Nhal.
// This module paints only paving. No map reads, pathing, light, RNG or save changes.
export const NHAL_FLAGSTONE_LAYOUTS_107C=Object.freeze([
  "large-ashlar","offset-courses","long-flagstones","broken-masonry"
]);

const SLABS=Object.freeze([
  // Large ashlar: unequal squares and a stepped lower-right joint.
  '<path data-material="worn-floor-slabs" d="M0 0H14V10H0ZM15 0H24V12H15ZM0 11H9V24H0ZM10 13H24V24H10Z" fill="#33434a"/>'+
  '<path d="M2 2H12M17 2H23M2 13H8M12 15H22" stroke="#7b8c87" stroke-width="1" opacity=".7"/>'+
  '<path data-detail="floor-mortar-depth" d="M14 0V12M0 10H14M9 11V24M10 12H24" stroke="#091720" stroke-width="2" opacity=".92"/>'+
  '<path data-detail="floor-beveled-masonry" d="M1 1H13M16 1H23M1 12H8M11 14H23" stroke="#657879" stroke-width="1" opacity=".65"/>',
  // Offset courses: long stone on one side, narrow block on the other.
  '<path data-material="worn-floor-slabs" d="M0 0H9V13H0ZM10 0H24V7H10ZM10 8H24V24H10ZM0 14H9V24H0Z" fill="#304047"/>'+
  '<path d="M2 2H8M12 2H22M12 10H22M2 16H8" stroke="#81928a" stroke-width="1" opacity=".69"/>'+
  '<path data-detail="floor-mortar-depth" d="M9 0V24M10 7H24M0 13H9" stroke="#0a1922" stroke-width="2" opacity=".93"/>'+
  '<path data-detail="floor-beveled-masonry" d="M1 1H8M11 1H23M11 9H23M1 15H8" stroke="#65787b" stroke-width="1" opacity=".64"/>',
  // Long horizontal quarry blocks: courses cross the whole tile.
  '<path data-material="worn-floor-slabs" d="M0 0H24V6H0ZM0 7H13V17H0ZM14 7H24V17H14ZM0 18H24V24H0Z" fill="#334148"/>'+
  '<path d="M2 2H21M2 9H11M16 9H22M3 20H20" stroke="#83928a" stroke-width="1" opacity=".66"/>'+
  '<path data-detail="floor-mortar-depth" d="M0 6H24M13 7V18M0 17H24" stroke="#09171e" stroke-width="2" opacity=".92"/>'+
  '<path data-detail="floor-beveled-masonry" d="M1 1H23M1 8H12M15 8H23M1 19H23" stroke="#617676" stroke-width="1" opacity=".66"/>',
  // Broken masonry: small diagonal and staggered joint offsets, non-interactive.
  '<path data-material="worn-floor-slabs" d="M0 0H13L11 10H0ZM14 0H24V11H12ZM0 11H11V24H0ZM12 12H24V24H12Z" fill="#303f47"/>'+
  '<path d="M2 2H10M15 2H22M2 13H9M14 14H22" stroke="#7e8d87" stroke-width="1" opacity=".7"/>'+
  '<path data-detail="floor-mortar-depth" d="M13 0L11 11M0 10H11M11 11H24M11 12V24" stroke="#08171f" stroke-width="2" fill="none" opacity=".9"/>'+
  '<path data-detail="floor-beveled-masonry" d="M1 1H12M15 1H23M1 12H10M13 13H23" stroke="#69807c" stroke-width="1" opacity=".64"/>'
]);
const PLANE_SHADE=Object.freeze([
  '<path d="M2 6H8M17 7H22M2 20H6" stroke="#1a2a32" stroke-width="2" opacity=".26"/>',
  '<path d="M2 8H7M13 19H22" stroke="#1b2b33" stroke-width="2" opacity=".26"/>',
  '<path d="M4 4H14M2 13H9M7 22H17" stroke="#172831" stroke-width="2" opacity=".25"/>',
  '<path d="M3 5H10M16 6H20M15 18H21" stroke="#182a32" stroke-width="2" opacity=".27"/>'
]);

export function flagstoneGeometry107C(index){
  if(!Number.isInteger(index)||index<0||index>=NHAL_FLAGSTONE_LAYOUTS_107C.length)
    throw new RangeError("ART-107C: unknown floor geometry");
  return '<g data-art="art107c-flagstone" data-layout="'+NHAL_FLAGSTONE_LAYOUTS_107C[index]+'">'+
    // Material fills and deep mortar are substantially different in each layout.
    '<rect width="24" height="24" fill="#1a2730"/>'+
    SLABS[index]+PLANE_SHADE[index]+
    // A restrained one-pixel chipped stone, never a marker for a real trap.
    '<path d="M3 21H5M19 4H21" stroke="#819087" stroke-width="1" opacity=".19"/>'+
    '</g>';
}
