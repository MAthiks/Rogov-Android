// ART-107B3/B4 — Static visual finishing for the real Nhal 24px atlas.
// Aesthetic only: no map/actor reads, no randomness, browser API or save fields.
// Asset IDs stay unchanged; no hidden trap or undiscovered site is revealed.

export const FLOOR_RHYTHMS_107B3=Object.freeze([
  "staggered-hewn","offset-pavement","patched-mortar","weathered-chisel"
]);
const FLOOR_GEOMETRY=Object.freeze([
  // Quiet broad joints: centre stays dark enough for a 24px actor.
  '<path d="M2 5h5M15 7h6M5 18h6" stroke="#59676a" stroke-width="1" opacity=".45"/>'+
  '<path d="M3 7h3M15 8h4M6 19h3" stroke="#0b171d" stroke-width="1" opacity=".6"/>'+
  '<path d="M1 14h2M19 22h3" stroke="#65716d" stroke-width="1" opacity=".45"/>',
  // Offset stone bands rather than repeating the same crack in every tile.
  '<path d="M1 4h7M16 3h7M2 19h7M17 18h5" stroke="#77847e" stroke-width="1" opacity=".42"/>'+
  '<path d="M2 6h7M17 5h6M2 20h7M17 20h5" stroke="#0e1920" stroke-width="1" opacity=".72"/>'+
  '<path d="M6 2v2M19 17v2" stroke="#58676a" stroke-width="1" opacity=".45"/>',
  // A restrained repaired masonry joint: no spikes, eye, or treasure shape.
  '<path d="M2 3h5M16 16h6M4 19h6" stroke="#83908a" stroke-width="1" opacity=".43"/>'+
  '<path d="M2 4h5M16 17h6M4 20h6" stroke="#121e25" stroke-width="1" opacity=".72"/>'+
  '<path d="M5 4v2M19 13v3" stroke="#3b4b50" stroke-width="1" opacity=".55"/>',
  // Weathered chisel marks kept to slab edges, not actor feet/face areas.
  '<path d="M3 2l2 2M19 6l2-2M3 17l3-2M18 21l3-2" stroke="#7d8981" stroke-width="1" fill="none" opacity=".37"/>'+
  '<path d="M5 4l1 2M19 5l-2 2M5 18l2-2M19 20l-2 2" stroke="#111d25" stroke-width="1" fill="none" opacity=".58"/>'+
  '<path d="M3 8h5M17 15h5" stroke="#60706c" stroke-width="1" opacity=".46"/>'
]);
export function floorRhythm107B3(index){
  if(!Number.isInteger(index)||index<0||index>=FLOOR_GEOMETRY.length)
    throw new RangeError("ART-107B3: floor rhythm outside atlas");
  return '<g data-art="art107b3-floor-rhythm" data-rhythm="'+FLOOR_RHYTHMS_107B3[index]+'">'+
    FLOOR_GEOMETRY[index]+'</g>';
}
// Whiten the *already visual* terrain hash: FNV's low bits alone form a
// conspicuous checkerboard on even grids. This never reads gameplay RNG.
export function floorRhythmIndex107B3(visualHash){
  if(!Number.isInteger(visualHash)||visualHash<0||visualHash>0xffffffff)
    throw new RangeError("ART-107B3: expected uint32 visual hash");
  let h=visualHash>>>0;
  h^=h>>>16;h=Math.imul(h,0x7feb352d);
  h^=h>>>15;h=Math.imul(h,0x846ca68b);
  h^=h>>>16;
  return (h>>>0)%FLOOR_GEOMETRY.length;
}

