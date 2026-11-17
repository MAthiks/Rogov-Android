// ROGOV Web — deterministic, offline-first gameplay core. No DOM dependencies.
export const SAVE_KEY = "rogov-web-v1";
export const SCHEMA_VERSION = 1;
export const INVENTORY_LIMIT = 8;
export const JOURNAL_LIMIT = 30;
export const EVENT_TYPES = Object.freeze(["system", "action", "loot", "danger", "extraction", "recall", "combat", "heal"]);
const MOVEMENT_CODE = "move";

/** Accept older saved string messages and structured v0.3 messages. */
function validJournalEntry(entry) {
  if (typeof entry === "string") return true;
  return entry !== null && typeof entry === "object" &&
    EVENT_TYPES.includes(entry.type) && typeof entry.text === "string" &&
    (entry.turn === null || (Number.isSafeInteger(entry.turn) && entry.turn >= 0));
}

/** Preserve all existing save fields while upgrading the old journal format in memory. */
export function normalizeJournal(state) {
  return {
    ...state,
    run: state.run && !Array.isArray(state.run.enemies)
      ? { ...state.run, enemies: [] }
      : state.run,
    journal: state.journal.slice(0, JOURNAL_LIMIT).map(entry =>
      typeof entry === "string"
        ? { type:"system", turn:null, text:entry }
        : { ...entry })
  };
}

function recordEvent(state, type, message, turn) {
  const previous = state.journal[0];
  if (type === "action" && previous && typeof previous === "object" &&
      previous.code === MOVEMENT_CODE) {
    const count = (previous.count || 1) + 1;
    state.journal[0] = {
      type, turn, text: count + " déplacements dans Nhal.",
      code: MOVEMENT_CODE, count
    };
    return;
  }
  const entry = { type, turn, text: message };
  if (type === "action") {
    entry.code = MOVEMENT_CODE;
    entry.count = 1;
  }
  state.journal.unshift(entry);
  if (state.journal.length > JOURNAL_LIMIT) state.journal.length = JOURNAL_LIMIT;
}

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

