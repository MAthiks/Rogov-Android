import test from "node:test";
import assert from "node:assert/strict";
import {newGame, validateSave, beginRun, move, recall, extract, inventoryCount, mapText} from "../docs/game.js";

test("fresh refuge is stable", () => {
  const s = newGame();
  assert.equal(s.meta.hero.level, 1);
  assert.equal(s.meta.stash["weapon.rusty_sword"], 1);
  assert.ok(validateSave(s));
});
test("death returns the same hero, loses all carried items, protects stash", () => {
  let s = beginRun(newGame(), ["weapon.rusty_sword"]).state;
  assert.equal(s.meta.stash["weapon.rusty_sword"], 0);
  s = move(s, "right").state;
  s = move(s, "right").state; // ^ hazard
  assert.equal(s.run, null);
  assert.equal(s.meta.recalls, 1);
  assert.equal(s.meta.hero.level, 1);
  assert.equal(s.meta.stash["weapon.rusty_sword"], 0);
  assert.equal(s.meta.stash["consumable.bandage"], 2);
});
test("extraction secures brought and found items and preserves progression", () => {
  let s = beginRun(newGame(), ["weapon.rusty_sword"]).state;
  s = move(s, "up").state;
  s = move(s, "right").state;
  s = move(s, "right").state; // $ at 3,6
  assert.equal(s.run.carried["relic.ashen_fragment"], 1);
  assert.equal(s.meta.hero.xp, 1);
  for(let n=0;n<9;n++) s = move(s, "right").state;
  s = move(s, "down").state; // E at 12,7
  assert.equal(s.run, null);
  assert.equal(s.meta.extractions, 1);
  assert.equal(s.meta.stash["weapon.rusty_sword"], 1);
  assert.equal(s.meta.stash["relic.ashen_fragment"], 1);
  assert.equal(s.meta.hero.xp, 3);
});
test("wall cannot move nor consume a turn", () => {
  const started = beginRun(newGame(), []).state;
  const r = move(started, "left");
  assert.equal(r.changed, false);
  assert.equal(r.state.run.turns, 0);
});
test("invalid equipment does not modify stash", () => {
  const initial = newGame();
  const result = beginRun(initial, ["consumable.bandage", "consumable.bandage"]);
  assert.equal(result.changed, false);
  assert.equal(initial.meta.stash["consumable.bandage"], 2);
  assert.equal(initial.run, null);
});
test("recovered experience remains after a death", () => {
  let s = beginRun(newGame(), []).state;
  for (const direction of ["up","right","right"]) s = move(s,direction).state;
  assert.equal(s.meta.hero.xp, 1);
  s = recall(s).state;
  assert.equal(s.meta.hero.xp, 1);
  assert.equal(s.meta.stash["relic.ashen_fragment"] || 0, 0);
});
test("inventory and map support predictable state", () => {
  const s = beginRun(newGame(), ["consumable.bandage"]).state;
  assert.equal(inventoryCount(s), 1);
  assert.equal(mapText(s).split("\n").length, 9);
  assert.ok(validateSave(s));
});
test("extraction away from E is not allowed", () => {
  const s = beginRun(newGame(), []).state;
  assert.equal(extract(s).changed, false);
  assert.ok(s.run);
});
