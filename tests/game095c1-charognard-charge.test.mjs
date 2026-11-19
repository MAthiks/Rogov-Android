// GAME-095C1 — a telegraphed threat with real counterplay, no RNG tricks.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newGame,beginRun,waitTurn,move,defend,recall,resolveFloorExit,
  validateSave,normalizeJournal,ENEMY_TYPES,SAVE_KEY,SCHEMA_VERSION}
  from "../docs/game.js";
import {charognardLane,charognardDecision,charognardIntent,
  CHAROGNARD_TACTICS,validEnemyTactic} from "../docs/enemy-ai.js";
import {INTENT_KINDS,currentEnemyIntent} from "../docs/combat.js";
import {balanceDepthLayout} from "../docs/depth-balance.js";
import {generateDeepLayout} from "../docs/deep-dungeon.js";
import {deepFloorSeed} from "../docs/floors.js";

const origin=()=>{
  const s=beginRun(newGame(),["weapon.rusty_sword"]).state;
  s.run.enemies=[{id:"c1-scout",kind:"charognard",x:3,y:7,hp:3,
    tactic:"stalking"}];
  s.run.x=1;s.run.y=7;
  return s;
};
const char=s=>s.run.enemies[0];
const step=s=>waitTurn(s).state;
const deep=()=>{
  const seed=newGame();seed.meta.descents=1;
  const state=beginRun(seed,["weapon.rusty_sword"],null,
    {multiFloor:true}).state;
  state.run.x=state.run.exit.x;state.run.y=state.run.exit.y;
  state.run.enemies=[]; // isolate transition from actual combat
  return resolveFloorExit(state,"descend").state;
};

test("GAME-095C1: charge uses explicit known states, not legacy migration",()=>{
  assert.deepEqual(CHAROGNARD_TACTICS,["stalking","winding","recovering"]);
  assert.ok(INTENT_KINDS.includes("charognard_lunge"));
  assert.ok(INTENT_KINDS.includes("charognard_prepare"));
  for(const tactic of CHAROGNARD_TACTICS)
    assert.equal(validEnemyTactic({kind:"charognard",tactic}),true);
  assert.equal(validEnemyTactic({kind:"charognard",tactic:"guardian_guard"}),false);
  assert.equal(validEnemyTactic({kind:"rift_larva",tactic:"winding"}),false);
  assert.equal(validEnemyTactic({kind:"guardian",tactic:"stalking"}),false);
  assert.equal(validEnemyTactic({kind:"charognard"}),true);
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(SAVE_KEY,"rogov-web-v1");
});

