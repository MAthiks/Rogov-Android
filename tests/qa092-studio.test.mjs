// QA-092 — Studio audit for the existing ROGOV extraction loop.
// These are deterministic engineering checks, NOT five human playtests and
// NOT evidence that the game is enjoyable or balanced on a physical phone.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {
  newGame,beginRun,move,extract,recall,craftAtRefuge,useItem,
  normalizeJournal,validateSave,INVENTORY_LIMIT,SAVE_KEY,SCHEMA_VERSION
} from "../docs/game.js";
import {generateDeepLayout,deepRoute} from "../docs/deep-dungeon.js";
import {expeditionReport} from "../docs/expedition-report.js";

const key=point=>point.x+","+point.y;
const tutorialRoute=["up","right","right",...Array(9).fill("right"),"down"];
const content=path=>readFileSync(new URL(path,import.meta.url),"utf8");

test("QA-092: genuine tutorial flow -> carried relic -> extraction -> forge -> second descent",()=>{
  let state=newGame();
  const initial=JSON.stringify(state);
  assert.equal(state.meta.stash["weapon.rusty_sword"],1);
  let result=beginRun(state,["weapon.rusty_sword","consumable.bandage"]);
  assert.equal(result.changed,true);
  state=result.state;
  assert.equal(JSON.stringify(newGame()),initial,"A launch must not mutate its input");
  assert.equal(state.meta.stash["weapon.rusty_sword"],0);
  assert.equal(state.meta.stash["consumable.bandage"],1);
  assert.equal(state.run.carried["weapon.rusty_sword"],1);
  assert.equal(state.run.carried["consumable.bandage"],1);
  assert.equal(state.run.turns,0);

  for(const [i,direction] of tutorialRoute.entries()){
    const before=state.run?.turns;
    result=move(state,direction);
    assert.equal(result.changed,true,"Tutorial movement "+i);
    state=result.state;
    if(state.run){
      assert.equal(state.run.turns,before+1,"Tutorial consumes only real movement turns");
      assert.ok(validateSave(state));
      if(i===2)assert.equal(state.run.carried["relic.ashen_fragment"],1,
        "The first real loot pickup must be exposed to loss");
      if(i===5){
        const original=JSON.stringify(state);
        state=normalizeJournal(JSON.parse(original));
        assert.equal(JSON.stringify(state),original,"Reload cannot regenerate the map");
      }
    }
  }
  assert.equal(state.run,null,"The real tutorial exit completes the run");
  assert.equal(state.meta.extractions,1);
  assert.equal(state.meta.recalls,0);
  assert.equal(state.meta.stash["weapon.rusty_sword"],1);
  assert.equal(state.meta.stash["relic.ashen_fragment"],1);
  assert.equal(state.meta.stash["consumable.bandage"],2);
  assert.equal(state.journal[0].type,"extraction");
  assert.ok(validateSave(state));

  const prepared=craftAtRefuge(state,"supply.bandages");
  assert.equal(prepared.changed,true);
  state=prepared.state;
  assert.equal(state.meta.stash["relic.ashen_fragment"],0);
  assert.equal(state.meta.stash["consumable.bandage"],4);
  assert.equal(state.meta.extractions,1);
  assert.ok(validateSave(state));
  result=beginRun(state,["weapon.rusty_sword","consumable.bandage"]);
  assert.equal(result.changed,true);
  state=result.state;
  assert.ok(state.run.rooms?.length>=8,"The next descent must be a deep dungeon");
  assert.equal(state.meta.descents,2);
  assert.equal(state.run.carried["consumable.bandage"],1);
  assert.equal(state.meta.stash["consumable.bandage"],3);
  assert.equal(state.meta.stash["weapon.rusty_sword"],0);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  assert.ok(validateSave(normalizeJournal(JSON.parse(JSON.stringify(state)))));
});

