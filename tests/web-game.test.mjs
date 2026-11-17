import test from "node:test";
import assert from "node:assert/strict";
import {newGame, validateSave, normalizeJournal, JOURNAL_LIMIT, MAX_HP, HEALING_ITEMS, ENEMY_TYPES, enemyAt, inspectTile, beginRun, move, useItem, waitTurn, recall, extract, inventoryCount, mapText} from "../docs/game.js";

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

import { TILE_SPRITES, LEGEND_ITEMS } from "../docs/tiles.js";

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


test("three enemy families spawn with distinct ASCII symbols and visual identities", () => {
  const s=beginRun(newGame(),[]).state;
  assert.deepEqual(s.run.enemies.map(e=>e.kind),["charognard","guardian","rift_larva"]);
  assert.equal(ENEMY_TYPES.charognard.symbol,"c");
  assert.equal(ENEMY_TYPES.guardian.symbol,"G");
  assert.equal(ENEMY_TYPES.rift_larva.symbol,"L");
  const map=mapText(s);
  assert.ok(map.includes("c"));
  assert.ok(map.includes("G"));
  assert.ok(map.includes("L"));
  assert.equal(inspectTile(s,3,2).name,"Charognard");
  assert.equal(inspectTile(s,11,2).name,"Gardien déchu");
  assert.equal(inspectTile(s,6,2).name,"Larve de faille");
  assert.equal(inspectTile(s,9,4).kind,"danger");
  assert.equal(inspectTile(s,12,7).kind,"extraction");
  assert.equal(inspectTile(s,8,2).kind,"loot");
  assert.ok(validateSave(s));
});
test("walking into a guardian attacks without moving the hero; killing grants XP", () => {
  let s=beginRun(newGame(),["weapon.rusty_sword"]).state;
  s.run.enemies=[{id:"test-guardian",kind:"guardian",x:2,y:7,hp:5}];
  s=move(s,"right").state;
  assert.equal(s.run.x,1);
  assert.equal(s.run.y,7);
  assert.equal(s.run.turns,1);
  assert.equal(s.run.enemies[0].hp,2);
  assert.equal(s.run.hp,10);
  assert.ok(s.journal.some(e=>e.type==="combat"));
  s=move(s,"right").state;
  assert.equal(s.run.enemies.length,0);
  assert.equal(s.run.hp,10);
  assert.equal(s.meta.hero.xp,4);
  assert.ok(s.journal.some(e=>e.text.includes("Victoire sur Gardien déchu")));
  assert.ok(validateSave(s));
});
test("enemy combat can cause a Rappel without losing the persistent hero or stash", () => {
  let s=beginRun(newGame(),["weapon.rusty_sword"]).state;
  s.run.hp=2;
  s.run.enemies=[{id:"test-guardian",kind:"guardian",x:2,y:7,hp:5}];
  s=move(s,"right").state;
  assert.equal(s.run,null);
  assert.equal(s.meta.recalls,1);
  assert.equal(s.meta.hero.level,1);
  assert.equal(s.meta.stash["weapon.rusty_sword"],0);
  assert.equal(s.meta.stash["consumable.bandage"],2);
  assert.equal(s.journal[0].type,"recall");
  assert.equal(s.journal[0].turn,1);
});
test("older active descents without enemies remain loadable and are not reset", () => {
  const old=beginRun(newGame(),[]).state;
  old.run.x=2;old.run.y=6;old.run.turns=11;old.run.hp=8;
  delete old.run.enemies;
  assert.equal(validateSave(old),true);
  const migrated=normalizeJournal(old);
  assert.deepEqual(migrated.run.enemies,[]);
  assert.equal(migrated.run.turns,11);
  assert.equal(migrated.run.hp,8);
  assert.equal(migrated.run.x,2);
  assert.ok(validateSave(migrated));
});
test("charognards pursue the hero only at short distance", () => {
  let s=beginRun(newGame(),[]).state;
  s.run.enemies=[{id:"test-hunter",kind:"charognard",x:3,y:5,hp:3}];
  s=move(s,"up").state;
  s=move(s,"right").state;
  const monster=enemyAt(s.run,2,5);
  assert.ok(monster);
  assert.equal(monster.kind,"charognard");
  assert.ok(s.journal.some(e=>e.type==="danger"));
});
test("graphic pack offers original sprites for both enemies and important tiles", () => {
  for (const name of ["floor","wall","hero","loot","hazard","exit","charognard","guardian","rift_larva"]) {
    assert.ok(TILE_SPRITES[name].startsWith("data:image/svg+xml;charset=UTF-8,"));
  }
  const first=decodeURIComponent(TILE_SPRITES.hero.split(",")[1]);
  const second=decodeURIComponent(TILE_SPRITES.charognard.split(",")[1]);
  assert.notEqual(first,second);
});

