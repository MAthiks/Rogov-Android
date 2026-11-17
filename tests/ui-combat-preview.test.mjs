import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { beginRun, move, newGame, validateSave } from "../docs/game.js";
import { selectTarget, combatSnapshot } from "../docs/combat.js";

const asset = (path) => readFileSync(new URL("../docs/" + path, import.meta.url), "utf8");

test("DEV-071 mobile target panel is inside the expedition below the map", () => {
  const html=asset("index.html");
  for (const id of ["target-choices", "combat-panel", "target-clear", "combat-target-name",
    "combat-target-family", "combat-target-health", "combat-target-distance",
    "combat-intent", "combat-weapon", "combat-defense", "combat-range-note"]) {
    assert.ok(html.includes('id="'+id+'"'), id + " missing");
  }
  const map=html.indexOf('id="tile-map"');
  const targets=html.indexOf('id="target-choices"');
  const panel=html.indexOf('id="combat-panel"');
  const dpad=html.indexOf('class="dpad"');
  assert.ok(map>=0 && map<targets && targets<panel && panel<dpad);
  assert.match(html,/id="combat-panel"[^>]*hidden/);
  assert.match(html,/APERÇU UNIQUEMENT/);
});

test("DEV-071 touch target selection and keyboard cycle use pure no-turn contract", () => {
  const app=asset("app.js");
  const tile=asset("tiles.js");
  assert.match(tile,/cell\.dataset\.enemyId=enemy\.id/);
  assert.match(tile,/selected-target-tile/);
  assert.match(app,/if \(cell\.dataset\.enemyId\) chooseTarget\(cell\.dataset\.enemyId\)/);
  assert.match(app,/selectTarget\(state,enemyId\)/);
  assert.match(app,/event\.key\.toLowerCase\(\)==="c"/);
  assert.match(app,/choice\.addEventListener\("click",\(\)=>chooseTarget\(enemy\.id\)\)/);
  assert.match(app,/renderTargetChoices\(\)/);
  assert.match(app,/renderCombatPreview\(\)/);
});

test("DEV-071 target choices are keyboard-accessible and do not depend on tiles", () => {
  const app=asset("app.js");
  const html=asset("index.html");
  assert.match(app,/const choice=document\.createElement\("button"\)/);
  assert.match(app,/choice\.setAttribute\("aria-pressed"/);
  assert.match(html,/Choisir une cible sans perdre de tour/);
  assert.match(html,/id="dungeon-map"[^>]+hidden/);
  assert.match(app,/renderTargetChoices\(\)/);
  assert.match(app,/renderMode === "tiles"\) drawTileMap/);
});

test("DEV-071 four tactical actions are labelled as previews and not activatable", () => {
  const html=asset("index.html");
  const app=asset("app.js");
  assert.match(html,/class="tactic-preview-actions"/);
  for (const label of ["Attaquer","Esquiver","Parer / Bloquer","Reculer"]) {
    assert.ok(html.includes(label),label+" missing");
  }
  assert.doesNotMatch(html,/id="tactical-attack"/);
  assert.doesNotMatch(app,/function attackTarget/);
  assert.match(html,/le combat actuel s'effectue toujours en marchant vers l'ennemi/i);
});

test("DEV-071 selecting a target preserves all current combat, death and extraction rules", () => {
  let s=beginRun(newGame(),["weapon.rusty_sword"]).state;
  const selected=selectTarget(s,"nhal-guardian-01").state;
  assert.equal(selected.run.turns,0);
  assert.equal(selected.meta.stash["weapon.rusty_sword"],0);
  assert.ok(validateSave(selected));
  assert.equal(combatSnapshot(selected).name,"Gardien déchu");
  // The unchanged v0.6 engine can still move and extract with a selected enemy ID.
  s=selected;
  for (const direction of ["up","right","right"]) s=move(s,direction).state;
  assert.equal(s.meta.hero.xp,1);
  assert.equal(s.run.targetId,"nhal-guardian-01");
  assert.ok(validateSave(s));
});

test("DEV-071 cache v0.6.2 includes the new combat module for offline operation", () => {
  const sw=asset("sw.js");
  const html=asset("index.html");
  assert.match(sw,/rogov-v0\.6\.2/);
  assert.match(sw,/"\.\/combat\.js"/);
  assert.match(html,/style\.css\?v=0\.6\.2/);
  assert.match(html,/app\.js\?v=0\.6\.2/);
});
