import {finishInteractive106D} from "./art106d-finishes.js";
import {polishInteractive107A} from "./art107a-finishes.js";
// ART-091C — original 24 × 24 Sprite C assets for Nhal interactions.
// Pure presentation; no randomness, browser APIs, remote images or game state.
const svg=parts=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" shape-rendering="crispEdges">'+parts+"</svg>";
const URI="data:image/svg+xml;charset=UTF-8,";
const stone="#78817e",rim="#a7aca0",dark="#17242c",wood="#504237",
  woodLight="#88705b",iron="#b7aa89",ivory="#e4ddc6",amber="#e0bc80",
  teal="#91d1bd",moss="#526b5a";

// Passable doorway: visibly EMPTY black arch with two stone jambs.
// Closed doorway: OPAQUE timber face with crossbar. No visual state guesswork.
const door_open=svg(
  '<g data-feature="open-void">'+
  '<path d="M2 23V7l5-5h10l5 5v16" fill="none" stroke="'+rim+'" stroke-width="3"/>'+
  '<path d="M6 23V9l3-3h6l3 3v14Z" fill="#09121b"/>'+
  '<rect x="2" y="8" width="3" height="15" fill="'+stone+'"/>'+
  '<rect x="19" y="8" width="3" height="15" fill="'+stone+'"/>'+
  '<path d="M6 21h12M9 4h6" fill="none" stroke="#3b5256" stroke-width="1"/>'+
  '<path data-detail="arch-keystone" d="M9 2h6v3H9Z" fill="#c0c8bc"/>'+
  '<path d="M2 8h4M18 8h4M2 14h3M19 14h3" stroke="#3f5258" stroke-width="1"/>'+
  // Recessed joints and a walkable threshold: never draw a timber panel.
  '<path data-detail="door-ribbed-voussoirs" d="M2 7h5M17 7h5M3 12h3M18 12h3M2 17h4M18 17h4M7 3l2 3M17 3l-2 3" fill="none" stroke="#48595b" stroke-width="1"/>'+
  '<path data-detail="ui100-open-jamb-depth" d="M3 9v11M20 9v11M7 21h10" stroke="#b6b8a6" stroke-width="1" fill="none"/>'+
  '<path data-detail="door-recessed-threshold" d="M6 21h12M7 23h10" fill="none" stroke="#77817e" stroke-width="1"/>'+
  '<path d="M1 23h22" fill="none" stroke="'+rim+'" stroke-width="2"/>'+
  '</g>'
);
const door_closed=svg(
  '<g data-feature="opaque-timber">'+
  '<path d="M2 23V7l5-5h10l5 5v16Z" fill="'+stone+'" stroke="'+rim+'" stroke-width="1"/>'+
  '<path d="M6 22V9l3-3h6l3 3v13Z" fill="'+wood+'"/>'+
  '<rect x="8" y="8" width="2" height="14" fill="'+woodLight+'"/>'+
  '<rect x="14" y="8" width="2" height="14" fill="'+woodLight+'"/>'+
  '<rect x="6" y="13" width="12" height="2" fill="#232e32"/>'+
  '<rect x="6" y="19" width="12" height="2" fill="'+iron+'"/>'+
  '<rect x="15" y="15" width="2" height="3" fill="'+amber+'"/>'+
  '<rect data-detail="opaque-door-lock" x="13" y="14" width="4" height="5" fill="#322c29"/>'+
  '<rect x="15" y="15" width="1" height="2" fill="'+amber+'"/>'+
  '<path d="M7 10h10M8 17h3M17 17h1" stroke="#b19a78" stroke-width="1"/>'+
  // Heavy opaque door: visible straps, rivets and a separate pull ring.
  '<path data-detail="door-iron-straps" d="M7 10h10M7 12h10M7 20h10" stroke="#9c917b" stroke-width="1"/>'+
  '<path d="M8 11h1M15 11h1M8 20h1M15 20h1" stroke="#e3caa0" stroke-width="1"/>'+
  '<path data-detail="ui100-closed-plank-depth" d="M8 8v13M16 8v13M7 22h10" stroke="#ccb08a" stroke-width="1" fill="none"/>'+
  '<circle data-detail="door-ring-pull" cx="12" cy="15" r="2" fill="none" stroke="#d0b48b" stroke-width="1"/>'+
  '<path d="M2 23h20" stroke="'+rim+'" stroke-width="2"/>'+
  '</g>'
);
// Chest states differ structurally, not only by glow.
const loot=svg(
  '<g data-feature="sealed-lid">'+
  '<rect x="3" y="12" width="18" height="10" fill="#332d2c" stroke="'+iron+'" stroke-width="1"/>'+
  '<path d="M3 12V8l4-4h10l4 4v4Z" fill="'+wood+'" stroke="'+amber+'" stroke-width="2"/>'+
  '<path d="M6 7h12M7 11h10" stroke="'+woodLight+'" stroke-width="1"/>'+
  '<rect x="5" y="13" width="2" height="8" fill="'+iron+'"/>'+
  '<rect x="17" y="13" width="2" height="8" fill="'+iron+'"/>'+
  '<rect x="10" y="11" width="4" height="7" fill="'+amber+'"/>'+
  '<rect x="11" y="13" width="2" height="3" fill="'+dark+'"/>'+
  // Gold latch and two wide clasps read as a sealed treasure at 20 CSS px.
  '<path data-detail="chest-sealed-bands" d="M4 10h4v2H4ZM16 10h4v2h-4ZM3 17h7M14 17h7" fill="#d9b983" stroke="#b69b70" stroke-width="1"/>'+
  // The crown and corner caps clearly signal an unopened container.
  '<path data-detail="chest-gold-corners" d="M3 12h4v2H5v4H3ZM17 12h4v6h-2v-4h-2ZM4 20h4M16 20h4" fill="#ce9f55" stroke="#60432c" stroke-width=".5"/>'+
  '<path data-detail="ui100-closed-chest-bevel" d="M4 12h16M5 20h14" stroke="#f0d3a1" stroke-width="1" fill="none"/>'+
  '<rect data-detail="chest-lock-glint" x="11" y="15" width="2" height="2" fill="#f6d894"/>'+
  '</g>'
);
const chest_open=svg(
  '<g data-feature="raised-lid">'+
  '<path d="M3 11l3-8 12-1 3 8-3 2H5Z" fill="'+woodLight+'" stroke="'+iron+'" stroke-width="1"/>'+
  '<path d="M6 5h11M5 8h15" stroke="'+wood+'" stroke-width="2"/>'+
  '<rect x="3" y="13" width="18" height="9" fill="'+wood+'" stroke="'+iron+'" stroke-width="1"/>'+
  '<path d="M5 14h14v4H5Z" fill="#101820"/>'+
  '<rect x="6" y="19" width="12" height="2" fill="#6d5540"/>'+
  '<rect x="5" y="13" width="2" height="9" fill="'+iron+'"/>'+
  '<rect x="17" y="13" width="2" height="9" fill="'+iron+'"/>'+
  '<rect x="11" y="17" width="2" height="3" fill="'+amber+'"/>'+
  '<path data-detail="chest-empty-cavity" d="M6 14h12v3H6Z" fill="#090f18"/>'+
  // Keep the cavity visibly empty, with the lid raised above the hinges.
  '<path data-detail="chest-open-hinges" d="M5 12h3M16 12h3" stroke="#d7b580" stroke-width="2"/>'+
  '<path data-detail="ui100-open-chest-rim" d="M6 13h12M5 19h2M17 19h2" stroke="#e0c399" stroke-width="1" fill="none"/>'+
  '<path data-detail="chest-void-recess" d="M7 15h10M8 16h8" stroke="#050b12" stroke-width="1"/>'+
  '<path d="M5 4l13-1M5 7h14" stroke="#c8b08d" stroke-width="1"/>'+
  '</g>'
);
// The clue is a floor scratch, not an armed device; identified has clearly
// exposed spikes; disabled has physically removed/bent spikes and a crossed bar.
const trap_clue=svg(
  '<g data-feature="subtle-floor-scratches">'+
  '<path d="M3 17l5-4 3 1 5-6M11 19l4-3 5 1" fill="none" stroke="#9b8c70" stroke-width="1"/>'+
  '<path d="M7 8h5M15 11h4M5 21h4" stroke="#6b6c5c" stroke-width="1"/>'+
  // A subtle dust shift only: never draw spikes or a trap kind while hidden.
  '<path data-detail="ambiguous-stone-traces" d="M6 18h3M16 7h3" stroke="#847761" stroke-width="1" opacity=".6"/>'+
  '</g>'
);
const trap_revealed=svg(
  '<g data-feature="exposed-spikes">'+
  '<rect x="2" y="16" width="20" height="6" fill="#533b36" stroke="'+amber+'" stroke-width="1"/>'+
  '<path d="M3 17l3-11 3 11 3-13 3 13 3-11 3 11Z" fill="#d5b78e" stroke="#7f4c40" stroke-width="1"/>'+
  '<rect x="3" y="19" width="18" height="2" fill="#372d30"/>'+
  '<path d="M5 2v2M12 1v2M19 2v2" stroke="#e6b389" stroke-width="2"/>'+
  '<path data-detail="ui100-armed-trap-bed" d="M4 21h16M5 18h2M17 18h2" stroke="#edc6a0" stroke-width="1" fill="none"/>'+
  '<path data-detail="armed-trap-fangs" d="M6 15l2-5 2 5M13 15l2-7 2 7" fill="#f1cea2" stroke="#7f4c40" stroke-width="1"/>'+
  '</g>'
);
const trap_disabled=svg(
  '<g data-feature="broken-spikes">'+
  '<rect x="2" y="17" width="20" height="5" fill="#333d3b" stroke="#7cb59e" stroke-width="1"/>'+
  '<path d="M5 16l3-6 1 4 4-3 3 5 3-3" stroke="#8c9992" stroke-width="2" fill="none"/>'+
  '<path d="M3 6l18 15" stroke="#8fd0ad" stroke-width="3"/>'+
  '<rect x="3" y="19" width="18" height="2" fill="#263536"/>'+
  '<path data-detail="ui100-disarmed-trap-bolts" d="M5 20h3M16 20h3" stroke="#c0ccc1" stroke-width="1" fill="none"/>'+
  '<path data-detail="disarmed-trap-lockout" d="M6 10l3 3-3 3M18 10l-3 3 3 3" fill="none" stroke="#b6c4b7" stroke-width="2"/>'+
  '</g>'
);
const trap_triggered=svg(
  '<g data-feature="spent-mechanism">'+
  '<rect x="2" y="15" width="20" height="7" fill="#42464a" stroke="#7e8681" stroke-width="1"/>'+
  '<path d="M4 17l4-6 3 6 4-6 4 6" fill="none" stroke="#717e83" stroke-width="2"/>'+
  '<path d="M3 4l18 18M21 4L3 22" stroke="#b1a99b" stroke-width="1"/>'+
  '<path data-detail="ui100-spent-trap-mortar" d="M5 20h4M15 20h4" stroke="#5a656a" stroke-width="1" fill="none"/>'+
  '<path data-detail="spent-trap-empty-bed" d="M4 19h16M8 21h8" stroke="#8d9794" stroke-width="1"/>'+
  '</g>'
);
// Extraction = inhabitable stone portal with a standing TURQUOISE interior;
// hazard = fractured crimson wound with no architectural opening.
const exit=svg(
  '<g data-feature="turquoise-extraction-arch">'+
  '<path d="M1 23V8l6-7h10l6 7v15Z" fill="#4e6865" stroke="'+teal+'" stroke-width="1"/>'+
  '<path d="M5 23V10l4-5h6l4 5v13Z" fill="#153e3e"/>'+
  '<path d="M9 9l3-3 3 3 2 4-3 9h-4l-3-9Z" fill="#4b9b8e"/>'+
  '<path d="M12 8v13M8 13h8" stroke="#b5eddb" stroke-width="1"/>'+
  '<path data-detail="extraction-keystone" d="M9 1h6v3H9Z" fill="#c6c9b6"/>'+
  '<path d="M2 15h3M19 15h3M7 4h3M14 4h3" stroke="#98b6b0" stroke-width="1"/>'+
  '<rect x="10" y="20" width="4" height="2" fill="#8fd9c9"/>'+
  // The sole upright luminous portal: teal rune crown and bright steps.
  '<path data-detail="arch-carved-stones" d="M2 10h4M18 10h4M2 15h3M19 15h3M7 4l2 2M17 4l-2 2" stroke="#9aaca8" stroke-width="1" fill="none"/>'+
  '<path data-detail="ui100-arch-inner-runic" d="M8 11v6M16 11v6M10 20h4" stroke="#b1f1db" stroke-width="1" fill="none"/>'+
  '<path data-detail="arch-rune-crown" d="M12 2l2 3-2 2-2-2Z" fill="#b4f4dd" stroke="#46968b" stroke-width="1"/>'+
  '<path data-detail="arch-luminous-threshold" d="M6 22h12M8 21h8" stroke="#a5eee1" stroke-width="1"/>'+
  '<path d="M2 23h20M3 9h3M18 9h3" stroke="'+rim+'" stroke-width="2"/>'+
  '</g>'
);
const hazard=svg(
  '<g data-feature="fractured-lethal-rift">'+
  '<path d="M12 1l4 6 6 5-5 4-5 7-4-6-6-5 6-4Z" fill="#452532" stroke="#c17b7c" stroke-width="1"/>'+
  '<path d="M12 4l3 7-3 3 1 6-5-7 2-4Z" fill="#b65e69"/>'+
  '<path d="M12 6l-2 6 4 2-2 5" fill="none" stroke="#f7b7aa" stroke-width="2"/>'+
  '<path data-detail="rift-black-center" d="M13 9l2 3-2 5-2-3Z" fill="#161721"/>'+
  '<path d="M7 11l-3-2M17 15l4 2" stroke="#e58d84" stroke-width="1"/>'+
  // Branching fracture on the ground, never an apparent open portal.
  '<path data-detail="rift-branch-fractures" d="M10 7L5 3M9 15L4 19M15 10l5-6M16 17l5 3" stroke="#cc817b" stroke-width="1" fill="none"/>'+
  '<path data-detail="ui100-rift-cracked-axis" d="M12 6l2 4-2 4 2 3M8 11l-2 2" stroke="#ffd0b5" stroke-width="1" fill="none"/>'+
  '<path data-detail="rift-ember-flecks" d="M4 11h2M18 12h2M9 20h2" stroke="#f5a58f" stroke-width="1"/>'+
  '<path d="M3 5l4 4M19 4l-4 4M3 20l5-4M20 19l-5-4" stroke="#74404a" stroke-width="1"/>'+
  '</g>'
);
// Secret renders *only* when existing state marks it revealed. No concealed
// variant exists, and the sprite carries no unknown-map information.
const secret_open=svg(
  '<g data-feature="discovered-fractured-wall">'+
  '<path d="M2 23V5l6-4h11l3 5v17Z" fill="#566465" stroke="'+rim+'" stroke-width="1"/>'+
  '<path d="M6 23V8l5-4 6 5v14Z" fill="#0b1c25"/>'+
  '<path d="M3 8l6 2-4 5M18 5l-3 6 5 3M4 19l4-3M18 19l3-3" fill="none" stroke="#b9aa8b" stroke-width="2"/>'+
  '<path d="M10 17l2-5 2 3-2 6" fill="none" stroke="'+teal+'" stroke-width="1"/>'+
  '</g>'
);
// Three distinct room markers: hammer and anvil, ringed echo, relic cache.
const site_atelier=svg(
  '<g data-feature="abandoned-forge">'+
  '<path d="M2 10l4-5h12l4 5" fill="none" stroke="'+iron+'" stroke-width="2"/>'+
  '<path d="M4 10v12M20 10v12" stroke="'+stone+'" stroke-width="2"/>'+
  '<path d="M6 15h12l-2 5H9Z" fill="#596568" stroke="'+rim+'" stroke-width="1"/>'+
  '<rect x="9" y="20" width="6" height="2" fill="'+stone+'"/>'+
  '<path d="M7 5l7 5M11 4l-6 8" fill="none" stroke="'+amber+'" stroke-width="2"/>'+
  '<path d="M14 16h3" stroke="#d7b991" stroke-width="2"/>'+
  '</g>'
);
const site_echo=svg(
  '<g data-feature="echo-ritual-ring">'+
  '<circle cx="12" cy="12" r="10" fill="#26383e" stroke="#83b6b2" stroke-width="2"/>'+
  '<circle cx="12" cy="12" r="6" fill="none" stroke="#b4d2bd" stroke-width="1"/>'+
  '<path d="M12 4v5M12 15v5M4 12h5M15 12h5" stroke="#719b9b" stroke-width="1"/>'+
  '<path d="M12 8l4 4-4 4-4-4Z" fill="#93cabe"/>'+
  '<rect x="11" y="11" width="2" height="2" fill="'+ivory+'"/>'+
  '</g>'
);
const site_cache=svg(
  '<g data-feature="forgotten-reliquary">'+
  '<path d="M3 22V7l5-5h13v20Z" fill="#50564e" stroke="'+rim+'" stroke-width="1"/>'+
  '<path d="M6 20V9l4-4h8v15Z" fill="#2c3939"/>'+
  '<rect x="7" y="12" width="12" height="8" fill="'+wood+'" stroke="'+amber+'" stroke-width="1"/>'+
  '<rect x="9" y="14" width="8" height="4" fill="#111e24"/>'+
  '<path d="M12 11l3 4-3 4-3-4Z" fill="#a9c3a0"/>'+
  '<rect x="11" y="14" width="2" height="2" fill="'+ivory+'"/>'+
  '</g>'
);
const site_camp=svg(
  '<g data-feature="torn-camp">'+
  '<path d="M2 20L8 7h8l6 13Z" fill="#4c574f" stroke="#8b8d77" stroke-width="1"/>'+
  '<path d="M8 7l4 13 4-13" fill="#28383b" stroke="#a99c81" stroke-width="1"/>'+
  '<path d="M10 20v-7h5v7" fill="#141c21"/>'+
  '<rect x="3" y="18" width="5" height="4" fill="#7b4b3a" stroke="#b89669" stroke-width="1"/>'+
  '<path d="M4 20h3M5 19v2" stroke="#ead8b5" stroke-width="1"/>'+
  '</g>'
);
const site_signal=svg(
  '<g data-feature="watch-bell">'+
  '<path d="M4 22V4l5-2v20M19 22V4l-5-2v20" fill="#3a4a4b" stroke="#8c8a70" stroke-width="1"/>'+
  '<path d="M6 5h12M6 20h12" stroke="#a18c6f" stroke-width="2"/>'+
  '<path d="M10 8h4l3 7H7Z" fill="#bb9364" stroke="#e0c393" stroke-width="1"/>'+
  '<circle cx="12" cy="16" r="2" fill="#5b3929"/>'+
  '<path d="M12 4v4" stroke="#ddd0a2" stroke-width="1"/>'+
  '</g>'
);
const site_reliquary=svg(
  '<g data-feature="sealed-reliquary">'+
  '<path d="M4 21V10l8-6 8 6v11Z" fill="#35494a" stroke="#9ea79a" stroke-width="1"/>'+
  '<path d="M6 11h12v8H6Z" fill="#1b2c30" stroke="#b4a280" stroke-width="1"/>'+
  '<rect x="10" y="10" width="4" height="7" fill="#d5b77b"/>'+
  '<path d="M12 6v5M8 14h8M6 21h12" stroke="#94cec2" stroke-width="1"/>'+
  '<path d="M9 3h6M10 19h4" stroke="#e6d2a4" stroke-width="2"/>'+
  '</g>'
);
const site_resolved=svg(
  '<g data-feature="explored-site">'+
  '<rect x="2" y="3" width="20" height="19" fill="#263938" stroke="#7e9688" stroke-width="1"/>'+
  '<path d="M5 7h14M5 18h14" stroke="#52665d" stroke-width="2"/>'+
  '<path d="M6 13l4 4 8-9" fill="none" stroke="#b2ddbc" stroke-width="3"/>'+
  '</g>'
);
export const INTERACTIVE_IDS=Object.freeze([
  "door_open","door_closed","loot","chest_open",
  "trap_clue","trap_revealed","trap_disabled","trap_triggered",
  "exit","hazard","secret_open",
  "site_atelier","site_echo","site_cache","site_camp","site_signal","site_reliquary","site_resolved"
]);
const BASE_INTERACTIVE_SVGS={
  door_open,door_closed,loot,chest_open,
  trap_clue,trap_revealed,trap_disabled,trap_triggered,
  exit,hazard,secret_open,site_atelier,site_echo,site_cache,site_camp,site_signal,site_reliquary,site_resolved
};
export const INTERACTIVE_SVGS=Object.freeze(Object.fromEntries(
  Object.entries(BASE_INTERACTIVE_SVGS).map(([id,source])=>
    [id,polishInteractive107A(id,finishInteractive106D(id,source))]))
);
export const INTERACTIVE_SPRITES=Object.freeze(Object.fromEntries(
  INTERACTIVE_IDS.map(id=>[id,URI+encodeURIComponent(INTERACTIVE_SVGS[id])])
));