const HERO_ETCH=Object.freeze({
  down:
    '<path d="M7 7h2M15 7h2M7 9h1M16 9h1" stroke="#c8a8b2" stroke-width="1"/>'+
    '<path d="M9 11h6M9 12h2M13 12h2" stroke="#2c2731" stroke-width="1"/>'+
    '<path d="M10 12h1M14 12h1" stroke="#f3daa7" stroke-width="1"/>'+
    '<path d="M10 17h4M12 18v2" stroke="#b6a17b" stroke-width="1"/>'+
    '<path d="M7 22h3M15 22h3" stroke="#b1a08b" stroke-width="1"/>',
  up:
    '<path d="M8 6h8M7 9h3M15 9h2" stroke="#c4a4b0" stroke-width="1"/>'+
    '<path d="M9 14h6M10 16h4" stroke="#6c5965" stroke-width="1"/>'+
    '<path d="M12 17v3M7 22h3M15 22h3" stroke="#bb9d7d" stroke-width="1"/>',
  left:
    '<path d="M7 6h5M6 9h3M7 11h2" stroke="#c4a3b2" stroke-width="1"/>'+
    '<path d="M6 12h2" stroke="#ffe0ad" stroke-width="1"/>'+
    '<path d="M10 16h4M8 20h2M14 21h3" stroke="#aa917c" stroke-width="1"/>'
});
const ENEMY_ETCH=Object.freeze({
  charognard:
    '<path d="M3 12l3-4M6 16l2-2M10 14l2-1" stroke="#b19a83" stroke-width="1" fill="none"/>'+
    '<path d="M18 12h2M20 16h3" stroke="#eee0bd" stroke-width="1"/>'+
    '<path d="M18 13h1" stroke="#f1a66e" stroke-width="1"/>',
  guardian:
    '<path d="M4 8h4M16 8h4M5 11h3M16 11h3" stroke="#d0c4ab" stroke-width="1"/>'+
    '<path d="M10 11h5M10 12h5" stroke="#141c22" stroke-width="1"/>'+
    '<path d="M11 13h1M14 13h1" stroke="#f0745d" stroke-width="1"/>'+
    '<path d="M8 18h8M5 21h4M15 21h4" stroke="#9eb0ad" stroke-width="1"/>',
  rift_larva:
    '<path d="M4 10h2M9 9h3M15 10h3" stroke="#e1c7c2" stroke-width="1"/>'+
    '<path d="M6 15h2M12 14h2M18 15h2" stroke="#493943" stroke-width="1"/>'+
    '<path d="M19 12h1M21 13h1" stroke="#fb8d70" stroke-width="1"/>'
});
const SITE_DETAILS=Object.freeze({
  secret_open:'<path d="M5 4h3M16 4h3M5 20h3M16 20h3" stroke="#b4b9aa" stroke-width="1"/>'+
    '<path d="M11 8v10M13 9v8" stroke="#0b1720" stroke-width="1"/>',
  site_atelier:'<path d="M6 7h12M5 20h14" stroke="#c6a57d" stroke-width="1"/>'+
    '<path d="M8 11l4 3M13 14l3-3" stroke="#bcc8bf" stroke-width="1" fill="none"/>',
  site_echo:'<path d="M6 9l3-2 3 2 3-2 3 2M7 16l3 2 3-2 3 2" stroke="#94c6c3" stroke-width="1" fill="none" opacity=".75"/>',
  site_cache:'<path d="M5 11h14M6 19h12" stroke="#b59b79" stroke-width="1"/>'+
    '<path d="M11 13h2v2h-2Z" fill="#dac38c"/>',
  site_camp:'<path d="M7 18l5-3 5 3M8 19h8" stroke="#c89d69" stroke-width="1" fill="none"/>'+
    '<path d="M12 11v3M11 13h2" stroke="#ffd18c" stroke-width="1"/>',
  site_signal:'<path d="M12 4v4M7 9l3 2M17 9l-3 2M7 20h10" stroke="#c0b39a" stroke-width="1" fill="none"/>'+
    '<path d="M12 10h1" stroke="#b7e7d5" stroke-width="1"/>',
  site_reliquary:'<path d="M6 9h12M6 20h12" stroke="#dfc38b" stroke-width="1"/>'+
    '<path d="M10 12h4M12 11v5" stroke="#fcdfad" stroke-width="1"/>',
  site_resolved:'<path d="M4 5h16M4 20h16" stroke="#87998c" stroke-width="1" opacity=".56"/>'+
    '<path d="M8 13l3 3 5-6" stroke="#e0dcc1" stroke-width="1" fill="none"/>'
});
export const ART107B3_SITES=Object.freeze(Object.keys(SITE_DETAILS));

function wrap24(source,marker,paths){
  if(typeof source!=="string"||!source.startsWith("<svg ")||
    !source.includes('viewBox="0 0 24 24"')||!source.endsWith("</svg>"))
    throw new TypeError("ART-107B3/B4: original 24px SVG required");
  return source.slice(0,-6)+'<g data-art="'+marker+'">'+paths+'</g></svg>';
}
export function finishHero107B4(facing,source){
  const layer=facing==="right"
    ?'<g transform="translate(24 0) scale(-1 1)">'+HERO_ETCH.left+'</g>'
    :HERO_ETCH[facing];
  if(!layer)throw new RangeError("ART-107B4: unknown Sprite C direction");
  return wrap24(source,"art107b4-hero-"+facing,layer);
}
export function finishEnemy107B4(kind,source){
  const layer=ENEMY_ETCH[kind];
  if(!layer)throw new RangeError("ART-107B4: unknown enemy");
  return wrap24(source,"art107b4-enemy-"+kind,layer);
}
export function finishSite107B3(kind,source){
  // In particular: trap_clue is intentionally untouched by this pass.
  const layer=SITE_DETAILS[kind];
  return layer?wrap24(source,"art107b3-site-"+kind,layer):source;
}
