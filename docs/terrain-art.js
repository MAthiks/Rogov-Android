// DEV-089B — Original, offline-first terrain atlas for Nhal.
// Terrain styling cannot change collisions, doors, visibility or combat RNG.
// All terrain sprites are 24x24 SVGs; no external image requests.
export const TERRAIN_PALETTE=Object.freeze({
  void:"#121f26",floor:"#202d33",mortar:"#18252c",
  slab:"#28363d",slabEdge:"#3c4b50",wall:"#4b5c63",
  wallFace:"#33464e",wallHighlight:"#82908b",
  moss:"#40574b",dust:"#66564a",coldLight:"#9dd7c4"
});
const svg=parts=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" shape-rendering="crispEdges">'+parts+"</svg>";
const uri=source=>"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(source);

// Base floor has a low-contrast masonry cadence. Six accents are genuinely
// different materials, never fake doors, enemies, clues, traps or chest shapes.
const floorDetails=Object.freeze([
  '<path d="M3 3h5M18 19h3" stroke="#4b5c63" stroke-width="1"/>',
  '<path d="M3 4l5 3-2 4 5 2M18 18l-3-2-3 4" fill="none" stroke="#526066" stroke-width="1"/>',
  '<path d="M4 5h3M5 6h2M18 15h3M17 16h4" stroke="#52605d" stroke-width="1"/>'+
    '<rect x="3" y="19" width="4" height="1" fill="#39494a"/>',
  '<path d="M3 15h5M16 5h5" stroke="#66564a" stroke-width="2" opacity=".65"/>'+
    '<rect x="8" y="17" width="2" height="1" fill="#88745b" opacity=".6"/>',
  '<path d="M3 10h3M19 3v3M16 20h4" stroke="#40574b" stroke-width="2"/>'+
    '<rect x="11" y="16" width="5" height="1" fill="#435c5c" opacity=".65"/>',
  '<path d="M5 4l4 3 2 5-2 3M19 12l-3 2-1 4" stroke="#161d25" stroke-width="2" fill="none"/>'+
    '<rect x="16" y="7" width="3" height="2" fill="#30333a"/>'
]);
// ART-097A1: restrained patina on the existing six floor variants. It must
// never resemble a door, chest, spike, crack of magical light or a hidden trap.
const floorPatina=Object.freeze([
  '<path data-detail="floor-patina" d="M18 6h2M3 18h2" stroke="#425354" stroke-width="1"/>',
  '<path data-detail="floor-patina" d="M5 16h2M18 4h2" stroke="#45565a" stroke-width="1"/>',
  '<path data-detail="floor-patina" d="M3 14h2M18 15h3" stroke="#4c5c52" stroke-width="1"/>',
  '<path data-detail="floor-patina" d="M17 4h2M4 17h2" stroke="#66564a" stroke-width="1"/>',
  '<path data-detail="floor-patina" d="M17 18h3M3 5h2" stroke="#405a4a" stroke-width="1"/>',
  '<path data-detail="floor-patina" d="M4 4h2M17 17h2" stroke="#485456" stroke-width="1"/>'
]);
function floorSvg(variant){
  return svg(
    '<rect width="24" height="24" fill="#202d33"/>'+
    '<path data-material="worn-floor-slabs" d="M1 1h11v7H1ZM15 11h8v8h-8ZM1 12h7v7H1Z" fill="#2e3c42" opacity=".52"/>'+
    '<path d="M2 2h8M16 12h5M2 13h4" stroke="#526068" stroke-width="1" opacity=".45"/>'+
    '<path d="M0 9h12M14 9h10M14 0v9M9 9v15M0 20h9M10 20h14" stroke="#151f25" stroke-width="1"/>'+
    '<path d="M0 10h12M14 10h10M15 0v9M10 10v14M0 21h9M11 21h13" stroke="#37454b" stroke-width="1"/>'+
    '<rect x="2" y="12" width="1" height="1" fill="#435257"/>'+
    '<rect x="18" y="3" width="2" height="1" fill="#334449"/>'+
    // One-pixel edge lighting adds volume without making the quiet floor
    // compete with the hero, a visible trap or the extraction portal.
    '<path data-detail="floor-beveled-masonry" d="M2 2h9M2 3v5M16 12h6M16 13v5M2 13h5M2 14v4" stroke="#637179" stroke-width="1" opacity=".32"/>'+
    '<path data-detail="floor-mortar-depth" d="M0 8h12M14 8h10M13 0v10M8 11v13M0 19h9M10 19h14" stroke="#0e181f" stroke-width="1" opacity=".75"/>'+
    floorDetails[variant]+floorPatina[variant]
  );
}

