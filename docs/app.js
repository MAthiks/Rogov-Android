import { SAVE_KEY, ITEMS, MAX_HP, newGame, validateSave, normalizeJournal, inspectTile, beginRun, move, attackTarget, defend, retreat, useItem, waitTurn, mapText, inventoryCount } from "./game.js";
import { drawTileMap, TILE_SPRITES, LEGEND_ITEMS } from "./tiles.js";
import { selectTarget, clearTarget, combatSnapshot, rangeBand, tileDistance } from "./combat.js";

const $ = (id) => document.getElementById(id);
let state = newGame();
let selected = new Set();
let storageLocked = false;
let installPrompt = null;
let registration = null;
let transientMessage = null;
let hasStoredGame = false;
const EVENT_LABELS = Object.freeze({
  system:"SYSTÈME", action:"ACTION", loot:"BUTIN", danger:"DANGER",
  extraction:"EXTRACTION", recall:"RAPPEL", combat:"COMBAT", heal:"SOIN", defense:"DÉFENSE"
});
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
      state = normalizeJournal(decoded);
      hasStoredGame = true;
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
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    hasStoredGame = true;
    updateTitle();
  }
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
function eventRow(entry) {
  const event = typeof entry === "string"
    ? { type:"system", turn:null, text:entry }
    : entry;
  const row = document.createElement("li");
  row.className = "journal-entry event-" + event.type;
  const category = document.createElement("span");
  category.className = "journal-entry-meta";
  category.textContent = (event.turn === null ? "—" : "T" + event.turn) + " · " + (EVENT_LABELS[event.type] || "SYSTÈME");
  const message = document.createElement("span");
  message.className = "journal-entry-text";
  message.textContent = event.text;
  row.append(category, message);
  return row;
}
function renderJournal() {
  // One movable panel; its <details> open state survives rendering and returning to Veyr.
  const target = state.run ? $("run-log-slot") : $("refuge-log-slot");
  if ($("action-panel").parentNode !== target) target.append($("action-panel"));
  const event = transientMessage || state.journal[0] || { type:"system", turn:null, text:"Aucun événement." };
  $("last-action").className = "last-action event-" + event.type;
  $("latest-type").textContent = EVENT_LABELS[event.type] || "SYSTÈME";
  $("latest-turn").textContent = event.turn === null ? "" : "T" + event.turn;
  $("latest-message").textContent = event.text;
  $("journal-count").textContent = String(state.journal.length);
  const fragment = document.createDocumentFragment();
  for (const entry of state.journal) fragment.append(eventRow(entry));
  $("journal").replaceChildren(fragment);
}
function renderLegend() {
  const target=$("graphic-legend");
  if (target.childElementCount) return;
  for (const [id,label] of LEGEND_ITEMS) {
    const chip=document.createElement("span");
    chip.className="legend-chip";
    const img=document.createElement("img");
    img.src=TILE_SPRITES[id];img.alt="";img.draggable=false;
    const title=document.createElement("span");
    title.textContent=label;
    chip.append(img,title);
    target.append(chip);
  }
}
function inspect(x,y) {
  const details=inspectTile(state,x,y);
  if(!details) return;
  $("inspect-title").textContent=details.name;
  $("inspect-description").textContent=details.description;
  $("inspect-panel").dataset.kind=details.kind;
}
/**
 * DEV-071: selecting a target is informational only. Combat rules still belong
 * to v0.6.1 until DEV-072 replaces movement-based attacks.
 */
