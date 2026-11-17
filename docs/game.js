// ROGOV Web — deterministic, offline-first gameplay core. No DOM dependencies.
import { DEFAULT_HERO_STATS, ENEMY_STATS, migrateHero, migrateEnemy, migrateRunStats,
  validAttributes, validClassId, validLoadout, heroDerivedStats, enemyDerivedStats } from "./stats.js";
import { TACTICAL_COSTS, descentSeed, validSeed, resolveStrike, resolveActiveDefense,
  regenEndurance } from "./combat-rules.js";
import {validEnemyTactic,guardianDecision,guardianTactic,GUARDIAN_HEAVY_BONUS} from "./enemy-ai.js";
import {BASE_MAP,BASE_LOOT,generateLayout,validateLayout} from "./dungeon.js";
import {RECIPES,canCraft} from "./economy.js";
import {EQUIPMENT_CATALOG} from "./stats.js";
export const SAVE_KEY = "rogov-web-v1";
export const SCHEMA_VERSION = 1;
export const INVENTORY_LIMIT = 8;
export const MAX_HP = 12;
export const HEALING_ITEMS = Object.freeze({
  "consumable.bandage": 4,
  "consumable.dusk_tonic": 6
});
export const JOURNAL_LIMIT = 30;
export const EVENT_TYPES = Object.freeze(["system", "action", "loot", "danger", "extraction", "recall", "combat", "heal", "defense"]);
const MOVEMENT_CODE = "move";
const TACTICAL_DEFENSES = Object.freeze(["none", "dodge", "parry", "block"]);

/** Accept older saved string messages and structured v0.3 messages. */
function validJournalEntry(entry) {
  if (typeof entry === "string") return true;
  return entry !== null && typeof entry === "object" &&
    EVENT_TYPES.includes(entry.type) && typeof entry.text === "string" &&
    (entry.turn === null || (Number.isSafeInteger(entry.turn) && entry.turn >= 0));
}

/** Preserve all existing save fields while upgrading the old journal format in memory. */
function migrateCombatRun(run,meta) {
  if(!run)return run;
  const enriched=migrateRunStats(run);
  const max=heroDerivedStats({meta,run:enriched})?.enduranceMax ?? 15;
  return {
    ...enriched,
    rngState: enriched.rngState===undefined?descentSeed(meta.descents):enriched.rngState,
    enduranceMax: enriched.enduranceMax===undefined?max:enriched.enduranceMax,
    endurance: enriched.endurance===undefined?max:enriched.endurance
  };
}
export function normalizeJournal(state) {
  const meta={...state.meta,hero:migrateHero(state.meta.hero)};
  return {
    ...state,
    meta,
    run:migrateCombatRun(state.run,meta),
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
  "weapon.ashen_blade": { name: "Lame cendrée", type: "Arme +1", symbol: "†" },
  "consumable.bandage": { name: "Bandage", type: "Soin", symbol: "+" },
  "relic.ashen_fragment": { name: "Fragment de cendre", type: "Relique", symbol: "*" },
  "consumable.dusk_tonic": { name: "Tonique du crépuscule", type: "Potion", symbol: "!" }
});
/** Legacy exported reference remains unchanged for old saved descents. */
export const MAP=BASE_MAP;

