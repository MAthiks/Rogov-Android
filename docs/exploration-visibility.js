// DEV-081 — deterministic, fog-safe knowledge state for deep Nhal only.
// No DOM, randomness or local storage. Never import game.js here.
export const VISION_RADIUS=5;
const inBounds=(run,x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&
  y>=0&&y<run.map.length&&x>=0&&x<run.map[0].length;
const doorAt=(run,x,y)=>run.doors?.find(d=>d.x===x&&d.y===y);
const isOpaque=(run,x,y)=>run.map[y]?.[x]==="#"||
  (run.map[y]?.[x]==="+"&&!doorAt(run,x,y)?.open);
export function visionKey(run,x,y){
  return y*run.map[0].length+x;
}
export function hasFog(run){
  return Boolean(run?.rooms && run.exploration);
}
export function validExploration(run){
  if(!run?.rooms || !run.exploration || !Array.isArray(run.exploration.seen))return false;
  const seen=run.exploration.seen;
  const max=run.map.length*run.map[0].length;
  return seen.length<=max && seen.every((n,i)=>
    Number.isSafeInteger(n)&&n>=0&&n<max&&(i===0||n>seen[i-1]));
}
/** Supercover-style integer ray. Opaque target itself is visible;
 * nothing beyond a wall or closed door is revealed. Both blocked corners
 * prevent diagonal peeking. The source is always visible.
 */
export function lineOfSight(run,tx,ty){
  if(!inBounds(run,tx,ty)||!inBounds(run,run.x,run.y))return false;
  let x=run.x,y=run.y;
  if(x===tx&&y===ty)return true;
  const dx=Math.abs(tx-x),dy=Math.abs(ty-y);
  const sx=x<tx?1:-1,sy=y<ty?1:-1;
  let err=dx-dy;
  while(x!==tx||y!==ty){
    const twice=err*2;
    let nx=x,ny=y;
    if(twice>-dy){err-=dy;nx+=sx;}
    if(twice<dx){err+=dx;ny+=sy;}
    if(nx!==x&&ny!==y&&isOpaque(run,nx,y)&&isOpaque(run,x,ny))
      return false;
    x=nx;y=ny;
    if(x===tx&&y===ty)return true;
    if(isOpaque(run,x,y))return false;
  }
  return true;
}
export function visibleCells(run, radius=VISION_RADIUS){
  const tiles=new Set();
  if(!run?.map)return tiles;
  const left=Math.max(0,run.x-radius),right=Math.min(run.map[0].length-1,run.x+radius);
  const top=Math.max(0,run.y-radius),bottom=Math.min(run.map.length-1,run.y+radius);
  for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
    if(Math.hypot(x-run.x,y-run.y)>radius+.001)continue;
    if(lineOfSight(run,x,y))tiles.add(visionKey(run,x,y));
  }
  return tiles;
}
/** Mutate only a copied run during a time-spending action.
 * Sorted numeric cell IDs keep the save compact, deterministic and verifiable.
 */
export function revealAround(run){
  if(!hasFog(run))return run;
  const visited=new Set(run.exploration.seen);
  for(const tile of visibleCells(run))visited.add(tile);
  run.exploration.seen=[...visited].sort((a,b)=>a-b);
  return run;
}
export function explorationState(run,x,y,visible=null){
  if(!run)return "unknown";
  if(!hasFog(run))return "visible"; // legacy saves can omit run.map entirely
  if(!run.map||!inBounds(run,x,y))return "unknown";
  const position=visionKey(run,x,y);
  if((visible||visibleCells(run)).has(position))return "visible";
  return run.exploration.seen.includes(position)?"remembered":"unknown";
}
/** Minimap exposes static discovered geometry only. No mobile enemy positions,
 * speculative exits, loot behind an unopened door, or unknown coordinates.
 */
export function minimapText(run){
  if(!run?.map)return "";
  if(!hasFog(run))return ""; // no minimap retrofitted into legacy runs
  const known=new Set(run.exploration.seen),live=visibleCells(run);
  const width=run.map[0].length;
  return run.map.map((row,y)=>[...row].map((tile,x)=>{
    if(x===run.x&&y===run.y)return "@";
    const pos=y*width+x;
    if(!known.has(pos)&&!live.has(pos))return " ";
    if(tile==="#")return "#";
    if(tile==="+")return "+";
    if(tile==="E")return "E";
    if(run.secrets?.some(s=>s.revealed&&s.x===x&&s.y===y))return "?";
    if(tile==="^")return "^";
    if(tile==="$"&&run.rooms)return run.collected.includes(x+","+y)?"o":"C";
    return live.has(pos)?".":":";
  }).join("")).join("\n");
}