function chooseTarget(enemyId) {
  if (!state.run) return;
  const result = selectTarget(state,enemyId);
  if (!result.changed) return;
  state=result.state;
  persist();
  render();
}
function unselectTarget() {
  const result=clearTarget(state);
  if (!result.changed) return;
  state=result.state;
  persist();
  render();
}
function renderTargetChoices() {
  const host=$("target-choices");
  host.replaceChildren();
  if (!state.run) return;
  const enemies=state.run.enemies || [];
  if (!enemies.length) {
    const empty=document.createElement("p");
    empty.className="target-empty";
    empty.textContent="Aucun ennemi restant dans cette descente.";
    host.append(empty);
    return;
  }
  for (const enemy of enemies) {
    const choice=document.createElement("button");
    choice.type="button";
    choice.className="target-choice";
    choice.setAttribute("aria-pressed",String(state.run.targetId===enemy.id));
    choice.title="Observer et cibler sans consommer de tour";
    const portrait=document.createElement("img");
    portrait.alt="";
    portrait.src=TILE_SPRITES[enemy.kind];
    const copy=document.createElement("span");
    const label=document.createElement("strong");
    label.textContent=enemy.kind==="rift_larva"?"Larve":enemy.kind==="guardian"?"Gardien":"Charognard";
    const details=document.createElement("small");
    details.textContent=rangeBand(tileDistance(state.run,enemy))+" · "+enemy.hp+" PV";
    copy.append(label,details);
    choice.append(portrait,copy);
    choice.addEventListener("click",()=>chooseTarget(enemy.id));
    host.append(choice);
  }
}
function renderCombatPreview() {
  const snapshot=combatSnapshot(state);
  const panel=$("combat-panel");
  panel.hidden=!snapshot;
  if (!snapshot) return;
  $("combat-target-name").textContent=snapshot.name;
  $("combat-target-family").textContent=snapshot.family;
  $("combat-target-health").textContent=snapshot.hp+" / "+snapshot.maxHp+" PV";
  $("combat-target-distance").textContent=snapshot.band+" · "+snapshot.distance+" cases";
  $("combat-intent").textContent=snapshot.intent?.label || "Intention inconnue";
  $("combat-intent").dataset.intent=snapshot.intent?.kind || "idle";
  $("combat-weapon").textContent=(state.run.carried["weapon.rusty_sword"]||0)>0
    ? "Épée usée" : "Sans arme";
  $("combat-defense").textContent=snapshot.defense==="none" ? "Aucune" : snapshot.defense;
  $("combat-attack").disabled=!snapshot.meleeAvailable;
  $("combat-parry").disabled=(state.run.carried["weapon.rusty_sword"]||0)<1;
  $("combat-range-note").textContent=snapshot.meleeAvailable
    ? "Cible au CONTACT : tu peux attaquer. Chaque action valide consomme un tour."
    : "Hors de portée de mêlée : rapproche-toi, prépare une défense ou recule.";

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
  renderJournal();
  if (run) {
    $("hp").textContent = run.hp + " / " + MAX_HP;
    $("health-meter").value = run.hp;
    $("health-meter").max = MAX_HP;
    $("health-meter").setAttribute("aria-valuetext", run.hp + " points de vie sur " + MAX_HP);
    $("health-meter").dataset.health = run.hp <= 4 ? "critical" : run.hp <= 8 ? "caution" : "healthy";
    $("health-state").textContent = run.hp <= 4 ? "DANGER" : run.hp <= 8 ? "BLESSE" : "STABLE";
    $("health-state").dataset.health = $("health-meter").dataset.health;
    const enemyCount = run.enemies?.length ?? 0;
    $("threat-state").textContent = enemyCount > 0 ? enemyCount + " HOSTILE" + (enemyCount > 1 ? "S" : "") : "ZONE CALME";
    $("threat-state").dataset.threat = enemyCount > 0 ? "danger" : "clear";
    $("use-bandage").disabled = (run.carried["consumable.bandage"] || 0) === 0 || run.hp >= MAX_HP;
    $("use-tonic").disabled = (run.carried["consumable.dusk_tonic"] || 0) === 0 || run.hp >= MAX_HP;
    $("use-bandage").textContent = "Bandage +4 PV (" + (run.carried["consumable.bandage"] || 0) + ")";
    $("use-tonic").textContent = "Tonique +6 PV (" + (run.carried["consumable.dusk_tonic"] || 0) + ")";
    $("turns").textContent = String(run.turns);
    $("bag-count").textContent = inventoryCount(state) + " / 8";
    $("dungeon-map").textContent = mapText(state);
    $("dungeon-map").hidden = renderMode !== "ascii";
    $("tile-map").hidden = renderMode !== "tiles";
    $("renderer-toggle").textContent = renderMode === "tiles" ? "Passer en ASCII" : "Activer les graphismes";
    $("renderer-toggle").setAttribute("aria-pressed", renderMode === "tiles" ? "true" : "false");
    $("graphic-legend").hidden = renderMode !== "tiles";
    $("ascii-legend").hidden = renderMode !== "ascii";
    if (renderMode === "tiles") drawTileMap(state, $("tile-map"));
    renderTargetChoices();
    renderCombatPreview();
    renderInventory($("bag-items"), run.carried);
  } else {
    const available = new Set(Object.keys(state.meta.stash).filter((id) => state.meta.stash[id] > 0));
    selected = new Set([...selected].filter((id) => available.has(id)));
    renderInventory($("stash-items"), state.meta.stash, true);
  }
}
function act(result) {
  if (result.changed) {
    $("inspect-title").textContent="Identifier une case";
    $("inspect-description").textContent="Touchez un élément de la carte pour connaître son rôle et ses caractéristiques.";
    $("inspect-panel").dataset.kind="floor";
  }
  if (!result.changed) {
    transientMessage = { type:"action", turn:state.run?.turns ?? null, text:result.message };
    renderJournal();
    return;
  }
  transientMessage = null;
  state = result.state;
  // If an enemy dies during the v0.6 collision combat, never leave a stale target.
  if (state.run?.targetId && !state.run.enemies?.some(e=>e.id===state.run.targetId && e.hp>0)) {
    state=clearTarget(state).state;
  }
  if (!state.run) selected.clear();
  persist();
  render();
}
function updateTitle() {
  const primary = $("title-continue");
  primary.textContent = hasStoredGame ? "CONTINUER" : "COMMENCER";
  $("title-save-info").textContent = hasStoredGame
    ? state.meta.hero.title + " · Niveau " + state.meta.hero.level + " · " + state.meta.hero.xp + " XP" +
      (state.run ? " · Descente en cours" : " · Refuge de Veyr")
    : storageLocked
      ? "Sauvegarde incompatible : nouvelle partie possible après confirmation."
      : "Aucune sauvegarde — commence une nouvelle aventure.";
  $("title-render-mode").textContent = "Rendu actuel : " + (renderMode === "tiles" ? "graphique" : "ASCII");
}
function enterGame() {
  $("title-screen").hidden = true;
  $("game-shell").hidden = false;
  render();
  window.scrollTo(0,0);
  const target = state.run ? $("exp-title") : $("refuge-title");
  target.setAttribute("tabindex","-1");
  target.focus({preventScroll:true});
}
function returnToTitle() {
  $("game-shell").hidden = true;
  $("title-screen").hidden = false;
  updateTitle();
  window.scrollTo(0,0);
  $("title-continue").focus({preventScroll:true});
}
$("title-continue").addEventListener("click", enterGame);
$("title-new").addEventListener("click", () => {
  if ((hasStoredGame || storageLocked) &&
      !window.confirm("Effacer définitivement le héros, son coffre et la descente en cours sur cet appareil ?")) return;
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    showWarning("Impossible de supprimer la sauvegarde : aucun changement n'a été effectué.");
    return;
  }
  storageLocked = false;
  hasStoredGame = false;
  state = newGame();
  selected.clear();
  transientMessage = null;
  $("warning").hidden = true;
  persist();
  enterGame();
});
$("title-options").addEventListener("click", () => {
  const panel = $("title-options-panel");
  panel.hidden = !panel.hidden;
  $("title-options").setAttribute("aria-expanded", String(!panel.hidden));
});
$("title-render-mode").addEventListener("click", () => {
  renderMode = renderMode === "tiles" ? "ascii" : "tiles";
  try { localStorage.setItem(VIEW_KEY,renderMode); } catch { /* Keep current preference in memory. */ }
  updateTitle();
});
$("back-to-title").addEventListener("click", returnToTitle);

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
$("wait-btn").addEventListener("click", () => act(waitTurn(state)));
$("use-bandage").addEventListener("click", () => act(useItem(state, "consumable.bandage")));
$("use-tonic").addEventListener("click", () => act(useItem(state, "consumable.dusk_tonic")));
$("target-clear").addEventListener("click", unselectTarget);
$("combat-attack").addEventListener("click",()=>act(attackTarget(state)));
$("combat-dodge").addEventListener("click",()=>act(defend(state,"dodge")));
$("combat-parry").addEventListener("click",()=>act(defend(state,"parry")));
$("combat-block").addEventListener("click",()=>act(defend(state,"block")));
$("combat-retreat").addEventListener("click",()=>act(retreat(state)));
window.addEventListener("keydown", (event) => {
  if (!state.run) return;
  const target = event.target;
  if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
  const direction = { ArrowUp:"up", ArrowDown:"down", ArrowLeft:"left", ArrowRight:"right", w:"up", s:"down", a:"left", d:"right" }[event.key];
  if (direction) {
    event.preventDefault();
    act(move(state,direction));
    return;
  }
  if (event.key.toLowerCase()==="c" && target?.tagName!=="BUTTON") {
    const enemies=state.run.enemies || [];
    if (enemies.length) {
      event.preventDefault();
      const index=enemies.findIndex(e=>e.id===state.run.targetId);
      chooseTarget(enemies[(index+1)%enemies.length].id);
    }
    return;
  }
  const action = { " ":"wait", "1":"bandage", "2":"tonic", "f":"attack", "e":"dodge", "p":"parry", "b":"block", "r":"retreat" }[event.key.toLowerCase()];
  if (action && target?.tagName !== "BUTTON") {
    event.preventDefault();
    if (action === "wait") act(waitTurn(state));
    if (action === "bandage") act(useItem(state, "consumable.bandage"));
    if (action === "tonic") act(useItem(state, "consumable.dusk_tonic"));
    if (action === "attack") act(attackTarget(state));
    if (action === "dodge") act(defend(state,"dodge"));
    if (action === "parry") act(defend(state,"parry"));
    if (action === "block") act(defend(state,"block"));
    if (action === "retreat") act(retreat(state));
  }
});
renderLegend();
$("tile-map").addEventListener("click", (event) => {
  const cell=event.target.closest(".pixel-tile");
  if (!cell || !$("tile-map").contains(cell)) return;
  if (cell.dataset.enemyId) chooseTarget(cell.dataset.enemyId);
  inspect(Number(cell.dataset.x),Number(cell.dataset.y));
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
updateTitle();
render();