test("bandage heals four, costs one turn, and adjacent enemy can counterattack", () => {
  let s=beginRun(newGame(),["consumable.bandage"]).state;
  s.run.hp=6;
  s.run.enemies=[{id:"close-guard",kind:"guardian",x:2,y:7,hp:5}];
  const result=useItem(s,"consumable.bandage");
  assert.equal(result.changed,true);
  s=result.state;
  assert.equal(s.run.hp,8); // 6 + 4 healing - 2 guard damage
  assert.equal(s.run.turns,1);
  assert.equal(s.run.carried["consumable.bandage"] || 0,0);
  assert.equal(s.meta.stash["consumable.bandage"],1); // the other bandage is safe at Veyr
  assert.ok(s.journal.some(event=>event.type==="heal"));
  assert.ok(s.journal.some(event=>event.type==="combat"));
  assert.ok(validateSave(s));
});
test("healing at full health does not consume items or time", () => {
  const s=beginRun(newGame(),["consumable.bandage"]).state;
  const result=useItem(s,"consumable.bandage");
  assert.equal(result.changed,false);
  assert.equal(s.run.hp,MAX_HP);
  assert.equal(s.run.turns,0);
  assert.equal(s.run.carried["consumable.bandage"],1);
});
test("healing cannot pull objects from the safe stash", () => {
  const s=beginRun(newGame(),[]).state;
  s.run.hp=4;
  assert.equal(useItem(s,"consumable.bandage").changed,false);
  assert.equal(s.run.hp,4);
  assert.equal(s.meta.stash["consumable.bandage"],2);
  assert.equal(s.run.turns,0);
});
test("tonic heals six without overflowing health and remains a usable loot item", () => {
  const s=beginRun(newGame(),[]).state;
  s.run.hp=9;
  s.run.carried["consumable.dusk_tonic"]=1;
  const result=useItem(s,"consumable.dusk_tonic");
  assert.equal(result.changed,true);
  assert.equal(result.state.run.hp,12);
  assert.equal(result.state.run.turns,1);
  assert.equal(result.state.run.carried["consumable.dusk_tonic"] || 0,0);
  assert.equal(HEALING_ITEMS["consumable.dusk_tonic"],6);
  assert.ok(validateSave(result.state));
});
test("waiting advances one turn and may provoke an enemy", () => {
  let s=beginRun(newGame(),[]).state;
  s.run.enemies=[{id:"close-guard",kind:"guardian",x:2,y:7,hp:5}];
  s=waitTurn(s).state;
  assert.equal(s.run.turns,1);
  assert.equal(s.run.hp,10);
  assert.ok(s.journal.some(e=>e.type==="combat"));
});
test("waiting and item use are disabled at the refuge", () => {
  const initial=newGame();
  assert.equal(waitTurn(initial).changed,false);
  assert.equal(useItem(initial,"consumable.bandage").changed,false);
  assert.equal(initial.meta.stash["consumable.bandage"],2);
});
test("healing followed by lethal attack still triggers Rappel and loses carried gear", () => {
  let s=beginRun(newGame(),["consumable.bandage"]).state;
  s.run.hp=1;
  s.run.enemies=[
    {id:"g1",kind:"guardian",x:2,y:7,hp:5},
    {id:"g2",kind:"guardian",x:1,y:6,hp:5},
    {id:"g3",kind:"guardian",x:1,y:8,hp:5}
  ];
  s=useItem(s,"consumable.bandage").state;
  assert.equal(s.run,null);
  assert.equal(s.meta.recalls,1);
  assert.equal(s.meta.stash["consumable.bandage"],1);
  assert.equal(s.journal[0].type,"recall");
});


