// ROGOV ORIGINAL ART v0.4 — functional pixel readability before decorative detail.
// All sprites are written for ROGOV in inline SVG; no external images or licenses.
import { MAP, ENEMY_TYPES, enemyAt, cameraBounds } from "./game.js";
import { hasFog,visibleCells,visionKey } from "./exploration-visibility.js";
import {trapAppearance} from "./traps.js";
import {roomSiteAppearance} from "./room-events.js";
import {TERRAIN_SVGS,terrainSpriteAt,knownCorridorAxis} from "./terrain-art.js";
import {HERO_SVGS} from "./hero-art.js";
import {currentEnemyIntent} from "./combat.js";
import {ENEMY_SVGS} from "./enemy-art.js";
import {INTERACTIVE_SVGS} from "./interaction-art.js";
import {localLightAt,SCONCE_SPRITE} from "./nhal-lighting.js";
const svg = (parts) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" shape-rendering="crispEdges">' + parts + '</svg>';
// Terrain is now sourced from the reusable, fog-safe DEV-089B atlas.
// Preserve the original floor/wall sprite keys for the legend and older UI.
const floor=TERRAIN_SVGS.floor[0];
const wall=TERRAIN_SVGS.wall[0][0];
const hero=HERO_SVGS.down;
const hero_up=HERO_SVGS.up;
const hero_left=HERO_SVGS.left;
const hero_right=HERO_SVGS.right;
const loot=INTERACTIVE_SVGS.loot;
const hazard=INTERACTIVE_SVGS.hazard;
const exit=INTERACTIVE_SVGS.exit;
const door_open=INTERACTIVE_SVGS.door_open;
const door_closed=INTERACTIVE_SVGS.door_closed;
const chest_open=INTERACTIVE_SVGS.chest_open;
const secret_open=INTERACTIVE_SVGS.secret_open;
const charognard=ENEMY_SVGS.charognard;
const guardian=ENEMY_SVGS.guardian;
const rift_larva=ENEMY_SVGS.rift_larva;
const trap_clue=INTERACTIVE_SVGS.trap_clue;
const trap_revealed=INTERACTIVE_SVGS.trap_revealed;
const trap_disabled=INTERACTIVE_SVGS.trap_disabled;
const trap_triggered=INTERACTIVE_SVGS.trap_triggered;
const site_atelier=INTERACTIVE_SVGS.site_atelier;
const site_echo=INTERACTIVE_SVGS.site_echo;
const site_cache=INTERACTIVE_SVGS.site_cache;
const site_resolved=INTERACTIVE_SVGS.site_resolved;
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
// UI-only cue taxonomy: the combat engine alone decides what happens next.
const VISUAL_CUES=Object.freeze({
  guardian_heavy:"imminent",rift_pulse:"imminent",
  charognard_lunge:"imminent",melee:"imminent",
  guardian_prepare:"preparing",rift_charge:"preparing",
  charognard_prepare:"preparing",guardian_guard:"guarding"
});
export function drawTileMap(state,host,heroFacing="down",motion=null) {
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
  // Knowledge boundary shared by ambient shading and wall sconces.
  const visibleAt=(cx,cy)=>cy>=0&&cy<map.length&&cx>=0&&cx<map[0].length&&
    (!live||live.has(visionKey(run,cx,cy)));
  host.style.gridTemplateColumns="repeat("+viewport.width+", minmax(0, 1fr))";
  const fragment=document.createDocumentFragment();
  let remainingAnimatedFoes=3; // Bound simultaneous transforms on low-end Android.
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
    // Do not calculate local light for unseen/remembered tiles. Any source
    // queried by localLightAt must itself pass visibleAt before reading map.
    const ambience=visible?localLightAt(map,x,y,visibleAt,artSeed):null;
    if(ambience)cell.classList.add("art097c-"+ambience);
    const corridorAxis=visible?knownCorridorAxis(map,x,y,visibleAt):null;
    if(corridorAxis)cell.classList.add("ui100-corridor-"+corridorAxis);
    cell.style.backgroundImage="url('"+terrainSpriteAt(map,x,y,knows,artSeed)+"')";
    let spriteId=null;
    if(x===run.x&&y===run.y){
      const facing=["up","left","right"].includes(heroFacing)?heroFacing:"down";
      spriteId=facing==="down"?"hero":"hero_"+facing;
      cell.dataset.facing=facing;
      cell.classList.add("tile-hero"); // Sprite seul, sans contour de sélection.
      if(motion?.step&&visible)cell.classList.add("art097b2-step");
    }
    else {
      const enemy=visible?enemyAt(run,x,y):null;
      if(enemy) {
        spriteId=enemy.kind;
        cell.dataset.entity="enemy";
        cell.dataset.enemyId=enemy.id;
        cell.classList.add("hostile-tile");
        // Only VISIBLE enemy sprites react on an action turn; badges stay still.
        if(motion?.foeTurn&&remainingAnimatedFoes>0){
          cell.classList.add("art097b2-foe-turn");
          remainingAnimatedFoes--;
        }
        if(enemy.kind==="charognard"&&enemy.tactic==="winding")
          cell.classList.add("enemy-charge");
        // Only inspect the intention of a VISIBLE foe; never query hidden actors
        // or attach a premonition to a remembered map cell.
        const intent=currentEnemyIntent(run,enemy);
        const cue=VISUAL_CUES[intent?.kind];
        if(cue){
          cell.classList.add("intent-"+cue);
          cell.dataset.intent=intent.kind;
          cell.title=intent.label;
          const symbol=document.createElement("span");
          symbol.className="tile-intent-marker";
          symbol.setAttribute("aria-hidden","true");
          symbol.textContent=cue==="imminent"?"!":cue==="guarding"?"▣":"…";
          cell.append(symbol);
        }
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
    // Decorative wall torch ONLY on a visible real wall, never an
    // interactive sprite or an object hinted through the fog.
    if(visible&&ambience==="sconce"){
      const torch=document.createElement("img");
      torch.src=SCONCE_SPRITE;torch.alt="";torch.draggable=false;
      torch.decoding="async";torch.className="art097c-wall-sconce";
      // Empty alt makes this decorative sconce invisible to screen readers.
      cell.append(torch);
    }
    fragment.append(cell);
  }
  host.append(fragment);
}
