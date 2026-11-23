// ART-097C1 — deterministic, fog-safe local ambience. Original ROGOV art.
// Decorative torches are not map entities, do not alter pathing, turns,
// triggers, loot, traps, encounters or any serialized game state.
import {terrainHash} from "./terrain-art.js";
import {sconceFinish107B} from "./art107b-tileset.js";

const svg=parts=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" shape-rendering="crispEdges">'+parts+"</svg>";
export const SCONCE_SVG=svg(
  '<g data-decoration="wall-sconce">'+
  '<rect x="10" y="12" width="4" height="9" fill="#413b38"/>'+
  '<rect x="8" y="14" width="8" height="2" fill="#99836a"/>'+
  '<path d="M10 16h4v5h-4z" fill="#655144"/>'+
  '<rect x="9" y="11" width="6" height="3" fill="#a18e6e"/>'+
  '<path data-detail="ember-flame" d="M12 2l3 5-1 4-2 2-3-2-1-4 2-2 1 2Z" fill="#dd8d3f"/>'+
  '<path d="M12 5l2 4-2 3-2-3Z" fill="#f3c477"/>'+
  '<rect x="12" y="8" width="1" height="3" fill="#fbe3aa"/>'+
  '<path d="M8 15h8M10 19h4" stroke="#302b2c" stroke-width="1"/>'+
  // ART-106C: bright ember core, iron cage, orange face reflections.
  // All artwork is displayed ONLY after the original visible-only check.
  '<g data-detail="art106c-forged-sconce">'+
  '<path d="M7 15h10v2H7ZM9 17h2v5H9ZM13 17h2v5h-2Z" fill="#19242c"/>'+
  '<path d="M8 15h8v1H8ZM9 19h6v1H9Z" fill="#ccad77"/>'+
  '<path d="M8 13h2v2H8ZM14 13h2v2h-2Z" fill="#7f735d"/>'+
  '<path d="M8 11v3M16 11v3" stroke="#28333b" stroke-width="1"/>'+
  '<path d="M9 6h2v3H9ZM14 7h2v2h-2Z" fill="#c66a32"/>'+
  '<path d="M11 4h2v6h-2Z" fill="#ffd079"/>'+
  '<path d="M12 6v4" stroke="#fff1b1" stroke-width="1"/>'+
  '<path d="M10 2h2v2h-2Z" fill="#d27b3c"/>'+
  '<path d="M10 20h4v1h-4Z" fill="#78634c"/>'+
  '</g>'+
  sconceFinish107B()+
  '</g>'
);
export const SCONCE_SPRITE="data:image/svg+xml;charset=UTF-8,"+
  encodeURIComponent(SCONCE_SVG);
const cardinal=Object.freeze([[0,-1],[1,0],[0,1],[-1,0]]);

/** All map reads occur AFTER an explicit visible() check, even for neighbors.
 * A visible wall gets a purely cosmetic sconce iff a visible floor borders it.
 * The layout hash is stable across reloads and does not consume RNG.
 */
export function sconceAt(map,x,y,visible,seed="nhal"){
  if(!visible(x,y))return false;
  if(map[y]?.[x]!=="#")return false;
  if(terrainHash(seed,x,y)%13!==0)return false;
  for(const [dx,dy] of cardinal){
    const nx=x+dx,ny=y+dy;
    if(visible(nx,ny)&&map[ny]?.[nx]===".")return true;
  }
  return false;
}

/** Only visible cells receive their own local lighting class. Light never
 * spreads diagonally, through a wall, or onto a remembered/unknown cell.
 * Source priorities emphasize real hazards and extraction rather than decor.
 */
export function localLightAt(map,x,y,visible,seed="nhal"){
  if(!visible(x,y))return null;
  const tile=map[y]?.[x];
  if(tile==="E")return "arch";
  if(tile==="^")return "rift";
  if(tile==="#"&&sconceAt(map,x,y,visible,seed))return "sconce";
  if(tile!==".")return null;
  let warm=false,arch=false,rift=false;
  for(const [dx,dy] of cardinal){
    const nx=x+dx,ny=y+dy;
    if(!visible(nx,ny))continue;
    const neighbor=map[ny]?.[nx];
    if(neighbor==="^")rift=true;
    else if(neighbor==="E")arch=true;
    else if(neighbor==="#"&&sconceAt(map,nx,ny,visible,seed))warm=true;
  }
  if(rift)return "rift-edge";
  if(arch)return "arch-edge";
  if(warm)return "sconce-edge";
  return null;
}
