// ROGOV ORIGINAL ART v0.4 — functional pixel readability before decorative detail.
// All sprites are written for ROGOV in inline SVG; no external images or licenses.
import { MAP, ENEMY_TYPES, enemyAt, cameraBounds } from "./game.js";
import { hasFog,visibleCells,visionKey } from "./exploration-visibility.js";
import {trapAppearance} from "./traps.js";
import {roomSiteAppearance} from "./room-events.js";
import {TERRAIN_SVGS,terrainSpriteAt} from "./terrain-art.js";
import {HERO_SVGS} from "./hero-art.js";
const svg = (parts) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" shape-rendering="crispEdges">' + parts + '</svg>';
// Terrain is now sourced from the reusable, fog-safe DEV-089B atlas.
// Preserve the original floor/wall sprite keys for the legend and older UI.
const floor=TERRAIN_SVGS.floor[0];
const wall=TERRAIN_SVGS.wall[0][0];
const hero=HERO_SVGS.down;
const hero_up=HERO_SVGS.up;
const hero_left=HERO_SVGS.left;
const hero_right=HERO_SVGS.right;
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
const door_open=svg(
  // Open doorway: truly dark passage between stone jambs, not a green door slab.
  '<rect width="24" height="24" fill="#111c23"/>'+
  '<path d="M2 23V5L6 2h12l4 3v18" stroke="#9eaaa0" stroke-width="3" fill="none"/>'+
  '<rect x="4" y="6" width="3" height="17" fill="#495961"/>'+
  '<rect x="17" y="6" width="3" height="17" fill="#495961"/>'+
  '<path d="M8 21h8M9 17h6" stroke="#384a4a" stroke-width="1"/>'+
  '<rect x="17" y="9" width="2" height="5" fill="#bcad7d"/>'
);
const door_closed=svg(
  // Closed is solid and opaque. Vertical timber stays distinct from stone.
  '<rect width="24" height="24" fill="#18252c"/>'+
  '<rect x="2" y="2" width="20" height="21" fill="#38444a" stroke="#9eaaa0" stroke-width="2"/>'+
  '<rect x="5" y="4" width="14" height="18" fill="#4f5146"/>'+
  '<path d="M8 4v18M13 4v18M17 4v18" stroke="#252f31" stroke-width="2"/>'+
  '<path d="M5 10h14M5 18h14" stroke="#8c836a" stroke-width="1"/>'+
  '<rect x="17" y="12" width="2" height="3" fill="#f5e3a5"/>'
);
const chest_open=svg(
  '<rect x="2" y="12" width="20" height="10" fill="#4c3928" stroke="#d1b789" stroke-width="2"/>'+
  '<path d="M3 10L7 3h13l2 6-3 3H3Z" fill="#866239" stroke="#f4d389" stroke-width="2"/>'+
  '<rect x="11" y="15" width="3" height="3" fill="#e9db9a"/>'
);
const secret_open=svg(
  '<rect x="1" y="1" width="22" height="22" fill="#233833" stroke="#bdac83" stroke-width="2"/>'+
  '<path d="M5 23L7 6l5-4 5 4 2 17" fill="#071c22" stroke="#d2c18c" stroke-width="2"/>'+
  '<path d="M10 10l3-3-1 7 3 3-2 5" fill="none" stroke="#8cd2bf" stroke-width="2"/>'
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
const trap_clue=svg('<path d="M2 7h20M4 17h16" stroke="#b29c69" stroke-width="1.5" stroke-dasharray="4 3"/>'+
  '<path d="M5 12l5-4 4 7 5-4" stroke="#d4c18b" stroke-width="2" fill="none"/>');
const trap_revealed=svg('<rect x="2" y="2" width="20" height="20" fill="#4d392b" stroke="#e9b875" stroke-width="2"/>'+
  '<path d="M12 4v11M12 19v2" stroke="#ffe5b4" stroke-width="3"/>');
const trap_disabled=svg('<rect x="2" y="2" width="20" height="20" fill="#233e36" stroke="#7ac2a2" stroke-width="2"/>'+
  '<path d="M5 12l5 5L20 7" stroke="#c3ead0" stroke-width="3" fill="none"/>');
const trap_triggered=svg('<rect x="2" y="2" width="20" height="20" fill="#31383c" stroke="#76838b" stroke-width="1"/>'+
  '<path d="M5 7l14 10M19 7L5 17" stroke="#b3b6ab" stroke-width="2"/>');
// Original, offline-first SVG markers for the three DEV-087 rooms.
const site_atelier=svg('<rect x="2" y="13" width="20" height="8" fill="#654c36" stroke="#c1a17b" stroke-width="2"/>'+
  '<path d="M3 10h18M6 10v4M18 10v4" stroke="#d2bd91" stroke-width="2"/>'+
  '<path d="M8 4l8 4M12 3l-4 9" stroke="#b6d7c1" stroke-width="2"/>'+
  '<rect x="15" y="13" width="4" height="5" fill="#b3a67a"/>');
const site_echo=svg('<rect x="2" y="2" width="20" height="20" rx="2" fill="#263440" stroke="#89b5ba" stroke-width="2"/>'+
  '<path d="M6 19V5h12v14M9 8l6 8M15 8l-6 8" fill="none" stroke="#a5ded8" stroke-width="2"/>'+
  '<path d="M3 12h4M17 12h4" stroke="#e4d1ac" stroke-width="2"/>');
const site_cache=svg('<path d="M3 20V6L8 2h12v18Z" fill="#37362f" stroke="#cfb484" stroke-width="2"/>'+
  '<rect x="7" y="10" width="13" height="8" fill="#715b3e" stroke="#e7ce90" stroke-width="1.5"/>'+
  '<rect x="12" y="12" width="3" height="4" fill="#b7ddbe"/>');
const site_resolved=svg('<rect x="3" y="3" width="18" height="18" rx="2" fill="#243c38" stroke="#6d9889" stroke-width="2"/>'+
  '<path d="M7 12l4 4 7-8" fill="none" stroke="#a3d4b6" stroke-width="2"/>');
const SPRITE_SVGS={ floor, wall, hero, hero_up, hero_left, hero_right, loot, hazard, exit, door_open, door_closed, secret_open, chest_open, charognard, guardian, rift_larva, trap_clue, trap_revealed, trap_disabled, trap_triggered, site_atelier, site_echo, site_cache, site_resolved };
export const TILE_SPRITES=Object.freeze(Object.fromEntries(
  Object.entries(SPRITE_SVGS).map(([id,source])=>[id,"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(source)])
));
export const LEGEND_ITEMS=Object.freeze([
  ["hero","Joueur"],["charognard","Charognard"],["guardian","Gardien déchu"],["rift_larva","Larve de faille"],
  ["loot","Coffre / butin"],["chest_open","Coffre ouvert"],["hazard","Faille mortelle"],["exit","Extraction"],["secret_open","Secret découvert"],
  ["trap_clue","Sol suspect"],["trap_revealed","Piège identifié"],["trap_disabled","Piège désamorcé"],
  ["site_atelier","Atelier"],["site_echo","Chambre de l’Écho"],["site_cache","Cache oubliée"],["site_resolved","Lieu exploré"]
]);
export function drawTileMap(state,host,heroFacing="down") {
  host.replaceChildren();
  if(!state.run)return;
  const run=state.run;
  const map=run.map||MAP;
  const viewport=cameraBounds(run);
  const live=hasFog(run)?visibleCells(run):null;
  const seen=live?new Set(run.exploration.seen):null;
  // Known-only wall connectors prevent the artwork from hinting at unknown
  // passages. The visual variant does not touch RNG, save state or turns.
  const knows=(cx,cy)=>{
    if(cy<0||cy>=map.length||cx<0||cx>=map[0].length)return false;
    if(!live)return true;
    const key=visionKey(run,cx,cy);
    return live.has(key)||seen.has(key);
  };
  const artSeed=run.layoutId||"rogov-legacy";
  host.style.gridTemplateColumns="repeat("+viewport.width+", minmax(0, 1fr))";
  const fragment=document.createDocumentFragment();
  for(let y=viewport.top;y<viewport.top+viewport.height;y++)
    for(let x=viewport.left;x<viewport.left+viewport.width;x++){
    const tile=map[y][x];
    const cell=document.createElement("div");
    cell.className="pixel-tile";
    cell.dataset.x=String(x);cell.dataset.y=String(y);
    const id=live?visionKey(run,x,y):null;
    const visible=!live||live.has(id);
    const remembered=!visible&&seen.has(id);
    cell.dataset.knowledge=visible?"visible":remembered?"remembered":"unknown";
    if(!visible&&!remembered){
      cell.classList.add("tile-unknown");
      fragment.append(cell);
      continue; // No map texture, sprite or hidden entity data in the DOM.
    }
    if(remembered)cell.classList.add("tile-remembered");
    cell.style.backgroundImage="url('"+terrainSpriteAt(map,x,y,knows,artSeed)+"')";
    let spriteId=null;
    if(x===run.x&&y===run.y){
      const facing=["up","left","right"].includes(heroFacing)?heroFacing:"down";
      spriteId=facing==="down"?"hero":"hero_"+facing;
      cell.dataset.facing=facing;
      cell.classList.add("tile-hero"); // Preserve the contrast outline at mobile size.
    }
    else {
      const enemy=visible?enemyAt(run,x,y):null;
      if(enemy) {
        spriteId=enemy.kind;
        cell.dataset.entity="enemy";
        cell.dataset.enemyId=enemy.id;
        cell.classList.add("hostile-tile");
        if (run.targetId===enemy.id) cell.classList.add("selected-target-tile");
        cell.dataset.hp=String(enemy.hp);
      }
      else if(visible&&trapAppearance(run,x,y))
        spriteId=trapAppearance(run,x,y).sprite;
      else if(visible&&roomSiteAppearance(run,x,y))
        spriteId=roomSiteAppearance(run,x,y).sprite;
      else if(run.secrets?.some(s=>s.revealed&&s.x===x&&s.y===y))
        spriteId="secret_open";
      else if(tile==="$"&&run.rooms)
        spriteId=run.collected.includes(x+","+y)?"chest_open":"loot";
      else if(tile==="$"&&!run.collected.includes(x+","+y))spriteId="loot";
      else if(tile==="^")spriteId="hazard";
      else if(tile==="E")spriteId="exit";
      else if(tile==="+")spriteId=run.doors?.find(d=>d.x===x&&d.y===y)?.open?
        "door_open":"door_closed";
    }
    if(spriteId) {
      const img=document.createElement("img");
      img.alt="";img.draggable=false;img.decoding="async";
      img.src=TILE_SPRITES[spriteId];
      cell.append(img);
      cell.classList.add("tile-"+spriteId);
    }
    fragment.append(cell);
  }
  host.append(fragment);
}
