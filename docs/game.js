// ROGOV Web — deterministic, offline-first gameplay core. No DOM dependencies.
export const SAVE_KEY = "rogov-web-v1";
export const SCHEMA_VERSION = 1;
export const INVENTORY_LIMIT = 8;
export const ITEMS = Object.freeze({
  "weapon.rusty_sword": { name: "Épée usée", type: "Arme", symbol: "/" },
  "consumable.bandage": { name: "Bandage", type: "Soin", symbol: "+" },
  "relic.ashen_fragment": { name: "Fragment de cendre", type: "Relique", symbol: "*" },
  "consumable.dusk_tonic": { name: "Tonique du crépuscule", type: "Potion", symbol: "!" }
});
export const MAP = Object.freeze([
  "###############",
  "#.............#",
  "#.......$.....#",
  "#....###......#",
  "#........^....#",
  "#.............#",
  "#..$..........#",
  "#S.^..#.....E.#",
  "###############"
]);
const LOOT = Object.freeze({ "3,6": "relic.ashen_fragment", "8,2": "consumable.dusk_tonic" });
export const DIRECTIONS = Object.freeze({
  up: [0,-1], down: [0,1], left: [-1,0], right: [1,0]
});

export function newGame() {
  return {
    schemaVersion: SCHEMA_VERSION,
    meta: {
      hero: { id: "character.first_wanderer", title: "L'Égaré", level: 1, xp: 0 },
      stash: { "weapon.rusty_sword": 1, "consumable.bandage": 2 },
      descents: 0, extractions: 0, recalls: 0
    },
    run: null,
    journal: ["Bienvenue au refuge de Veyr. Prépare une descente dans Nhal."]
  };
}
const copy = (state) => JSON.parse(JSON.stringify(state));
const quantity = (items) => Object.values(items).reduce((sum, count) => sum + count, 0);
const positionKey = (x,y) => x + "," + y;
const tileAt = (x,y) => MAP[y]?.[x] || "#";
const info = (state, message, changed=true) => {
  if (changed) state.journal = [message, ...state.journal].slice(0, 6);
  return { state, message, changed };
};
function gainXp(s, amount) {
  s.meta.hero.xp += amount;
  s.meta.hero.level = 1 + Math.floor(s.meta.hero.xp / 5);
}
export function validateSave(s) {
  if (!s || s.schemaVersion !== SCHEMA_VERSION) return false;
  if (!s.meta || !s.meta.hero || !s.meta.stash || !Array.isArray(s.journal)) return false;
  if (!Number.isSafeInteger(s.meta.hero.xp) || s.meta.hero.xp < 0) return false;
  if (!Number.isSafeInteger(s.meta.hero.level) || s.meta.hero.level !== 1 + Math.floor(s.meta.hero.xp / 5)) return false;
  for (const [id,count] of Object.entries(s.meta.stash)) {
    if (!ITEMS[id] || !Number.isSafeInteger(count) || count < 0) return false;
  }
  if (s.run !== null) {
    const r = s.run;
    if (!r || !Number.isInteger(r.x) || !Number.isInteger(r.y) || tileAt(r.x,r.y) === "#") return false;
    if (!r.carried || !Array.isArray(r.collected) || !Number.isSafeInteger(r.turns)) return false;
    for (const [id,count] of Object.entries(r.carried)) {
      if (!ITEMS[id] || !Number.isSafeInteger(count) || count < 0) return false;
    }
    if (quantity(r.carried) > INVENTORY_LIMIT) return false;
  }
  return true;
}
export function beginRun(state, equipment=[]) {
  if (state.run) return info(state, "Une descente est déjà en cours.", false);
  if (equipment.length > INVENTORY_LIMIT || new Set(equipment).size !== equipment.length) {
    return info(state, "Équipement invalide ou sac trop rempli.", false);
  }
  if (equipment.some((id) => !ITEMS[id] || (state.meta.stash[id] || 0) < 1)) {
    return info(state, "Objet absent du coffre sécurisé.", false);
  }
  const s = copy(state);
  const carried = {};
  for (const id of equipment) {
    s.meta.stash[id] -= 1;
    carried[id] = 1;
  }
  s.meta.descents += 1;
  s.run = { x: 1, y: 7, hp: 12, turns: 0, carried, collected: [] };
  return info(s, "Descente " + s.meta.descents + " : les profondeurs de Nhal s'ouvrent.");
}
export function recall(state) {
  if (!state.run) return info(state, "Tu es déjà à Veyr.", false);
  const s = copy(state);
  s.meta.recalls += 1;
  s.run = null;
  return info(s, "LE RAPPEL — Tu renais à Veyr. Tout ton équipement transporté est perdu.");
}
export function extract(state) {
  if (!state.run) return info(state, "Aucune descente active.", false);
  if (tileAt(state.run.x, state.run.y) !== "E") {
    return info(state, "Tu dois atteindre un point d'extraction E.", false);
  }
  const s = copy(state);
  for (const [id,count] of Object.entries(s.run.carried)) {
    s.meta.stash[id] = (s.meta.stash[id] || 0) + count;
  }
  s.run = null;
  s.meta.extractions += 1;
  gainXp(s, 2);
  return info(s, "EXTRACTION RÉUSSIE — Ton butin rejoint le coffre. +2 XP.");
}
export function move(state, direction) {
  if (!state.run) return info(state, "Commence une descente depuis Veyr.", false);
  const vector = DIRECTIONS[direction];
  if (!vector) return info(state, "Déplacement inconnu.", false);
  const x = state.run.x + vector[0];
  const y = state.run.y + vector[1];
  const tile = tileAt(x,y);
  if (tile === "#") return info(state, "Un mur barre le passage.", false);
  const s = copy(state);
  s.run.x = x;
  s.run.y = y;
  s.run.turns += 1;
  if (tile === "^") return recall(s);
  if (tile === "E") return extract(s);
  if (tile === "$" && !s.run.collected.includes(positionKey(x,y))) {
    if (quantity(s.run.carried) >= INVENTORY_LIMIT) {
      return info(s, "Sac plein : laisse le butin pour le moment.");
    }
    const id = LOOT[positionKey(x,y)];
    s.run.carried[id] = (s.run.carried[id] || 0) + 1;
    s.run.collected.push(positionKey(x,y));
    gainXp(s, 1);
    return info(s, "Butin : " + ITEMS[id].name + ". +1 XP.");
  }
  return info(s, "Tu avances dans Nhal. Le silence reste menaçant.");
}
export function mapText(state) {
  if (!state.run) return "";
  const {x: px,y: py,collected} = state.run;
  return MAP.map((row,y) => row.split("").map((tile,x) => {
    if (x === px && y === py) return "@";
    if (tile === "S") return ".";
    if (tile === "$" && collected.includes(positionKey(x,y))) return ".";
    return tile;
  }).join("")).join("\n");
}
export function inventoryCount(state) { return state.run ? quantity(state.run.carried) : 0; }
