import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newGame,beginRun,resolveRoomSite,recall,extract,normalizeJournal,
  validateSave,SCHEMA_VERSION,SAVE_KEY,craftAtRefuge} from "../docs/game.js";
import {revealAround} from "../docs/exploration-visibility.js";
import {nearbyRoomSite} from "../docs/room-events.js";
import {ECHO_FINDINGS,validEchoFindings,echoDossier} from "../docs/echo-investigation.js";
import {narrativeObjective} from "../docs/narrative.js";

const file=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const pkey=p=>p.x+","+p.y;

function nearEcho(state){
  const next=structuredClone(state);
  const site=next.run.sites.find(s=>s.kind==="echo");
  assert.ok(site,"Only actual deep-run Echo sites are eligible");
  // Isolate the text and persistence tests from random enemy movement.
  next.run.enemies=[];
  const near=[[1,0],[-1,0],[0,1],[0,-1]]
    .map(([dx,dy])=>({x:site.x+dx,y:site.y+dy}))
    .find(p=>next.run.map[p.y]?.[p.x]==="."&&
      !next.run.traps.some(t=>pkey(t)===pkey(p)));
  assert.ok(near,"An Echo room must be approachable");
  next.run.x=near.x;next.run.y=near.y;
  revealAround(next.run);
  assert.equal(nearbyRoomSite(next.run)?.id,site.id);
  assert.ok(validateSave(next));
  return {state:next,site};
}

test("NAR-094: fresh and legacy saves have no invented Echo knowledge",()=>{
  const fresh=newGame();
  assert.deepEqual(fresh.meta.echoFindings,[]);
  assert.equal(echoDossier(fresh).count,0);
  assert.deepEqual(echoDossier(fresh).findings,[]);
  const legacy=newGame();delete legacy.meta.echoFindings;
  assert.ok(validateSave(legacy),"pre-NAR094 refuge save remains valid");
  const normal=normalizeJournal(JSON.parse(JSON.stringify(legacy)));
  assert.ok(validateSave(normal));
  assert.equal(normal.meta.echoFindings,undefined,
    "An old save must not be silently awarded new evidence");
  legacy.meta.descents=1;
  const oldRun=beginRun(legacy).state;
  assert.ok(validateSave(oldRun),"pre-NAR094 deep run remains valid");
  assert.equal(echoDossier(oldRun).count,0);
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(SAVE_KEY,"rogov-web-v1");
});

test("NAR-094: only a real visible Echo action grants one canonical permanent discovery",()=>{
  const base=newGame();base.meta.descents=1;
  const initial=beginRun(base).state;
  const remote=initial.run.sites.find(s=>s.kind==="echo");
  assert.equal(resolveRoomSite(initial,remote.id,"inscription").changed,false);
  assert.equal(initial.meta.echoFindings.length,0);
  const {state,site}=nearEcho(initial);
  const before=JSON.stringify(state),rng=state.run.rngState,turn=state.run.turns;
  const result=resolveRoomSite(state,site.id,"inscription");
  assert.equal(result.changed,true);
  assert.equal(JSON.stringify(state),before,"World actions may not mutate caller input");
  assert.equal(result.state.run.turns,turn+1);
  assert.equal(result.state.run.rngState,rng);
  assert.equal(result.state.meta.hero.xp,state.meta.hero.xp+1);
  assert.deepEqual(result.state.meta.echoFindings,[ECHO_FINDINGS[0].id]);
  assert.match(result.state.journal[0].text,/INDICE CONSERVÉ/);
  assert.deepEqual(echoDossier(result.state).findings,[ECHO_FINDINGS[0]]);
  assert.equal(resolveRoomSite(result.state,site.id,"resonance").changed,false,
    "One Echo room can only award one choice and one clue");
  assert.ok(validateSave(result.state));
});

test("NAR-094: three distinct descents yield at most three clues; both Echo choices count",()=>{
  let s=newGame();s.meta.descents=1;
  for(const [index,choice] of ["inscription","resonance","inscription","resonance"].entries()){
    const started=beginRun(s).state;
    const {state,site}=nearEcho(started);
    const beforeXP=state.meta.hero.xp;
    const result=resolveRoomSite(state,site.id,choice);
    assert.equal(result.changed,true);
    const expected=Math.min(index+1,3);
    assert.equal(echoDossier(result.state).count,expected);
    assert.deepEqual(result.state.meta.echoFindings,
      ECHO_FINDINGS.slice(0,expected).map(f=>f.id));
    assert.equal(result.state.meta.hero.xp,beforeXP+(choice==="resonance"?2:1));
    assert.ok(validateSave(result.state));
    const recovered=normalizeJournal(JSON.parse(JSON.stringify(result.state)));
    assert.deepEqual(recovered.meta.echoFindings,result.state.meta.echoFindings);
    assert.equal(echoDossier(recovered).findings.length,expected);
    s=recall(recovered).state; // death must preserve knowledge, NOT carried equipment
    assert.equal(s.run,null);
    assert.equal(s.meta.echoFindings.length,expected);
    assert.ok(validateSave(s));
  }
  assert.equal(echoDossier(s).count,3);
  assert.match(echoDossier(s).next,/origine du Rappel n.est pas encore découverte/);
  assert.equal(echoDossier(s).findings.length,3);
});

