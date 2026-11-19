// GAME-095D3C — optional duet at a side-room treasure, no extra enemies.
// Only called for NEW balanced floors 2–3; old saved maps are never rebuilt.
// Guardian telegraphed melee + Larva periodic line pulse: no stat scaling.
// No random calls: existing chest and combat RNG streams remain unchanged.
import {deepRoute,deepTwoReturnWays} from "./deep-dungeon.js";
import {lineOfSight} from "./exploration-visibility.js";

export const OPTIONAL_DUO_VERSION=1;
const key=p=>p.x+","+p.y;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const neighbors=p=>[
  {x:p.x+1,y:p.y},{x:p.x-1,y:p.y},
  {x:p.x,y:p.y+1},{x:p.x,y:p.y-1}
];
const floor=(layout,p)=>layout.map[p.y]?.[p.x]===".";

/** Return a NEW layout only when a safe, actually visible two-enemy approach
 * to the optional side chest exists. A missing valid arrangement keeps the
 * original published B2 layout, not a forced fight or an invented shortcut.
 * No treasure content is inspected except its reward ROLE.
 */
export function coordinateOptionalDuo(layout){
  if(!layout||!Array.isArray(layout.enemies)||!Array.isArray(layout.rooms)||
     !Array.isArray(layout.map)||!layout.loot)
    throw new TypeError("Expected complete deep balanced layout");
  const optional=Object.entries(layout.loot).find(([,id])=>
    id!=="relic.ashen_fragment"&&id!=="consumable.bandage");
  const guardian=layout.enemies.find(e=>e.id==="nhal-guardian-01"&&e.kind==="guardian");
  const larva=layout.enemies.find(e=>e.id==="nhal-rift_larva-01"&&e.kind==="rift_larva");
  const sideRoom=layout.rooms.find(room=>room.slot===10);
  if(!optional||!guardian||!larva||!sideRoom)return layout;
  const [cx,cy]=optional[0].split(",").map(Number);
  const chest={x:cx,y:cy};
  // The optional chest belongs to the atelier. No group at the entrance
  // bandage, the Fragment, the public Arche or a forced corridor.
  if(cx<=sideRoom.x||cy<=sideRoom.y||
     cx>=sideRoom.x+sideRoom.width-1||
     cy>=sideRoom.y+sideRoom.height-1)return layout;
  const forbidden=new Set([
    ...Object.keys(layout.loot),
    key(layout.start),key(layout.exit),
    ...(layout.doors||[]).map(key),
    ...layout.enemies.filter(e=>e.id!==guardian.id).map(key),
    ...(layout.traps||[]).map(key),
    ...(layout.sites||[]).map(key),
    ...(layout.secrets||[]).flatMap(s=>[key(s),key(s.clue)]),
  ]);
  const traps=new Set((layout.traps||[]).map(key));
  // A chest can be approached and later abandoned without crossing either
  // enemy; neither two return routes nor the known optional trap is removed.
  const options=[];
  for(let y=sideRoom.y+1;y<sideRoom.y+sideRoom.height-1;y++)
    for(let x=sideRoom.x+1;x<sideRoom.x+sideRoom.width-1;x++){
      const point={x,y};
      if(!floor(layout,point)||forbidden.has(key(point))||
         distance(point,chest)>3||
         distance(point,larva)<2||distance(point,larva)>4||
         (layout.sites||[]).some(s=>distance(s,point)<2)||
         (layout.traps||[]).some(t=>distance(t,point)<2))continue;
      const enemies=layout.enemies.map(e=>e.id===guardian.id
        ?{...e,x,y}:e);
      const blocked=new Set([...traps,...enemies.map(key)]);
      if(!deepTwoReturnWays(layout.map,layout.start,layout.exit,traps)||
         !deepRoute(layout.map,layout.start,layout.exit,blocked)||
         Object.keys(layout.loot).some(chestKey=>{
           const [tx,ty]=chestKey.split(",").map(Number),p={x:tx,y:ty};
           return !deepRoute(layout.map,layout.start,p,blocked)||
             !deepRoute(layout.map,p,layout.exit,blocked);
         }))continue;
      // True sight and proximity from a real, reachable chest-opening cell,
      // not simply two enemies put in the same room on a diagram.
      const readable=neighbors(chest).some(p=>
        floor(layout,p)&&!blocked.has(key(p))&&
        distance(p,point)<=3&&distance(p,larva)<=3&&
        deepRoute(layout.map,layout.start,p,blocked)&&
        lineOfSight({...layout,x:p.x,y:p.y},point.x,point.y)&&
        lineOfSight({...layout,x:p.x,y:p.y},larva.x,larva.y)
      );
      if(!readable)continue;
      options.push({point,enemies,score:distance(point,chest)*10+
        distance(point,larva)});
    }
  if(!options.length)return layout;
  options.sort((a,b)=>a.score-b.score||
    a.point.y-b.point.y||a.point.x-b.point.x);
  return {...layout,enemies:options[0].enemies};
}
