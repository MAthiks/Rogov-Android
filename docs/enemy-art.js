// ART-091B — Sprite C enemy silhouettes (original transparent 24 × 24 SVG).
// Visual replacement ONLY: combat state, hostility, fog, labels and HP stay in
// their existing game / tile / HUD contracts. No external assets or RNG.
const svg=parts=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" shape-rendering="crispEdges">'+parts+'</svg>';

// Charognard: low, asymmetric carrion-bird anatomy. Its horizontal hooked beak,
// hunched neck, trailing tattered feathers and uneven clawed feet read as a
// scavenger even when the sprite is only ~27 CSS pixels wide on Android.
const charognard=svg(
  '<g data-feature="low-carrion-silhouette">'+
  '<path d="M1 17l3-4 1-6 4 4 4-3 3 2 1 4 3 1 1 5-4 2H7l-4-2Z" fill="#261f24"/>'+
  '<path d="M2 16l4-4 2-5 3 6 3-3 3 5-3 5-7 1-4-2Z" fill="#57413d"/>'+
  '<path d="M2 17l4-5 2-5 1 9-2 4H4Z" fill="#746052"/>'+
  '<path d="M5 12l-3-8 6 4 2 5-2 4Z" fill="#42323a"/>'+
  '<path d="M5 10l-4-4 5 2M10 11l2-5 3 5" fill="none" stroke="#947664" stroke-width="1"/>'+
  '<path d="M9 14l4-3 3 4-2 4-6 1Z" fill="#392b31"/>'+
  '<path d="M9 15l3-3 3 2-1 1-3 1-2 3" fill="none" stroke="#75605a" stroke-width="1"/>'+
  '<path d="M15 12l3-2 3 2v4l-2 2-4-2Z" fill="#9d8770"/>'+
  '<path d="M17 12h3l1 2-3 1-2-1Z" fill="#d5c6a8"/>'+
  '<rect x="19" y="13" width="1" height="1" fill="#1d2428"/>'+
  '<g data-feature="hooked-bone-beak">'+
  '<path d="M20 15h3l-1 3-4 1 1-2 2-1Z" fill="#e2d3ad"/>'+
  '<path d="M20 17h2l-2 2-2-1Z" fill="#8f8273"/>'+
  '</g>'+
  '<path d="M7 20l-2 3M11 20l1 3M16 19l1 3" stroke="#ba9977" stroke-width="2"/>'+
  '<path d="M4 22h4M10 22h5M16 22h4" stroke="#d5b18b" stroke-width="1"/>'+
  '<rect x="8" y="18" width="2" height="1" fill="#9b7060"/>'+
  '<path data-detail="ragged-wing-rim" d="M5 12l-3 6 3 3M11 12l-3 6M13 11l2 4" stroke="#b49a83" stroke-width="1" fill="none" opacity=".86"/>'+
  '<path data-detail="scavenger-barbed-feathers" d="M2 14l-1-3M5 13l-3-3M9 12l-2-4M4 19l-2 2" stroke="#d0af8b" stroke-width="1" fill="none"/>'+
  '<path data-detail="scavenger-worn-pinions" d="M9 16h3M10 18h3M14 16h2" stroke="#9e8071" stroke-width="1" fill="none"/>'+
  // Crisp internal wing and beak landmarks, no rectangle/halo around the enemy.
  '<path data-detail="ui100-scavenger-hooked-profile" d="M19 15h3M3 18l2 2M7 9l2 3" stroke="#edc99c" stroke-width="1" fill="none"/>'+
  '<path data-detail="art097c2-scavenger-readable-profile" d="M3 14l2-3M9 15h3M17 11h2M20 16h2" stroke="#d3b798" stroke-width="1" fill="none"/>'+
  '</g>'
);

// Gardien déchu: full-height, wide stone-armored giant. Squared shoulders and
// massive mace produce a readable silhouette distinct from the hooded Égaré;
// small pale cracks are material highlights, NOT a player or interaction halo.
const guardian=svg(
  '<g data-feature="heavy-stone-sentinel">'+
  '<path d="M1 10l3-5h5l2-3h6l3 3h2v14l-3 4H4l-3-4Z" fill="#1d2730"/>'+
  '<path d="M2 9l3-3 5 1 1 7-3 6H3Z" fill="#53616a"/>'+
  '<path d="M15 7l4-2 3 4-1 11h-6l-2-6Z" fill="#53616a"/>'+
  '<path d="M4 6l2-2 5 1 1 4-2 4H4Z" fill="#83908b"/>'+
  '<path d="M14 5l5-1 3 4-2 5h-5l-2-4Z" fill="#7a8684"/>'+
  '<path d="M8 5l3-3h5l3 4-2 7-7 2-4-5Z" fill="#303d46"/>'+
  '<path d="M9 5l3-2h4l2 4-2 4h-6l-2-4Z" fill="#65717b"/>'+
  '<path d="M10 9h7v4l-4 2-4-2Z" fill="#202a34"/>'+
  '<rect x="12" y="10" width="3" height="1" fill="#ddd5b9"/>'+
  '<rect x="13" y="11" width="1" height="2" fill="#99c4b6"/>'+
  '<path d="M8 13l4 2 5-2 2 8-3 2H7l-3-2Z" fill="#414d55"/>'+
  '<path d="M11 14v7M16 15l-2 5M7 17l3 2" stroke="#87918c" stroke-width="1" fill="none"/>'+
  '<path data-detail="stone-armor-planes" d="M4 7h5M16 7h4M8 16h8M7 21h4M15 21h3" stroke="#b8b5a4" stroke-width="1" fill="none" opacity=".85"/>'+
  '<path d="M7 20h5v3H5v-2ZM14 20h5v3h-6Z" fill="#29333c"/>'+
  '<path d="M3 13v7l4 2-1-8M20 12l-1 7" stroke="#a9ada1" stroke-width="2"/>'+
  '<g data-feature="massive-mace">'+
  '<rect x="21" y="8" width="2" height="14" fill="#a99d87"/>'+
  '<path d="M19 3h4v7h-4l-1-3Z" fill="#1a2530"/>'+
  '<rect x="19" y="4" width="4" height="5" fill="#78858a"/>'+
  '<path d="M19 6h4M20 3v8" stroke="#c2c0ab" stroke-width="1"/>'+
  '</g>'+
  '<path data-detail="guardian-fractured-pauldrons" d="M4 8l3 2M9 6l-2 4M16 7l3 3M20 9l-3 3" stroke="#c3b6a1" stroke-width="1" fill="none"/>'+
  '<path data-detail="guardian-heavy-greaves" d="M5 22h6M14 22h5M8 19h2M15 19h2" stroke="#a3a7a0" stroke-width="1" fill="none"/>'+
  '<path data-detail="guardian-helmet-slit" d="M11 10h5" stroke="#dcd4b8" stroke-width="1" fill="none"/>'+
  // Opposing flat pauldrons and a readable chest are the Gardien signature.
  '<path data-detail="ui100-guardian-shoulder-depth" d="M4 6h6M15 6h5M7 18h3M14 18h4" stroke="#e1d5bb" stroke-width="1" fill="none"/>'+
  '<path data-detail="art097c2-guardian-armor-profile" d="M4 5h5M16 5h4M8 16h8" stroke="#d0c9b4" stroke-width="1" fill="none"/>'+
  '</g>'
);