/** v0.6 Creature bible: low / tall / anomalous silhouettes; all original to ROGOV. */
export const ENEMY_TYPES = Object.freeze({
  charognard: { name:"Charognard", symbol:"c", hp:3, damage:1, xp:2, aggro:2,
    family:"Charognards de Nhal",
    description:"Fouisseur aux pattes inégales et aux yeux d'ivoire. Il te traque de près." },
  guardian: { name:"Gardien déchu", symbol:"G", hp:5, damage:2, xp:4, aggro:0,
    family:"Gardiens déchus",
    description:"Sentinelle de pierre et d'os, scellée à une armure rituelle. Elle garde sa position." },
  rift_larva: { name:"Larve de faille", symbol:"L", hp:4, damage:1, xp:3, aggro:0,
    family:"Choses de la Faille",
    description:"Corps fendu d'une lueur spectrale. Émet une onde à deux cases tous les trois tours, en ligne droite." }
});
const ENEMY_START = Object.freeze([
  { id:"nhal-charognard-01", kind:"charognard", x:3, y:2, hp:3 },
  { id:"nhal-guardian-01", kind:"guardian", x:11, y:2, hp:5 },
  { id:"nhal-rift-larva-01", kind:"rift_larva", x:6, y:2, hp:4 }
]);
const distance = (a,b) => Math.abs(a.x-b.x) + Math.abs(a.y-b.y);
export function enemyAt(run, x, y) {
  return (run?.enemies || []).find(enemy => enemy.x === x && enemy.y === y && enemy.hp > 0) || null;
}
export function inspectTile(state, x, y) {
  if (!state.run || !Number.isInteger(x) || !Number.isInteger(y)) return null;
  if (x === state.run.x && y === state.run.y) return { kind:"hero", name:"L'Égaré", description:"Ton personnage. PV : "+state.run.hp+"/"+MAX_HP+"." };
  const enemy = enemyAt(state.run,x,y);
  if (enemy) {
    const creature=ENEMY_TYPES[enemy.kind];
    return { kind:"enemy", name:creature.name,
      description:creature.family+" · PV "+enemy.hp+"/"+creature.hp+" · "+creature.description };
  }
  const tile = tileAt(x,y,state.run);
  if (tile==="#") return { kind:"wall", name:"Mur de pierre", description:"Obstacle infranchissable." };
  if (tile==="^") return { kind:"danger", name:"Faille mortelle", description:"La traverser déclenche le Rappel. Le sac sera perdu." };
  if (tile==="E") return { kind:"extraction", name:"Arche d'extraction", description:"Atteins-la pour sécuriser ton équipement." };
  if (tile==="$" && !state.run.collected.includes(positionKey(x,y))) {
    const id=lootAt(state.run,positionKey(x,y));
    return { kind:"loot", name:ITEMS[id].name, description:"Butin récupérable. Tu dois te déplacer sur cette case." };
  }
  if (tile==="#") return null;
  return { kind:"floor", name:"Sol de Nhal", description:"Terrain praticable." };
}
/** A rift pulse travels straight through open floor, never through walls or corners. */
function canRiftPulse(enemy, run) {
  if (distance(enemy,run)!==2) return false;
  if (enemy.x!==run.x && enemy.y!==run.y) return false;
  return tileAt((enemy.x+run.x)/2,(enemy.y+run.y)/2,run)!=="#";
}

/**
 * Both sides use the same hit/crit/armor formulas.
 * A player's active defense checks stats + equipment, and applies to the first
 * matching landed hit in the enemy phase only. Enemy strikes may miss or crit.
 */
