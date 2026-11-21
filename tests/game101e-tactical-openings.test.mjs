// GAME-101E — deterministic combat windows, visible terrain and legacy saves.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newGame,beginRun,attackTarget,openingStrike,validateSave,
  normalizeJournal,ENEMY_TYPES,SAVE_KEY,SCHEMA_VERSION} from "../docs/game.js";
import {generateDeepLayout,validateDeepLayout} from "../docs/deep-dungeon.js";
import {openingOpportunity,OPENING_STRIKE_ENDURANCE_COST,
  COMBAT_OPENING_VERSION} from "../docs/opening-strike.js";
import {revealAround,explorationState} from "../docs/exploration-visibility.js";
import {nextRandom} from "../docs/combat-rules.js";

function deep(seed=2){
  const s=newGame();s.meta.descents=seed-1;
  return beginRun(s,["weapon.rusty_sword"]).state;
}
const adjacent=[[1,0],[-1,0],[0,1],[0,-1]];
const key=p=>p.x+","+p.y;
function beside(kind="charognard",tactic="recovering",seed=2){
  const s=deep(seed);
  // Use real generated geometry, no fake layout and no teleport to a wall.
  const enemy=s.run.enemies.find(e=>e.kind===kind);
  assert.ok(enemy,"fixture contains "+kind);
  const at=adjacent.map(([dx,dy])=>({x:enemy.x+dx,y:enemy.y+dy}))
    .find(p=>s.run.map[p.y]?.[p.x]==="."&&
      !s.run.traps.some(t=>key(t)===key(p))&&
      !s.run.sites.some(t=>key(t)===key(p))&&
      !s.run.encounters.some(t=>key(t)===key(p)));
  assert.ok(at,kind+" has adjacent ground");
  s.run.x=at.x;s.run.y=at.y;
  s.run.enemies=[{...enemy,tactic,hp:kind==="guardian"?5:3}];
  s.run.targetId=enemy.id;
  s.run.rngState=1; // first hit 49, next crit roll 68.
  revealAround(s.run);
  assert.equal(explorationState(s.run,enemy.x,enemy.y),"visible");
  assert.ok(validateSave(s),kind+" genuine saved fixture");
  return s;
}

test("GAME-101E: opt-in marker and 20 deep seeds keep existing routes and saves",()=>{
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(COMBAT_OPENING_VERSION,1);
  assert.equal(OPENING_STRIKE_ENDURANCE_COST,3);
  for(let seed=2;seed<22;seed++){
    const layout=generateDeepLayout(seed);
    assert.equal(layout.combatOpeningVersion,1);
    assert.ok(validateDeepLayout(layout));
    assert.deepEqual(generateDeepLayout(seed),layout);
  }
  const active=deep();
  assert.equal(active.run.combatOpeningVersion,1);
  assert.ok(validateSave(active));
  const reloaded=normalizeJournal(JSON.parse(JSON.stringify(active)));
  assert.equal(reloaded.run.combatOpeningVersion,1);
  assert.ok(validateSave(reloaded));
  const legacy=structuredClone(active);
  delete legacy.run.combatOpeningVersion;
  delete legacy.run.pursuitPlanVersion;
  assert.ok(validateSave(legacy));
  const wrong=structuredClone(active);wrong.run.combatOpeningVersion=2;
  assert.equal(validateSave(wrong),false);
  const inconsistent=structuredClone(active);delete inconsistent.run.encounterPlanVersion;
  assert.equal(validateSave(inconsistent),false);
});

test("GAME-101E: recovery strike uses normal hit RNG, costs 3 END and no extra XP",()=>{
  const s=beside(),snapshot=structuredClone(s);
  const enemy=s.run.enemies[0],op=openingOpportunity(s.run,enemy);
  assert.equal(op?.kind,"recovery");
  assert.equal(op.bonus,2);
  assert.equal(op.xpBonus,0);
  const standard=attackTarget(s).state;
  const outcome=openingStrike(s);
  assert.equal(outcome.changed,true);
  assert.deepEqual(s,snapshot,"input state must remain immutable");
  const r=outcome.state;
  assert.equal(r.run.turns,1);
  assert.equal(r.run.endurance,s.run.endurance-3);
  assert.equal(r.run.rngState,standard.run.rngState,
    "same hit/critical rolls as the ordinary strike");
  assert.ok(r.run.hp===s.run.hp,"recovering target cannot bite this phase");
  assert.ok(r.run.enemies.length<=standard.run.enemies.length);
  assert.ok(r.meta.hero.xp<=standard.meta.hero.xp+ENEMY_TYPES.charognard.xp);
  assert.ok(r.journal.some(e=>e.text.includes("FRAPPE DE BRÈCHE")));
  assert.ok(validateSave(r));
  assert.ok(validateSave(normalizeJournal(JSON.parse(JSON.stringify(r)))));
});