/** Original ROGOV enemy families — readable silhouettes, deterministic v0.4 AI. */
export const ENEMY_TYPES = Object.freeze({
  charognard: { name:"Charognard", symbol:"c", hp:3, damage:1, xp:2, aggro:2, description:"Petite créature des ruines. Elle chasse les intrus à courte distance." },
  guardian: { name:"Gardien déchu", symbol:"G", hp:5, damage:2, xp:4, aggro:0, description:"Guerrier en armure, lent mais dangereux au contact." }
});
const ENEMY_START = Object.freeze([
  { id:"nhal-charognard-01", kind:"charognard", x:3, y:2, hp:3 },
  { id:"nhal-guardian-01", kind:"guardian", x:11, y:2, hp:5 }
]);
const distance = (a,b) => Math.abs(a.x-b.x) + Math.abs(a.y-b.y);
export function enemyAt(run, x, y) {
  return (run?.enemies || []).find(enemy => enemy.x === x && enemy.y === y && enemy.hp > 0) || null;
}
export function inspectTile(state, x, y) {
  if (!state.run || !Number.isInteger(x) || !Number.isInteger(y)) return null;
  if (x === state.run.x && y === state.run.y) return { kind:"hero", name:"L'Égaré", description:"Ton personnage. PV : "+state.run.hp+"/12." };
  const enemy = enemyAt(state.run,x,y);
  if (enemy) return { kind:"enemy", name:ENEMY_TYPES[enemy.kind].name, description:"PV "+enemy.hp+"/"+ENEMY_TYPES[enemy.kind].hp+" · "+ENEMY_TYPES[enemy.kind].description };
  const tile = tileAt(x,y);
  if (tile==="#") return { kind:"wall", name:"Mur de pierre", description:"Obstacle infranchissable." };
  if (tile==="^") return { kind:"danger", name:"Faille mortelle", description:"La traverser déclenche le Rappel. Le sac sera perdu." };
  if (tile==="E") return { kind:"extraction", name:"Arche d'extraction", description:"Atteins-la pour sécuriser ton équipement." };
  if (tile==="$" && !state.run.collected.includes(positionKey(x,y))) {
    const id=LOOT[positionKey(x,y)];
    return { kind:"loot", name:ITEMS[id].name, description:"Butin récupérable. Tu dois te déplacer sur cette case." };
  }
  if (tile==="#") return null;
  return { kind:"floor", name:"Sol de Nhal", description:"Terrain praticable." };
}
function enemyPhase(s) {
  const run=s.run;
  if (!run) return s;
  for (const enemy of run.enemies || []) {
    const type=ENEMY_TYPES[enemy.kind];
    const d=distance(enemy,{x:run.x,y:run.y});
    if (d===1) {
      run.hp = Math.max(0,run.hp-type.damage);
      recordEvent(s,"combat",type.name+" te touche : -"+type.damage+" PV. ("+run.hp+"/12)",run.turns);
      if(run.hp<=0) {
        return recall(s).state;
      }
    } else if (type.aggro > 0 && d<=type.aggro) {
      const dx=Math.sign(run.x-enemy.x),dy=Math.sign(run.y-enemy.y);
      const options=Math.abs(run.x-enemy.x)>=Math.abs(run.y-enemy.y)
        ? [[dx,0],[0,dy]] : [[0,dy],[dx,0]];
      for(const [ox,oy] of options) {
        if (!ox&&!oy)continue;
        const nx=enemy.x+ox,ny=enemy.y+oy;
        const tile=tileAt(nx,ny);
        if((tile==="."||tile==="S") && !(nx===run.x&&ny===run.y) &&
           !enemyAt(run,nx,ny)) {
          enemy.x=nx;enemy.y=ny;
          recordEvent(s,"danger","Un charognard approche.",run.turns);
          break;
        }
      }
    }
  }
  return s;
}

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
    journal: [{ type:"system", turn:null, text:"Bienvenue au refuge de Veyr. Prépare une descente dans Nhal." }]
  };
}
const copy = (state) => JSON.parse(JSON.stringify(state));
const quantity = (items) => Object.values(items).reduce((sum, count) => sum + count, 0);
const positionKey = (x,y) => x + "," + y;
const tileAt = (x,y) => MAP[y]?.[x] || "#";
const info = (state, message, changed=true, type="system", turn=state.run?.turns ?? null) => {
  if (changed) recordEvent(state, type, message, turn);
  return { state, message, changed };
};
function gainXp(s, amount) {
  s.meta.hero.xp += amount;
  s.meta.hero.level = 1 + Math.floor(s.meta.hero.xp / 5);
}
export function validateSave(s) {
  if (!s || s.schemaVersion !== SCHEMA_VERSION) return false;
  if (!s.meta || !s.meta.hero || !s.meta.stash || !Array.isArray(s.journal)) return false;
  if (!s.journal.every(validJournalEntry)) return false;
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
    if (r.enemies !== undefined) {
      if (!Array.isArray(r.enemies)) return false;
      for (const enemy of r.enemies) {
        if (!enemy || typeof enemy.id!=="string" || !(enemy.kind in ENEMY_TYPES) ||
          !Number.isInteger(enemy.x) || !Number.isInteger(enemy.y) ||
          !Number.isInteger(enemy.hp) || enemy.hp<1 || enemy.hp>ENEMY_TYPES[enemy.kind].hp ||
          tileAt(enemy.x,enemy.y)==="#") return false;
      }
    }
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
  s.run = { x: 1, y: 7, hp: 12, turns: 0, carried, collected: [], enemies: ENEMY_START.map(e=>({...e})) };
  return info(s, "Descente " + s.meta.descents + " : les profondeurs de Nhal s'ouvrent.");
}
export function recall(state) {
  if (!state.run) return info(state, "Tu es déjà à Veyr.", false);
  const s = copy(state);
  const finalTurn = s.run.turns;
  s.meta.recalls += 1;
  s.run = null;
  return info(s, "LE RAPPEL — Tu renais à Veyr. Tout ton équipement transporté est perdu.", true, "recall", finalTurn);
}
export function extract(state) {
  if (!state.run) return info(state, "Aucune descente active.", false);
  if (tileAt(state.run.x, state.run.y) !== "E") {
    return info(state, "Tu dois atteindre un point d'extraction E.", false);
  }
  const s = copy(state);
  const finalTurn = s.run.turns;
  for (const [id,count] of Object.entries(s.run.carried)) {
    s.meta.stash[id] = (s.meta.stash[id] || 0) + count;
  }
  s.run = null;
  s.meta.extractions += 1;
  gainXp(s, 2);
  return info(s, "EXTRACTION RÉUSSIE — Ton butin rejoint le coffre. +2 XP.", true, "extraction", finalTurn);
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
  s.run.turns += 1;
  const enemy=enemyAt(s.run,x,y);
  if(enemy) {
    const type=ENEMY_TYPES[enemy.kind];
    const damage=(s.run.carried["weapon.rusty_sword"]||0)>0 ? 3 : 2;
    enemy.hp-=damage;
    const killed=enemy.hp<=0;
    recordEvent(s,"combat","Tu frappes "+type.name+" : "+damage+" dégâts"+(killed?" (vaincu).":"."),s.run.turns);
    if(killed) {
      s.run.enemies=s.run.enemies.filter(e=>e.id!==enemy.id);
      gainXp(s,type.xp);
      recordEvent(s,"loot","Victoire sur "+type.name+" : +"+type.xp+" XP.",s.run.turns);
    }
    const after=enemyPhase(s);
    return {state:after,message:after.journal[0]?.text||"Combat.",changed:true};
  }
  s.run.x=x; s.run.y=y;
  if(tile==="^") return recall(s);
  if(tile==="E") return extract(s);
  let message="Déplacement dans Nhal.",type="action";
  if(tile==="$"&&!s.run.collected.includes(positionKey(x,y))) {
    if(quantity(s.run.carried)>=INVENTORY_LIMIT) {
      message="Sac plein : laisse le butin pour le moment.";type="danger";
    } else {
      const id=LOOT[positionKey(x,y)];
      s.run.carried[id]=(s.run.carried[id]||0)+1;
      s.run.collected.push(positionKey(x,y));
      gainXp(s,1);
      message="Butin : "+ITEMS[id].name+". +1 XP.";type="loot";
    }
  }
  recordEvent(s,type,message,s.run.turns);
  const after=enemyPhase(s);
  return {state:after,message:after.journal[0]?.text||message,changed:true};
}
export function mapText(state) {
  if (!state.run) return "";
  const {x: px,y: py,collected} = state.run;
  return MAP.map((row,y) => row.split("").map((tile,x) => {
    if (x === px && y === py) return "@";
    const enemy=enemyAt(state.run,x,y);
    if(enemy) return ENEMY_TYPES[enemy.kind].symbol;
    if (tile === "S") return ".";
    if (tile === "$" && collected.includes(positionKey(x,y))) return ".";
    return tile;
  }).join("")).join("\n");
}
export function inventoryCount(state) { return state.run ? quantity(state.run.carried) : 0; }
