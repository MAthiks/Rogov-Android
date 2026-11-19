import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  newGame,beginRun,move,recall,craftAtRefuge,validateSave,SCHEMA_VERSION,SAVE_KEY
} from "../docs/game.js";
import {narrativeObjective,NAR093_LORE} from "../docs/narrative.js";

const file=path=>readFileSync(new URL(path,import.meta.url),"utf8");
const safeTutorial=["up","right","right",...Array(9).fill("right"),"down"];

test("NAR-093: a new player receives an achievable extraction objective, not a fictitious campaign quest",()=>{
  const state=newGame(),snapshot=JSON.stringify(state);
  const quest=narrativeObjective(state);
  assert.equal(quest.phase,"depart");
  assert.match(quest.title,/Première mission/);
  assert.match(quest.text,/1 Fragment de cendre/);
  assert.match(quest.text,/Arche d.extraction/);
  assert.doesNotMatch(quest.text,/coordon|(?:\d+,\d+)|mission terminée/);
  assert.equal(JSON.stringify(state),snapshot,"Narrative view must not mutate state");
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  assert.ok(validateSave(state));
});

test("NAR-093: carried fragments clearly remain at risk until a real extraction",()=>{
  let state=beginRun(newGame()).state;
  const first=narrativeObjective(state);
  assert.equal(first.phase,"premiere-descente");
  assert.match(first.text,/Fragment de cendre/);
  for(const dir of ["up","right","right"])state=move(state,dir).state;
  const snapshot=JSON.stringify(state);
  const carrying=narrativeObjective(state);
  assert.equal(carrying.phase,"retour");
  assert.match(carrying.text,/1 Fragment de cendre/);
  assert.match(carrying.text,/Rappel/);
  assert.match(carrying.text,/perdre tout ton sac/);
  assert.equal(JSON.stringify(state),snapshot);
  state=recall(state).state;
  assert.equal(state.run,null);
  assert.equal(narrativeObjective(state).phase,"depart",
    "A Rappel must never count as securing a fragment");
  assert.equal(state.meta.stash["relic.ashen_fragment"]??0,0);
  assert.ok(validateSave(state));
});

test("NAR-093: real extraction, crafting and deep exploration update existing objective text",()=>{
  let s=beginRun(newGame()).state;
  for(const direction of safeTutorial)s=move(s,direction).state;
  assert.equal(s.meta.extractions,1);
  assert.equal(s.meta.stash["relic.ashen_fragment"],1);
  const secured=narrativeObjective(s);
  assert.equal(secured.phase,"securise");
  assert.match(secured.text,/1 Fragment de cendre au coffre/);
  assert.match(secured.text,/2 bandages/);
  assert.match(secured.text,/2 Fragments/);
  s=craftAtRefuge(s,"supply.bandages").state;
  assert.equal(s.meta.stash["relic.ashen_fragment"],0);
  const afterForge=narrativeObjective(s);
  assert.equal(afterForge.phase,"suite");
  assert.doesNotMatch(afterForge.text,/Fragment de cendre au coffre/);
  s=beginRun(s).state;
  const deep=narrativeObjective(s);
  assert.equal(deep.phase,"enquete");
  assert.match(deep.text,/Chambre de l.Écho/);
  assert.ok(validateSave(s));
});

test("NAR-093: all lore definitions describe already visible mechanics, not hidden map contents",()=>{
  assert.deepEqual(Object.keys(NAR093_LORE),["veyr","nhal","fragment","arche","rappel","echo"]);
  assert.match(NAR093_LORE.rappel,/sac transporté est perdu/);
  assert.match(NAR093_LORE.arche,/protège tout le contenu de ton sac/);
  const state=newGame();state.meta.descents=1;
  const deep=beginRun(state).state;
  const before=JSON.stringify(deep);
  const text=JSON.stringify(narrativeObjective(deep));
  assert.doesNotMatch(text,/x":|y":|hidden|secret|sortie à \(/);
  assert.equal(JSON.stringify(deep),before);
});

test("NAR-093: title, refuge, expedition and PWA offline module are linked without touching saves",()=>{
  const html=file("../docs/index.html");
  const app=file("../docs/app.js");
  const sw=file("../docs/sw.js");
  for(const id of ["title-premise","mission-refuge-title","mission-refuge-text","lore-primer",
    "lore-terms","mission-compact","route-hint"])
    assert.ok(html.includes('id="'+id+'"'),"Missing narrative UI "+id);
  assert.match(app,/import \{ narrativeObjective, NAR093_LORE \} from "\.\/narrative\.js"/);
  assert.match(app,/\$\("mission-compact"\)\.textContent=mission\.tag/);
  assert.match(app,/\$\("route-hint"\)\.textContent=mission\.text/);
  assert.match(app,/\$\("mission-refuge-text"\)\.textContent=mission\.text/);
  assert.match(sw,/"\.\/narrative\.js"/);
  assert.doesNotMatch(app,/meta\.mission\s*=/);
});
