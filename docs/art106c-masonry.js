// ART-106C — Hand-placed 24x24 masonry layers for real terrain cells.
// SVG fragments are deterministic, transparent and never use map state,
// visibility knowledge, RNG or browser APIs. All colors are dark stone.
// These shapes depict only mundane masonry and age, never traps or loot.
export const ART106C_FLOOR_DETAILS=Object.freeze([
  // Chipped rectangular slate; tiny chipped corners, quiet center.
  '<g data-detail="art106c-worn-slate">'+
    '<path d="M1 1h10v2H2v5H1ZM16 11h6v2h-5v5h-1Z" fill="#708087" opacity=".32"/>'+
    '<path d="M2 7h7M3 18h3M16 19h5" stroke="#101a22" stroke-width="1"/>'+
    '<path d="M3 4h2M18 14h2" stroke="#83908a" stroke-width="1" opacity=".4"/>'+
    '<path d="M9 2v2M18 17l2 1M3 16v2" stroke="#111c24" stroke-width="1"/>'+
    '</g>',
  // Faded row of hand-hewn repair stones.
  '<g data-detail="art106c-repaired-blocks">'+
    '<path d="M2 3h7v4H2ZM16 12h6v5h-6Z" fill="#43535b" opacity=".34"/>'+
    '<path d="M2 3h7M16 12h6M1 15h5" stroke="#83938d" stroke-width="1" opacity=".38"/>'+
    '<path d="M3 8h6M14 18h8" stroke="#121c22" stroke-width="1"/>'+
    '<path d="M17 14h3M6 16h1M18 3h3" stroke="#667777" stroke-width="1" opacity=".6"/>'+
    '</g>',
  // Stable rock split, not a magical crack or revealed secret.
  '<g data-detail="art106c-natural-slate-crack">'+
    '<path d="M1 2h10v3H1ZM15 11h7v5h-7Z" fill="#54646c" opacity=".22"/>'+
    '<path d="M2 13l3 2-1 2 3 2M19 3l-2 3 1 1" stroke="#0a141b" stroke-width="1" fill="none" opacity=".8"/>'+
    '<path d="M3 12l3 2M18 4l-1 2" stroke="#687779" stroke-width="1" fill="none" opacity=".46"/>'+
    '<path d="M3 3h4M16 12h5" stroke="#85958e" stroke-width="1" opacity=".3"/>'+
    '</g>',
  // Muted moss pressed between blocks; entirely non-interactive.
  '<g data-detail="art106c-mossy-joints">'+
    '<path d="M2 3h9M15 12h7" stroke="#68766e" stroke-width="1" opacity=".34"/>'+
    '<path d="M0 9h4M6 9h4M9 20h5M20 9h3" stroke="#365747" stroke-width="2" opacity=".72"/>'+
    '<path d="M1 8h2M8 10h1M13 20h2M19 8h2" stroke="#70865e" stroke-width="1" opacity=".55"/>'+
    '<path d="M4 16h2M17 18h3" stroke="#192c26" stroke-width="1"/>'+
    '</g>',
  // Erased shale bands and powdered mineral in the same paving geometry.
  '<g data-detail="art106c-slate-strata">'+
    '<path d="M2 2h8v2H2ZM16 11h6v2h-6Z" fill="#607078" opacity=".3"/>'+
    '<path d="M1 6h8M15 16h6M2 18h5" stroke="#85918d" stroke-width="1" opacity=".3"/>'+
    '<path d="M4 6h3M17 16h2M18 3h1" stroke="#1e2b31" stroke-width="1"/>'+
    '<path d="M7 14v2M4 3h1M20 20h2" stroke="#52636b" stroke-width="1"/>'+
    '</g>',
  // A few loose pebbles remain unobtrusive behind entities.
  '<g data-detail="art106c-broken-slate">'+
    '<path d="M1 2h10M15 11h7" stroke="#74847e" stroke-width="1" opacity=".35"/>'+
    '<path d="M2 17h2v1H2ZM17 4h3v2h-3ZM21 17h2v1h-2Z" fill="#536069"/>'+
    '<path d="M2 18h3M17 6h4M21 18h2" stroke="#111a21" stroke-width="1"/>'+
    '<path d="M4 3l2 1M18 15l-1 2" stroke="#1a2730" stroke-width="1"/>'+
    '</g>'
]);
const WALL_FACE_DETAILS=Object.freeze([
  '<path d="M4 17h4M17 18h3M4 21h3" stroke="#89958a" stroke-width="1" opacity=".55"/>'+
    '<path d="M7 16l1 3M19 14l-2 2" stroke="#18262c" stroke-width="1" fill="none"/>',
  '<path d="M4 16h2M16 20h5" stroke="#90a198" stroke-width="1" opacity=".5"/>'+
    '<path d="M7 19l2 2M18 14l-1 3" stroke="#182830" stroke-width="1" fill="none"/>',
  '<path d="M4 20h4M16 17h2" stroke="#71877e" stroke-width="1" opacity=".6"/>'+
    '<path d="M7 14v3M20 19l-2 2" stroke="#18292f" stroke-width="1" fill="none"/>'
]);
export function floorMasonry106C(variant){
  if(!Number.isInteger(variant)||variant<0||variant>=ART106C_FLOOR_DETAILS.length)
    throw new RangeError("Invalid floor masonry variant");
  return '<g data-decoration="art106c-floor-masonry">'+
    // New, shallow chipped bevels are stable and do not add floor entities.
    '<path d="M1 1h10M15 11h8M1 12h7" stroke="#9ba59a" stroke-width="1" opacity=".28"/>'+
    '<path d="M1 8h10M14 19h8M2 19h5" stroke="#09131b" stroke-width="1" opacity=".67"/>'+
    ART106C_FLOOR_DETAILS[variant]+'</g>';
}
export function wallMasonry106C(mask,variant){
  if(!Number.isInteger(mask)||mask<0||mask>15||
    !Number.isInteger(variant)||variant<0||variant>2)
    throw new RangeError("Invalid known-edge masonry");
  // Directional highlights depend EXCLUSIVELY on the already known wall mask.
  // An unknown neighboring tile can never change these pixel positions.
  const exposed=(mask&1?
    '<path d="M2 1h20v2H2Z" fill="#c2c5ae" opacity=".48"/>':'')+
    (mask&2?'<path d="M21 3h2v18h-2Z" fill="#a7a994" opacity=".45"/>':'')+
    (mask&4?'<path d="M2 21h20v2H2Z" fill="#bec4af" opacity=".36"/>':'')+
    (mask&8?'<path d="M1 3h2v18H1Z" fill="#9ea99c" opacity=".5"/>':'');
  if(mask===15){
    // Only four KNOWN, passable adjacent cells yield a freestanding column.
    return '<g data-decoration="art106c-wall-masonry" data-feature="art106c-isolated-pillar">'+
      '<rect x="3" y="20" width="18" height="3" fill="#121d26"/>'+
      '<rect x="5" y="10" width="14" height="11" fill="#344651"/>'+
      '<path d="M5 10h3v11H5ZM16 10h3v11h-3Z" fill="#586a6c"/>'+
      '<path d="M9 11h2v8H9ZM13 11h2v9h-2Z" fill="#273943"/>'+
      '<path d="M6 19h12v2H6Z" fill="#1a2b32"/>'+
      '<rect x="2" y="5" width="20" height="8" fill="#31414b"/>'+
      '<path d="M2 5h20v2H2ZM4 8h16v3H4Z" fill="#77888a"/>'+
      '<path d="M4 8h16v1H4Z" fill="#b3b9a6"/>'+
      '<path d="M7 1h10v3H7ZM4 4h16v2H4Z" fill="#465963"/>'+
      '<path d="M7 1h10M4 4h16" stroke="#c4c3ad" stroke-width="1"/>'+
      '<path d="M4 13h16M6 20h12" stroke="#101b23" stroke-width="1"/>'+
      '<path d="M9 8h6v2H9Z" fill="#617277"/>'+
      '<path d="M11 8h2v2h-2Z" fill="#a0a699"/>'+
      '<path d="M4 22h16" stroke="#687a77" stroke-width="1"/>'+
      '</g>';
  }
  return '<g data-decoration="art106c-wall-masonry">'+
    // Massive stone overhang, separate illuminated cap from dark face.
    '<path d="M2 3h20v3H2Z" fill="#687a7d" opacity=".52"/>'+
    '<path d="M3 3h18v1H3Z" fill="#c0c2b1" opacity=".5"/>'+
    '<path d="M3 7h18v1H3Z" fill="#2b3a42" opacity=".87"/>'+
    '<path d="M1 10h22v3H1Z" fill="#111d25" opacity=".86"/>'+
    '<path d="M2 13h8v8H2ZM14 13h8v8h-8Z" fill="#3c5055" opacity=".3"/>'+
    '<path d="M2 13h9M14 13h8M3 15v7M15 15v7" stroke="#9ca99d" stroke-width="1" opacity=".4"/>'+
    '<path d="M11 14v9M12 14v9" stroke="#0b1721" stroke-width="1"/>'+
    '<path d="M3 22h7M14 22h7" stroke="#15242c" stroke-width="1"/>'+
    WALL_FACE_DETAILS[variant]+exposed+
    '</g>';
}
