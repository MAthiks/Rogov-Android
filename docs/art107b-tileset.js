// ART-107B — 24x24 gothic Nhal tileset: original, deterministic SVG finishing layers.
// Pure presentational fragments. No RNG, DOM, entity IDs, map queries or hidden knowledge.
// Historical six base floor sprites remain valid; B1 adds two surface variants.

export const ART107B_FLOOR_NAMES=Object.freeze([
  "regular-slate","worn-slate","cracked-slate","moss-joints",
  "repaired-masonry","dust-and-gravel","faded-gothic","deep-slate"
]);
export const ART107B_WALL_FINISHES=Object.freeze([
  "dressed-stone","fractured-stone","moss-stone"
]);
const FLOOR_SURFACES=Object.freeze([
  // F01: quiet regular stone. Chiseled edge, low-frequency detail.
  '<path d="M2 2h8v2H2ZM16 12h6v2h-6Z" fill="#6a7b80" opacity=".22"/>'+
  '<path d="M3 2h7M16 12h6M2 17h5" stroke="#a2a9a1" stroke-width="1" opacity=".48"/>'+
  '<path d="M3 8h7M16 19h5" stroke="#101c25" stroke-width="1" opacity=".72"/>',
  // F02: fractured edges and worn limestone, no magical cracks.
  '<path d="M2 2h8M16 12h6" stroke="#87948d" stroke-width="1" opacity=".4"/>'+
  '<path d="M3 5l2 2-1 2M16 17l3-2 2 1" stroke="#101d25" stroke-width="1" fill="none"/>'+
  '<path d="M5 6h2M18 16h2" stroke="#788784" stroke-width="1" opacity=".63"/>',
  // F03: hairline splitting held within the known paving, never an interactable rift.
  '<path d="M1 2h9M16 12h6" stroke="#778b90" stroke-width="1" opacity=".52"/>'+
  '<path d="M4 12l3 2-1 3 2 2M20 3l-2 2 1 2" stroke="#101d25" stroke-width="1" fill="none" opacity=".8"/>'+
  '<path d="M4 13l2 1M18 5h2" stroke="#778487" stroke-width="1" opacity=".62"/>',
  // F04: muted moss is local to mortar; never a luminous hazard.
  '<path d="M2 2h8M16 12h6" stroke="#809388" stroke-width="1" opacity=".4"/>'+
  '<path d="M1 9h5M7 9h3M16 20h5" stroke="#486653" stroke-width="2" opacity=".7"/>'+
  '<path d="M2 8h2M7 10h2M19 19h2" stroke="#7b9770" stroke-width="1" opacity=".65"/>',
  // F05: patched slab, hand-set replacement and recessed grout.
  '<path d="M3 3h6v5H3ZM16 13h5v4h-5Z" fill="#53616a" opacity=".42"/>'+
  '<path d="M3 3h6M16 13h5M3 8h6M16 17h5" stroke="#9da59a" stroke-width="1" opacity=".5"/>'+
  '<path d="M2 9h9M15 18h7" stroke="#111e27" stroke-width="1"/>',
  // F06: short mineral flecks/pebbles that cannot be mistaken for loot.
  '<path d="M2 2h8M16 12h6" stroke="#9e9989" stroke-width="1" opacity=".35"/>'+
  '<path d="M4 17h2v1H4ZM19 4h2v1h-2Z" fill="#74736a" opacity=".55"/>'+
  '<path d="M3 19h4M18 6h4" stroke="#0f1c24" stroke-width="1" opacity=".65"/>',
  // F07: ancient ornamental repair, non-glowing and non-interactive.
  '<path d="M2 2h8M16 12h6" stroke="#88959a" stroke-width="1" opacity=".48"/>'+
  '<path d="M16 14l2 2 2-2M18 16v2M4 5h3M5 4v3" stroke="#707d7f" stroke-width="1" fill="none" opacity=".55"/>'+
  '<path d="M3 9h7M15 20h7" stroke="#0e1b24" stroke-width="1" opacity=".62"/>',
  // F08: almost black low-level quarry stone, no fake entity silhouettes.
  '<path d="M2 2h9v7H2ZM15 11h8v9h-8Z" fill="#111e29" opacity=".48"/>'+
  '<path d="M2 2h9M16 12h6M3 14h4" stroke="#55666c" stroke-width="1" opacity=".55"/>'+
  '<path d="M1 9h11M15 20h8" stroke="#071219" stroke-width="1" opacity=".75"/>'
]);
export function floorFinish107B(index){
  if(!Number.isInteger(index)||index<0||index>=FLOOR_SURFACES.length)
    throw new RangeError("ART-107B: unknown floor index");
  return '<g data-decoration="art107b-floor" data-material="'+ART107B_FLOOR_NAMES[index]+'">'+
    FLOOR_SURFACES[index]+'</g>';
}

