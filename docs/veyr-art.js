// ART-091D — original Sprite C portraits and item pictograms for Veyr.
// 24x24 pixel-style SVG only, standalone and transparent. The NPCs below are
// read-only art CONCEPTS, not game actors, dialogue, shops or world entities.
// All inventory icons are presentation-only aliases to game.js ITEMS keys.
const svg=parts=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" shape-rendering="crispEdges">'+parts+"</svg>";
const data=source=>"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(source);

const warden=svg(
  '<g data-feature="warden-hood-and-lantern">'+
  '<path d="M3 23l1-8 3-4 2-5 3-3 4 3 2 5 2 12Z" fill="#273139"/>'+
  '<path d="M5 23l1-8 3-3 2 3-1 8Z" fill="#586062"/>'+
  '<path d="M16 13l2 2 1 8h-7l-1-8Z" fill="#444b54"/>'+
  '<path d="M8 9l2-5 3-2 3 3 1 6-4 4-4-3Z" fill="#2b333e"/>'+
  '<path d="M10 9l3-3 3 3-1 4-4 1Z" fill="#a49c8e"/>'+
  '<path d="M10 12h4" stroke="#282c31" stroke-width="2"/>'+
  '<path d="M8 14l-2 6M17 13l3 4" stroke="#8d8b7d" stroke-width="2"/>'+
  '<g data-feature="amber-lantern">'+
  '<path d="M19 15l1-2h2l1 2v6h-4Z" fill="#3b4142" stroke="#c1aa7f" stroke-width="1"/>'+
  '<rect x="20" y="16" width="2" height="4" fill="#e3b76e"/>'+
  '<path d="M19 13v-2h4v2" stroke="#c2b39a" stroke-width="1" fill="none"/>'+
  '</g><path d="M7 22h9" stroke="#9c9d8d" stroke-width="1"/>'+
  '</g>'
);

const smith=svg(
  '<g data-feature="stocky-smith-apron">'+
  '<path d="M2 11l3-5 4-2h7l4 2 3 5-2 10-5 2H7l-5-2Z" fill="#3b3c3e"/>'+
  '<path d="M3 11l4-4 3 3-1 8-5 3Z" fill="#73706b"/>'+
  '<path d="M16 10l2-3 4 4-2 10-5-3Z" fill="#77726c"/>'+
  '<path d="M8 6l2-4h5l3 5-2 7h-7Z" fill="#b8a18b"/>'+
  '<path d="M8 7l1-5h7l2 5-5-2Z" fill="#565555"/>'+
  '<path d="M9 12l2 3 3 1 3-4-1-3h-6Z" fill="#77604a"/>'+
  '<rect x="11" y="12" width="3" height="2" fill="#4b4138"/>'+
  '<path d="M8 14l3 2 4-1 2 7H7Z" fill="#8b6549" stroke="#aa8f71" stroke-width="1"/>'+
  '<rect x="10" y="18" width="5" height="2" fill="#d6b58d"/>'+
  '<path d="M3 12l3 5-2 5M20 12l-2 5 1 5" stroke="#c6b39e" stroke-width="2"/>'+
  '<g data-feature="blacksmith-hammer">'+
  '<path d="M19 16l4 7" stroke="#9b7860" stroke-width="2"/>'+
  '<rect x="16" y="12" width="7" height="4" fill="#8c9895" stroke="#c2c5ae" stroke-width="1"/>'+
  '</g>'+
  '</g>'
);

const scholar=svg(
  '<g data-feature="echo-scholar-open-book">'+
  '<path d="M4 23l1-10 3-7 5-4 4 3 3 8 1 10Z" fill="#28343e"/>'+
  '<path d="M5 21l4-9 2-4 4 2 4 12Z" fill="#585563"/>'+
  '<path d="M9 7l3-5 4 4 1 5-2 3h-6Z" fill="#322d39"/>'+
  '<path d="M11 9l2-2 3 2v4h-5Z" fill="#c5baa3"/>'+
  '<rect x="12" y="11" width="3" height="1" fill="#4b4447"/>'+
  '<path d="M6 13l4 4M18 13l-2 5" stroke="#9b9f98" stroke-width="2"/>'+
  '<g data-feature="green-echo-book">'+
  '<path d="M5 15l7 1 1 6-7-2Z" fill="#a9a692" stroke="#d0c9ad" stroke-width="1"/>'+
  '<path d="M13 16l7-2-1 6-6 2Z" fill="#42675c" stroke="#a2c7a6" stroke-width="1"/>'+
  '<path d="M12 16v6" stroke="#566c63" stroke-width="1"/>'+
  '<rect x="16" y="17" width="2" height="2" fill="#b0e4bf"/>'+
  '</g>'+
  '</g>'
);

