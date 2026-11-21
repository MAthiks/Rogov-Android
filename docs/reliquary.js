// GAME-101G — optional risk / reward beside the stationary Rift Larva.
// Deterministic layout, no new enemies, RNG, compulsory path or auto-loot.
export const RELIQUARY_PLAN_VERSION=1;
export const RELIQUARY_WARDEN_ID="nhal-rift_larva-01";
const key=p=>p.x+","+p.y;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const inside=(p,r)=>p.x>r.x&&p.y>r.y&&
  p.x<r.x+r.width-1&&p.y<r.y+r.height-1;
const choices=new Set(["salvage","unseal"]);

/** Place in the existing larva's side chamber, never on its square, a trap,
 * a chest, an existing encounter or the public route. A missed placement
 * rejects that seed; the generator retries another map, not a forced site.
 */
export function placeReliquary(layout,index,route,twoReturnWays){
  if(!Number.isSafeInteger(index)||index<2||
     !Array.isArray(layout?.rooms)||!Array.isArray(layout.map)||
     !Array.isArray(layout.enemies)||!Array.isArray(layout.traps)||
     !Array.isArray(layout.sites)||!Array.isArray(layout.encounters)||
     typeof route!=="function"||typeof twoReturnWays!=="function")
    throw new TypeError("Incomplete GAME-101G reliquary layout");
  const warden=layout.enemies.find(e=>e.id===RELIQUARY_WARDEN_ID&&e.kind==="rift_larva");
  const room=layout.rooms.find(r=>warden&&inside(warden,r));
  if(!warden||!room)throw new Error("No safe GAME-101G reliquary");
  const blocked=new Set([...layout.enemies,...layout.traps].map(key));
  const excluded=new Set([
    key(layout.start),key(layout.exit),...Object.keys(layout.loot),
    ...layout.enemies.map(key),...layout.doors.map(key),
    ...layout.sites.map(key),...layout.encounters.map(key),
    ...layout.traps.flatMap(t=>[key(t),key(t.clue)]),
    ...(layout.secrets||[]).flatMap(s=>[key(s),key(s.clue)])
  ]);
  const candidates=[];
  for(let y=room.y+1;y<room.y+room.height-1;y++)
    for(let x=room.x+1;x<room.x+room.width-1;x++){
      const p={x,y},proximity=distance(p,warden);
      if(layout.map[y]?.[x]!=="."||excluded.has(key(p))||
         proximity<2||proximity>4||
         layout.enemies.some(e=>e.id!==warden.id&&distance(e,p)<2)||
         layout.traps.some(t=>distance(t,p)<2)||
         !route(layout.map,layout.start,p,blocked)||
         !route(layout.map,p,layout.exit,blocked)||
         !twoReturnWays(layout.map,p,layout.exit))continue;
      candidates.push({p,score:proximity*5+(x*17+y*31+index*11)%13});
    }
  candidates.sort((a,b)=>a.score-b.score||key(a.p).localeCompare(key(b.p)));
  if(!candidates.length)throw new Error("No safe GAME-101G reliquary");
  return {id:"nhal-reliquary-01",kind:"reliquary",wardenId:RELIQUARY_WARDEN_ID,
    roomId:room.id,x:candidates[0].p.x,y:candidates[0].p.y,
    status:"untouched",choice:null};
}

/** New layouts must carry one valid site; a historical run without either
 * field is valid and is NEVER migrated into a guarded new encounter.
 * Warden absence during live play is expected after a genuine victory.
 */
export function validReliquary(run){
  if(run?.reliquaryPlanVersion===undefined)return run?.reliquary===undefined;
  if(run.reliquaryPlanVersion!==RELIQUARY_PLAN_VERSION||
     run.pursuitPlanVersion!==1||run.encounterPlanVersion!==1||
     !Array.isArray(run.rooms)||!Array.isArray(run.map)||
     !Array.isArray(run.enemies)||!Array.isArray(run.sites)||
     !Array.isArray(run.encounters))return false;
  const site=run.reliquary,room=run.rooms[site?.roomId];
  if(!site||!room||site.id!=="nhal-reliquary-01"||
     site.kind!=="reliquary"||site.wardenId!==RELIQUARY_WARDEN_ID||
     !Number.isInteger(site.x)||!Number.isInteger(site.y)||
     !inside(site,room)||run.map[site.y]?.[site.x]!=="."||
     !["untouched","resolved"].includes(site.status)||
     (site.status==="untouched"?site.choice!==null:!choices.has(site.choice))||
     [...run.sites,...run.encounters].some(s=>key(s)===key(site))||
     Object.hasOwn(run.loot||{},key(site))||
     run.doors?.some(d=>key(d)===key(site))||
     run.traps?.some(t=>key(t)===key(site)||key(t.clue)===key(site))||
     run.secrets?.some(s=>key(s)===key(site)||key(s.clue)===key(site)))
    return false;
  return true;
}
export function reliquaryWardenAlive(run){
  return Boolean(run?.enemies?.some(e=>
    e.id===RELIQUARY_WARDEN_ID&&e.kind==="rift_larva"&&e.hp>0));
}