test("GAME-095C1: a visible 2-cell lane braces before any strike",()=>{
  let s=origin();
  const pre=s.run.rngState,position={x:char(s).x,y:char(s).y};
  assert.ok(validateSave(s));
  assert.deepEqual(charognardLane(s.run,char(s)),{x:2,y:7});
  assert.equal(currentEnemyIntent(s.run,char(s)).kind,"charognard_prepare");
  const before=JSON.stringify(s);
  s=step(s);
  assert.equal(s.run.turns,1);
  assert.equal(s.run.hp,12);
  assert.equal(char(s).tactic,"winding");
  assert.deepEqual({x:char(s).x,y:char(s).y},position);
  assert.equal(s.run.rngState,pre,"preparation consumes no random roll");
  assert.equal(currentEnemyIntent(s.run,char(s)).kind,"charognard_lunge");
  assert.match(charognardIntent(char(s),s.run).label,/Quitte l'axe/);
  assert.ok(s.journal.some(e=>e.type==="danger"&&e.text.includes("CHARGE")));
  assert.notEqual(JSON.stringify(s),before);
  assert.ok(validateSave(s));
});

test("GAME-095C1: lunge attacks once for normal damage, then recovers",()=>{
  let s=origin();s.run.rngState=1;
  s=step(s);
  const charged=normalizeJournal(JSON.parse(JSON.stringify(s)));
  // Legacy run normalization legitimately fills missing enemy attributes
  // and loadout; it must never replace the persisted tactical windup.
  assert.equal(charged.run.enemies[0].tactic,"winding");
  assert.equal(charged.run.rngState,s.run.rngState);
  assert.equal(charged.run.hp,s.run.hp);
  assert.equal(charged.run.turns,s.run.turns);
  assert.ok(validateSave(charged));
  assert.deepEqual(normalizeJournal(JSON.parse(JSON.stringify(charged))),charged);
  s=step(s);
  const hitState=normalizeJournal(JSON.parse(JSON.stringify(s)));
  assert.equal(s.run.turns,2);
  assert.deepEqual({x:char(s).x,y:char(s).y},{x:2,y:7});
  assert.equal(char(s).tactic,"recovering");
  assert.ok(s.run.hp>=11,"one charge does not increase damage over a normal bite");
  assert.ok(s.run.hp<=12,"a charged strike still uses the normal hit roll");
  assert.ok(validateSave(s));
  const hp=s.run.hp,rng=s.run.rngState;
  s=step(s);
  assert.equal(s.run.hp,hp,"recovery grants the player a full response turn");
  assert.equal(char(s).tactic,"stalking");
  assert.equal(s.run.rngState,rng,"recovery is deterministic and RNG-free");
  assert.ok(s.journal.some(e=>/reprend ses appuis/.test(e.text)));
  assert.ok(validateSave(s));
  assert.deepEqual(normalizeJournal(JSON.parse(JSON.stringify(hitState))),hitState);
});

test("GAME-095C1: stepping off the axis interrupts charge with zero attack rolls",()=>{
  let s=origin();s.run.rngState=1;s=step(s);
  const seed=s.run.rngState;
  assert.equal(char(s).tactic,"winding");
  assert.equal(currentEnemyIntent(s.run,char(s)).kind,"charognard_lunge");
  s=move(s,"up").state;
  assert.ok(s.run,"sidestep should not recall");
  assert.deepEqual({x:s.run.x,y:s.run.y},{x:1,y:6});
  assert.equal(s.run.hp,12);
  assert.equal(char(s).tactic,"stalking");
  assert.equal(s.run.rngState,seed);
  assert.equal(charognardLane(s.run,char(s)),null);
  assert.ok(s.journal.some(e=>/charge interrompue/.test(e.text)));
  assert.ok(validateSave(s));
});

test("GAME-095C1: taking the middle space also cancels the charge",()=>{
  let s=step(origin());
  assert.equal(char(s).tactic,"winding");
  s=move(s,"right").state;
  assert.ok(s.run);
  assert.deepEqual([s.run.x,s.run.y],[2,7]);
  assert.equal(s.run.hp,12,"moving into contact prevents a preannounced lunge");
  assert.equal(char(s).tactic,"stalking");
  assert.equal(currentEnemyIntent(s.run,char(s)).kind,"melee",
    "next turn the enemy returns to its historical normal bite");
  assert.ok(validateSave(s));
});

test("GAME-095C1: a defense can respond to the telegraphed attack",()=>{
  let s=step(origin());s.run.rngState=1;
  const before=s.run.hp;
  s=defend(s,"dodge").state;
  assert.ok(s.run);
  assert.equal(s.run.turns,2);
  // GAME-095D2: an earned armed dodge can now riposte and defeat this
  // wounded Charognard; otherwise the original recovery turn still applies.
  if(s.run.enemies.length===0)
    assert.ok(s.journal.some(e=>e.text.includes("RIPOSTE D'ESQUIVE")));
  else assert.equal(char(s).tactic,"recovering");
  assert.ok(s.run.hp<=before&&s.run.hp>=before-1,
    "same defensive resolver, no artificial damage boost");
  assert.ok(validateSave(s));
});

test("GAME-095C1: closed terrain, a trap or an enemy blocks the charge",()=>{
  const original=origin(),first=char(original);
  assert.deepEqual(charognardLane(original.run,first),{x:2,y:7});
  const blocked=structuredClone(original);
  blocked.run.traps=[{x:2,y:7}];
  assert.equal(charognardLane(blocked.run,char(blocked)),null);
  const crowded=structuredClone(original);
  crowded.run.enemies.push({id:"another",kind:"charognard",x:2,y:7,hp:3});
  assert.equal(charognardLane(crowded.run,char(crowded)),null);
  const wall=structuredClone(original);
  wall.run.map[7]=wall.run.map[7].slice(0,2)+"#"+wall.run.map[7].slice(3);
  assert.equal(charognardLane(wall.run,char(wall)),null);
  for(const s of [blocked,crowded,wall]){
    char(s).tactic="winding";
    assert.equal(charognardDecision(char(s),s.run),"interrupt");
    assert.equal(charognardIntent(char(s),s.run).kind,"idle");
  }
});

test("GAME-095C1: old enemies never charge, even on the exact same lane",()=>{
  let s=origin();delete char(s).tactic;
  assert.ok(validateSave(s));
  assert.equal(charognardDecision(char(s),s.run),"legacy");
  assert.equal(currentEnemyIntent(s.run,char(s)).kind,"approach");
  s=step(s);
  assert.equal(char(s).tactic,undefined);
  assert.equal(char(s).x,2);
  assert.equal(s.run.hp,12);
  assert.ok(validateSave(s));
});

test("GAME-095C1: only newly generated B2 multi-floor scouts opt in",()=>{
  const s=deep();
  assert.equal(s.run.floorDepth,2);
  assert.equal(s.run.depthBalanceVersion,1);
  assert.ok(validateSave(s));
  const scout=s.run.enemies.find(e=>e.id==="nhal-charognard-scout-01");
  assert.ok(scout);
  assert.equal(scout.tactic,"stalking");
  assert.equal(s.run.enemies.length,4);
  assert.equal(s.run.enemies.filter(e=>e.kind==="rift_larva").length,2);
  for(const enemy of s.run.enemies)
    if(enemy!==scout)assert.equal(enemy.kind==="guardian"?enemy.tactic:"",enemy.kind==="guardian"?"ready":"");
  const fresh=balanceDepthLayout(generateDeepLayout(deepFloorSeed(2,3)),2,3);
  assert.equal(fresh.enemies.find(e=>e.id==="nhal-charognard-scout-01").tactic,"stalking");
  assert.equal(fresh.enemies.filter(e=>e.kind==="guardian").length,2);
  assert.equal(fresh.enemies.length,4);
  // Persisted B2 floor snapshots are never regenerated or tactically migrated.
  const legacy=deep();
  delete legacy.run.enemies.find(e=>e.id==="nhal-charognard-scout-01").tactic;
  assert.ok(validateSave(legacy));
  const reloaded=normalizeJournal(JSON.parse(JSON.stringify(legacy)));
  assert.equal(reloaded.run.enemies.find(e=>e.id==="nhal-charognard-scout-01").tactic,
    undefined);
  assert.ok(validateSave(reloaded));
  const returned=recall(s).state;
  assert.equal(returned.run,null);
  assert.ok(validateSave(returned));
});

test("GAME-095C1: Android telegraph is visible-only, PWA cached",()=>{
  const file=path=>readFileSync(new URL("../docs/"+path,import.meta.url),"utf8");
  const app=file("app.js"),tiles=file("tiles.js"),css=file("style.css"),sw=file("sw.js");
  assert.match(app,/"charognard_lunge"/);
  assert.match(app,/explorationState\(run,enemy\.x,enemy\.y\)!=="visible"\)continue/);
  assert.match(app,/explorationState\(state\.run,e\.x,e\.y\)==="visible"/);
  assert.match(tiles,/enemy\.kind==="charognard"&&enemy\.tactic==="winding"/);
  assert.match(css,/\.hostile-tile\.enemy-charge/);
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-[a-z0-9-]+"/);
  assert.match(sw,/"\.\/enemy-ai\.js"/);
});
