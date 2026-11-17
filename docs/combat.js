// ROGOV v0.7 DEV-070 — pure combat contract; no UI or change to v0.6 gameplay.
// Future combat actions will use this contract, while v0.6 remains playable.
import { MAP, ENEMY_TYPES, enemyAt } from "./game.js";
import {guardianIntent} from "./enemy-ai.js";

export const RANGES = Object.freeze({ CONTACT: "CONTACT", PROCHE: "PROCHE", LOIN: "LOIN" });
export const COMBAT_ACTIONS = Object.freeze(["attack", "dodge", "parry", "block", "retreat"]);
export const DEFENSE_MODES = Object.freeze(["none", "dodge", "parry", "block"]);
export const INTENT_KINDS = Object.freeze(["idle", "approach", "melee", "rift_charge", "rift_pulse",
  "guardian_prepare","guardian_heavy","guardian_guard"]);

/** Manhattan distance on the orthogonal roguelike grid. */
export function tileDistance(a, b) {
  if (!a || !b || ![a.x, a.y, b.x, b.y].every(Number.isInteger)) return null;
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

/** MVP thresholds from COMBAT_DESIGN_V0.7.md. */
export function rangeBand(distance) {
  if (!Number.isInteger(distance) || distance < 1) return null;
  if (distance === 1) return RANGES.CONTACT;
  if (distance <= 3) return RANGES.PROCHE;
  return RANGES.LOIN;
}

/** Straight-axis line of sight; diagonal and walls are not silently traversed. */
export function straightLineClear(a, b, map = MAP) {
  if (tileDistance(a, b) === null) return false;
  if (a.x !== b.x && a.y !== b.y) return false;
  if (a.x === b.x && a.y === b.y) return false;
  const dx = Math.sign(b.x - a.x);
  const dy = Math.sign(b.y - a.y);
  for (let x = a.x + dx, y = a.y + dy; x !== b.x || y !== b.y; x += dx, y += dy) {
    if (map[y]?.[x] === undefined || map[y][x] === "#") return false;
  }
  return true;
}

/** DEV-073C: deterministic next-phase enemy forecast (shares AI state with engine). */
export function currentEnemyIntent(run, enemy, map = MAP) {
  if (!run || !enemy || !ENEMY_TYPES[enemy.kind] || enemy.hp <= 0) return null;
  const d = tileDistance(run, enemy);
  if (d === null) return null;
  const nextTurn = run.turns + 1;
  const intent = (kind, label) => Object.freeze({ kind, label, nextTurn });
  if (enemy.kind === "rift_larva") {
    if (d === 2 && straightLineClear(run, enemy, map)) {
      return nextTurn % 3 === 0
        ? intent("rift_pulse", "Onde spectrale imminente")
        : intent("rift_charge", "La faille vibre, l'onde se prépare");
    }
    if (d === 1) return intent("melee", "Attaque de contact");
    return intent("idle", "Présence immobile");
  }
  if (enemy.kind==="guardian"){
    const next=guardianIntent(enemy,d);
    return Object.freeze({...next,nextTurn});
  }
  if (d === 1) return intent("melee", "Attaque de contact imminente");
  if (enemy.kind === "charognard" && d <= ENEMY_TYPES.charognard.aggro) {
    return intent("approach", "Le Charognard se rapproche");
  }
  return intent("idle","À l'affût");
}

/**
 * Target selection is informational: no turn, HP, equipment or enemy changes.
 * Selected target is represented by a stable enemy ID in the optional run field.
 */
export function selectTarget(state, enemyId) {
  if (!state?.run || typeof enemyId !== "string" || enemyId.length === 0) {
    return { state, changed: false, message: "Aucune cible valide." };
  }
  const target = state.run.enemies?.find(enemy => enemy.id === enemyId && enemy.hp > 0);
  if (!target) return { state, changed: false, message: "Cible introuvable." };
  if (state.run.targetId === enemyId) {
    return { state, changed: false, message: "Cible déjà sélectionnée." };
  }
  return {
    state: { ...state, run: { ...state.run, targetId: enemyId } },
    changed: true,
    message: ENEMY_TYPES[target.kind].name + " ciblé."
  };
}

export function clearTarget(state) {
  if (!state?.run || state.run.targetId === undefined || state.run.targetId === null) {
    return { state, changed: false, message: "Aucune cible." };
  }
  return {
    state: { ...state, run: { ...state.run, targetId: null } },
    changed: true,
    message: "Cible désélectionnée."
  };
}

/** Forward-compatible optional tactical fields; old saves without them stay valid. */
export function validTacticalFields(run) {
  if (!run || typeof run !== "object") return false;
  const selected = run.targetId;
  if (selected !== undefined && selected !== null &&
    (typeof selected !== "string" || selected.length < 1)) return false;
  if (run.defense !== undefined && !DEFENSE_MODES.includes(run.defense)) return false;
  return true;
}

/** Stable, serializable view model for the future contextual mobile combat panel. */
export function combatSnapshot(state) {
  const run = state?.run;
  if (!run || !validTacticalFields(run) || !run.targetId) return null;
  const target = run.enemies?.find(enemy => enemy.id === run.targetId && enemy.hp > 0);
  if (!target || !ENEMY_TYPES[target.kind]) return null;
  const distance = tileDistance(run, target);
  if (distance === null || distance < 1) return null;
  return {
    targetId: target.id,
    name: ENEMY_TYPES[target.kind].name,
    family: ENEMY_TYPES[target.kind].family,
    kind: target.kind,
    hp: target.hp,
    maxHp: ENEMY_TYPES[target.kind].hp,
    distance,
    band: rangeBand(distance),
    meleeAvailable: distance === 1,
    intent: currentEnemyIntent(run, target),
    defense: run.defense ?? "none"
  };
}
