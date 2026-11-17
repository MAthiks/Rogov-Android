import test from "node:test";
import assert from "node:assert/strict";
import {newGame, validateSave, normalizeJournal, JOURNAL_LIMIT, beginRun, move, recall, extract, inventoryCount, mapText} from "../docs/game.js";

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

import { TILE_SPRITES } from "../docs/tiles.js";

test("six original scalable graphical sprites are included", () => {
  for (const name of ["floor", "wall", "hero", "loot", "hazard", "exit"]) {
    assert.ok(TILE_SPRITES[name].startsWith("data:image/svg+xml;charset=UTF-8,"));
    assert.ok(decodeURIComponent(TILE_SPRITES[name].split(",")[1]).includes("shape-rendering"));
  }
});

test("new game starts with a structured system event", () => {
  assert.deepEqual(newGame().journal[0], {
    type:"system", turn:null, text:"Bienvenue au refuge de Veyr. Prépare une descente dans Nhal."
  });
});
test("v0.2 string journals are compatible; all hero and stash data persist", () => {
  const s = newGame();
  s.journal = ["Ancien événement", "Ancien butin"];
  s.meta.hero.xp=10; s.meta.hero.level=3;
  s.meta.stash["weapon.rusty_sword"]=5;
  assert.equal(validateSave(s),true);
  const migrated=normalizeJournal(s);
  assert.deepEqual(migrated.journal.map(e=>e.type), ["system","system"]);
  assert.deepEqual(migrated.journal.map(e=>e.text), ["Ancien événement","Ancien butin"]);
  assert.equal(migrated.meta.hero.xp,10);
  assert.equal(migrated.meta.stash["weapon.rusty_sword"],5);
  assert.equal(validateSave(migrated),true);
});
test("loot has its turn and type; extraction preserves the final turn", () => {
  let s=beginRun(newGame(),["weapon.rusty_sword"]).state;
  for (const d of ["up","right","right"]) s=move(s,d).state;
  assert.equal(s.journal[0].type,"loot");
  assert.equal(s.journal[0].turn,3);
  for(let n=0;n<9;n++) s=move(s,"right").state;
  s=move(s,"down").state;
  assert.equal(s.run,null);
  assert.equal(s.journal[0].type,"extraction");
  assert.equal(s.journal[0].turn,13);
});
test("Rappel event preserves fatal turn", () => {
  let s=beginRun(newGame(),[]).state;
  s=move(s,"right").state;
  s=move(s,"right").state;
  assert.equal(s.run,null);
  assert.equal(s.journal[0].type,"recall");
  assert.equal(s.journal[0].turn,2);
});
test("ordinary movements are grouped rather than flooding the log", () => {
  let s=beginRun(newGame(),[]).state;
  for(const d of ["up","right","left","right","left"]) s=move(s,d).state;
  const events=s.journal.filter(e=>e.type==="action");
  assert.equal(events.length,1);
  assert.equal(events[0].count,5);
  assert.equal(events[0].turn,5);
  assert.ok(validateSave(s));
});
test("journal is capped at 30 while the hero remains persistent", () => {
  let s=newGame();
  for(let n=0;n<25;n++) {
    s=beginRun(s,[]).state;
    s=recall(s).state;
  }
  assert.equal(s.journal.length,JOURNAL_LIMIT);
  assert.equal(s.meta.recalls,25);
  assert.ok(validateSave(s));
});
