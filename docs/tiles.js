// ROGOV VISUAL PACK v0.2 — six original, scalable pixel-art sprites.
// Inline SVG: no external images, no network dependency, no third-party license.
import { MAP } from "./game.js";

const svg = (body) => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" shape-rendering="crispEdges">' + body + '</svg>';

const floor = svg(
  '<rect width="24" height="24" fill="#202c34"/>' +
  '<path d="M0 7h8l3-3h13M5 24v-7l4-2M17 0v7l7 2M12 14l3 3-2 7" stroke="#2e3d45" fill="none" stroke-width="1"/>' +
  '<rect x="4" y="4" width="2" height="1" fill="#34444b"/><rect x="19" y="18" width="2" height="2" fill="#111b22"/>' +
  '<path d="M0 23h24" stroke="#111920"/>'
);
const wall = svg(
  '<rect width="24" height="24" fill="#0c151b"/>' +
  '<rect x="1" y="2" width="22" height="8" fill="#526268"/><rect x="1" y="12" width="11" height="10" fill="#3c5057"/><rect x="14" y="12" width="9" height="10" fill="#40545b"/>' +
  '<path d="M2 3h20M2 13h10M14 13h9" stroke="#708187" stroke-width="1"/>' +
  '<path d="M1 10h22M12 11v12" stroke="#0c151b" stroke-width="2"/>' +
  '<rect x="5" y="7" width="3" height="2" fill="#263a40"/><rect x="18" y="16" width="2" height="4" fill="#22373a"/>'
);
const hero = svg(
  '<path d="M7 7L11 2h3l4 5-1 5 3 7-5 3H8l-5-3 4-7z" fill="#192527" stroke="#87a9a2" stroke-width="1"/>' +
  '<path d="M8 6l4-3 4 3v8H8z" fill="#476965"/>' +
  '<path d="M8 10h8v5H8z" fill="#101a1b"/>' +
  '<rect x="9" y="11" width="2" height="1" fill="#c3ebaa"/><rect x="13" y="11" width="2" height="1" fill="#c3ebaa"/>' +
  '<path d="M7 14l-3 5 5 3h6l5-3-3-5-5 2z" fill="#2f534b"/>' +
  '<rect x="11" y="16" width="2" height="6" fill="#a4b99b"/>' +
  '<path d="M18 8v11" stroke="#d3c18c" stroke-width="2"/><path d="M16 11h4" stroke="#d3c18c" stroke-width="2"/>'
);
const loot = svg(
  '<ellipse cx="12" cy="20" rx="9" ry="2" fill="#0c1317" opacity=".7"/>' +
  '<rect x="4" y="11" width="16" height="9" fill="#74552d" stroke="#d1ad66" stroke-width="1"/>' +
  '<path d="M4 11V8c0-5 16-5 16 0v3" fill="#8b6a3a" stroke="#d1ad66" stroke-width="1"/>' +
  '<path d="M4 12h16" stroke="#2b1e14" stroke-width="2"/>' +
  '<rect x="10" y="11" width="4" height="5" fill="#f4d078"/><rect x="11" y="13" width="2" height="2" fill="#765522"/>'
);
const hazard = svg(
  '<path d="M12 1l10 11-10 11L2 12z" fill="#3b1720" stroke="#ba4656" stroke-width="2"/>' +
  '<path d="M12 5l5 7-5 7-5-7z" fill="#7d303d"/>' +
  '<path d="M12 5v14M7 12h10" stroke="#f39b8e" stroke-width="1"/>' +
  '<rect x="10" y="10" width="4" height="4" fill="#1b0d14"/><rect x="11" y="11" width="2" height="2" fill="#ffb5a3"/>'
);
const exit = svg(
  '<path d="M4 23V8l3-5h10l3 5v15" fill="#18353b" stroke="#7fbab5" stroke-width="2"/>' +
  '<path d="M8 22V10l4-4 4 4v12" fill="#56a3a0" opacity=".85"/>' +
  '<path d="M10 19l2-9 2 9-2 3z" fill="#c0e6c3"/>' +
  '<path d="M2 22h20" stroke="#c5dcb4" stroke-width="2"/>' +
  '<rect x="11" y="3" width="2" height="2" fill="#d0efc7"/>'
);

export const TILE_SPRITES = Object.freeze(Object.fromEntries(
  Object.entries({ floor, wall, hero, loot, hazard, exit }).map(([name, source]) => [
    name, "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(source)
  ])
));

export function drawTileMap(state, host) {
  host.replaceChildren();
  if (!state.run) return;
  const run = state.run;
  host.style.gridTemplateColumns = "repeat(" + MAP[0].length + ", minmax(0, 1fr))";
  const fragment = document.createDocumentFragment();
  MAP.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const symbol = row[x];
      const wall = symbol === "#";
      const cell = document.createElement("div");
      cell.className = "pixel-tile";
      cell.style.backgroundImage = "url('" + (wall ? TILE_SPRITES.wall : TILE_SPRITES.floor) + "')";
      let object = null;
      if (x === run.x && y === run.y) object = "hero";
      else if (symbol === "$" && !run.collected.includes(x + "," + y)) object = "loot";
      else if (symbol === "^") object = "hazard";
      else if (symbol === "E") object = "exit";
      if (object) {
        const sprite = document.createElement("img");
        sprite.alt = "";
        sprite.draggable = false;
        sprite.src = TILE_SPRITES[object];
        sprite.decoding = "async";
        cell.append(sprite);
      }
      fragment.append(cell);
    }
  });
  host.append(fragment);
}