// Item silhouettes share NPC material cues but do not borrow the same shape
// as the exit portal, lethal rift, or the character's directional sprites.
const rustySword=svg(
  '<g data-feature="worn-notched-sword">'+
  '<path d="M5 19L17 4l3-2-1 5-2 2-9 12Z" fill="#9a9d93" stroke="#d5d2bb" stroke-width="1"/>'+
  '<path d="M16 7l3-4M11 12l3-2" stroke="#5b6e6e" stroke-width="1"/>'+
  '<path d="M4 16l6 5" stroke="#8e694f" stroke-width="3"/>'+
  '<path d="M4 21l-2 2M8 19l3 4" stroke="#c9b394" stroke-width="2"/>'+
  '<path d="M5 20l-2 2" stroke="#4c342c" stroke-width="2"/>'+
  '</g>'
);
const ashenBlade=svg(
  '<g data-feature="forged-ashen-blade">'+
  '<path d="M5 19L16 4l3-2-1 6-9 12Z" fill="#a6ada6" stroke="#e2e0c4" stroke-width="1"/>'+
  '<path d="M15 5l-6 11" stroke="#8fc8ad" stroke-width="2"/>'+
  '<path d="M3 16l8 6M5 18l-3 4" stroke="#c4b38f" stroke-width="2"/>'+
  '<path d="M4 18l2 2-1 3" stroke="#47424a" stroke-width="2"/>'+
  '<rect x="16" y="3" width="2" height="2" fill="#d9ecda"/>'+
  '</g>'
);
const bandage=svg(
  '<g data-feature="rolled-cloth-bandage">'+
  '<path d="M4 9l3-3h10l3 4v8l-4 3H7l-3-3Z" fill="#c8bda9" stroke="#e7dec6" stroke-width="1"/>'+
  '<path d="M6 8l3 12M11 7l3 14M16 7l3 12" stroke="#897d6e" stroke-width="2"/>'+
  '<path d="M5 10l14 4M5 15l13 3" stroke="#efe6cf" stroke-width="2"/>'+
  '<path d="M8 11l7 2" stroke="#b6a58e" stroke-width="1"/>'+
  '</g>'
);
const fragment=svg(
  '<g data-feature="faceted-ashen-mineral">'+
  '<path d="M11 2l6 4 3 7-6 9-8-3-3-8Z" fill="#4d5157" stroke="#a2a49e" stroke-width="1"/>'+
  '<path d="M11 2l-2 10 5 10 1-13Z" fill="#9e998c"/>'+
  '<path d="M3 11l6 1 8-6M9 12l11 1M14 22l-5-10" stroke="#d2c5a9" stroke-width="1"/>'+
  '<path d="M11 9l4 0-2 4-3-1Z" fill="#d7b58f"/>'+
  '<rect x="11" y="11" width="2" height="2" fill="#f1dab3"/>'+
  '</g>'
);
const tonic=svg(
  '<g data-feature="stoppered-dusk-tonic">'+
  '<rect x="10" y="2" width="4" height="4" fill="#ac9071"/>'+
  '<path d="M9 6h6v3l4 4v7l-3 2H8l-3-2v-7l4-4Z" fill="#32434b" stroke="#9daead" stroke-width="1"/>'+
  '<path d="M7 14h10v5l-2 2H9l-2-2Z" fill="#467e69"/>'+
  '<path d="M9 12h6M10 16l2 2 3-3" stroke="#b4e1bd" stroke-width="1"/>'+
  '<rect x="10" y="3" width="4" height="2" fill="#d5b994"/>'+
  '<path d="M6 13l3-4" stroke="#b6c8be" stroke-width="1"/>'+
  '</g>'
);
export const VEYR_NPC_IDS=Object.freeze(["warden","smith","scholar"]);
export const VEYR_NPC_CONCEPTS=Object.freeze({
  warden:Object.freeze({name:"Gardien du refuge",role:"Concept · lanterne ambrée",svg:warden}),
  smith:Object.freeze({name:"Forgeron de reliques",role:"Concept · marteau et tablier",svg:smith}),
  scholar:Object.freeze({name:"Érudite de l'Écho",role:"Concept · grimoire spectral",svg:scholar})
});
export const VEYR_NPC_SPRITES=Object.freeze(Object.fromEntries(
  VEYR_NPC_IDS.map(id=>[id,data(VEYR_NPC_CONCEPTS[id].svg)])
));
export const ITEM_ART_IDS=Object.freeze([
  "weapon.rusty_sword","weapon.ashen_blade",
  "consumable.bandage","relic.ashen_fragment","consumable.dusk_tonic"
]);
export const ITEM_SVGS=Object.freeze({
  "weapon.rusty_sword":rustySword,
  "weapon.ashen_blade":ashenBlade,
  "consumable.bandage":bandage,
  "relic.ashen_fragment":fragment,
  "consumable.dusk_tonic":tonic
});
export const ITEM_SPRITES=Object.freeze(Object.fromEntries(
  ITEM_ART_IDS.map(id=>[id,data(ITEM_SVGS[id])])
));