test("QA-092: loss after looting creates a real investment decision, stash and XP persist",()=>{
  const initial=newGame(),before=JSON.stringify(initial);
  let s=beginRun(initial,["weapon.rusty_sword","consumable.bandage"]).state;
  for(const direction of ["up","right","right"]){
    const next=move(s,direction);
    assert.equal(next.changed,true);
    s=next.state;
  }
  assert.equal(s.run.carried["relic.ashen_fragment"],1);
  const xp=s.meta.hero.xp;
  s=recall(s).state;
  assert.ok(validateSave(s));
  assert.equal(s.run,null);
  assert.equal(s.meta.recalls,1);
  assert.equal(s.meta.extractions,0);
  assert.equal(s.meta.hero.xp,xp,"Death keeps knowledge / XP");
  assert.equal(s.meta.stash["weapon.rusty_sword"],0,
    "A carried weapon must not teleport back to the safe stash");
  assert.equal(s.meta.stash["consumable.bandage"],1,
    "One uncarried bandage stays secured");
  assert.equal(s.meta.stash["relic.ashen_fragment"]??0,0,
    "Extracted and recalled relics must have different consequences");
  assert.equal(JSON.stringify(initial),before,"A run cannot mutate the original meta");
  const unarmed=beginRun(s,[]).state;
  assert.ok(validateSave(unarmed),
    "Permadeath must not make a new run impossible without a weapon");
});

test("QA-092: 30 deep descents remain variable and never require a lethal trap for a basic return",()=>{
  const unique=new Set(),counts=new Set();
  let minimum=Infinity,maximum=0;
  for(let n=2;n<=31;n++){
    const layout=generateDeepLayout(n);
    unique.add(layout.map.join("\n"));
    counts.add(layout.rooms.length);
    const blockers=new Set([...layout.enemies,...layout.traps].map(key));
    const route=deepRoute(layout.map,layout.start,layout.exit,blockers);
    assert.ok(route?.length>1,"Seed "+n+" has a non-lethal, non-mandatory-combat exit route");
    for(let i=1;i<route.length;i++)
      assert.equal(Math.abs(route[i].x-route[i-1].x)+
        Math.abs(route[i].y-route[i-1].y),1,
        "Extraction route uses ordinary adjacent moves");
    minimum=Math.min(minimum,route.length-1);
    maximum=Math.max(maximum,route.length-1);
    assert.ok(layout.rooms.length>=8&&layout.rooms.length<=12);
    assert.ok(layout.enemies.length>=1);
    assert.ok(layout.traps.length>=1);
    assert.ok(Object.keys(layout.loot).length>=1);
  }
  assert.ok(unique.size>=25,"Procedural runs need meaningful layout diversity");
  assert.ok(counts.size>=3,"Different room counts are a minimum variety signal");
  assert.ok(maximum>=minimum,"Report observable route lengths; not a fun metric");
  console.log("QA-092 sample: 30 seeded networks; unique="+unique.size+
    "; room counts="+[...counts].sort().join(",")+
    "; hazard/enemy-avoiding route length="+minimum+"–"+maximum+" turns");
});

test("QA-092: fresh deep field report makes no spoiler or fake promise of safety",()=>{
  const starter=newGame();
  starter.meta.descents=1;
  const state=beginRun(starter).state;
  const frozen=JSON.stringify(state);
  const report=expeditionReport(state);
  assert.equal(report.available,true);
  assert.equal(report.exitKnown,false);
  assert.equal(report.knownRoute,null);
  assert.ok(report.secured>=0);
  assert.equal(report.carried,0);
  assert.ok(state.run.enemies.length>0);
  assert.ok(state.run.traps.length>0);
  assert.ok(validateSave(state));
  assert.equal(JSON.stringify(state),frozen,"Observation cannot change turns, enemies or save");
  const attackFromOutside=useItem(state,"consumable.bandage");
  assert.equal(attackFromOutside.changed,false,
    "A non-carried healing item cannot be fabricated by UI");
  assert.equal(JSON.stringify(state),frozen);
});

test("QA-092: technical baseline remains an Android-first PWA, not a certified device release",()=>{
  const html=content("../docs/index.html");
  const mobile=content("../docs/ui092.css");
  const sw=content("../docs/sw.js");
  const controller=content("../docs/ui092.js");
  for(const id of ["expedition","tile-map","field-controls","wait-btn",
    "use-bandage","use-tonic","jump-combat","jump-action","jump-report",
    "jump-bag","jump-journal","jump-menu","ui092-sheet"]){
    assert.ok(html.includes('id="'+id+'"'),"Missing essential mobile cockpit element: "+id);
  }
  assert.match(mobile,/position:fixed/);
  assert.match(mobile,/safe-area-inset-bottom/);
  assert.match(controller,/mount\.append\(node\)/);
  assert.match(controller,/placeholder\.replaceWith\(activeNode\)/);
  assert.match(sw,/"\.\/ui092\.js"/);
  assert.match(sw,/"\.\/ui092\.css\?v=2"/);
  assert.equal(INVENTORY_LIMIT,8);
  // Browser geometry, interaction targeting, physical contrast and player
  // comprehension are deliberately outside this source-level assertion.
});
