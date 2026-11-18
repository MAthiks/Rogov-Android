import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {ITEMS,SAVE_KEY,SCHEMA_VERSION,newGame,beginRun,validateSave} from "../docs/game.js";
import {VEYR_NPC_IDS,VEYR_NPC_CONCEPTS,VEYR_NPC_SPRITES,
  ITEM_ART_IDS,ITEM_SVGS,ITEM_SPRITES} from "../docs/veyr-art.js";
import {HERO_SVGS} from "../docs/hero-art.js";

const source=path=>readFileSync(new URL(path,import.meta.url),"utf8");

test("ART-091D: every existing game item has one distinct transparent 24px Sprite C icon",()=>{
  assert.deepEqual([...ITEM_ART_IDS].sort(),Object.keys(ITEMS).sort());
  assert.equal(new Set(ITEM_ART_IDS).size,5);
  assert.equal(new Set(Object.values(ITEM_SVGS)).size,5);
  for(const id of ITEM_ART_IDS){
    const svg=ITEM_SVGS[id],uri=ITEM_SPRITES[id];
    assert.match(svg,/viewBox="0 0 24 24" width="24" height="24"/);
    assert.match(svg,/shape-rendering="crispEdges"/);
    assert.match(svg,/<g data-feature="[a-z-]+">/);
    assert.doesNotMatch(svg,/<(?:script|image|foreignObject|text|animate)\b|(?:xlink:)?href\s*=/i);
    assert.match(uri,/^data:image\/svg\+xml;charset=UTF-8,/);
    assert.equal(decodeURIComponent(uri.split(",").slice(1).join(",")),svg);
    assert.ok(typeof ITEMS[id].symbol==="string","Legacy ASCII icon still exists");
  }
  assert.match(ITEM_SVGS["weapon.rusty_sword"],/worn-notched-sword/);
  assert.match(ITEM_SVGS["weapon.ashen_blade"],/forged-ashen-blade/);
  assert.match(ITEM_SVGS["consumable.bandage"],/rolled-cloth-bandage/);
  assert.match(ITEM_SVGS["relic.ashen_fragment"],/faceted-ashen-mineral/);
  assert.match(ITEM_SVGS["consumable.dusk_tonic"],/stoppered-dusk-tonic/);
});

test("ART-091D: three clearly distinct Veyr NPCs remain noninteractive art concepts",()=>{
  assert.deepEqual(VEYR_NPC_IDS,["warden","smith","scholar"]);
  assert.equal(new Set(Object.values(VEYR_NPC_SPRITES)).size,3);
  for(const id of VEYR_NPC_IDS){
    const npc=VEYR_NPC_CONCEPTS[id],uri=VEYR_NPC_SPRITES[id];
    assert.ok(npc.name&&npc.role.startsWith("Concept · "));
    assert.match(npc.svg,/viewBox="0 0 24 24" width="24" height="24"/);
    assert.match(npc.svg,/shape-rendering="crispEdges"/);
    assert.doesNotMatch(npc.svg,/<(?:script|image|foreignObject|text|animate)\b|(?:xlink:)?href\s*=/i);
    assert.equal(decodeURIComponent(uri.slice(uri.indexOf(",")+1)),npc.svg);
    for(const pose of Object.values(HERO_SVGS))
      assert.notEqual(npc.svg,pose,"Never reuse the PJ silhouette");
  }
  assert.match(VEYR_NPC_CONCEPTS.warden.svg,/warden-hood-and-lantern/);
  assert.match(VEYR_NPC_CONCEPTS.warden.svg,/amber-lantern/);
  assert.match(VEYR_NPC_CONCEPTS.smith.svg,/stocky-smith-apron/);
  assert.match(VEYR_NPC_CONCEPTS.smith.svg,/blacksmith-hammer/);
  assert.match(VEYR_NPC_CONCEPTS.scholar.svg,/echo-scholar-open-book/);
  assert.match(VEYR_NPC_CONCEPTS.scholar.svg,/green-echo-book/);
  const artSource=source("../docs/veyr-art.js");
  assert.doesNotMatch(artSource,/import\s|export function |newGame\(|localStorage|Math\.random/);
});

test("ART-091D: saved schemas and gameplay items are unchanged",()=>{
  const state=beginRun(newGame(),[]).state;
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(validateSave(state),true);
  assert.deepEqual(Object.keys(ITEMS).sort(),[
    "weapon.rusty_sword","weapon.ashen_blade","consumable.bandage",
    "relic.ashen_fragment","consumable.dusk_tonic"
  ].sort());
  assert.equal(Object.hasOwn(state,"npcs"),false);
  assert.equal(Object.hasOwn(state.meta,"npcs"),false);
  assert.equal(Object.hasOwn(state.run,"npcs"),false);
  const code=source("../docs/app.js");
  assert.match(code,/if \(ITEM_SPRITES\[id\]\)/);
  assert.match(code,/image\.addEventListener\("error",/);
  assert.match(code,/renderInventory\(\$\("stash-items"\), state\.meta\.stash, true\);/);
  assert.match(code,/renderInventory\(\$\("bag-items"\), run\.carried\);/);
  assert.match(code,/function renderVeyrConceptGallery\(\)/);
  assert.doesNotMatch(code,/chooseNpc|startNpcDialogue|npc\.action/i);
});

test("ART-091D: compact gallery is collapsed, accessible and packed into offline PWA",()=>{
  const html=source("../docs/index.html");
  const sw=source("../docs/sw.js");
  const css=source("../docs/style.css");
  assert.match(html,/<details id="veyr-concepts" class="veyr-concepts">/);
  assert.match(html,/Aucun personnage interactif ni dialogue/);
  assert.match(html,/id="veyr-concept-grid"/);
  assert.doesNotMatch(html,/<button[^>]*npc-|id="npc-/i);
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-[a-z0-9-]+"/,
    "The original Veyr assets must survive later PWA versioning");
  assert.match(sw,/"\.\/veyr-art\.js"/);
  for(const name of ["hero-art.js","enemy-art.js","interaction-art.js"])
    assert.ok(sw.includes('"./'+name+'"'));
  assert.match(css,/\.item-row \.item-icon img/);
  assert.match(css,/\.veyr-concept-grid/);
  assert.match(css,/image-rendering:pixelated/);
});