// Bitmask: exposed, *known* edges north=1, east=2, south=4, west=8.
// No source data about unknown neighbors is consulted when selecting artwork.
const WALL_N=1,WALL_E=2,WALL_S=4,WALL_W=8;
function wallSvg(mask,variant){
  const face=variant===1?"#34464d":variant===2?"#30443f":"#35464c";
  const accents=[
    '<path d="M5 8l2-2M19 17l-2 3" stroke="#697a76" stroke-width="1"/>',
    '<path d="M18 4l-3 3-1 5 3 2-2 5" stroke="#20323a" stroke-width="1" fill="none"/>',
    '<path d="M4 18h4M9 19h2M20 8h2" stroke="#40574b" stroke-width="2"/>'
  ];
  const rim=(mask&WALL_N?'<path d="M0 1h24" stroke="#8d9b94" stroke-width="2"/>':"")+
    (mask&WALL_E?'<path d="M23 2v22" stroke="#84928b" stroke-width="2"/>':"")+
    (mask&WALL_S?'<path d="M0 22h24" stroke="#97a59c" stroke-width="2"/>':"")+
    (mask&WALL_W?'<path d="M1 2v22" stroke="#84928b" stroke-width="2"/>':"");
  return svg(
    '<rect width="24" height="24" fill="#111b23"/>'+
    '<rect x="1" y="1" width="22" height="10" fill="#4b5c63"/>'+
    '<path data-material="raised-stone-ledge" d="M1 1h22v3H1ZM2 5h20v2H2Z" fill="#73848a"/>'+
    '<path d="M2 7h20v3H2Z" fill="#394f58"/>'+
    '<rect x="1" y="13" width="10" height="10" fill="'+face+'"/>'+
    '<rect x="13" y="13" width="10" height="10" fill="'+face+'"/>'+
    '<path d="M0 12h24M12 12v12" stroke="#111d24" stroke-width="2"/>'+
    '<path d="M2 3h20M2 14h8M14 14h8" stroke="#82908b" stroke-width="1"/>'+
    '<path d="M4 10h7M15 10h6M4 21h4M16 21h5" stroke="#23353c" stroke-width="1"/>'+
    // Top-down 3/4 stonework: a bright capstone, dark recessed mortar and
    // low-contrast face joints. No glow or simulated interactive object.
    '<path data-detail="wall-dressed-capstone" d="M2 2h20v1H2ZM3 5h18v1H3ZM2 8h7M15 8h7" fill="#9ba9a4" opacity=".62"/>'+
    '<path data-detail="wall-recessed-joints" d="M1 11h22v2H1ZM11 13h2v11h-2Z" fill="#121e26"/>'+
    '<path data-detail="wall-face-bevel" d="M2 14h8M14 14h8M2 15v7M14 15v7" stroke="#6b7d7c" stroke-width="1" opacity=".56"/>'+
    '<path data-detail="wall-age-patina" d="M4 18h2M18 19h3" stroke="#46594e" stroke-width="1"/>'+
    accents[variant]+rim
  );
}
export const TERRAIN_SVGS=Object.freeze({
  floor:Object.freeze(Array.from({length:floorDetails.length},(_,v)=>floorSvg(v))),
  wall:Object.freeze(Array.from({length:16},(_,mask)=>
    Object.freeze(Array.from({length:3},(_,v)=>wallSvg(mask,v)))))
});
export const TERRAIN_SPRITES=Object.freeze({
  floor:Object.freeze(TERRAIN_SVGS.floor.map(uri)),
  wall:Object.freeze(TERRAIN_SVGS.wall.map(row=>Object.freeze(row.map(uri))))
});

// A deterministic hash independent of any gameplay RNG. The seed here
// represents an already-generated layout, not a newly rolled dungeon.
export function terrainHash(seed,x,y){
  let h=2166136261;
  const value=String(seed)+":"+String(x)+":"+String(y);
  for(let i=0;i<value.length;i++){
    h^=value.charCodeAt(i);
    h=Math.imul(h,16777619);
  }
  return h>>>0;
}
export function floorVariantAt(seed,x,y){
  return terrainHash(seed,x,y)%TERRAIN_SPRITES.floor.length;
}
export function wallVariantAt(seed,x,y){
  return terrainHash(seed,x,y)%TERRAIN_SPRITES.wall[0].length;
}
export function wallEdgeMask(map,x,y,isKnown){
  if(map[y]?.[x]!=="#")return 0;
  let mask=0;
  for(const [dx,dy,bit] of [[0,-1,WALL_N],[1,0,WALL_E],
    [0,1,WALL_S],[-1,0,WALL_W]]){
    const nx=x+dx,ny=y+dy;
    // Do not even read map[ny][nx] until fog knowledge has been checked.
    if(isKnown(nx,ny)&&map[ny]?.[nx]!==undefined&&map[ny][nx]!=="#")
      mask|=bit;
  }
  return mask;
}
export function terrainSpriteAt(map,x,y,isKnown,seed="nhal"){
  if(map[y]?.[x]==="#")
    return TERRAIN_SPRITES.wall[wallEdgeMask(map,x,y,isKnown)]
      [wallVariantAt(seed,x,y)];
  return TERRAIN_SPRITES.floor[floorVariantAt(seed,x,y)];
}