const WALL_PATINA=Object.freeze([
  '<path d="M4 17h5M15 18h4" stroke="#a2aea4" stroke-width="1" opacity=".4"/>',
  '<path d="M5 15l2 2-1 4M18 16l-2 3" stroke="#17272f" stroke-width="1" fill="none"/>'+
    '<path d="M4 20h3M16 19h4" stroke="#899790" stroke-width="1" opacity=".52"/>',
  '<path d="M4 18h4M15 20h5" stroke="#3f624d" stroke-width="2" opacity=".65"/>'+
    '<path d="M4 17h2M17 19h2" stroke="#91a079" stroke-width="1" opacity=".5"/>'
]);
export function wallFinish107B(mask,variant){
  if(!Number.isInteger(mask)||mask<0||mask>15||
    !Number.isInteger(variant)||variant<0||variant>=WALL_PATINA.length)
    throw new RangeError("ART-107B: invalid known wall mask/variant");
  // Bit 1=N, 2=E, 4=S, 8=W. These edges were filtered by wallEdgeMask.
  if(mask===15){
    return '<g data-decoration="art107b-wall" data-material="'+ART107B_WALL_FINISHES[variant]+'" data-pillar="isolated">'+
      '<path d="M6 4h12M4 7h16M5 11h14" stroke="#d3d0b8" stroke-width="1" opacity=".68"/>'+
      '<path d="M7 12v8M17 12v8" stroke="#1b2a32" stroke-width="1"/>'+
      '<path d="M4 21h16" stroke="#a5afa0" stroke-width="1" opacity=".45"/>'+
      WALL_PATINA[variant]+'</g>';
  }
  const exposed=(mask&1?'<path d="M3 2h18" stroke="#d5d4bf" stroke-width="1" opacity=".78"/>':'')+
    (mask&2?'<path d="M22 4v17" stroke="#b4c4bb" stroke-width="1" opacity=".65"/>':'')+
    (mask&4?'<path d="M3 21h18" stroke="#91a59d" stroke-width="1" opacity=".56"/>':'')+
    (mask&8?'<path d="M2 4v17" stroke="#b1bcb2" stroke-width="1" opacity=".66"/>':'');
  return '<g data-decoration="art107b-wall" data-material="'+ART107B_WALL_FINISHES[variant]+'" data-known-mask="'+mask+'">'+
    // Three planes: a bright stone cap, black recess under the cap, heavy face.
    '<path data-detail="art107b-carved-cap" d="M2 2h20v3H2Z" fill="#9ba8a2" opacity=".47"/>'+
    '<path d="M3 2h18M3 5h18" stroke="#c5c7b5" stroke-width="1" opacity=".56"/>'+
    '<path data-detail="art107b-deep-mortar" d="M1 10h22v3H1Z" fill="#07141c" opacity=".78"/>'+
    '<path d="M3 14h8M14 14h7M12 14v9" stroke="#111e27" stroke-width="2" opacity=".83"/>'+
    '<path d="M3 15v6M14 15v6" stroke="#7b8d88" stroke-width="1" opacity=".48"/>'+
    '<path d="M3 22h8M14 22h7" stroke="#394d53" stroke-width="1"/>'+
    WALL_PATINA[variant]+exposed+'</g>';
}