function receiveEnemyAttack(s,enemy,type,base,source) {
  const run=s.run;
  const attacker=enemyDerivedStats(enemy);
  const defender=heroDerivedStats(s);
  const result=resolveStrike(s,attacker,defender,base,{source});
  if(!result.hit){
    recordEvent(s,"combat",type.name+" manque son attaque.",run.turns);
    return s;
  }
  let damage=result.damage;
  const mode=run.defense||"none";
  if(mode!=="none") {
    const defense=resolveActiveDefense(s,mode,defender,attacker,source);
    if(defense.attempted) {
      run.defense="none";
      if(defense.success) {
        if(mode==="dodge")damage=0;
        if(mode==="parry"){
          damage=Math.max(0,damage-1-Math.floor(defender.parryChance/25));
          enemy.hp-=1+Math.floor((defender.attackPower-5)/5);
          if(enemy.hp<=0){
            run.enemies=run.enemies.filter(e=>e.id!==enemy.id);
            gainXp(s,type.xp);
            if(run.targetId===enemy.id)run.targetId=null;
            recordEvent(s,"loot",type.name+" vaincu en riposte : +"+type.xp+" XP.",run.turns);
          }
        }
        if(mode==="block")damage=Math.max(0,damage-defender.blockAbsorb);
        const verb={dodge:"Esquive réussie",parry:"Parade réussie",block:"Blocage réussi"}[mode];
        recordEvent(s,"defense",verb+" contre "+type.name+
          " ("+defense.chance+" %).",run.turns);
      } else {
        recordEvent(s,"defense","Défense échouée ("+defense.chance+" %) contre "+type.name+".",run.turns);
      }
    }
  }
  if(damage>0){
    run.hp=Math.max(0,run.hp-damage);
    recordEvent(s,"combat",type.name+
      (source==="rift"?" libère une onde":" te touche")+
      (result.critical?" — CRITIQUE !":"")+
      " : -"+damage+" PV. ("+run.hp+"/"+MAX_HP+")",run.turns);
  } else if(!run.defense){
    recordEvent(s,"combat","Le coup de "+type.name+" ne cause aucun dégât.",run.turns);
  }
  return run.hp<=0?recall(s).state:s;
}
function enemyPhase(s) {
  const run=s.run;
  if (!run) return s;
  for (const enemy of run.enemies || []) {
    const type=ENEMY_TYPES[enemy.kind];
    const d=distance(enemy,{x:run.x,y:run.y});
    // Distinct v0.6 AI: immobile Larva pulses at range 2 on turns 3, 6, 9...
    if (enemy.kind==="rift_larva" && run.turns>0 &&
        run.turns%3===0 && canRiftPulse(enemy,run)) {
      s=receiveEnemyAttack(s,enemy,type,1,"rift");
      if(!s.run) return s;
      continue;
    }
    // Sentinel: windup -> heavy attack -> visible high guard -> windup.
    // Moving out of CONTACT cancels the queued heavy attack without a hit.
    if(enemy.kind==="guardian"){
      const decision=guardianDecision(enemy,d);
      if(decision==="interrupt"){
        enemy.tactic="ready";
        recordEvent(s,"danger",type.name+" perd la cible : son coup lourd est interrompu.",run.turns);
      } else if(decision==="hold"){
        if(guardianTactic(enemy)==="guarding")enemy.tactic="ready";
      } else if(decision==="prepare"){
        enemy.tactic="winding";
        recordEvent(s,"danger",type.name+" arme un COUP LOURD. Éloigne-toi ou prépare une défense !",run.turns);
      } else if(decision==="heavy"){
        enemy.tactic="guarding";
        s=receiveEnemyAttack(s,enemy,type,type.damage+GUARDIAN_HEAVY_BONUS,"melee");
        if(!s.run)return s;
      } else if(decision==="legacy_attack"){
        // Unmigrated direct-state compatibility. Normalized saved encounters
        // and every new run use "ready" and announce their heavy attack.
        s=receiveEnemyAttack(s,enemy,type,type.damage,"melee");
        if(!s.run)return s;
      }
      continue;
    }
    if (d===1) {
      s=receiveEnemyAttack(s,enemy,type,type.damage,"melee");
      if(!s.run) return s;
    } else if (type.aggro > 0 && d<=type.aggro) {
      const dx=Math.sign(run.x-enemy.x),dy=Math.sign(run.y-enemy.y);
      const options=Math.abs(run.x-enemy.x)>=Math.abs(run.y-enemy.y)
        ? [[dx,0],[0,dy]] : [[0,dy],[dx,0]];
      for(const [ox,oy] of options) {
        if (!ox&&!oy)continue;
        const nx=enemy.x+ox,ny=enemy.y+oy;
        const tile=tileAt(nx,ny,run);
        if((tile==="."||tile==="S") && !(nx===run.x&&ny===run.y) &&
           !enemyAt(run,nx,ny)) {
          enemy.x=nx;enemy.y=ny;
          recordEvent(s,"danger",type.name+" approche.",run.turns);
          break;
        }
      }
    }
  }
  // A preparation lasts only one enemy phase, never indefinitely.
  run.defense="none";
  return s;
}

const LOOT=BASE_LOOT;
export const DIRECTIONS = Object.freeze({
  up: [0,-1], down: [0,1], left: [-1,0], right: [1,0]
});

