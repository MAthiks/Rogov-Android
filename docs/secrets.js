// DEV-082 — one entirely optional, seeded secret per *new* deep descent.
// The original floor network is always created and validated before this step.
// No combat RNG, hidden mandatory door, retroactive spawn or client storage.
import {visibleCells,visionKey} from "./exploration-visibility.js";

export const SECRET_REWARD="consumable.bandage";
const directions=[[0,-1],[1,0],[0,1],[-1,0]];
const tile=(map,x,y)=>map[y]?.[x]??"#";
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const clueTexts=Object.freeze([
  "Un courant d'air traverse les joints d'un mur. La pierre sonne creux.",
  "Une traînée de poussière s'interrompt contre une paroi trop régulière.",
  "Un écho inhabituel répond derrière des pierres couvertes de griffures."
]);
const pointKey=(p)=>p.x+","+p.y;
const isFloor=(symbol)=>symbol===".";
const atEdge=(layout,x,y)=>x<=1||y<=1||
  x>=layout.map[0].length-2||y>=layout.map.length-2;

/**
 * Called only after the public geometry passes its full return-route checks.
 * A shortcut uses a single hidden wall between two normal floor tiles and
 * still has a long public detour; an optional one-cell cache is the fallback.
 * No new route is required for extraction, even before revealing the secret.
 */
export function placeOptionalSecret(layout,index,route){
  if(!layout?.map||!layout?.rooms||!Number.isSafeInteger(index)||index<2)
    throw new TypeError("Secret placement requires a generated deep layout");
  const shortcuts=[],alcoves=[];
  // Geometry obstacles are structural masonry, not discoverable secret
  // doors. Protect them so revealing a secret cannot invalidate saved rooms.
  const structural=new Set(layout.rooms.flatMap(r=>(r.obstacles||[]).map(pointKey)));
  for(let y=2;y<layout.map.length-2;y++
    for(let x=2;x<layout.map[0].length-2;x++){
      if(tile(layout.map,x,y)!=="#"||atEdge(layout,x,y)||
          structural.has(x+","+y))continue;
      const p={x,y};
      if(distance(p,layout.start)<6||distance(p,layout.exit)<5)continue;
      const neighbours=directions.map(([dx,dy])=>({x:x+dx,y:y+dy}));
      const floors=neighbours.filter(n=>isFloor(tile(layout.map,n.x,n.y)));
      const others=neighbours.filter(n=>!isFloor(tile(layout.map,n.x,n.y)));
      // Never carve beside a normal door, an exit, a hazard or the tutorial.
      if(neighbours.some(n=>!["#","."].includes(tile(layout.map,n.x,n.y))))continue;
      if(floors.length===1&&others.length===3)
        alcoves.push({x,y,clue:floors[0],kind:"cache",score:1});
      if(floors.length===2&&others.length===2&&
          (floors[0].x===floors[1].x||floors[0].y===floors[1].y)){
        shortcuts.push({x,y,clue:floors[0],kind:"shortcut",ends:floors});
      }
    }
  // Evaluate a bounded subset to limit generation cost on Android.
  const viable=[];
  for(let n=0;n<Math.min(shortcuts.length,24);n++){
    const item=shortcuts[(index*7+n*11)%shortcuts.length];
    if(viable.some(v=>v.x===item.x&&v.y===item.y))continue;
    const path=route(layout.map,item.ends[0],item.ends[1]);
    if(path&&path.length>=10)
      viable.push({...item,score:path.length});
  }
  const candidates=viable.length?viable:alcoves;
  if(!candidates.length)throw new Error("No optional hidden cache candidate");
  // Same index + plan always yields the same clue and location.
  const selected=candidates[(index*13+layout.rooms[5].width)%candidates.length];
  return [{
    id:"nhal-secret-01",x:selected.x,y:selected.y,
    clue:{x:selected.clue.x,y:selected.clue.y},
    kind:selected.kind,clueType:index%clueTexts.length,
    revealed:false,claimed:false,reward:SECRET_REWARD
  }];
}
/** Validate optional save data; legacy deep runs with no secrets are accepted. */
export function validSecrets(run){
  if(run?.secrets===undefined)return true;
  if(!run?.rooms||!Array.isArray(run.secrets)||run.secrets.length!==1)return false;
  const secret=run.secrets[0];
  if(!secret||secret.id!=="nhal-secret-01"||
    !["cache","shortcut"].includes(secret.kind)||
    !Number.isInteger(secret.x)||!Number.isInteger(secret.y)||
    !Number.isInteger(secret.clue?.x)||!Number.isInteger(secret.clue?.y)||
    !Number.isInteger(secret.clueType)||secret.clueType<0||secret.clueType>=clueTexts.length||
    typeof secret.revealed!=="boolean"||typeof secret.claimed!=="boolean"||
    secret.reward!==SECRET_REWARD||(!secret.revealed&&secret.claimed))return false;
  if(atEdge(run,secret.x,secret.y)||
    distance(secret,secret.clue)!==1||tile(run.map,secret.clue.x,secret.clue.y)!==".")return false;
  return tile(run.map,secret.x,secret.y)===(secret.revealed?".":"#");
}
/**
 * Passive clue only when its specific floor is actually visible.
 * Higher PER helps read the sign sooner; it is never a prerequisite.
 * No hidden coordinates or rewards are returned by this function.
 */
export function nearbySecretHint(run,perception=5){
  const secret=run?.secrets?.find(s=>!s.revealed);
  if(!secret||!run?.exploration)return null;
  const maxDistance=perception>=7?3:2;
  if(distance(run,secret.clue)>maxDistance)return null;
  if(!visibleCells(run).has(visionKey(run,secret.clue.x,secret.clue.y)))return null;
  return {
    text:clueTexts[secret.clueType],
    clue:{...secret.clue},
    canSearch:distance(run,secret)===1,
    hint:distance(run,secret)===1
      ?"La paroi suspecte est à portée. Fouille attentivement pour confirmer le passage."
      :"Suis cette trace jusqu'à la paroi pour fouiller."
  };
}
export function revealedSecretAt(run,x,y){
  return run?.secrets?.find(s=>s.revealed&&s.x===x&&s.y===y)||null;
}
