import { SAVE_KEY, ITEMS, MAX_HP, newGame, validateSave, normalizeJournal, inspectTile, beginRun, resolveFloorExit, craftAtRefuge, equipItem, unequipItem, discardItem, move, toggleDoor, openChest, searchSecret, searchTrap, disarmTrap, resolveRoomSite, attackTarget, defend, retreat, useItem, waitTurn, mapViewportText, inventoryCount } from "./game.js";
import { drawTileMap, TILE_SPRITES, LEGEND_ITEMS } from "./tiles.js";
import { setupUi092 } from "./ui092.js";
import {MAX_FLOOR_DEPTH,floorChoiceAvailable,canDescendFurther} from "./floors.js";
import {depthIntel} from "./depth-balance.js";
import { narrativeObjective, NAR093_LORE } from "./narrative.js";
import { echoDossier } from "./echo-investigation.js";
import { ITEM_SPRITES, VEYR_NPC_IDS, VEYR_NPC_CONCEPTS, VEYR_NPC_SPRITES } from "./veyr-art.js";
import {heroFacingFromStep} from "./hero-art.js";
import { nearbySecretHint } from "./secrets.js";
import {nearbyTrapHint,trapHintText} from "./traps.js";
import {ROOM_SITES,nearbyRoomSite} from "./room-events.js";
import {expeditionReport} from "./expedition-report.js";
import { hasFog,explorationState,visibleCells,minimapText } from "./exploration-visibility.js";
import {RESOURCE_ID,RECIPES,canCraft} from "./economy.js";
import { STAT_KEYS, STAT_LABELS, ARCHETYPES, EQUIPMENT_CATALOG,
  heroDerivedStats, enemyDerivedStats, playerLoadout, EMPTY_LOADOUT } from "./stats.js";
import {TACTICAL_COSTS, hitChance, defenseChance} from "./combat-rules.js";
import { selectTarget, clearTarget, combatSnapshot, currentEnemyIntent,
  rangeBand, tileDistance } from "./combat.js";

const $ = (id) => document.getElementById(id);
let state = newGame();
let selected = new Set();
let selectedQuantities = new Map();
let preparedLoadout = {};
let selectedDoor = null;
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
let heroFacing = "down"; // Render-only: preserve SCHEMA_VERSION and all old saves.
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
  const row = document.createElement(checkable?"label":"div");
  row.className = "item-row";
  let qtyInput=null;
  if (checkable) {
    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = selected.has(id);
    box.setAttribute("aria-label", "Emporter " + ITEMS[id].name);
    box.addEventListener("change", () => {
      if(box.checked) {
        selected.add(id);
        selectedQuantities.set(id,selectedQuantities.get(id)||1);
      } else {
        selected.delete(id);
        selectedQuantities.delete(id);
      }
      if(qtyInput)qtyInput.disabled=!box.checked;
      updatePreparationControls();
    });
    row.append(box);
  }
  const icon = document.createElement("span");
  icon.className = "item-icon";
  icon.textContent = ITEMS[id].symbol;
  if (ITEM_SPRITES[id]) {
    const image = document.createElement("img");
    image.src = ITEM_SPRITES[id];
    image.alt = "";
    image.width = 28;
    image.height = 28;
    image.draggable = false;
    image.decoding = "async";
    // Retain the legacy ASCII symbol if an SVG fails on a device.
    image.addEventListener("error",()=>{icon.textContent=ITEMS[id].symbol;},{once:true});
    icon.replaceChildren(image);
  }
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
  if(checkable&&count>1){
    qtyInput=document.createElement("select");
    qtyInput.className="prep-quantity";
    qtyInput.setAttribute("aria-label","Quantité à emporter : "+ITEMS[id].name);
    for(let i=1;i<=Math.min(count,8);i++){
      const opt=document.createElement("option");
      opt.value=String(i);opt.textContent=String(i);
      qtyInput.append(opt);
    }
    qtyInput.value=String(Math.min(count,selectedQuantities.get(id)||1,8));
    qtyInput.disabled=!selected.has(id);
    qtyInput.addEventListener("change",()=>{
      if(!selected.has(id))return;
      selectedQuantities.set(id,Number(qtyInput.value));
      updatePreparationControls();
    });
    row.append(qtyInput);
  }
  return row;
}
// Display-only concepts: no NPC actor IDs, encounters, dialogue or actions.
function renderVeyrConceptGallery() {
  const host=$("veyr-concept-grid");
  if(host.childElementCount)return; // Keep <details> state during game rerenders.
  for(const id of VEYR_NPC_IDS){
    const entry=VEYR_NPC_CONCEPTS[id];
    const card=document.createElement("figure");
    card.className="veyr-concept-card";
    const img=document.createElement("img");
    img.src=VEYR_NPC_SPRITES[id];
    img.width=48;img.height=48;img.alt="";
    img.draggable=false;img.decoding="async";
    const caption=document.createElement("figcaption");
    const name=document.createElement("strong");name.textContent=entry.name;
    const note=document.createElement("small");note.textContent=entry.role;
    caption.append(name,note);card.append(img,caption);host.append(card);
  }
}
// The glossary only describes public world rules; no NPCs or quest progression.
function renderLorePrimer(){
  const host=$("lore-terms");
  if(host.childElementCount)return;
  const titles={veyr:"Veyr",nhal:"Nhal",fragment:"Fragments de cendre",
    arche:"Arche d'extraction",rappel:"Rappel",echo:"Chambre de l'Écho"};
  for(const [id,description] of Object.entries(NAR093_LORE)){
    const term=document.createElement("dt"),definition=document.createElement("dd");
    term.textContent=titles[id];definition.textContent=description;
    host.append(term,definition);
  }
}
// NAR-094 — the same persistent discoveries are shown at Veyr and in the
// existing expedition report. Only meta.echoFindings are read. Never scan
// unseen rooms, reconstruct old achievements or spend a turn for reading.
function renderEchoDossier(){
  const dossier=echoDossier(state);
  for(const [countId,listId,nextId] of [
    ["echo-refuge-count","echo-refuge-list","echo-refuge-next"],
    ["echo-expedition-count","echo-expedition-list","echo-expedition-next"]
  ]){
    $(countId).textContent=dossier.count+" / "+dossier.total;
    $(nextId).textContent=dossier.next;
    const list=document.createDocumentFragment();
    for(const finding of dossier.findings){
      const item=document.createElement("li");
      const title=document.createElement("strong");
      const text=document.createElement("p");
      title.textContent=finding.title;
      text.textContent=finding.text;
      item.append(title,text);
      list.append(item);
    }
    $(listId).replaceChildren(list);
  }
}
/** GAME-095A2: preparation state is UI-only; only the chosen bag and
 * loadout enter the serialized run when the player explicitly starts.
 */
