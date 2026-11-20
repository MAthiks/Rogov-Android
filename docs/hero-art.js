// ART-091A — L'Égaré, Sprite C: four original 24x24 hood-up idle views.
// Render-only assets: no save field, animation timer, RNG or external request.
const svg=parts=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" shape-rendering="crispEdges">'+parts+"</svg>";
const P=Object.freeze({
  outline:"#171b25",hood:"#3d3544",hoodShade:"#282733",hoodRim:"#665561",
  cape:"#514550",capeShadow:"#302d39",capeEdge:"#79656a",
  scarf:"#85746b",leather:"#816b55",leatherDark:"#4d413b",
  ivory:"#ebe3cd",face:"#d5c3a7",boot:"#252c33",metal:"#b5b1a0",
  glint:"#bed0b7"
});
// Pixel coordinates and proportions stay identical in all four directions.
// The boots and central shoulder/hood anchors never move relative to the tile.
const boots=
  '<rect x="6" y="20" width="5" height="3" fill="'+P.boot+'"/>'+
  '<rect x="14" y="20" width="5" height="3" fill="'+P.boot+'"/>'+
  '<rect x="7" y="20" width="3" height="1" fill="'+P.leatherDark+'"/>'+
  '<rect x="15" y="20" width="3" height="1" fill="'+P.leatherDark+'"/>'+
  // Single-pixel wear shared with all four views; no floor halo or background.
  '<path data-detail="boot-worn-soles" d="M6 22h5M14 22h5" stroke="#748080" stroke-width="1" opacity=".75"/>'+
  '<path d="M7 20h2M15 20h2" stroke="#b5a08a" stroke-width="1"/>';