test("title screen contains functional controls and separate game shell", async () => {
  const {readFileSync} = await import("node:fs");
  const html=readFileSync(new URL("../docs/index.html", import.meta.url),"utf8");
  const app=readFileSync(new URL("../docs/app.js", import.meta.url),"utf8");
  for(const id of ["title-screen","title-continue","title-new","title-options","title-options-panel","title-render-mode","game-shell","back-to-title"]) {
    assert.ok(html.includes('id="'+id+'"'),id+" absent");
  }
  assert.ok(html.includes('id="game-shell" hidden'));
  assert.ok(app.includes('state = normalizeJournal(decoded)'));
  assert.ok(app.includes('hasStoredGame = true'));
  assert.ok(app.includes('localStorage.removeItem(SAVE_KEY)'));
  assert.ok(app.includes('window.confirm('));
});
test("title scene is included in PWA cache manifest", async () => {
  const {readFileSync} = await import("node:fs");
  const sw=readFileSync(new URL("../docs/sw.js", import.meta.url),"utf8");
  assert.match(sw,/rogov-v0\.5\.1/);
  assert.match(sw,/title-scene\.webp/);
});

test("rift larva uses its own low-range spectral pulse every third turn", () => {
  let s=beginRun(newGame(),[]).state;
  s.run.x=4; s.run.y=2;
  s.run.enemies=[{id:"larva-test",kind:"rift_larva",x:6,y:2,hp:4}];
  s=waitTurn(s).state;
  assert.equal(s.run.hp,12);
  s=waitTurn(s).state;
  assert.equal(s.run.hp,12);
  s=waitTurn(s).state;
  assert.equal(s.run.hp,11);
  assert.ok(s.journal.some(e=>e.type==="combat" && e.text.includes("onde")));
  assert.equal(s.run.enemies[0].x,6); // immobile, unlike the scavenger
  assert.equal(s.run.turns,3);
  assert.ok(validateSave(s));
});
test("rift pulses do not pass diagonally or through stone", () => {
  let s=beginRun(newGame(),[]).state;
  s.run.enemies=[{id:"larva-test",kind:"rift_larva",x:6,y:2,hp:4}];
  s.run.x=5; s.run.y=1; // diagonal, Manhattan range 2
  for(let i=0;i<3;i++)s=waitTurn(s).state;
  assert.equal(s.run.hp,12);
  s.run.x=6;s.run.y=4; // wall at (6,3) blocks a vertical rift pulse
  for(let i=0;i<3;i++)s=waitTurn(s).state;
  assert.equal(s.run.hp,12);
  assert.ok(validateSave(s));
});
test("rift larva remains an ordinary melee threat at contact", () => {
  let s=beginRun(newGame(),[]).state;
  s.run.x=5;s.run.y=2;
  s.run.enemies=[{id:"larva-test",kind:"rift_larva",x:6,y:2,hp:4}];
  s=waitTurn(s).state;
  assert.equal(s.run.hp,11);
  assert.ok(s.journal.some(e=>e.text.includes("Larve de faille te touche")));
});
test("older v0.5.1 active runs keep their own two-enemy population", () => {
  const original=beginRun(newGame(),[]).state;
  original.run.enemies=original.run.enemies.filter(e=>e.kind!=="rift_larva");
  original.run.x=3;original.run.y=6;
  original.run.turns=9;
  const upgraded=normalizeJournal(original);
  assert.equal(upgraded.run.enemies.length,2);
  assert.equal(upgraded.run.turns,9);
  assert.deepEqual(upgraded.run.enemies.map(e=>e.kind),["charognard","guardian"]);
  assert.equal(validateSave(upgraded),true);
});
test("rift larva can be defeated with original weapons and gives experience", () => {
  let s=beginRun(newGame(),["weapon.rusty_sword"]).state;
  s.run.x=5;s.run.y=2;
  s.run.enemies=[{id:"larva-test",kind:"rift_larva",x:6,y:2,hp:4}];
  s=move(s,"right").state;
  assert.equal(s.run.enemies[0].hp,1);
  s=move(s,"right").state;
  assert.equal(s.run.enemies.length,0);
  assert.equal(s.run.x,5);
  assert.equal(s.meta.hero.xp,3);
  assert.equal(s.meta.stash["weapon.rusty_sword"],0);
});
test("v0.6 creature art is self-contained and distinct by silhouette", () => {
  for (const id of ["charognard","guardian","rift_larva"]) {
    assert.ok(LEGEND_ITEMS.some(([key])=>key===id));
    const svg=decodeURIComponent(TILE_SPRITES[id].split(",")[1]);
    assert.ok(svg.includes('viewBox="0 0 24 24"'));
    assert.ok(svg.includes('shape-rendering="crispEdges"'));
  }
  assert.notEqual(TILE_SPRITES.charognard,TILE_SPRITES.guardian);
  assert.notEqual(TILE_SPRITES.guardian,TILE_SPRITES.rift_larva);
});