function preparationCounts(){
  return Object.fromEntries([...selected].map(id=>[
    id,Math.max(1,Math.min(state.meta.stash[id]||1,selectedQuantities.get(id)||1,8))
  ]));
}
function updatePreparationControls(){
  if(state.run)return;
  const carried=preparationCounts();
  const total=Object.values(carried).reduce((a,b)=>a+b,0);
  const valid=total<=8;
  const summary=$("prep-summary");
  summary.textContent="Préparation : "+total+" / 8 places"+
    (valid?"":" — sac trop rempli");
  summary.dataset.full=String(!valid);
  $("start-btn").disabled=!valid;
  const defaults=playerLoadout(carried);
  for(const slot of ["mainHand","offHand","body"]){
    const select=$("prep-"+slot);
    const available=Object.keys(carried).filter(id=>
      EQUIPMENT_CATALOG[id]?.slot===slot);
    const previous=preparedLoadout[slot];
    if(previous!==undefined && previous!==null && !available.includes(previous))
      delete preparedLoadout[slot];
    const chosen=preparedLoadout[slot]===undefined?defaults[slot]:preparedLoadout[slot];
    select.replaceChildren();
    const empty=document.createElement("option");
    empty.value="";empty.textContent="Aucun";
    select.append(empty);
    for(const id of available){
      const opt=document.createElement("option");
      opt.value=id;opt.textContent=ITEMS[id].name;
      select.append(opt);
    }
    select.value=chosen||"";
  }
}
function preparedChoice(){
  return {...EMPTY_LOADOUT,
    mainHand:$("prep-mainHand").value||null,
    offHand:$("prep-offHand").value||null,
    body:$("prep-body").value||null};
}
function resetPreparation(){
  selected.clear();selectedQuantities.clear();preparedLoadout={};
}
function renderBagEquipped(){
  const panel=$("bag-equipped");
  if(!state.run){panel.replaceChildren();return;}
  panel.replaceChildren();
  for(const [slot,title] of [
    ["mainHand","ARME"],["offHand","SECONDAIRE"],["body","ARMURE"],["relic","RELIQUE"]
  ]){
    const line=document.createElement("span");
    const item=state.run.loadout?.[slot];
    line.textContent=title+" : "+(EQUIPMENT_CATALOG[item]?.name||"Aucun");
    panel.append(line);
  }
}
function bagActions(row,id,count){
  const equippedSlot=Object.entries(state.run?.loadout||{})
    .find(([,value])=>value===id)?.[0];
  const item=EQUIPMENT_CATALOG[id];
  const host=document.createElement("div");
  host.className="bag-item-actions";
  const add=(label,callback)=>{
    const btn=document.createElement("button");
    btn.type="button";btn.className="secondary bag-item-action";
    btn.textContent=label;btn.addEventListener("click",callback);
    host.append(btn);
  };
  if(item&&Object.hasOwn(ITEMS,id)){
    if(equippedSlot){
      add("Retirer · 1 tour",()=>act(unequipItem(state,equippedSlot)));
    } else {
      add("Équiper · 1 tour",()=>act(equipItem(state,id)));
    }
  }
  if(id==="consumable.vigor_salts"){
    add("Utiliser · +6 END · 1 tour",()=>act(useItem(state,id)));
  }
  if(!equippedSlot||count>1){
    add("Abandonner 1 · 1 tour",()=>{
      if(window.confirm("Abandonner définitivement un exemplaire de "+
        ITEMS[id].name+" dans Nhal ?"))act(discardItem(state,id));
    });
  }
  if(host.childElementCount)row.append(host);
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
  // The expedition bag is sorted by material type. The Veyr stash keeps
  // its original selection order and checkbox semantics.
  if(!selectable)entries.sort(([a],[b])=>
    (ITEMS[a]?.type||"").localeCompare(ITEMS[b]?.type||"")||
    (ITEMS[a]?.name||"").localeCompare(ITEMS[b]?.name||""));
  let previousType=null;
  for (const [id, count] of entries) {
    if(!ITEMS[id])continue;
    const type=ITEMS[id].type;
    if(!selectable&&type!==previousType){
      const heading=document.createElement("strong");
      heading.className="bag-category";
      heading.textContent=type;
      container.append(heading);
    }
    const row=infoItem(id,count,selectable);
    if(!selectable&&state.run)bagActions(row,id,count);
    container.append(row);
    previousType=type;
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
function nearbyChest(){
  const run=state.run;
  if(!run?.rooms)return null;
  return Object.keys(run.loot||{}).map(k=>{
    const [x,y]=k.split(",").map(Number);
    return {x,y,key:k};
  }).find(p=>run.map[p.y]?.[p.x]==="$"&&!run.collected.includes(p.key)&&
    Math.abs(p.x-run.x)+Math.abs(p.y-run.y)<=1)||null;
}
function updateChestAction(){
  const button=$("chest-action"),chest=nearbyChest();
  button.hidden=!state.run?.rooms;
  button.disabled=!chest;
  button.textContent=chest?"Ouvrir le coffre voisin · 1 tour":"Aucun coffre à portée";
}
function adjacentDoors(){
  const run=state.run;
  return (run?.doors||[]).filter(d=>Math.abs(d.x-run.x)+Math.abs(d.y-run.y)===1);
}
function selectNextDoor(){
  const nearby=adjacentDoors();
  if(!nearby.length)return;
  const at=nearby.findIndex(d=>d.x===selectedDoor?.x&&d.y===selectedDoor?.y);
  const next=nearby[(at+1)%nearby.length];
  inspect(next.x,next.y); // Inspection is free: separate confirmation button spends the turn.
}
function updateDoorAction(){
  const button=$("door-action");
  const select=$("door-select");
  const nearby=adjacentDoors();
  select.disabled=nearby.length===0;
  select.textContent=nearby.length?
    "Choisir porte voisine ("+nearby.length+")":"Aucune porte voisine";
  const run=state.run;
  const door=selectedDoor&&run?.doors?.find(d=>d.x===selectedDoor.x&&d.y===selectedDoor.y);
  const adjacent=door&&Math.abs(run.x-door.x)+Math.abs(run.y-door.y)===1;
  button.disabled=!adjacent;
  button.textContent=adjacent?(door.open?"Fermer la porte · 1 tour":"Ouvrir la porte · 1 tour"):
    "Sélectionner une porte voisine";
}
function updateTrapActions(){
  const run=state.run;
  const trap=nearbyTrapHint(run,state.meta.hero.attributes?.perception??5);
  $("trap-clue").hidden=!trap;
  $("trap-clue").textContent=trap?trapHintText(trap):"";
  $("trap-search").hidden=!trap||trap.status!=="hidden";
  $("trap-disarm").hidden=!trap||trap.status!=="revealed";
  const adjacent=Boolean(trap&&Math.abs(run.x-trap.x)+Math.abs(run.y-trap.y)===1);
  $("trap-search").disabled=!adjacent||trap?.status!=="hidden";
  $("trap-disarm").disabled=!adjacent||trap?.status!=="revealed"||
    (run?.endurance??0)<2;
}
function updateRoomSiteActions(){
  const panel=$("room-site-panel"),options=$("room-site-options");
  const site=nearbyRoomSite(state.run);
  panel.hidden=!site;
  options.replaceChildren();
  if(!site)return; // Never include unexplored site text or rewards in the DOM.
  const event=ROOM_SITES[site.kind];
  $("room-site-title").textContent=event.name;
  $("room-site-description").textContent=event.description;
  for(const [choice,rule] of Object.entries(event.options)){
    const button=document.createElement("button");
    button.type="button";
    button.className="secondary room-site-choice";
    button.dataset.roomChoice=choice;
    button.textContent=rule.label;
    button.disabled=(rule.item&&inventoryCount(state)>=8)||
      (state.run.endurance??0)<rule.endurance;
    button.addEventListener("click",()=>act(resolveRoomSite(state,site.id,choice)));
    options.append(button);
  }
}
// DEV-090C: only *existing, locally known* interactions enter the dock.
// No new entity scanning and no persistent state, combat RNG or turns.
function updateInteractionDock(){
  const run=state.run;
  const dock=$("interaction-dock");
  const nearbyDoor=run?adjacentDoors().length:0;
  const visible={
    secret:run&&!$("secret-clue").hidden,
    trap:run&&!$("trap-clue").hidden,
    site:run&&!$("room-site-panel").hidden,
    chest:run&&!$("chest-action").disabled&&!$("chest-action").hidden,
    door:Boolean(nearbyDoor)
  };
  dock.querySelector(".secret-controls").hidden=!visible.secret;
  dock.querySelector(".trap-controls").hidden=!visible.trap;
  dock.querySelector(".room-site-panel").hidden=!visible.site;
  dock.querySelector(".chest-controls").hidden=!visible.chest;
  dock.querySelector(".door-controls").hidden=!visible.door;
  const labels=[];
  if(visible.secret)labels.push("Indice");
  if(visible.trap)labels.push("Piège");
  if(visible.site)labels.push("Lieu");
  if(visible.chest)labels.push("Coffre");
  if(visible.door)labels.push("Porte");
  dock.hidden=labels.length===0;
  $("interaction-summary").textContent=labels.length
    ?labels.join(" · "):"Aucune interaction proche";
  $("jump-action").disabled=dock.hidden;
}
function updateBagStatus(){
  const count=inventoryCount(state);
  const full=count>=8;
  $("bag-summary").textContent=full?"SAC PLEIN · "+count+" / 8":
    count+" / 8 objets";
  $("bag-summary").dataset.full=String(full);
  $("bag-meter").value=count;
  $("bag-meter").setAttribute("aria-valuetext",
    count+" objets transportés sur 8 places");
}
function inspect(x,y) {
  const details=inspectTile(state,x,y);
  if(!details) return;
  $("inspect-title").textContent=details.name;
  $("inspect-description").textContent=details.description;
  $("inspect-panel").dataset.kind=details.kind;
  selectedDoor=details.kind==="door"?{x,y}:null;
  updateDoorAction();
  updateInteractionDock();
}
/**
 * DEV-071: selecting a target is informational only. Combat rules still belong
 * to v0.6.1 until DEV-072 replaces movement-based attacks.
 */
function chooseTarget(enemyId) {
  if (!state.run) return;
  const e=state.run.enemies?.find(enemy=>enemy.id===enemyId);
  if(!e||explorationState(state.run,e.x,e.y)!=="visible")return;
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
  const dock=$("combat-dock");
  host.replaceChildren();
  if (!state.run){dock.hidden=true;return;}
  const enemies=(state.run.enemies || []).filter(e=>
    explorationState(state.run,e.x,e.y)==="visible");
  // A contextual combat dock appears only for enemies truly in sight.
  // No hidden enemies or future intentions are exposed via the DOM.
  dock.hidden=enemies.length===0;
  const selected=enemies.find(e=>e.id===state.run.targetId);
  $("combat-dock-summary").textContent=selected
    ? "Cible verrouillée · "+enemies.length+" visible"+(enemies.length>1?"s":"")
    : enemies.length+" menace"+(enemies.length>1?"s":"")+" visible"+
      (enemies.length>1?"s":"")+" · choisir gratuitement";
  if (!enemies.length) {
    const empty=document.createElement("p");
    empty.className="target-empty";
    empty.textContent=hasFog(state.run)?"Aucune menace dans le champ de vision.":"Aucun ennemi restant dans cette descente.";
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
    const intent=currentEnemyIntent(state.run,enemy);
    details.textContent=rangeBand(tileDistance(state.run,enemy))+" · "+enemy.hp+" PV";
    if(["guardian_heavy","rift_pulse","charognard_lunge"].includes(intent?.kind)){
      choice.classList.add("threat-imminent");
      details.textContent+=" · ⚠";
      choice.setAttribute("aria-label",label.textContent+" : "+intent.label);
    } else if(intent?.kind==="charognard_prepare"){
      details.textContent+=" · prépare une charge";
    } else if(intent?.kind==="guardian_guard"){
      choice.classList.add("threat-guarded");
      details.textContent+=" · garde";
    }
    copy.append(label,details);
    choice.append(portrait,copy);
    choice.addEventListener("click",()=>chooseTarget(enemy.id));
    host.append(choice);
  }
}
function renderThreatForecast(){
  const box=$("threat-forecast");
  const run=state.run;
  if(!run){box.hidden=true;return;}
  const warnings=[];
  for(const enemy of run.enemies||[]){
    if(explorationState(run,enemy.x,enemy.y)!=="visible")continue;
    const intent=currentEnemyIntent(run,enemy);
    if(!intent)continue;
    if(["guardian_heavy","rift_pulse","charognard_lunge","melee"].includes(intent.kind)){
      const name=enemy.kind==="guardian"?"Gardien":
        enemy.kind==="rift_larva"?"Larve":"Charognard";
      warnings.push(name+" : "+intent.label);
    }
  }
  box.hidden=warnings.length===0;
  box.textContent=warnings.length?"⚠ MENACES AU PROCHAIN TOUR — "+warnings.join(" | "):"";
}
function renderActorStats() {
  const profile=heroDerivedStats(state);
  const values=$("actor-stat-values");
  values.replaceChildren();
  if (!profile) return;
  for (const key of STAT_KEYS) {
    const cell=document.createElement("span");
    cell.className="actor-stat-chip";
    const label=document.createElement("small");
    label.textContent=STAT_LABELS[key];
    const number=document.createElement("strong");
    number.textContent=String(profile.attributes[key]);
    cell.append(label,number);
    values.append(cell);
  }
  const gear=state.run?.loadout || {};
  const weapon=gear.mainHand && EQUIPMENT_CATALOG[gear.mainHand];
  $("actor-derived-values").textContent=
    "Endurance maximale "+profile.enduranceMax+
    " · Critique "+profile.criticalChance+" %"+
    " · Agilité défensive "+profile.dodgeChance+
    " · Maîtrise de parade "+profile.parryChance+
    " · Maîtrise de blocage "+profile.blockChance+
    " · Armure "+profile.armor+
    " · Arme : "+(weapon?.name || "Aucune");
  const classId=state.meta.hero.classId;
  $("actor-class-label").textContent="Archétype : "+
    (classId && ARCHETYPES[classId] ? ARCHETYPES[classId] : "non choisi (système de classes à venir)");
}
function renderCombatPreview() {
  const snapshot=combatSnapshot(state);
  const panel=$("combat-panel");
  const target=state.run?.enemies?.find(e=>e.id===snapshot?.targetId);
  if(target&&explorationState(state.run,target.x,target.y)!=="visible"){
    panel.hidden=true;
    return;
  }
  panel.hidden=!snapshot;
  if (!snapshot) return;
  $("combat-target-name").textContent=snapshot.name;
  $("combat-target-family").textContent=snapshot.family;
  $("combat-target-health").textContent=snapshot.hp+" / "+snapshot.maxHp+" PV";
  $("combat-target-meter").max=snapshot.maxHp;
  $("combat-target-meter").value=Math.max(0,snapshot.hp);
  $("combat-target-meter").setAttribute("aria-valuetext",
    snapshot.hp+" points de vie sur "+snapshot.maxHp);
  $("combat-target-distance").textContent=snapshot.band+" · "+snapshot.distance+" cases";
  $("combat-target-distance").dataset.range=snapshot.band.toLowerCase();
  const enemy=state.run.enemies?.find(e=>e.id===snapshot.targetId);
  const enemyStats=enemyDerivedStats(enemy);
  const heroStats=heroDerivedStats(state);
  $("combat-target-profile").textContent=enemyStats && heroStats
    ? "Coup au contact : "+hitChance(heroStats,enemyStats)+
      " % de toucher · "+heroStats.criticalChance+" % de critique sur touche"+
      " · Armure adverse "+enemyStats.armor+
      " · Défenses contre cet ennemi : esquive "+defenseChance("dodge",heroStats,enemyStats,"melee")+
      " %, parade "+defenseChance("parry",heroStats,enemyStats,"melee")+
      " %, blocage "+defenseChance("block",heroStats,enemyStats,"melee")+" %"
    : "";
  $("combat-intent").textContent=snapshot.intent?.label || "Intention inconnue";
  $("combat-intent").dataset.intent=snapshot.intent?.kind || "idle";
  $("combat-weapon").textContent=EQUIPMENT_CATALOG[state.run.loadout?.mainHand]?.name || "Sans arme";
  $("combat-defense").textContent=snapshot.defense==="none" ? "Aucune" : snapshot.defense;
  const stamina=state.run.endurance??0;
  $("combat-attack").disabled=!snapshot.meleeAvailable || stamina<TACTICAL_COSTS.attack;
  $("combat-dodge").disabled=stamina<TACTICAL_COSTS.dodge;
  $("combat-parry").disabled=
    EQUIPMENT_CATALOG[state.run.loadout?.mainHand]?.kind!=="weapon" || stamina<TACTICAL_COSTS.parry;
  $("combat-block").disabled=stamina<TACTICAL_COSTS.block;
  $("combat-range-note").textContent=snapshot.meleeAvailable
    ? "Cible au CONTACT : tu peux attaquer. Chaque action valide consomme un tour."
    : "Hors de portée de mêlée : rapproche-toi, prépare une défense ou recule.";

}
function updateExpeditionReport(){
  const details=$("expedition-report"),report=expeditionReport(state);
  details.hidden=!report.available;
  if(!report.available)return;
  const securedItems=report.secured;
  $("report-carried").textContent=report.carried+" objet"+(report.carried>1?"s":"");
  $("report-fragments").textContent=String(report.fragments);
  $("report-secured").textContent=securedItems+" objet"+(securedItems>1?"s":"");
  $("report-chests").textContent=String(report.knownChests);
  $("report-sites").textContent=String(report.knownSites);
  $("report-enemies").textContent=String(report.enemies);
  $("report-route").textContent=!report.exitKnown
    ?"Arche non repérée : aucun trajet affiché."
    :!report.knownRoute
      ?"Arche repérée, mais pas de trajet entièrement connu depuis cette position."
      :"Tracé connu : "+report.knownRoute.steps+" cases"
        +(report.knownRoute.closedDoors
          ?" · "+report.knownRoute.closedDoors+" porte(s) à ouvrir":"")+
        ". Ce n'est pas une garantie de sécurité.";
  $("report-advice").textContent=report.advice;
  $("expedition-report-summary").textContent=report.carried+
    " objet(s) exposé(s) · "+(report.knownRoute
      ?"retour connu":"retour à reconnaître");
}
function renderFloorChoice(run){
  const onArche=floorChoiceAvailable(run);
  $("floor-hud").hidden=!run?.floorDepth;
  if(run?.floorDepth)
    $("floor-depth").textContent=run.floorDepth+" / "+MAX_FLOOR_DEPTH;
  $("floor-choice").hidden=!onArche;
  if(!onArche)return;
  const canContinue=canDescendFurther(run);
  $("floor-choice-title").textContent="ARCHE ATTEINTE · ÉTAGE "+
    run.floorDepth+" / "+MAX_FLOOR_DEPTH;
  const forecast=canContinue?depthIntel(run.floorDepth+1):null;
  $("floor-choice-description").textContent=forecast
    ?"Prochain étage — "+forecast.name+". "+forecast.risk+" "+
      forecast.prize+" Ton butin reste exposé jusqu'à l'extraction."
    :"Dernier étage atteint. Tu peux sécuriser ton expédition à Veyr.";
  $("floor-descend").hidden=!canContinue;
  $("floor-extract").disabled=false;
}
function render() {
  const run = state.run;
  $("game-shell").classList.toggle("is-expedition", Boolean(run));
  $("mode-status").textContent = run ? "DESCENTE" : "REFUGE";
  $("hero-name").textContent = state.meta.hero.title;
  $("hero-level").textContent = String(state.meta.hero.level);
  $("hero-xp").textContent = state.meta.hero.xp + " XP";
  $("run-stats").textContent = state.meta.extractions + " / " + state.meta.recalls;
  $("refuge").hidden = Boolean(run);
  $("expedition").hidden = !run;
  renderFloorChoice(run);
  $("refuge-depth-record").hidden=!(!run&&state.meta.bestDepth);
  if(!run&&state.meta.bestDepth)
    $("refuge-depth-record").textContent="· Profondeur record : étage "+
      state.meta.bestDepth+"/"+MAX_FLOOR_DEPTH+".";
  renderJournal();
  renderEchoDossier();
  const mission=narrativeObjective(state);
  if (run) {
    $("hp").textContent = run.hp + " / " + MAX_HP;
    $("endurance-state").textContent = run.endurance+" / "+run.enduranceMax;
    $("endurance-meter").max=run.enduranceMax;
    $("endurance-meter").value=run.endurance;
    $("health-meter").value = run.hp;
    $("health-meter").max = MAX_HP;
    $("health-meter").setAttribute("aria-valuetext", run.hp + " points de vie sur " + MAX_HP);
    $("health-meter").dataset.health = run.hp <= 4 ? "critical" : run.hp <= 8 ? "caution" : "healthy";
    $("health-state").textContent = run.hp <= 4 ? "DANGER" : run.hp <= 8 ? "BLESSE" : "STABLE";
    $("health-state").dataset.health = $("health-meter").dataset.health;
    const enemyCount = (run.enemies||[]).filter(e=>
      explorationState(run,e.x,e.y)==="visible").length;
    $("threat-state").textContent = enemyCount > 0 ? enemyCount + " HOSTILE" + (enemyCount > 1 ? "S" : "")+" VISIBLE"+(enemyCount>1?"S":"") : (hasFog(run)?"AUCUNE MENACE VISIBLE":"ZONE CALME");
    $("threat-state").dataset.threat = enemyCount > 0 ? "danger" : "clear";
    $("use-bandage").disabled = (run.carried["consumable.bandage"] || 0) === 0 || run.hp >= MAX_HP;
    $("use-tonic").disabled = (run.carried["consumable.dusk_tonic"] || 0) === 0 || run.hp >= MAX_HP;
    $("use-bandage").textContent = "Bandage +4 PV (" + (run.carried["consumable.bandage"] || 0) + ")";
    $("use-tonic").textContent = "Tonique +6 PV (" + (run.carried["consumable.dusk_tonic"] || 0) + ")";
    $("turns").textContent = String(run.turns);
    $("bag-count").textContent = inventoryCount(state) + " / 8";
    updateBagStatus();
    updateExpeditionReport();
    $("mission-compact").textContent=mission.tag;
    $("route-hint").textContent=mission.text;
    const clue=nearbySecretHint(run,state.meta.hero.attributes?.perception??5);
    $("secret-clue").hidden=!clue;
    $("secret-clue").textContent=clue?clue.text+" "+clue.hint:"";
    $("secret-search").hidden=!clue;
    $("secret-search").disabled=!clue?.canSearch;
    updateTrapActions();
    updateRoomSiteActions();
    $("dungeon-map").textContent = mapViewportText(state);
    $("exploration-map-panel").hidden = !hasFog(run);
    $("exploration-mini-map").textContent = hasFog(run)?minimapText(run):"";
    $("dungeon-map").hidden = renderMode !== "ascii";
    $("tile-map").hidden = renderMode !== "tiles";
    $("renderer-toggle").textContent = renderMode === "tiles" ? "Passer en ASCII" : "Activer les graphismes";
    $("renderer-toggle").setAttribute("aria-pressed", renderMode === "tiles" ? "true" : "false");
    $("graphic-legend").hidden = renderMode !== "tiles";
    $("ascii-legend").hidden = renderMode !== "ascii";
    if (renderMode === "tiles") drawTileMap(state, $("tile-map"), heroFacing);
    updateDoorAction();
    updateChestAction();
    updateInteractionDock();
    renderActorStats();
    renderTargetChoices();
    renderThreatForecast();
    renderCombatPreview();
    renderInventory($("bag-items"), run.carried);
    renderBagEquipped();
  } else {
    $("mission-refuge-title").textContent=mission.title;
    $("mission-refuge-text").textContent=mission.text;
    renderLorePrimer();
    $("expedition-report").hidden=true;
    selectedDoor=null;
    const available = new Set(Object.keys(state.meta.stash).filter((id) => state.meta.stash[id] > 0));
    selected = new Set([...selected].filter((id) => available.has(id)));
    for(const [id,q] of [...selectedQuantities]){
      if(!available.has(id))selectedQuantities.delete(id);
      else selectedQuantities.set(id,Math.min(q,state.meta.stash[id],8));
    }
    renderInventory($("stash-items"), state.meta.stash, true);
    updatePreparationControls();
    renderVeyrConceptGallery();
    const fragments=state.meta.stash[RESOURCE_ID]||0;
    $("forge-fragments").textContent=fragments+" Fragment"+(fragments>1?"s":"")+" de cendre";
    for(const button of document.querySelectorAll("[data-recipe]")){
      const id=button.dataset.recipe;
      button.disabled=!canCraft(state.meta.stash,id);
      const recipe=RECIPES[id];
      button.title=recipe.description;
    }
  }
  ui092.sync();
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
  const previousRun=state.run;
  state = result.state;
  if(previousRun?.floorDepth!==state.run?.floorDepth)ui092.close();
  heroFacing=heroFacingFromStep(previousRun,state.run,heroFacing);
  // If an enemy dies during the v0.6 collision combat, never leave a stale target.
  if (state.run?.targetId && !state.run.enemies?.some(e=>e.id===state.run.targetId && e.hp>0 &&
      explorationState(state.run,e.x,e.y)==="visible")) {
    state=clearTarget(state).state;
  }
  if (!state.run) resetPreparation();
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
  ui092.close();
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
  heroFacing = "down";
  resetPreparation();
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

for(const button of document.querySelectorAll("[data-recipe]")){
  button.addEventListener("click",()=>act(craftAtRefuge(state,button.dataset.recipe)));
}
for(const select of document.querySelectorAll("[data-prep-slot]")){
  select.addEventListener("change",()=>{
    preparedLoadout[select.dataset.prepSlot]=select.value||null;
    updatePreparationControls();
  });
}
$("start-btn").addEventListener("click", () => {
  if (storageLocked) {
    showWarning("La sauvegarde actuelle n'est pas accessible. Réinitialise d'abord ou accepte de jouer sans sauvegarde.");
    return;
  }
  // B1 is opt-in for freshly started GUI expeditions. Old engine callers,
  // already saved descents and the tutorial keep their extraction contract.
  act(beginRun(state,preparationCounts(),preparedChoice(),{multiFloor:true}));
});
for (const button of document.querySelectorAll("[data-direction]")) {
  button.addEventListener("click", () => act(move(state,button.dataset.direction)));
}
// UI-092A: preserve all actual gameplay controls/IDs, use a presentation-only
// bottom sheet on mobile and the existing scroll navigation on desktop.
const ui092=setupUi092({get:$,isRun:()=>Boolean(state.run),
  isAscii:()=>renderMode==="ascii"});
$("floor-extract").addEventListener("click",()=>act(resolveFloorExit(state,"extract")));
$("floor-descend").addEventListener("click",()=>{
  if(window.confirm("Descendre vers l'étage suivant ? Tes blessures et ton sac "+
      "te suivent. Cet étage ne sera plus accessible, mais une nouvelle Arche "+
      "permettra l'extraction."))
    act(resolveFloorExit(state,"descend"));
});
$("wait-btn").addEventListener("click", () => act(waitTurn(state)));
$("use-bandage").addEventListener("click", () => act(useItem(state, "consumable.bandage")));
$("use-tonic").addEventListener("click", () => act(useItem(state, "consumable.dusk_tonic")));
$("target-clear").addEventListener("click", unselectTarget);
$("chest-action").addEventListener("click",()=>{
  const chest=nearbyChest();
  if(chest)act(openChest(state,chest.x,chest.y));
});
$("door-select").addEventListener("click",selectNextDoor);
$("secret-search").addEventListener("click",()=>act(searchSecret(state)));
$("trap-search").addEventListener("click",()=>{
  const trap=nearbyTrapHint(state.run,state.meta.hero.attributes?.perception??5);
  if(trap)act(searchTrap(state,trap.x,trap.y));
});
$("trap-disarm").addEventListener("click",()=>{
  const trap=nearbyTrapHint(state.run,state.meta.hero.attributes?.perception??5);
  if(trap)act(disarmTrap(state,trap.x,trap.y));
});
$("door-action").addEventListener("click",()=>{
  if(selectedDoor)act(toggleDoor(state,selectedDoor.x,selectedDoor.y));
});
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
  if(["t","y"].includes(event.key.toLowerCase())&&target?.tagName!=="BUTTON"){
    const trap=nearbyTrapHint(state.run,state.meta.hero.attributes?.perception??5);
    if(trap){
      event.preventDefault();
      act(event.key.toLowerCase()==="t"
        ?searchTrap(state,trap.x,trap.y):disarmTrap(state,trap.x,trap.y));
    }
    return;
  }
  if(event.key.toLowerCase()==="o"&&target?.tagName!=="BUTTON"){
    event.preventDefault();
    selectNextDoor();
    return;
  }
  if (event.key.toLowerCase()==="c" && target?.tagName!=="BUTTON") {
    const enemies=(state.run.enemies || []).filter(e=>
      explorationState(state.run,e.x,e.y)==="visible");
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
  // First installation must not reload the active expedition unexpectedly.
  // A later controller replacement still reloads when the user accepts an update.
  let currentController = navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    const wasControlled = Boolean(currentController);
    currentController = navigator.serviceWorker.controller;
    if (wasControlled) window.location.reload();
  });
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
