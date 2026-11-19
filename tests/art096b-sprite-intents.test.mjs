// ART-096B: original 24px Sprite C readability, no combat rule or fog changes.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {INTERACTIVE_SVGS,INTERACTIVE_SPRITES} from "../docs/interaction-art.js";
import {TILE_SPRITES} from "../docs/tiles.js";
import {newGame,beginRun,validateSave,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";
import {currentEnemyIntent} from "../docs/combat.js";
import {trapAppearance} from "../docs/traps.js";

const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const decode=src=>decodeURIComponent(src.slice("data:image/svg+xml;charset=UTF-8,".length));

test("ART-096B: closed/open chests retain radically distinct silhouettes and 24px SVG source",()=>{
  const sealed=INTERACTIVE_SVGS.loot,opened=INTERACTIVE_SVGS.chest_open;
  assert.match(sealed,/data-feature="sealed-lid"/);
  assert.match(sealed,/data-detail="chest-sealed-bands"/);
  assert.match(opened,/data-feature="raised-lid"/);
  assert.match(opened,/data-detail="chest-empty-cavity"/);
  assert.match(opened,/#101820/);
  assert.notEqual(sealed,opened);
  for(const id of ["loot","chest_open"]){
    assert.match(INTERACTIVE_SVGS[id],/viewBox="0 0 24 24" width="24" height="24"/);
    assert.equal(decode(INTERACTIVE_SPRITES[id]),INTERACTIVE_SVGS[id]);
    assert.equal(TILE_SPRITES[id],INTERACTIVE_SPRITES[id]);
  }
});

test("ART-096B: trap states stay four original states, with only discreet hidden clues",()=>{
  const kinds=[
    ["trap_clue","subtle-floor-scratches","ambiguous-stone-traces"],
    ["trap_revealed","exposed-spikes","armed-trap-fangs"],
    ["trap_disabled","broken-spikes","disarmed-trap-lockout"],
    ["trap_triggered","spent-mechanism","spent-trap-empty-bed"]
  ];
  assert.equal(new Set(kinds.map(([id])=>INTERACTIVE_SVGS[id])).size,4);
  for(const [id,feature,detail] of kinds){
    const xml=INTERACTIVE_SVGS[id];
    assert.match(xml,new RegExp('data-feature="'+feature+'"'));
    assert.match(xml,new RegExp('data-detail="'+detail+'"'));
    assert.match(xml,/shape-rendering="crispEdges"/);
    assert.doesNotMatch(xml,/<(?:script|image|foreignObject|text|animate)\b|(?:xlink:)?href\s*=/i);
    assert.equal(decode(INTERACTIVE_SPRITES[id]),xml);
    assert.equal(TILE_SPRITES[id],INTERACTIVE_SPRITES[id]);
  }
  assert.doesNotMatch(INTERACTIVE_SVGS.trap_clue,
    /armed-trap-fangs|broken-spikes|spent-trap-empty-bed/,
    "A clue must not identify an undiscovered trap's kind");
  const game=newGame();game.meta.descents=1;
  const state=beginRun(game).state;
  const baseline=JSON.stringify(state);
  const first=state.run.traps[0];
  assert.equal(trapAppearance(state.run,first.x,first.y)?.sprite==="trap_revealed",false);
  assert.equal(JSON.stringify(state),baseline,"Rendering assets never changes the trap");
});

test("ART-096B: combat intent glyphs classify only visible threats, without a hero halo",()=>{
  const tiles=read("../docs/tiles.js"),css=read("../docs/style.css");
  assert.match(tiles,/import \{currentEnemyIntent\} from "\.\/combat\.js"/);
  assert.match(tiles,/const enemy=visible\?enemyAt\(run,x,y\):null;/);
  assert.match(tiles,/const intent=currentEnemyIntent\(run,enemy\)/);
  assert.match(tiles,/const cue=VISUAL_CUES\[intent\?\.kind\]/);
  assert.match(tiles,/cell\.dataset\.intent=intent\.kind/);
  assert.match(tiles,/symbol\.setAttribute\("aria-hidden","true"\)/);
  assert.match(tiles,/symbol\.className="tile-intent-marker"/);
  assert.match(tiles,/if\(!visible&&!remembered\)[\s\S]*?continue;/);
  assert.match(css,/\.hostile-tile\.intent-imminent/);
  assert.match(css,/\.hostile-tile\.intent-preparing/);
  assert.match(css,/\.hostile-tile\.intent-guarding/);
  assert.match(css,/pointer-events:none/);
  assert.doesNotMatch(css,/\.tile-hero\s*:?\:?(?:before|after)/);
  for(const kind of ["guardian_heavy","charognard_lunge","rift_pulse","melee"])
    assert.match(tiles,new RegExp(kind+':"imminent"'));
});

test("ART-096B: visual forecast mirrors existing engine without spending a turn",()=>{
  const model=newGame();model.meta.descents=1;
  const state=beginRun(model).state;
  const before=JSON.stringify(state);
  for(const enemy of state.run.enemies){
    const intent=currentEnemyIntent(state.run,enemy);
    assert.ok(intent===null||typeof intent.kind==="string");
  }
  assert.equal(JSON.stringify(state),before);
  assert.equal(validateSave(state),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
});

test("ART-096B: all artwork remains local to the offline PWA",()=>{
  const sw=read("../docs/sw.js");
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-art096b-combat-legibility"/);
  for(const path of ["tiles.js","interaction-art.js","combat.js","ui096.css?v=1"])
    assert.ok(sw.includes('"./'+path+'"'),"Required offline module: "+path);
});
