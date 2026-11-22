// ART-106D — Original transparent 24x24 finishing pixels for the live Nhal
// hero, known enemy species and their existing interactive objects.
// Pure static SVG source transformation; it cannot see the map, fog, inventory,
// game state or random number generator. It adds NO surrounding entity outline.
const HERO=Object.freeze({
  down:
    '<g data-detail="art106d-hooded-front">'+
    '<path d="M9 3h6M7 7l2-4M17 7l-2-4" fill="none" stroke="#b38ba3" stroke-width="1"/>'+
    '<path d="M8 7h2M14 7h2" stroke="#8f6a86" stroke-width="1"/>'+
    '<path d="M9 9h6v2H9Z" fill="#201b2a" opacity=".8"/>'+
    '<path d="M10 10h1M13 10h1" stroke="#f0bc71" stroke-width="1"/>'+
    '<path d="M7 12h3M15 12h2M7 16l-2 3M17 16l2 3" stroke="#a78891" stroke-width="1" fill="none"/>'+
    '<path d="M10 15h4M12 17v3" stroke="#e4b47b" stroke-width="1" fill="none"/>'+
    '<path d="M8 20h2M15 20h2" stroke="#9e8375" stroke-width="1"/>'+
    '</g>',
  up:
    '<g data-detail="art106d-hooded-rear">'+
    '<path d="M9 3h6M7 7l3-4M17 7l-3-4" stroke="#b38ba3" stroke-width="1" fill="none"/>'+
    '<path d="M9 7h6M10 9h4M12 11v3" stroke="#73546b" stroke-width="1" fill="none"/>'+
    '<path d="M8 15l3 3M16 15l-3 3M7 20h3M14 20h3" stroke="#a08783" stroke-width="1" fill="none"/>'+
    '<path d="M12 15v4" stroke="#bd9b6c" stroke-width="1"/>'+
    '</g>',
  left:
    '<g data-detail="art106d-hooded-profile">'+
    '<path d="M9 3h5M6 8l3-5M7 6h3" stroke="#b38ba3" stroke-width="1" fill="none"/>'+
    '<path d="M6 10h2M6 11h2" stroke="#e6be88" stroke-width="1"/>'+
    '<path d="M9 12h5M9 16l-2 4M16 16l2 4" stroke="#ae8b87" stroke-width="1" fill="none"/>'+
    '<path d="M12 16l4 4M8 20h3" stroke="#d3a16d" stroke-width="1"/>'+
    '</g>'
});
const ENEMY=Object.freeze({
  charognard:
    '<g data-detail="art106d-carrion-wing">'+
    '<path d="M3 15l-2 3M5 11l-3-2M8 10l-2-3" stroke="#b69c81" stroke-width="1"/>'+
    '<path d="M7 15h3M9 17h4M13 14h2" stroke="#d2b49b" stroke-width="1"/>'+
    '<path d="M18 12h2" stroke="#702c2d" stroke-width="1"/>'+
    '<path d="M19 12h1" stroke="#e45a43" stroke-width="1"/>'+
    '<path d="M6 20v2M11 20v2" stroke="#c0ae8b" stroke-width="1"/>'+
    '</g>',
  guardian:
    '<g data-detail="art106d-guardian-forged-armor">'+
    '<path d="M4 5h5M15 5h5M3 8h5M17 8h4" stroke="#d6c6a8" stroke-width="1" fill="none"/>'+
    '<path d="M5 10v4M19 10v4M8 16h8M9 20h6" stroke="#9eaba4" stroke-width="1" fill="none"/>'+
    '<path d="M11 10h2M15 10h2" stroke="#6d211e" stroke-width="2"/>'+
    '<path data-detail="art106d-guardian-red-eyes" d="M11 10h1M15 10h1" stroke="#f25d47" stroke-width="1"/>'+
    '<path d="M12 14h3M13 17v2M5 21h5M14 21h5" stroke="#c9a984" stroke-width="1" fill="none"/>'+
    '<path d="M20 5h3M20 8h3" stroke="#ecbd80" stroke-width="1"/>'+
    '</g>',
  rift_larva:
    '<g data-detail="art106d-larva-armored-segments">'+
    '<path d="M3 12h4M9 11h4M15 12h4" stroke="#e2b1a5" stroke-width="1"/>'+
    '<path d="M5 14h2M11 13h2M17 14h2" stroke="#9d7b87" stroke-width="1"/>'+
    '<path d="M4 18h3M10 18h3M16 18h3" stroke="#232334" stroke-width="1"/>'+
    '<path data-detail="art106d-larva-red-eyes" d="M19 13h1M21 14h1" stroke="#f16b5b" stroke-width="1"/>'+
    '<path d="M3 21l-2 2M8 21l-2 2M15 21l-1 2M19 20l2 2" stroke="#b07d87" stroke-width="1"/>'+
    '</g>'
});
const OBJECT=Object.freeze({
  loot:
    '<g data-detail="art106d-sealed-gold-chest">'+
    '<path d="M5 9h15M4 12h16M5 21h15" stroke="#f3c66e" stroke-width="1" fill="none"/>'+
    '<path d="M4 15v5M20 15v5" stroke="#c28a35" stroke-width="1"/>'+
    '<path d="M7 11h3M15 11h3" stroke="#fae2a0" stroke-width="1"/>'+
    '<path d="M11 14h2v2h-2Z" fill="#151b1d"/>'+
    '<path d="M11 13h2M12 16v1" stroke="#ffe198" stroke-width="1"/>'+
    '</g>',
  chest_open:
    '<g data-detail="art106d-open-chest">'+
    '<path d="M5 4h13M4 9h16M5 21h15" stroke="#ebc084" stroke-width="1"/>'+
    '<path d="M7 15h10M8 16h8" stroke="#060c12" stroke-width="1"/>'+
    '<path d="M4 18v3M20 18v3" stroke="#b28d57" stroke-width="1"/>'+
    '</g>',
  door_closed:
    '<g data-detail="art106d-timber-door">'+
    '<path d="M7 8v14M17 8v14M11 7v15" stroke="#c2955c" stroke-width="1" opacity=".7"/>'+
    '<path d="M6 12h12M6 20h12" stroke="#c7ad82" stroke-width="1"/>'+
    '<path d="M8 11h1M15 11h1M8 20h1M15 20h1" stroke="#f7dca5" stroke-width="1"/>'+
    '<path d="M11 14h3M13 17h2" stroke="#403127" stroke-width="1"/>'+
    '</g>',
  door_open:
    '<g data-detail="art106d-open-jambs">'+
    '<path d="M2 9v12M21 9v12M7 3h10" stroke="#e2ccac" stroke-width="1" fill="none"/>'+
    '<path d="M3 14h2M19 14h2M3 19h2M19 19h2" stroke="#6e807e" stroke-width="1"/>'+
    '<path d="M8 21h8" stroke="#50666a" stroke-width="1"/>'+
    '</g>',
  exit:
    '<g data-detail="art106d-arch-cyan-keystone">'+
    '<path d="M3 9v12M21 9v12M7 3h10" stroke="#a9e6d6" stroke-width="1" fill="none"/>'+
    '<path d="M8 11h2M14 11h2M8 16h2M14 16h2" stroke="#54a9a4" stroke-width="1"/>'+
    '<path d="M12 4l2 2-2 2-2-2Z" fill="#d3fff1" stroke="#4daba3" stroke-width="1"/>'+
    '<path d="M12 12v7M10 17h4" stroke="#e9fff5" stroke-width="1"/>'+
    '<path d="M6 21h12M8 22h8" stroke="#79e4d4" stroke-width="1"/>'+
    '</g>',
  hazard:
    '<g data-detail="art106d-sickly-green-rift">'+
    '<path d="M12 2l2 6M10 9l-3 4M13 15l-2 6M15 12l5-3" stroke="#42712d" stroke-width="2" fill="none"/>'+
    '<path d="M11 6l2 5-2 4 2 4" stroke="#b6ff5b" stroke-width="1" fill="none"/>'+
    '<path d="M5 9l3 3M5 19l4-5M17 8l3-4M17 16l4 3" stroke="#82c33f" stroke-width="1" fill="none"/>'+
    '<path d="M12 10h1M11 15h1" stroke="#e4ff8c" stroke-width="1"/>'+
    '</g>'
});
export const ART106D_SUPPORTED=Object.freeze({
  hero:Object.freeze(["down","up","left","right"]),
  enemy:Object.freeze(Object.keys(ENEMY)),
  interactive:Object.freeze(Object.keys(OBJECT))
});
const add=(source,fragment)=>{
  if(typeof source!=="string"||!source.startsWith("<svg ")||!source.endsWith("</svg>"))
    throw new TypeError("ART-106D requires a complete 24px inline SVG");
  if(!source.includes('viewBox="0 0 24 24"'))throw new RangeError("Expected 24px sprite");
  return source.slice(0,-6)+fragment+"</svg>";
};
export function finishHero106D(facing,source){
  const layer=facing==="right"?
    '<g transform="translate(24 0) scale(-1 1)">'+HERO.left+"</g>":
    HERO[facing];
  if(!layer)throw new RangeError("Unknown hero facing: "+facing);
  return add(source,layer);
}
export function finishEnemy106D(kind,source){
  const layer=ENEMY[kind];
  if(!layer)throw new RangeError("Unknown enemy kind: "+kind);
  return add(source,layer);
}
export function finishInteractive106D(kind,source){
  // No new fictitious sprite: all non-polished types retain their exact art.
  const layer=OBJECT[kind];
  return layer?add(source,layer):source;
}
