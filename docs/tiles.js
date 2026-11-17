// ROGOV ORIGINAL ART v0.4 — functional pixel readability before decorative detail.
// All sprites are written for ROGOV in inline SVG; no external images or licenses.
import { MAP, ENEMY_TYPES, enemyAt } from "./game.js";
const svg = (parts) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" shape-rendering="crispEdges">' + parts + '</svg>';
const floor=svg(
  '<rect width="24" height="24" fill="#202c33"/>'+
  '<rect x="4" y="6" width="4" height="1" fill="#293840"/>'+
  '<rect x="16" y="18" width="3" height="1" fill="#283740"/>'
);
const wall=svg(
  '<rect width="24" height="24" fill="#131d24"/>'+
  '<rect x="1" y="1" width="22" height="10" fill="#455b65"/>'+
  '<rect x="1" y="13" width="10" height="10" fill="#394e59"/>'+
  '<rect x="13" y="13" width="10" height="10" fill="#394e59"/>'+
  '<path d="M1 2h22M1 14h10M13 14h10" stroke="#77909a" stroke-width="1"/>'+
  '<path d="M0 12h24M12 12v12" stroke="#0c161c" stroke-width="2"/>'
);
const hero=svg(
  '<path d="M5 23L5 10 9 4 11 1h3l5 9 1 13z" fill="#182a2c" stroke="#ebf0d0" stroke-width="2"/>'+
  '<path d="M7 10L11 4h3l4 6v4H7z" fill="#6e9d85"/>'+
  '<path d="M8 12h8v4H8z" fill="#112125"/>'+
  '<rect x="9" y="13" width="2" height="2" fill="#f6ffbc"/>'+
  '<rect x="14" y="13" width="2" height="2" fill="#f6ffbc"/>'+
  '<path d="M7 18l5-3 5 3 1 4H6z" fill="#437367"/>'+
  '<rect x="20" y="5" width="2" height="17" fill="#ddca8e"/>'+
  '<rect x="18" y="10" width="6" height="2" fill="#ddca8e"/>'
);
const loot=svg(
  '<path d="M3 12L5 8h14l2 4v9H3z" fill="#72552e" stroke="#f4d389" stroke-width="2"/>'+
  '<path d="M4 12h16" stroke="#392b19" stroke-width="2"/>'+
  '<rect x="10" y="12" width="4" height="6" fill="#ffe5a2"/>'+
  '<rect x="11" y="14" width="2" height="2" fill="#76551a"/>'
);
const hazard=svg(
  '<path d="M12 1L23 12 12 23 1 12Z" fill="#401925" stroke="#ff8b8f" stroke-width="2"/>'+
  '<path d="M12 5l6 7-6 7-6-7Z" fill="#8e3640"/>'+
  '<path d="M11 6l1 6-3 7M14 9l-2 3 3 5" stroke="#ffd2a9" stroke-width="2" fill="none"/>'
);
const exit=svg(
  '<path d="M2 23V8L7 2h10l5 6v15" fill="#113d3d" stroke="#b9f2d7" stroke-width="2"/>'+
  '<path d="M7 23V10l5-5 5 5v13" fill="#479c96"/>'+
  '<path d="M11 10h2v13h-2" fill="#efffe4"/>'+
  '<path d="M1 23h22" stroke="#b9f2d7" stroke-width="2"/>'
);
const charognard=svg(
  '<path d="M1 19L4 12 8 15 12 9l8 4 3 8-7 1-7-3-5 3Z" fill="#6a442f" stroke="#f1aa78" stroke-width="2"/>'+
  '<path d="M8 14L5 5l9 8 7-9-2 13" fill="#995c3c" stroke="#e5a275" stroke-width="1"/>'+
  '<path d="M15 15h3v3h-3" fill="#fff1ab"/>'+
  '<path d="M2 22l3-5M18 22l3-5" stroke="#e9ab7f" stroke-width="2"/>'
);
const guardian=svg(
  '<path d="M4 23L3 10l5-4 2-4h5l3 4 3 4-1 13Z" fill="#576271" stroke="#c2d6df" stroke-width="2"/>'+
  '<path d="M7 8L10 4h5l2 4-2 7H9Z" fill="#273a47" stroke="#d5d8d5" stroke-width="1"/>'+
  '<path d="M9 12h7" stroke="#f49f8d" stroke-width="3"/>'+
  '<path d="M7 16h10M8 21h8" stroke="#9eabb7" stroke-width="2"/>'+
  '<path d="M21 1v22" stroke="#dbd1ae" stroke-width="2"/>'
);
const SPRITE_SVGS={ floor, wall, hero, loot, hazard, exit, charognard, guardian };
export const TILE_SPRITES=Object.freeze(Object.fromEntries(
  Object.entries(SPRITE_SVGS).map(([id,source])=>[id,"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(source)])
));
export const LEGEND_ITEMS=Object.freeze([
  ["hero","Joueur"],["charognard","Charognard"],["guardian","Gardien déchu"],
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
