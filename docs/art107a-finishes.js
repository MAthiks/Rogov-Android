// ART-107A — Reference-guided, original 24x24 pixel finishes on the REAL Nhal atlas.
// Render-only SVG fragments: no map reads, RNG, traps, FOV, player state or DOM.
// Wall-edge bits come from terrain-art.wallEdgeMask AFTER knowledge filtering.
const FLOOR=Object.freeze([
  '<path d="M1 2h9v1H1ZM15 12h7v1h-7Z" fill="#8a9997" opacity=".43"/>'+
    '<path d="M2 7h8M16 18h6" stroke="#111b24" stroke-width="2" opacity=".55"/>'+
    '<path d="M4 16l2-1 1 2-2 1Z" fill="#65736e" opacity=".6"/>',
  '<path d="M2 2h7v1H2ZM16 13h6v1h-6Z" fill="#859691" opacity=".4"/>'+
    '<path d="M3 14h2M5 15h2M7 16h1" stroke="#18272b" stroke-width="1"/>'+
    '<path d="M18 3h2M20 4h2" stroke="#657c6b" stroke-width="1" opacity=".7"/>',
  '<path d="M2 3h8M15 12h7" stroke="#7f8d88" stroke-width="1" opacity=".5"/>'+
    '<path d="M3 17l2-2 2 1M19 3l2 2" stroke="#12202a" stroke-width="1" fill="none"/>'+
    '<path d="M4 16h2M18 5h2" stroke="#9ba396" stroke-width="1" opacity=".45"/>',
  '<path d="M2 2h8M15 12h6" stroke="#8f9182" stroke-width="1" opacity=".4"/>'+
    '<path d="M2 17h3v2H2ZM19 3h2v2h-2Z" fill="#514e48" opacity=".43"/>'+
    '<path d="M8 13h2M16 18h4" stroke="#151d22" stroke-width="1"/>',
  '<path d="M3 2h7M16 12h6" stroke="#899790" stroke-width="1" opacity=".5"/>'+
    '<path d="M2 9h3M5 10h2M15 20h3" stroke="#425c49" stroke-width="2" opacity=".58"/>'+
    '<path d="M3 8h2M17 20h2" stroke="#9a9974" stroke-width="1" opacity=".46"/>',
  '<path d="M1 2h8M16 12h7" stroke="#889394" stroke-width="1" opacity=".42"/>'+
    '<path d="M3 18l2-2 1 1 2-2M18 3l-1 3" stroke="#0d1a21" stroke-width="1" fill="none"/>'+
    '<path d="M4 17h2M17 4h2" stroke="#798882" stroke-width="1" opacity=".52"/>'
]);
const WALL_PATINA=Object.freeze([
  '<path d="M4 18h3M16 16h2M18 20h3" stroke="#697b73" stroke-width="1" opacity=".65"/>',
  '<path d="M5 15l2 2-1 3M18 16l-2 3" stroke="#172931" stroke-width="1" fill="none"/>'+
    '<path d="M5 19h2" stroke="#84948b" stroke-width="1" opacity=".6"/>',
  '<path d="M3 19h4M17 18h3" stroke="#365b48" stroke-width="2" opacity=".66"/>'+
    '<path d="M3 18h2M18 17h2" stroke="#8d9874" stroke-width="1" opacity=".65"/>'
]);
const HERO=Object.freeze({
  down:'<path d="M8 4h8M7 6h2M15 6h2" stroke="#c6a6b9" stroke-width="1"/>'+
    '<path d="M8 8h2M14 8h2" stroke="#6f4a73" stroke-width="1"/>'+
    '<path d="M9 10h6v2H9Z" fill="#161a27"/>'+
    '<path d="M10 11h1M13 11h1" stroke="#ffe0a0" stroke-width="1"/>'+
    '<path d="M7 15h2M15 15h2M8 19h2M14 19h2" stroke="#9c7788" stroke-width="1"/>'+
    '<path d="M11 16h2v2h-2Z" fill="#c2a178"/>',
  up:'<path d="M9 4h6M8 6h2M14 6h2M9 9h6" stroke="#bda5ad" stroke-width="1"/>'+
    '<path d="M10 12h4M9 15l3 2 3-2" stroke="#725967" stroke-width="1" fill="none"/>'+
    '<path d="M12 17v4" stroke="#bc9a78" stroke-width="1"/>'+
    '<path d="M7 20h3M14 20h3" stroke="#a1858e" stroke-width="1"/>',
  left:'<path d="M8 4h6M7 6h2M7 8h2" stroke="#c5a5b8" stroke-width="1"/>'+
    '<path d="M6 10h2M7 11h1" stroke="#f6d09d" stroke-width="1"/>'+
    '<path d="M9 13h6M8 17l-2 3M15 17l2 3" stroke="#9c7589" stroke-width="1" fill="none"/>'+
    '<path d="M10 19h3M15 20h2" stroke="#bb9b78" stroke-width="1"/>'
});
const ENEMY=Object.freeze({
  charognard:'<path d="M3 15l2-4 2 2M6 8l2 4M11 11l2-3" stroke="#bd9b81" stroke-width="1" fill="none"/>'+
    '<path d="M5 16h4M10 17h3M14 16h2" stroke="#4a3940" stroke-width="2"/>'+
    '<path d="M16 12h3M19 13h2" stroke="#d9c09b" stroke-width="1"/>'+
    '<path d="M19 13h1" stroke="#ed6955" stroke-width="1"/>',
  guardian:'<path d="M4 6h5M15 6h5M4 9h4M16 9h4" stroke="#c1b39f" stroke-width="1"/>'+
    '<path d="M4 12v5M19 12v5M7 18h10" stroke="#71878c" stroke-width="2" fill="none"/>'+
    '<path d="M9 11h7M10 12h6" stroke="#141b25" stroke-width="1"/>'+
    '<path d="M11 12h2M15 12h1" stroke="#ed6453" stroke-width="1"/>'+
    '<path d="M12 16h2M7 21h4M15 21h3" stroke="#d8b28c" stroke-width="1"/>',
  rift_larva:'<path d="M3 11h4M9 10h4M15 11h4" stroke="#d8b7b0" stroke-width="1"/>'+
    '<path d="M4 13h3M10 12h3M16 13h3" stroke="#715963" stroke-width="2"/>'+
    '<path d="M6 19h2M12 19h2M18 19h2" stroke="#191e2b" stroke-width="1"/>'+
    '<path d="M19 13h1M21 14h1" stroke="#ff8269" stroke-width="1"/>'
});
const OBJECT=Object.freeze({
  loot:'<path d="M5 9h14M4 11h16M5 19h14" stroke="#ffdc8d" stroke-width="1"/>'+
    '<path d="M4 13v6M20 13v6" stroke="#9a5b25" stroke-width="2"/>'+
    '<path d="M10 12h4v5h-4Z" fill="#d49a42"/>'+
    '<path d="M11 13h2v2h-2Z" fill="#141b23"/>'+
    '<path d="M7 10h2M16 10h2" stroke="#fff0b3" stroke-width="1"/>',
  chest_open:'<path d="M5 5h14M4 10h16M5 20h14" stroke="#e9ba73" stroke-width="1"/>'+
    '<path d="M8 13h8M7 16h10" stroke="#0c1620" stroke-width="2"/>'+
    '<path d="M7 19h3M15 19h3" stroke="#c58a48" stroke-width="1"/>',
  door_closed:'<path d="M4 8h16M5 21h14" stroke="#b4b4a4" stroke-width="1"/>'+
    '<path d="M8 9v12M12 9v12M16 9v12" stroke="#d3a86b" stroke-width="1" opacity=".73"/>'+
    '<path d="M6 13h12M6 19h12" stroke="#45372f" stroke-width="2"/>'+
    '<path d="M15 15h2v2h-2Z" fill="#e4c49a"/>',
  door_open:'<path d="M3 9v13M21 9v13M6 5h12" stroke="#cfccaf" stroke-width="1"/>'+
    '<path d="M5 12v9M19 12v9" stroke="#2e3c42" stroke-width="2"/>'+
    '<path d="M9 21h6" stroke="#7b9188" stroke-width="1"/>',
  exit:'<path d="M5 9v12M19 9v12M7 6l5-3 5 3" stroke="#6dcfc6" stroke-width="2" fill="none"/>'+
    '<path d="M9 11h6v9H9Z" fill="#1d7c83" opacity=".38"/>'+
    '<path d="M12 8l2 3-2 3-2-3Z" fill="#dcfff2"/>'+
    '<path d="M12 16v5M10 19h4" stroke="#a1fff0" stroke-width="1"/>'+
    '<path d="M5 22h14" stroke="#b7eade" stroke-width="1"/>',
  hazard:'<path d="M12 3l2 5-3 3 3 4-3 6" stroke="#0e2b1b" stroke-width="3" fill="none"/>'+
    '<path d="M12 4l1 5-2 3 2 4-1 4" stroke="#cbff72" stroke-width="1" fill="none"/>'+
    '<path d="M6 8l2 4-3 5M18 7l-2 4 3 4" stroke="#77be42" stroke-width="1" fill="none"/>',
  trap_revealed:'<path d="M6 17l3-7 3 7M13 17l3-7 3 7" stroke="#e0ac6c" stroke-width="1" fill="none"/>'+
    '<path d="M4 19h16" stroke="#6b4935" stroke-width="2"/>',
  trap_disabled:'<path d="M5 18h14M8 12l8 8" stroke="#a7b4a0" stroke-width="1" fill="none"/>',
  trap_triggered:'<path d="M5 11l4 7M11 10l4 8M17 11l3 7" stroke="#b88b78" stroke-width="1" fill="none"/>'
});
export const ART107A_ENHANCED=Object.freeze({
  hero:Object.freeze(['down','up','left','right']),
  enemy:Object.freeze(Object.keys(ENEMY)),
  interactive:Object.freeze(Object.keys(OBJECT)),
  floorVariants:6,
  wallMasks:16,
  wallVariants:3
});
export function floorRelief107A(variant){
  if(!Number.isInteger(variant)||variant<0||variant>=FLOOR.length)
    throw new RangeError('ART-107A invalid floor variant');
  return '<g data-art="art107a-floor-relief">'+FLOOR[variant]+'</g>';
}
export function wallRelief107A(mask,variant){
  if(!Number.isInteger(mask)||mask<0||mask>15||
    !Number.isInteger(variant)||variant<0||variant>=WALL_PATINA.length)
    throw new RangeError('ART-107A invalid known wall mask/variant');
  // The isolated pillar (mask 15) keeps its original identity and shadow.
  if(mask===15)return '<g data-art="art107a-freestanding-pillar">'+
    '<path d="M5 6h14M7 10h10M7 20h10" stroke="#d0cbb1" stroke-width="1" opacity=".65"/>'+
    '<path d="M7 12v7M17 12v7" stroke="#17242b" stroke-width="1"/>'+
    WALL_PATINA[variant]+'</g>';
  const knownEdges=(mask&1?'<path d="M3 2h18" stroke="#d1cbb1" stroke-width="1" opacity=".66"/>':'')+
    (mask&2?'<path d="M22 6v15" stroke="#c0c3ae" stroke-width="1" opacity=".6"/>':'')+
    (mask&4?'<path d="M4 21h16" stroke="#8ca59d" stroke-width="1" opacity=".54"/>':'')+
    (mask&8?'<path d="M2 6v15" stroke="#aebeb1" stroke-width="1" opacity=".6"/>':'');
  return '<g data-art="art107a-wall-relief">'+
    '<path d="M2 6h20v2H2Z" fill="#22323a" opacity=".8"/>'+
    '<path d="M3 3h18M4 5h16" stroke="#c1c3ae" stroke-width="1" opacity=".55"/>'+
    '<path d="M2 11h20M12 14v8" stroke="#06131b" stroke-width="2" opacity=".85"/>'+
    '<path d="M3 14h7M14 14h7" stroke="#8b9e96" stroke-width="1" opacity=".55"/>'+
    '<path d="M3 22h7M14 22h7" stroke="#10212a" stroke-width="1"/>'+
    WALL_PATINA[variant]+knownEdges+'</g>';
}
function append24(source,mark,layer){
  if(typeof source!=='string'||!source.startsWith('<svg ')||
    !source.endsWith('</svg>')||!source.includes('viewBox="0 0 24 24"'))
    throw new TypeError('ART-107A expects a complete 24x24 SVG');
  return source.slice(0,-6)+'<g data-art="art107a-'+mark+'">'+layer+'</g></svg>';
}
export function polishHero107A(facing,source){
  const layer=facing==='right'?'<g transform="translate(24 0) scale(-1 1)">'+HERO.left+'</g>':HERO[facing];
  if(!layer)throw new RangeError('ART-107A unknown hero facing: '+facing);
  return append24(source,'hero-'+facing,layer);
}
export function polishEnemy107A(kind,source){
  if(!ENEMY[kind])throw new RangeError('ART-107A unknown enemy kind: '+kind);
  return append24(source,'enemy-'+kind,ENEMY[kind]);
}
export function polishInteractive107A(kind,source){
  const layer=OBJECT[kind];
  // Do not alter unlisted entities or unrevealed trap clues.
  return layer?append24(source,'object-'+kind,layer):source;
}