test("GAME-101E: guardian heavy windup is a high-risk rewarded kill, never a free roll",()=>{
  const s=beside("guardian","winding"),target=s.run.enemies[0];
  assert.deepEqual({kind:openingOpportunity(s.run,target).kind,
    bonus:openingOpportunity(s.run,target).bonus,
    xpBonus:openingOpportunity(s.run,target).xpBonus},
    {kind:"windup",bonus:2,xpBonus:1});
  // A wounded, telegraphing guardian can be finished before the heavy attack.
  target.hp=1;
  assert.ok(validateSave(s));
  const result=openingStrike(s);
  assert.equal(result.changed,true);
  assert.equal(result.state.run.enemies.length,0);
  assert.equal(result.state.meta.hero.xp,s.meta.hero.xp+ENEMY_TYPES.guardian.xp+1);
  assert.equal(result.state.run.hp,s.run.hp);
  assert.ok(validateSave(result.state));
  // A survivor does NOT have the heavy attack secretly canceled.
  const survivor=beside("guardian","winding");
  const before=survivor.run.hp;
  const missSeed=Array.from({length:600},(_,i)=>i).find(i=>
    nextRandom(i).roll>90);
  survivor.run.rngState=missSeed;
  const after=openingStrike(survivor);
  assert.equal(after.changed,true);
  assert.equal(after.state.run.turns,1);
  assert.ok(after.state.run.hp<=before);
  assert.equal(after.state.run.enemies[0]?.tactic,"guarding");
  assert.ok(validateSave(after.state));
});

test("GAME-101E: visible geometry grants +1 only from a real wall or closed door",()=>{
  let fixture=null;
  for(let seed=2;seed<=8&&!fixture;seed++){
    const base=deep(seed);
    for(let y=2;y<base.run.map.length-2&&!fixture;y++)
      for(let x=2;x<base.run.map[y].length-2&&!fixture;x++)
        for(const [dx,dy] of adjacent){
          const player={x:x-dx,y:y-dy},back={x:x+dx,y:y+dy};
          if(base.run.map[y][x]!=="."||
             base.run.map[player.y]?.[player.x]!=="."||
             base.run.map[back.y]?.[back.x]!=="#"||
             base.run.traps.some(t=>[key(player),x+","+y].includes(key(t)))||
             base.run.sites.some(t=>[key(player),x+","+y].includes(key(t)))||
             base.run.encounters.some(t=>[key(player),x+","+y].includes(key(t))))continue;
          const s=structuredClone(base);
          s.run.x=player.x;s.run.y=player.y;
          s.run.enemies=[{id:"pinned-test",kind:"charognard",x,y,hp:3,tactic:"stalking"}];
          s.run.targetId="pinned-test";
          revealAround(s.run);
          if(validateSave(s)&&openingOpportunity(s.run,s.run.enemies[0])?.kind==="pinned")
            fixture=s;
          if(fixture)break;
        }
  }
  assert.ok(fixture,"find a genuine, visible wall-pinned tactical approach");
  const enemy=fixture.run.enemies[0],op=openingOpportunity(fixture.run,enemy);
  assert.equal(op.kind,"pinned");
  assert.equal(op.bonus,1);
  assert.equal(op.xpBonus,0);
  assert.ok(validateSave(openingStrike(fixture).state));
  const hidden=structuredClone(fixture);
  const back={x:enemy.x+(enemy.x-fixture.run.x),
    y:enemy.y+(enemy.y-fixture.run.y)};
  // Moving the character away hides the wall: no knowledge from memory only.
  hidden.run.x=hidden.run.start.x;hidden.run.y=hidden.run.start.y;
  assert.equal(explorationState(hidden.run,enemy.x,enemy.y)==="visible"&&
      explorationState(hidden.run,back.x,back.y)==="visible",false);
  assert.equal(openingOpportunity(hidden.run,enemy),null);
});

test("GAME-101E: invalid window, unequipped weapon and low stamina spend no turn",()=>{
  const s=beside();
  const cases=[
    (()=>{const q=structuredClone(s);delete q.run.combatOpeningVersion;
      delete q.run.pursuitPlanVersion;return q;})(),
    (()=>{const q=structuredClone(s);q.run.enemies[0].tactic="stalking";return q;})(),
    (()=>{const q=structuredClone(s);q.run.endurance=2;return q;})(),
    (()=>{const q=structuredClone(s);q.run.loadout.mainHand=null;return q;})(),
    (()=>{const q=structuredClone(s);q.run.targetId=null;return q;})()
  ];
  for(const item of cases){
    const before=JSON.stringify(item),result=openingStrike(item);
    assert.equal(result.changed,false);
    assert.equal(result.state,item);
    assert.equal(JSON.stringify(item),before);
    assert.ok(validateSave(item));
  }
});

test("GAME-101E: Android button/shortcut and offline cache expose no hidden action",()=>{
  const src=p=>readFileSync(new URL("../docs/"+p,import.meta.url),"utf8");
  const app=src("app.js"),html=src("index.html"),sw=src("sw.js");
  assert.match(app,/openingOpportunity\(state\.run,enemy\)/);
  assert.match(app,/\$\("combat-opening"\)\.disabled=/);
  assert.match(app,/act\(openingStrike\(state\)\)/);
  assert.match(app,/"v":"opening"/);
  assert.match(html,/id="combat-opening"/);
  assert.match(html,/id="combat-opening-hint"/);
  assert.match(sw,/"\.\/opening-strike\.js"/);
  assert.match(sw,/game101f-chamber-pursuit/);
});