test("NAR-094: Rappel loses the carried bag, not Echo evidence; extraction secures both",()=>{
  const game=newGame();game.meta.descents=1;
  let {state,site}=nearEcho(beginRun(game).state);
  state.run.carried={"relic.ashen_fragment":1,"weapon.rusty_sword":1};
  // A manually prepared isolated run still obeys the actual limits and loadout.
  state.run.loadout={...state.run.loadout,mainHand:"weapon.rusty_sword"};
  assert.ok(validateSave(state));
  const found=resolveRoomSite(state,site.id,"inscription").state;
  const died=recall(found).state;
  assert.equal(died.meta.echoFindings.length,1);
  assert.equal(died.meta.stash["relic.ashen_fragment"]??0,0);
  assert.equal(died.run,null);
  assert.ok(validateSave(died));

  let next=beginRun(died).state;
  assert.equal(echoDossier(next).count,1);
  next.run.x=next.run.exit.x;next.run.y=next.run.exit.y;
  next=extract(next).state;
  assert.equal(next.meta.echoFindings.length,1);
  assert.ok(validateSave(next));
  const crafted=craftAtRefuge(next,"supply.bandages");
  assert.equal(crafted.changed,false,"No fragment materializes from Echo knowledge");
  assert.equal(echoDossier(crafted.state).count,1);
});

test("NAR-094: reject invalid, duplicate, out-of-order and arbitrary save evidence",()=>{
  assert.equal(validEchoFindings(undefined),true);
  assert.equal(validEchoFindings([]),true);
  assert.equal(validEchoFindings([ECHO_FINDINGS[0].id]),true);
  for(const malformed of [null,1,{},["unknown"],
    [ECHO_FINDINGS[1].id],
    [ECHO_FINDINGS[0].id,ECHO_FINDINGS[0].id],
    ECHO_FINDINGS.map(x=>x.id).concat(ECHO_FINDINGS[2].id)]){
    assert.equal(validEchoFindings(malformed),false);
    const tampered=newGame();tampered.meta.echoFindings=malformed;
    assert.equal(validateSave(tampered),false,
      "Malformed discovery records must be rejected before loading");
  }
});

test("NAR-094: clue summary never reveals a new room, enemy, hidden exit or future evidence",()=>{
  const game=newGame();game.meta.descents=1;
  const started=beginRun(game).state;
  const frozen=JSON.stringify(started);
  const summary=echoDossier(started);
  assert.deepEqual(summary.findings,[]);
  assert.equal(JSON.stringify(started),frozen);
  assert.equal(summary.count,0);
  const followUp=narrativeObjective(started);
  assert.doesNotMatch(JSON.stringify(followUp),/cité enfouie|voix en avance|marque du retour/);
  const eligible=nearEcho(started);
  const discovered=resolveRoomSite(eligible.state,eligible.site.id,"resonance").state;
  const text=JSON.stringify(echoDossier(discovered));
  assert.match(text,/cité enfouie/);
  assert.doesNotMatch(text,/La voix en avance|La marque du retour/,
    "Future clues cannot leak before real Echo encounters");
});

test("NAR-094: the two UI dossiers and offline cache use the same real evidence source",()=>{
  const app=file("../docs/app.js"),html=file("../docs/index.html"),sw=file("../docs/sw.js");
  for(const id of ["echo-dossier-refuge","echo-refuge-list","echo-refuge-count",
    "echo-dossier-expedition","echo-expedition-list","echo-expedition-count"])
    assert.ok(html.includes('id="'+id+'"'),"Missing evidence UI: "+id);
  assert.match(app,/import \{ echoDossier \} from "\.\/echo-investigation\.js";/);
  assert.match(app,/const dossier=echoDossier\(state\)/);
  assert.match(app,/renderEchoDossier\(\)/);
  assert.match(sw,/"\.\/echo-investigation\.js"/);
});