// Larve de faille: strictly horizontal segmented body, not another upright
// humanoid or feathered quadruped. Its tiny spectral emitter is localized and
// never resembles the exit arch; darker gaps emphasize separated body plates.
const rift_larva=svg(
  '<g data-feature="segmented-horizontal-larva">'+
  '<path d="M2 14L4 9l4-2 3 2 4-2 4 3 3 3-1 5-5 3-6-2-4 1Z" fill="#102b32"/>'+
  '<path d="M1 12l3-6 2 4-1 7-2 2ZM8 8l2-5 3 5-2 5ZM15 8l3-5 1 6-2 4Z" fill="#31525a"/>'+
  '<path d="M3 12l3-3 3 2-1 7-4 1-2-3Z" fill="#47666a" stroke="#172f38" stroke-width="1"/>'+
  '<path d="M8 10l4-2 3 3-1 8-5-1-2-4Z" fill="#38616a" stroke="#152d35" stroke-width="1"/>'+
  '<path d="M14 11l4-2 3 4-2 6-5-1-1-4Z" fill="#4c7777" stroke="#183640" stroke-width="1"/>'+
  '<path d="M19 12l3 2-1 4-3 2-2-4Z" fill="#688b84"/>'+
  '<path d="M5 11v7M11 10v9M17 11l-1 7" stroke="#8ca9a0" stroke-width="1"/>'+
  '<path data-detail="segment-ridge" d="M4 10h3M10 9h3M16 10h3M4 17h2M10 17h2M16 17h2" stroke="#bed6c0" stroke-width="1" fill="none" opacity=".85"/>'+
  '<path d="M3 18l-2 4M8 19l-2 3M14 19l-1 3M18 19l1 3" stroke="#628a82" stroke-width="2"/>'+
  '<path d="M3 16L1 13M8 14l-3-2M14 14l-3-2" stroke="#132d35" stroke-width="1"/>'+
  '<g data-feature="localized-spectral-emitter">'+
  '<path d="M19 12l3 2-2 3-2-2Z" fill="#a1d7c6"/>'+
  '<rect x="20" y="14" width="2" height="2" fill="#e0f1d9"/>'+
  '<rect x="22" y="13" width="1" height="1" fill="#90c5b6"/>'+
  '</g>'+
  '<path data-detail="larva-chitin-facets" d="M4 12l2-2M9 12l2-2M15 12l2-2M5 15h2M11 15h2M17 15h2" stroke="#b2bfae" stroke-width="1" fill="none"/>'+
  '<path data-detail="larva-dorsal-spines" d="M4 8L3 5M11 7l-1-3M17 8l1-3" stroke="#8baea4" stroke-width="1" fill="none"/>'+
  '<path data-detail="larva-ventral-shadows" d="M3 20h3M9 20h4M15 20h4" stroke="#18313b" stroke-width="1" fill="none"/>'+
  // Three crisp dorsal plates remain horizontal and distinct from the Arche.
  '<path data-detail="ui100-larva-dorsal-contrast" d="M4 9h3M10 8h3M16 9h3M11 19h3" stroke="#e6ead2" stroke-width="1" fill="none"/>'+
  '<path data-detail="art097c2-larva-segment-steps" d="M4 11h3M10 10h3M16 11h3" stroke="#d4e2c8" stroke-width="1" fill="none"/>'+
  '</g>'
);

export const ENEMY_ART_IDS=Object.freeze(["charognard","guardian","rift_larva"]);
export const ENEMY_SVGS=Object.freeze({charognard,guardian,rift_larva});
export const ENEMY_SPRITES=Object.freeze(Object.fromEntries(
  ENEMY_ART_IDS.map(id=>[id,"data:image/svg+xml;charset=UTF-8,"+
    encodeURIComponent(ENEMY_SVGS[id])])
));