// B2 begins only on existing object categories. Never change their identity,
// action handlers, collision, discovery state or saved item data.
const STRUCTURE=Object.freeze({
  door_open:
    '<path d="M3 8v13M21 8v13M7 3h10" stroke="#c4c8b9" stroke-width="1" fill="none"/>'+
    '<path d="M4 12h2M18 12h2M4 18h2M18 18h2" stroke="#4e6668" stroke-width="1"/>'+
    '<path d="M7 22h10" stroke="#738985" stroke-width="1"/>',
  door_closed:
    '<path d="M3 8v13M21 8v13M7 3h10" stroke="#c1c8b6" stroke-width="1" fill="none"/>'+
    '<path d="M8 9v12M12 9v12M16 9v12" stroke="#b18c62" stroke-width="1"/>'+
    '<path d="M7 12h10M7 20h10" stroke="#d1b18a" stroke-width="1"/>'+
    '<path d="M15 15h2M16 16v2" stroke="#f0d4aa" stroke-width="1"/>',
  loot:
    '<path d="M4 11h16M4 20h16M5 8h14" stroke="#f2c877" stroke-width="1"/>'+
    '<path d="M6 11v9M18 11v9" stroke="#c38f4d" stroke-width="2"/>'+
    '<path d="M10 13h4M11 14h2" stroke="#1a1e20" stroke-width="1"/>',
  chest_open:
    '<path d="M4 7h16M5 13h14M5 21h14" stroke="#d7b47a" stroke-width="1"/>'+
    '<path d="M7 15h10M8 16h8" stroke="#07121a" stroke-width="1"/>'+
    '<path d="M5 19v2M19 19v2" stroke="#967248" stroke-width="1"/>',
  exit:
    '<path d="M5 7l7-4 7 4M4 10v12M20 10v12" stroke="#67b8b9" stroke-width="1" fill="none"/>'+
    '<path d="M12 5l3 3-3 3-3-3Z" fill="#adf7e8" opacity=".82"/>'+
    '<path d="M12 13v7M10 18h4M7 22h10" stroke="#c1fff2" stroke-width="1"/>',
  hazard:
    '<path d="M12 2l2 5-3 4 2 4-3 7" stroke="#213e28" stroke-width="2" fill="none"/>'+
    '<path d="M12 5l1 4-2 3 2 4-1 4" stroke="#d0ff7c" stroke-width="1" fill="none"/>'+
    '<path d="M5 11l3 2M18 9l-2 4" stroke="#74bd47" stroke-width="1"/>',
  trap_revealed:
    '<path d="M5 20h14M7 16l2-5 3 5M13 16l2-5 3 5" stroke="#dca97d" stroke-width="1" fill="none"/>',
  trap_disabled:
    '<path d="M5 18h14M7 12l11 8" stroke="#91a69e" stroke-width="1" fill="none"/>',
  trap_triggered:
    '<path d="M5 11l3 7M11 10l3 8M17 11l3 7" stroke="#c39478" stroke-width="1" fill="none"/>'
});
export const ART107B_STRUCTURE_IDS=Object.freeze(Object.keys(STRUCTURE));
export function finishStructure107B(kind,source){
  if(!Object.prototype.hasOwnProperty.call(STRUCTURE,kind))return source;
  if(typeof source!=="string"||!source.startsWith("<svg ")||
    !source.includes('viewBox="0 0 24 24"')||!source.endsWith("</svg>"))
    throw new TypeError("ART-107B: expected complete 24x24 SVG");
  return source.slice(0,-6)+'<g data-decoration="art107b-structure" data-kind="'+kind+'">'+
    STRUCTURE[kind]+'</g></svg>';
}
export function sconceFinish107B(){
  // Decorative flame only. tiles.js checks visible before adding this sprite.
  return '<g data-decoration="art107b-iron-sconce">'+
    '<path d="M9 13h6v2H9ZM8 15h8" stroke="#d5af75" stroke-width="1"/>'+
    '<path d="M11 4h2M12 6v5" stroke="#fff3bf" stroke-width="1"/>'+
    '<path d="M9 18v4M15 18v4" stroke="#303d42" stroke-width="1"/>'+
    '</g>';
}
