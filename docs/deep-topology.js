// DEV-089C — Deterministic room graph. Physical slots are not room IDs.
// An eight-room perimeter circuit guarantees alternate public return paths.
// Optional nodes extend that circuit or add genuine traversable loops.
// No combats, loot, traps, secrets or saves are decided by this module.
export const GRAPH_VERSION=1;
export const CORE_SLOTS=Object.freeze([0,1,3,4,7,8,10,11]);
export const OPTIONAL_SLOTS=Object.freeze([2,5,6,9]);
export const GRAPH_ROOM_MIN=8;
export const GRAPH_ROOM_MAX=12;
const key=(a,b)=>Math.min(a,b)+","+Math.max(a,b);

export function topologyEdges(slots){
  const chosen=new Set(slots);
  if(CORE_SLOTS.some(slot=>!chosen.has(slot)))return [];
  const perimeter=[0,1,...(chosen.has(2)?[2]:[]),3,7,11,10,
    ...(chosen.has(9)?[9]:[]),8,4];
  const edges=[];
  const seen=new Set();
  function add(a,b){
    const id=key(a,b);
    if(!seen.has(id)){seen.add(id);edges.push({a,b});}
  }
  for(let i=0;i<perimeter.length;i++)
    add(perimeter[i],perimeter[(i+1)%perimeter.length]);
  // Cross-links keep optional central chambers within two connected routes.
  if(chosen.has(5)){add(1,5);add(5,4);}
  if(chosen.has(6)){add(7,6);add(6,10);}
  // An ordinary, non-secret cross-gallery adds a third alternative route.
  // Without it the eight-room ring loses both return options if its one
  // corridor trap is treated as blocked, so such layouts would be rejected.
  const middle=[4,...(chosen.has(5)?[5]:[]),
    ...(chosen.has(6)?[6]:[]),7];
  for(let i=0;i<middle.length-1;i++)add(middle[i],middle[i+1]);
  if(chosen.has(2)&&chosen.has(6))add(2,6);
  if(chosen.has(5)&&chosen.has(9))add(5,9);
  return edges;
}
export function planDeepTopology(index,rand){
  if(!Number.isSafeInteger(index)||index<2||typeof rand!=="function")
    throw new TypeError("Invalid variable Nhal topology");
  const optional=[...OPTIONAL_SLOTS];
  for(let i=optional.length-1;i>0;i--){
    const j=rand(i+1);
    [optional[i],optional[j]]=[optional[j],optional[i]];
  }
  const slots=[...CORE_SLOTS,...optional.slice(0,rand(5))]
    .sort((a,b)=>a-b);
  const edges=topologyEdges(slots);
  // Room identity is independent of the physical slot. In particular,
  // slot 8 (entry) may have room id 5, 6 or 7.
  const lSlot=index%2===0?0:11;
  const shapes=new Map([[lSlot,"l"]]);
  const other=[0,1,4,7,11].filter(s=>s!==lSlot);
  const offset=rand(other.length);
  for(const [i,shape] of ["pillar","collapsed","alcove"].entries())
    shapes.set(other[(i+offset)%other.length],shape);
  const narrative=[0,1,4,7,11].filter(slot=>slot!==lSlot);
  const echoSlot=narrative[rand(narrative.length)];
  const cacheSlot=narrative.filter(slot=>slot!==echoSlot)[rand(narrative.length-1)];
  return {
    slots,edges,shapes,
    roleSlots:{entry:8,exit:3,atelier:10,valuable:7,guardian:4,
      echo:echoSlot,cache:cacheSlot},
    networkKind:slots.length===8?"anneau":
      slots.includes(5)&&slots.includes(6)?"traverses":
      slots.includes(2)&&slots.includes(9)?"galeries":"ruines"
  };
}
