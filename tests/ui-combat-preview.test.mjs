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
  assert.ok(map>=0 && map<dpad && dpad<targets && targets<panel,
    "DEV-090A puts movement next to the map before contextual combat");
  assert.match(html,/id="combat-panel"[^>]*hidden/);
  assert.match(html,/COMBAT TACTIQUE/);
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

test("DEV-072 tactical actions are buttons attached to the engine", () => {
  const html=asset("index.html");
  const app=asset("app.js");
  assert.match(html,/class="tactic-actions"/);
  for (const id of ["combat-attack","combat-dodge","combat-parry","combat-block","combat-retreat"]) {
    assert.ok(html.includes('id="'+id+'"'),id+" missing");
    assert.ok(app.includes('$("'+id+'").addEventListener("click"'),id+" has no callback");
  }
  for (const label of ["Attaquer","Esquiver","Parer","Bloquer","Reculer"]) {
    assert.ok(html.includes(label),label+" missing");
  }
  assert.match(app,/act\(attackTarget\(state\)\)/);
  assert.match(app,/act\(defend\(state,"dodge"\)\)/);
  assert.match(app,/act\(retreat\(state\)\)/);
  assert.match(html,/les intentions indiquent le danger du tour suivant/i);

});

test("DEV-071 selecting a target preserves current save and extraction rules", () => {
  let s=beginRun(newGame(),["weapon.rusty_sword"]).state;
  const selected=selectTarget(s,"nhal-guardian-01").state;
  assert.equal(selected.run.turns,0);
  assert.equal(selected.meta.stash["weapon.rusty_sword"],0);
  assert.ok(validateSave(selected));
  assert.equal(combatSnapshot(selected).name,"Gardien déchu");
  // Target selection remains free and movement remains possible with a selected ID.
  s=selected;
  for (const direction of ["up","right","right"]) s=move(s,direction).state;
  assert.equal(s.meta.hero.xp,1);
  assert.equal(s.run.targetId,"nhal-guardian-01");
  assert.ok(validateSave(s));
});

test("DEV-072 cache v0.7f includes the combat module for offline operation", () => {
  const sw=asset("sw.js");
  const html=asset("index.html");
  assert.match(sw,/rogov-v0\.7f/);
  assert.match(sw,/"\.\/combat\.js"/);
  assert.match(html,/style\.css\?v=0\.7f/);
  assert.match(html,/app\.js\?v=0\.7f/);
});


test("DEV-090B combat dock follows field controls, keeps enemy tells and folds optional detail",()=>{
  const html=asset("index.html");
  const app=asset("app.js");
  const map=html.indexOf('id="tile-map"');
  const field=html.indexOf('id="field-controls"');
  const dock=html.indexOf('id="combat-dock"');
  const target=html.indexOf('id="target-choices"');
  const preview=html.indexOf('id="combat-panel"');
  const exploration=html.indexOf('id="exploration-map-panel"');
  assert.ok(map>=0&&map<field&&field<dock&&dock<target&&target<preview&&
    preview<exploration,"the visible combat actions are grouped beside the map");
  assert.match(html,/id="combat-dock"[^>]*hidden/);
  assert.match(html,/id="combat-analysis"/);
  assert.match(html,/id="combat-target-meter"[^>]*aria-label="Santé de la cible"/);
  assert.match(app,/dock\.hidden=enemies\.length===0/);
  assert.match(app,/explorationState\(state\.run,e\.x,e\.y\)==="visible"/);
  assert.match(app,/\$\("combat-target-meter"\)\.max=snapshot\.maxHp/);
  assert.match(app,/\$\("combat-target-meter"\)\.value=Math\.max\(0,snapshot\.hp\)/);
  assert.match(app,/"jump-combat":\(\)=>!\$\("combat-dock"\)\.hidden/);
  assert.match(html,/id="combat-attack"/);
  assert.match(html,/id="combat-retreat"/);
});
