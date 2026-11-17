// ROGOV ORIGINAL ART v0.4 — functional pixel readability before decorative detail.
// All sprites are written for ROGOV in inline SVG; no external images or licenses.
import { MAP, ENEMY_TYPES, enemyAt } from "./game.js";
const svg = (parts) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" shape-rendering="crispEdges">' + parts + '</svg>';
const floor=svg(
  '<rect width="24" height="24" fill="#202d33"/>'+
  '<path d="M3 6h5M17 17h4" stroke="#2b3b42" stroke-width="1"/>'+
  '<rect x="11" y="12" width="1" height="1" fill="#334348"/>'
);
const wall=svg(
  '<rect width="24" height="24" fill="#121f26"/>'+
  '<path d="M1 1h22v10H1z" fill="#4b5c63"/>'+
  '<path d="M1 13h10v10H1zM13 13h10v10H13z" fill="#364b55"/>'+
  '<path d="M2 2h20M2 14h8M14 14h8" stroke="#89918b" stroke-width="1"/>'+
  '<path d="M0 12h24M12 12v12" stroke="#101d22" stroke-width="2"/>'+
  '<path d="M4 8l2-2M18 18l-2 3" stroke="#26373b" stroke-width="1"/>'
);
const hero=svg(
  '<path d="M5 23L5 10 9 4 11 1h3l5 9 1 13z" fill="#182a2c" stroke="#ebf0d0" stroke-width="2"/>'+
  '<path d="M7 10L11 4h3l4 6v4H7z" fill="#6e9d85"/>'+
  '<path d="M8 12h8v4H8z" fill="#112125"/>'+
  '<rect x="9" y="13" width="2" height="2" fill="#f6ffbc"/>'+
  '<rect x="14" y="13" width="2" height="2" fill="#f6ffbc"/>'+
  '<path d="M7 18l5-3 5 3 1 4H6z" fill="#437367"/>'+
  '<path d="M21 7l-2 14" stroke="#d5c28a" stroke-width="2"/>'
);
const loot=svg(
  '<path d="M3 12L5 8h14l2 4v9H3z" fill="#72552e" stroke="#f4d389" stroke-width="2"/>'+
  '<path d="M4 12h16" stroke="#392b19" stroke-width="2"/>'+
  '<rect x="10" y="12" width="4" height="6" fill="#ffe5a2"/>'+
  '<rect x="11" y="14" width="2" height="2" fill="#76551a"/>'
);
const hazard=svg(
  '<path d="M12 1L23 12 12 23 1 12Z" fill="#331923" stroke="#e38d89" stroke-width="2"/>'+
  '<path d="M12 4l6 8-6 8-6-8Z" fill="#703443"/>'+
  '<path d="M12 5l-2 6 3 3-2 5" stroke="#ffd0b5" stroke-width="2" fill="none"/>'+
  '<path d="M7 9l3 2M16 15l2 3" stroke="#c17773" stroke-width="1"/>'
);
const exit=svg(
  '<path d="M2 23V8L7 2h10l5 6v15" fill="#183f40" stroke="#aee5d3" stroke-width="2"/>'+
  '<path d="M7 23V10l5-5 5 5v13" fill="#387c76"/>'+
  '<path d="M11 8h2v15h-2" fill="#e2f5d8"/>'+
  '<path d="M1 23h22" stroke="#aee5d3" stroke-width="2"/>'+
  '<path d="M12 2l-2 3 2 3 2-3Z" fill="#d4e7b9"/>'
);
const charognard=svg(
  // Low asymmetrical body: six uneven limbs, one pallid eye.
  '<path d="M2 21l4-5 4 1 3-5 7 2 3 6-5 2-9-2-4 3Z" fill="#6a3d32" stroke="#e0a078" stroke-width="1.6"/>'+
  '<path d="M7 16L3 6l8 8M13 13l6-11-1 12" fill="#7a503b" stroke="#ac7659" stroke-width="1.4"/>'+
  '<path d="M5 19l-4 3M9 21l-2 2M16 20l2 3M19 18l4 4" stroke="#cf9471" stroke-width="1.5"/>'+
  '<path d="M10 12l3-6 1 7" fill="#49312b"/>'+
  '<rect x="17" y="16" width="3" height="2" fill="#eee3b3"/>'+
  '<path d="M12 16l2 2-1 3" stroke="#b6cbb1" stroke-width="1" fill="none"/>'
);
const guardian=svg(
  // Tall cyclopean sentry: carved stone shell, bone edges, vertical eye slit.
  '<path d="M3 23L2 10l5-4 3-5h6l4 5 2 4-1 13Z" fill="#55616b" stroke="#ccd0bb" stroke-width="1.8"/>'+
  '<path d="M7 8l4-5h4l3 5-3 7H9Z" fill="#293945" stroke="#9eaca9" stroke-width="1"/>'+
  '<path d="M12 8v6" stroke="#d8ebc2" stroke-width="2"/>'+
  '<path d="M6 15l4 2-1 5M18 15l-4 2 1 5" stroke="#8799a3" stroke-width="1.5" fill="none"/>'+
  '<path d="M4 9l3 3M21 9l-3 3" stroke="#343e49" stroke-width="2"/>'+
  '<path d="M22 1v22" stroke="#b8a18c" stroke-width="2"/>'+
  '<path d="M8 22h9" stroke="#c9d1c7" stroke-width="1.5"/>'
);
const rift_larva=svg(
  // Cosmic/incomplete anatomy: floating asymmetrical membrane and a pale inner split.
  '<path d="M4 17L2 10 7 4 10 6 15 2 22 8 19 15 22 20 16 22 12 19 7 23Z" fill="#1b4345" stroke="#9dd7c4" stroke-width="1.6"/>'+
  '<path d="M7 7l4 3 5-5 2 5-2 7-4 3-5-5Z" fill="#375b5c"/>'+
  '<path d="M13 6l-2 5 3 3-3 5" stroke="#ddf2d5" stroke-width="2.5" fill="none"/>'+
  '<rect x="10" y="10" width="2" height="2" fill="#b2e4d1"/>'+
  '<rect x="20" y="2" width="2" height="2" fill="#c7eee1"/>'+
  '<rect x="2" y="20" width="2" height="2" fill="#8dbeaa"/>'
);
const SPRITE_SVGS={ floor, wall, hero, loot, hazard, exit, charognard, guardian, rift_larva };
export const TILE_SPRITES=Object.freeze(Object.fromEntries(
  Object.entries(SPRITE_SVGS).map(([id,source])=>[id,"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(source)])
));
export const LEGEND_ITEMS=Object.freeze([
  ["hero","Joueur"],["charognard","Charognard"],["guardian","Gardien déchu"],["rift_larva","Larve de faille"],
  ["loot","Butin"],["hazard","Danger"],["exit","Extraction"]
]);
export function drawTileMap(state,host) {
  host.replaceChildren();
  if(!state.run)return;
  const run=state.run;
  host.style.gridTemplateColumns="repeat("+MAP[0].length+", minmax(0, 1fr))";
  const fragment=document.createDocumentFragment();
  MAP.forEach((line,y)=>line.split("").forEach((tile,x)=>{
    const cell=document.createElement("div");
    cell.className="pixel-tile";
    cell.dataset.x=String(x);cell.dataset.y=String(y);
    cell.style.backgroundImage="url('"+(tile==="#"?TILE_SPRITES.wall:TILE_SPRITES.floor)+"')";
    let spriteId=null;
    if(x===run.x&&y===run.y)spriteId="hero";
    else {
      const enemy=enemyAt(run,x,y);
      if(enemy) {
        spriteId=enemy.kind;
        cell.dataset.entity="enemy";
        cell.classList.add("hostile-tile");
        cell.dataset.hp=String(enemy.hp);
      }
      else if(tile==="$"&&!run.collected.includes(x+","+y))spriteId="loot";
      else if(tile==="^")spriteId="hazard";
      else if(tile==="E")spriteId="exit";
    }
    if(spriteId) {
      const img=document.createElement("img");
      img.alt="";img.draggable=false;img.decoding="async";
      img.src=TILE_SPRITES[spriteId];
      cell.append(img);
      cell.classList.add("tile-"+spriteId);
    }
    fragment.append(cell);
  }));
  host.append(fragment);
}