const down=svg(
  '<path d="M6 9h12l3 12-3 2H6l-3-2Z" fill="'+P.outline+'"/>'+
  '<path d="M7 10h10l3 11-3 1H7l-3-1Z" fill="'+P.cape+'"/>'+
  '<path d="M5 15l-1 6 4 1 2-9M19 15l1 6-4 1-2-9" fill="'+P.capeShadow+'"/>'+
  boots+
  '<rect x="3" y="15" width="4" height="6" fill="'+P.leatherDark+'"/>'+
  '<rect x="4" y="16" width="3" height="4" fill="'+P.leather+'"/>'+
  '<path d="M8 13l9 7" stroke="'+P.leather+'" stroke-width="2"/>'+
  '<rect x="16" y="17" width="3" height="4" fill="'+P.leatherDark+'"/>'+
  '<path d="M7 12h10l-1 3H8Z" fill="'+P.scarf+'"/>'+
  '<path data-detail="front-cloak-seams" d="M8 16l-2 4M15 16l3 5M10 17h4" stroke="#a18d89" stroke-width="1" fill="none"/>'+
  '<rect data-detail="front-brass-clasp" x="12" y="15" width="2" height="2" fill="#c6ad80"/>'+
  '<path d="M12 16h2" stroke="#33303a" stroke-width="1"/>'+
  '<g data-feature="hood">'+
  '<path d="M6 12V7l3-5h6l3 5v5l-3 2H9Z" fill="'+P.outline+'"/>'+
  '<path d="M7 11V7l3-4h4l3 4v4l-3 2H10Z" fill="'+P.hood+'"/>'+
  '<path d="M8 8l2-3h4l2 3v4H8Z" fill="'+P.hoodShade+'"/>'+
  '<rect x="10" y="8" width="4" height="4" fill="'+P.face+'"/>'+
  '<path d="M9 8V6h6v2h-2v1h-3v2H9Z" fill="'+P.ivory+'"/>'+
  '<rect x="10" y="10" width="1" height="1" fill="'+P.outline+'"/>'+
  '<rect x="13" y="10" width="1" height="1" fill="'+P.outline+'"/>'+
  '<path d="M7 8V6l3-3M17 8V6l-3-3" stroke="'+P.hoodRim+'" stroke-width="1" fill="none"/>'+
  '</g>'+
  '<rect x="17" y="17" width="1" height="1" fill="'+P.metal+'"/>'
);
const up=svg(
  '<path d="M6 9h12l3 12-3 2H6l-3-2Z" fill="'+P.outline+'"/>'+
  '<path d="M7 10h10l3 11-3 1H7l-3-1Z" fill="'+P.capeShadow+'"/>'+
  '<path d="M8 13h8l3 7-4 2H9l-4-2Z" fill="'+P.cape+'"/>'+
  '<path d="M10 14v8M14 14v8" stroke="'+P.capeEdge+'" stroke-width="1"/>'+
  '<path data-detail="rear-cape-stitching" d="M8 16l-2 4M16 16l2 4M11 19h2" stroke="#9b8984" stroke-width="1" fill="none"/>'+
  '<path data-detail="rear-cross-harness" d="M8 15l8 6M16 15l-8 6" stroke="#705f56" stroke-width="1" fill="none"/>'+
  boots+
  '<rect x="3" y="15" width="4" height="5" fill="'+P.leatherDark+'"/>'+
  '<rect x="4" y="16" width="3" height="3" fill="'+P.leather+'"/>'+
  '<path d="M16 13l3 7" stroke="'+P.leather+'" stroke-width="2"/>'+
  '<path d="M7 11h10v4H7Z" fill="'+P.scarf+'"/>'+
  '<g data-feature="hood">'+
  '<path d="M6 12V7l3-5h6l3 5v5l-3 3H9Z" fill="'+P.outline+'"/>'+
  '<path d="M7 11V7l3-4h4l3 4v4l-3 2h-4Z" fill="'+P.hood+'"/>'+
  '<path d="M10 4h4l2 4v4l-3 2h-2l-3-2V8Z" fill="'+P.hoodShade+'"/>'+
  '<path d="M10 4h4M8 7v4M16 7v4" stroke="'+P.hoodRim+'" stroke-width="1"/>'+
  '<path d="M12 7v6" stroke="'+P.capeEdge+'" stroke-width="1"/>'+
  '</g>'+
  '<rect x="17" y="17" width="1" height="1" fill="'+P.metal+'"/>'
);
const leftBody=
  '<path d="M7 9h10l3 12-3 2H6l-3-2Z" fill="'+P.outline+'"/>'+
  '<path d="M8 10h9l2 11-3 1H7l-3-1Z" fill="'+P.cape+'"/>'+
  '<path d="M8 14l-3 7 4 1 2-6M16 12l3 9-4 1-2-5" fill="'+P.capeShadow+'"/>'+
  '<path data-detail="profile-cloak-hem" d="M4 20l4 1M15 20l3 1M9 15l-2 5" stroke="#a38b86" stroke-width="1" fill="none"/>'+
  boots+
  '<rect x="17" y="14" width="4" height="7" fill="'+P.leatherDark+'"/>'+
  '<rect x="18" y="15" width="2" height="5" fill="'+P.leather+'"/>'+
  '<path d="M11 13l5 7" stroke="'+P.leather+'" stroke-width="2"/>'+
  '<path d="M7 12h10l-1 3H8Z" fill="'+P.scarf+'"/>'+
  '<g data-feature="hood">'+
  '<path d="M5 11V7l4-5h6l3 5v6l-5 2-6-2Z" fill="'+P.outline+'"/>'+
  '<path d="M6 10V7l4-4h4l3 4v5l-4 2-5-2Z" fill="'+P.hood+'"/>'+
  '<path d="M6 8l3-3h4l2 4v4l-4 1-4-2Z" fill="'+P.hoodShade+'"/>'+
  '<path d="M6 9h4v4H7l-2-2Z" fill="'+P.face+'"/>'+
  '<rect x="5" y="10" width="2" height="2" fill="'+P.ivory+'"/>'+
  '<rect x="7" y="10" width="1" height="1" fill="'+P.outline+'"/>'+
  '<path d="M8 5h4M16 7v4" stroke="'+P.hoodRim+'" stroke-width="1"/>'+
  '<path data-detail="profile-hood-overhang" d="M6 8h4M5 9h2" stroke="#b3a0a0" stroke-width="1" fill="none"/>'+
  '</g>'+
  '<rect x="18" y="17" width="1" height="1" fill="'+P.metal+'"/>';
const left=svg(leftBody);
// Mirroring maintains exact silhouette, cloak and hood proportions.
const right=svg('<g transform="translate(24 0) scale(-1 1)">'+leftBody+'</g>');
export const HERO_FACINGS=Object.freeze(["down","up","left","right"]);
export const HERO_SVGS=Object.freeze({down,up,left,right});
export const HERO_SPRITES=Object.freeze(Object.fromEntries(
  HERO_FACINGS.map(facing=>[facing,"data:image/svg+xml;charset=UTF-8,"+
    encodeURIComponent(HERO_SVGS[facing])])
));
// Pure UI computation. Invalid, blocked and non-positional actions do not
// rotate the hero; beginning/ending an expedition resets the display to front.
export function heroFacingFromStep(before,after,current="down"){
  if(!before||!after)return "down";
  const dx=after.x-before.x,dy=after.y-before.y;
  if(dx===1&&dy===0)return "right";
  if(dx===-1&&dy===0)return "left";
  if(dx===0&&dy===1)return "down";
  if(dx===0&&dy===-1)return "up";
  return HERO_FACINGS.includes(current)?current:"down";
}
