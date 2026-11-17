import { SAVE_KEY, SCHEMA_VERSION, ITEMS, newGame, validateSave, beginRun, move, mapText, inventoryCount } from "./game.js";
import { drawTileMap } from "./tiles.js";

const $ = (id) => document.getElementById(id);
let state = newGame();
let selected = new Set();
let storageLocked = false;
let installPrompt = null;
let registration = null;
const VIEW_KEY = "rogov-renderer-v1";
let renderMode = "tiles";
try { renderMode = localStorage.getItem(VIEW_KEY) === "ascii" ? "ascii" : "tiles"; }
catch { /* Default to graphic display without storage. */ }

try {
  const saved = localStorage.getItem(SAVE_KEY);
  if (saved !== null) {
    const decoded = JSON.parse(saved);
    if (!validateSave(decoded)) {
      storageLocked = true;
      showWarning("Sauvegarde incompatible : elle n'a pas été effacée. Choisis « Réinitialiser » si tu veux recommencer.");
    } else {
      state = decoded;
    }
  }
} catch (error) {
  storageLocked = true;
  showWarning("Impossible de lire la sauvegarde locale. Tu peux jouer sans sauvegarde, ou réinitialiser.");
}
function showWarning(message) {
  $("warning").textContent = message;
  $("warning").hidden = false;
}
function persist() {
  if (storageLocked) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
  catch { showWarning("La sauvegarde locale est indisponible (stockage ou navigation privée)."); }
}
function infoItem(id, count, checkable=false) {
  const row = document.createElement("label");
  row.className = "item-row";
  if (checkable) {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = selected.has(id);
    box.setAttribute("aria-label", "Emporter " + ITEMS[id].name);
    box.addEventListener("change", () => {
      if (box.checked) selected.add(id); else selected.delete(id);
    });
    row.append(box);
  }
  const icon = document.createElement("span");
  icon.className = "item-icon";
  icon.textContent = ITEMS[id].symbol;
  const text = document.createElement("span");
  text.className = "item-label";
  const strong = document.createElement("strong");
  strong.textContent = ITEMS[id].name;
  const small = document.createElement("small");
  small.textContent = ITEMS[id].type;
  text.append(strong,small);
  const amount = document.createElement("span");
  amount.className = "count";
  amount.textContent = "×" + count;
  row.append(icon,text,amount);
  return row;
}
function renderInventory(container, items, selectable=false) {
  container.replaceChildren();
  const entries = Object.entries(items).filter(([, count]) => count > 0);
  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = selectable ? "Le coffre est vide. Une descente sans équipement reste possible." : "Ton sac est vide.";
    container.append(empty);
  }
  for (const [id, count] of entries) {
    if (ITEMS[id]) container.append(infoItem(id,count,selectable));
  }
}
function render() {
  const run = state.run;
  $("mode-status").textContent = run ? "DESCENTE" : "REFUGE";
  $("hero-name").textContent = state.meta.hero.title;
  $("hero-level").textContent = String(state.meta.hero.level);
  $("hero-xp").textContent = state.meta.hero.xp + " XP";
  $("run-stats").textContent = state.meta.extractions + " / " + state.meta.recalls;
  $("refuge").hidden = Boolean(run);
  $("expedition").hidden = !run;
  $("journal").replaceChildren();
  for (const entry of state.journal) {
    const li = document.createElement("li");
    li.textContent = entry;
    $("journal").append(li);
  }
  if (run) {
    $("hp").textContent = run.hp + " / 12";
    $("turns").textContent = String(run.turns);
    $("bag-count").textContent = inventoryCount(state) + " / 8";
    $("dungeon-map").textContent = mapText(state);
    $("dungeon-map").hidden = renderMode !== "ascii";
    $("tile-map").hidden = renderMode !== "tiles";
    $("renderer-toggle").textContent = renderMode === "tiles" ? "Passer en ASCII" : "Activer les graphismes";
    $("renderer-toggle").setAttribute("aria-pressed", renderMode === "tiles" ? "true" : "false");
    if (renderMode === "tiles") drawTileMap(state, $("tile-map"));
    renderInventory($("bag-items"), run.carried);
  } else {
    const available = new Set(Object.keys(state.meta.stash).filter((id) => state.meta.stash[id] > 0));
    selected = new Set([...selected].filter((id) => available.has(id)));
    renderInventory($("stash-items"), state.meta.stash, true);
  }
}
function act(result) {
  if (!result.changed) {
    $("network-note").textContent = result.message;
    return;
  }
  state = result.state;
  if (!state.run) selected.clear();
  persist();
  render();
}
$("start-btn").addEventListener("click", () => {
  if (storageLocked) {
    showWarning("La sauvegarde actuelle n'est pas accessible. Réinitialise d'abord ou accepte de jouer sans sauvegarde.");
    return;
  }
  act(beginRun(state,[...selected]));
});
for (const button of document.querySelectorAll("[data-direction]")) {
  button.addEventListener("click", () => act(move(state,button.dataset.direction)));
}
window.addEventListener("keydown", (event) => {
  const direction = { ArrowUp:"up", ArrowDown:"down", ArrowLeft:"left", ArrowRight:"right", w:"up", s:"down", a:"left", d:"right" }[event.key];
  if (direction && state.run) {
    event.preventDefault();
    act(move(state,direction));
  }
});
$("renderer-toggle").addEventListener("click", () => {
  renderMode = renderMode === "tiles" ? "ascii" : "tiles";
  try { localStorage.setItem(VIEW_KEY, renderMode); } catch { /* Preference remains temporary. */ }
  render();
});
let touchStart = null;
for (const surface of [$("dungeon-map"), $("tile-map")]) {
surface.addEventListener("touchstart", (event) => {
  const t = event.changedTouches[0];
  touchStart = { x:t.clientX,y:t.clientY };
},{passive:true});
surface.addEventListener("touchend", (event) => {
  if (!touchStart || !state.run) return;
  const t = event.changedTouches[0];
  const dx = t.clientX - touchStart.x;
  const dy = t.clientY - touchStart.y;
  touchStart = null;
  if (Math.max(Math.abs(dx),Math.abs(dy)) < 25) return;
  act(move(state,Math.abs(dx)>Math.abs(dy) ? (dx>0?"right":"left") : (dy>0?"down":"up")));
},{passive:true});
}
$("reset-btn").addEventListener("click", () => {
  if (!window.confirm("Effacer le héros, le coffre et toutes les expéditions de ROGOV sur cet appareil ?")) return;
  try { localStorage.removeItem(SAVE_KEY); storageLocked = false; }
  catch { showWarning("Impossible de modifier le stockage du navigateur."); return; }
  state = newGame();
  selected.clear();
  $("warning").hidden = true;
  persist();
  render();
});
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  $("install-btn").textContent = "Installer ROGOV sur l'écran d'accueil";
});
$("install-btn").addEventListener("click", async () => {
  if (installPrompt) {
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
  } else {
    $("network-note").textContent = "Sur Android : ouvre Chrome → menu ⋮ → « Ajouter à l'écran d'accueil » ou « Installer l'application ».";
  }
});
$("update-btn").addEventListener("click", () => {
  if (registration?.waiting) registration.waiting.postMessage({ type:"SKIP_WAITING" });
  else window.location.reload();
});
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload());
  navigator.serviceWorker.register("./sw.js").then((reg) => {
    registration = reg;
    function checkUpdate() {
      if (reg.waiting && navigator.serviceWorker.controller) $("update-btn").hidden = false;
    }
    checkUpdate();
    reg.addEventListener("updatefound", () => {
      reg.installing?.addEventListener("statechange", checkUpdate);
    });
  }).catch(() => {
    $("network-note").textContent = "Le jeu fonctionne en ligne ; le mode hors ligne n'a pas pu être activé.";
  });
}
render();