export function newGame() {
  return {
    schemaVersion: SCHEMA_VERSION,
    meta: {
      hero: { id: "character.first_wanderer", title: "L'Égaré", level: 1, xp: 0,
        attributes:{...DEFAULT_HERO_STATS}, classId:null },
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
const tileAt = (x,y,run=null) => (run?.map || MAP)[y]?.[x] || "#";
const lootAt=(run,key)=> (run?.loot || LOOT)[key];
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
  // Optional tactical fields preserve every v0.6/v0.7a save.
  if (s.meta.hero.attributes!==undefined && !validAttributes(s.meta.hero.attributes)) return false;
  if (s.meta.hero.classId!==undefined && !validClassId(s.meta.hero.classId)) return false;
  for (const [id,count] of Object.entries(s.meta.stash)) {
    if (!ITEMS[id] || !Number.isSafeInteger(count) || count < 0) return false;
  }
  if (s.run !== null) {
    const r = s.run;
    if (!r || !Number.isInteger(r.x) || !Number.isInteger(r.y)) return false;
    if (r.map!==undefined && !validateLayout(r.map,r.loot)) return false;
    if (tileAt(r.x,r.y,r) === "#") return false;
    if (!r.carried || !Array.isArray(r.collected) || !Number.isSafeInteger(r.turns)) return false;
    if (!Number.isInteger(r.hp) || r.hp < 1 || r.hp > MAX_HP) return false;
    for (const [id,count] of Object.entries(r.carried)) {
      if (!ITEMS[id] || !Number.isSafeInteger(count) || count < 0) return false;
    }
    if (quantity(r.carried) > INVENTORY_LIMIT) return false;
    if (r.rngState!==undefined && !validSeed(r.rngState)) return false;
    if (r.enduranceMax!==undefined && (!Number.isSafeInteger(r.enduranceMax) ||
        r.enduranceMax<1 || r.enduranceMax>100))return false;
    if (r.endurance!==undefined && (!Number.isSafeInteger(r.endurance) ||
        r.endurance<0 || r.endurance>(r.enduranceMax??100)))return false;
    if (r.loadout!==undefined && !validLoadout(r.loadout,r.carried)) return false;
    if (r.targetId!==undefined && r.targetId!==null &&
        (typeof r.targetId!=="string" || r.targetId.length===0)) return false;
    if (r.defense!==undefined && !TACTICAL_DEFENSES.includes(r.defense)) return false;
    if (r.enemies !== undefined) {
      if (!Array.isArray(r.enemies)) return false;
      for (const enemy of r.enemies) {
        if (!enemy || typeof enemy.id!=="string" || !(enemy.kind in ENEMY_TYPES) ||
          !Number.isInteger(enemy.x) || !Number.isInteger(enemy.y) ||
          !Number.isInteger(enemy.hp) || enemy.hp<1 || enemy.hp>ENEMY_TYPES[enemy.kind].hp ||
          tileAt(enemy.x,enemy.y,r)==="#") return false;
        if (enemy.attributes!==undefined && !validAttributes(enemy.attributes)) return false;
        if (enemy.loadout!==undefined && !validLoadout(enemy.loadout)) return false;
        if (!validEnemyTactic(enemy)) return false;
      }
    }
  }
  return true;
}
/** Forging is done at Veyr using ONLY secured stash resources.
 * Never consumes a combat turn, never mutates input, and never crafts while
 * the player is in Nhal. Recipes require no legacy sword so recovery is possible.
 */
export function craftAtRefuge(state,recipeId) {
  if(state.run) return info(state,"La forge se trouve au refuge de Veyr.",false);
  const recipe=Object.hasOwn(RECIPES,recipeId)?RECIPES[recipeId]:null;
  if(!recipe)return info(state,"Fabrication inconnue.",false);
  if(!canCraft(state.meta.stash,recipeId))
    return info(state,"Fragments sécurisés insuffisants.",false);
  const s=copy(state);
  for(const [id,cost] of Object.entries(recipe.costs))
    s.meta.stash[id]-=cost;
  for(const [id,count] of Object.entries(recipe.yields))
    s.meta.stash[id]=(s.meta.stash[id]||0)+count;
  recordEvent(s,"loot",recipe.title+
    " : ressources dépensées au coffre de Veyr.",null);
  return {state:s,changed:true,message:s.journal[0].text};
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
  s.meta.hero=migrateHero(s.meta.hero);
  const carried = {};
  for (const id of equipment) {
    s.meta.stash[id] -= 1;
    carried[id] = 1;
  }
  s.meta.descents += 1;
  const layout=generateLayout(s.meta.descents);
  s.run = migrateCombatRun({ x:layout.start.x, y:layout.start.y, hp:MAX_HP,
    turns:0,carried,collected:[],enemies:layout.enemies,
    map:layout.map,loot:layout.loot,layoutId:layout.layoutId },s.meta);
  return info(s,"Descente "+s.meta.descents+
    (s.meta.descents===1?" : les profondeurs de Nhal s'ouvrent.":
    " : Nhal a changé. Deux voies de retour restent ouvertes, mais les dangers se déplacent."));
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
  if (tileAt(state.run.x, state.run.y,state.run) !== "E") {
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
export function move(state, direction, context="move") {
  if (!state.run) return info(state, "Commence une descente depuis Veyr.", false);
  const vector = DIRECTIONS[direction];
  if (!vector) return info(state, "Déplacement inconnu.", false);
  const x = state.run.x + vector[0];
  const y = state.run.y + vector[1];
  const tile = tileAt(x,y,state.run);
  if (tile === "#") return info(state, "Un mur barre le passage.", false);
  const blocking=enemyAt(state.run,x,y);
  if (blocking) {
    if (state.run.targetId===blocking.id)
      return info(state, ENEMY_TYPES[blocking.kind].name+" bloque le passage : choisis Attaquer.", false);
    const s=copy(state);
    s.run.targetId=blocking.id;
    return {state:s,changed:true,message:ENEMY_TYPES[blocking.kind].name+
      " ciblé (aucun tour perdu). Utilise Attaquer pour combattre."};
  }
  const s = copy(state);
  s.run.turns += 1;
  regenEndurance(s,1);
  s.run.x=x; s.run.y=y;
  if(tile==="^") return recall(s);
  if(tile==="E") return extract(s);
  let message=context==="retreat" ? "Repli tactique vers une case libre." : "Déplacement dans Nhal.";
  let type=context==="retreat" ? "combat" : "action";
  if(tile==="$"&&!s.run.collected.includes(positionKey(x,y))) {
    if(quantity(s.run.carried)>=INVENTORY_LIMIT) {
      message="Sac plein : laisse le butin pour le moment.";type="danger";
    } else {
      const id=lootAt(s.run,positionKey(x,y));
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

/** Explicit one-tile melee attack; target must be selected and adjacent. */
export function attackTarget(state) {
  if (!state.run) return info(state,"Prépare une descente.",false);
  const enemy=state.run.enemies?.find(e=>e.id===state.run.targetId && e.hp>0);
  if (!enemy) return info(state,"Sélectionne une cible vivante.",false);
  if (distance(state.run,enemy)!==1)
    return info(state,"Cible hors de portée : approche au CONTACT.",false);
  if ((state.run.endurance??0)<TACTICAL_COSTS.attack)
    return info(state,"Endurance insuffisante : attends pour récupérer.",false);
  const s=copy(state);
  const target=s.run.enemies.find(e=>e.id===enemy.id);
  const type=ENEMY_TYPES[target.kind];
  const equipped=s.run.loadout?.mainHand;
  const base=EQUIPMENT_CATALOG[equipped]?.baseDamage??2;
  s.run.endurance-=TACTICAL_COSTS.attack;
  s.run.turns+=1;
  const attacker=heroDerivedStats(s);
  const defender=enemyDerivedStats(target);
  const result=resolveStrike(s,attacker,defender,base);
  if(!result.hit) {
    recordEvent(s,"combat","Tu manques "+type.name+
      " ("+result.accuracy+" % de précision).",s.run.turns);
  } else {
    let damage=result.damage;
    // The Guardian's high guard is an announced, stat/equipment-based defense.
    // Same seeded defense resolver as the player's shield action.
    if(target.kind==="guardian" && guardianTactic(target)==="guarding"){
      const guard=resolveActiveDefense(s,"block",defender,attacker,"melee");
      target.tactic="ready"; // High guard is spent on the first landed attack.
      if(guard.success){
        damage=Math.max(0,damage-defender.blockAbsorb);
        recordEvent(s,"defense","Garde du Gardien réussie ("+guard.chance+
          " %) : "+(result.damage-damage)+" dégât(s) absorbé(s).",s.run.turns);
      } else {
        recordEvent(s,"defense","Garde du Gardien échouée ("+guard.chance+" %).",s.run.turns);
      }
    }
    target.hp-=damage;
    const killed=target.hp<=0;
    recordEvent(s,"combat","Tu frappes "+type.name+
      (result.critical?" — COUP CRITIQUE !":"")+
      " : "+damage+" dégât"+(damage>1?"s":"")+
      (killed?" (vaincu).":"."),s.run.turns);
    if(killed) {
      s.run.enemies=s.run.enemies.filter(e=>e.id!==target.id);
      s.run.targetId=null;
      gainXp(s,type.xp);
      recordEvent(s,"loot","Victoire sur "+type.name+" : +"+type.xp+" XP.",s.run.turns);
    }
  }
  const after=enemyPhase(s);
  return {state:after,message:after.journal[0]?.text||"Attaque résolue.",changed:true};
}

/** A defensive preparation consumes one turn and is resolved by the enemy phase. */
export function defend(state, mode) {
  if (!state.run) return info(state,"Prépare une descente.",false);
  if (!["dodge","parry","block"].includes(mode))
    return info(state,"Défense inconnue.",false);
  const equipped=EQUIPMENT_CATALOG[state.run.loadout?.mainHand];
  if (mode==="parry" && (!equipped || equipped.kind!=="weapon"))
    return info(state,"Parade impossible sans une arme de mêlée.",false);
  if ((state.run.endurance??0)<TACTICAL_COSTS[mode])
    return info(state,"Endurance insuffisante : attends pour récupérer.",false);
  const s=copy(state);
  s.run.endurance-=TACTICAL_COSTS[mode];
  s.run.turns+=1;
  s.run.defense=mode;
  const labels={dodge:"Esquive",parry:"Parade",block:"Blocage"};
  recordEvent(s,"defense",labels[mode]+" préparé(e) pour le tour "+s.run.turns+".",s.run.turns);
  const after=enemyPhase(s);
  return {state:after,message:after.journal[0]?.text||"Défense résolue.",changed:true};
}

/**
 * Retreat attempts a deterministic free step that increases distance from the
 * selected foe. Avoid lethal rifts and enemy collisions; enemies still react.
 */
export function retreat(state) {
  if (!state.run) return info(state,"Prépare une descente.",false);
  const enemy=state.run.enemies?.find(e=>e.id===state.run.targetId && e.hp>0);
  if (!enemy) return info(state,"Sélectionne un ennemi avant de reculer.",false);
  const previous=distance(state.run,enemy);
  const moves=Object.entries(DIRECTIONS).map(([direction,[dx,dy]])=>{
    const x=state.run.x+dx,y=state.run.y+dy;
    return {direction,x,y,range:distance({x,y},enemy),tile:tileAt(x,y,state.run)};
  }).filter(m=>m.tile!=="#" && m.tile!=="^" &&
    !enemyAt(state.run,m.x,m.y) && m.range>previous);
  if(!moves.length) return info(state,"Repli impossible : aucune case libre pour s'éloigner.",false);
  moves.sort((a,b)=>b.range-a.range);
  return move(state,moves[0].direction,"retreat");
}

/** Spend a carried healing item. Consuming it costs one turn and triggers enemy reactions. */
export function useItem(state, itemId) {
  if (!state.run) return info(state, "Prépare d'abord une descente.", false);
  const healing = HEALING_ITEMS[itemId];
  if (!healing) return info(state, "Cet objet ne peut pas être utilisé.", false);
  if ((state.run.carried[itemId] || 0) < 1) {
    return info(state, ITEMS[itemId].name + " absent de ton sac.", false);
  }
  if (state.run.hp >= MAX_HP) {
    return info(state, "Tes points de vie sont déjà au maximum.", false);
  }
  const s = copy(state);
  const run = s.run;
  const healed = Math.min(healing, MAX_HP - run.hp);
  run.hp += healed;
  run.carried[itemId] -= 1;
  if (run.carried[itemId] === 0) delete run.carried[itemId];
  run.turns += 1;
  regenEndurance(s,1);
  recordEvent(s, "heal", ITEMS[itemId].name + " utilisé : +" + healed + " PV. (" + run.hp + "/" + MAX_HP + ")", run.turns);
  const after = enemyPhase(s);
  return { state:after, message:after.journal[0]?.text || "Soin effectué.", changed:true };
}

/** Waiting costs one turn; nearby enemies can still move or attack. */
export function waitTurn(state) {
  if (!state.run) return info(state, "Tu es au refuge.", false);
  const s = copy(state);
  s.run.turns += 1;
  regenEndurance(s,3);
  recordEvent(s, "system", "Tu attends et observes les profondeurs.", s.run.turns);
  const after = enemyPhase(s);
  return { state:after, message:after.journal[0]?.text || "Tour passé.", changed:true };
}

export function mapText(state) {
  if (!state.run) return "";
  const {x: px,y: py,collected} = state.run;
  return (state.run.map||MAP).map((row,y) => row.split("").map((tile,x) => {
    if (x === px && y === py) return "@";
    const enemy=enemyAt(state.run,x,y);
    if(enemy) return ENEMY_TYPES[enemy.kind].symbol;
    if (tile === "S") return ".";
    if (tile === "$" && collected.includes(positionKey(x,y))) return ".";
    return tile;
  }).join("")).join("\n");
}
export function inventoryCount(state) { return state.run ? quantity(state.run.carried) : 0; }
