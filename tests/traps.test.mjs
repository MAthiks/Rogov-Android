import test from "node:test";
import assert from "node:assert/strict";
import {generateDeepLayout,validateDeepLayout,deepRoute,deepTwoReturnWays} from "../docs/deep-dungeon.js";
import {validTraps,trapAt,trapAppearance,nearbyTrapHint,TRAP_KINDS} from "../docs/traps.js";
import {newGame,beginRun,move,searchTrap,disarmTrap,validateSave,inspectTile,
  normalizeJournal,MAX_HP,mapText} from "../docs/game.js";
import {revealAround,visibleCells,visionKey} from "../docs/exploration-visibility.js";

const key=p=>p.x+","+p.y;
const dirs={"1,0":"right","-1,0":"left","0,1":"down","0,-1":"up"};
const towards=(a,b)=>dirs[(b.x-a.x)+","+(b.y-a.y)];
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const at=(seed=2)=>{
  const s=newGame();s.meta.descents=seed-1;
  return beginRun(s).state;
};
const beside=(state,kind)=>{
  const s=structuredClone(state);
  const trap=s.run.traps.find(t=>t.kind===kind);
  s.run.enemies=[]; // isolate the mechanism from the independently tested AI
  s.run.x=trap.clue.x;s.run.y=trap.clue.y;
  revealAround(s.run);
  return {s,trap};
};

test("DEV-083: 200 deterministic seeds place two optional traps without blocking any public return",()=>{
  const locations=new Set();
  for(let seed=2;seed<202;seed++){
    const l=generateDeepLayout(seed);
    assert.ok(validateDeepLayout(l),"layout "+seed);
    assert.equal(l.traps.length,2,"two contrasting mechanisms "+seed);
    assert.deepEqual(l.traps.map(t=>t.kind),["alarm_wire","unstable_slab"]);
    assert.ok(validTraps({...l,turns:0}),"valid saved trap metadata "+seed);
    const blocked=new Set(l.traps.map(key));
    const noEnemy=new Set([...blocked,...l.enemies.map(key)]);
    assert.ok(deepTwoReturnWays(l.map,l.start,l.exit,blocked),
      "two independent trap-free routes "+seed);
    assert.ok(deepRoute(l.map,l.start,l.exit,noEnemy),
      "at least one return avoids combat AND traps "+seed);
    for(const pos of Object.keys(l.loot)){
      const [x,y]=pos.split(",").map(Number),p={x,y};
      assert.ok(deepTwoReturnWays(l.map,p,l.exit,blocked),
        "loot two safe returns "+seed+":"+pos);
      assert.ok(deepRoute(l.map,p,l.exit,noEnemy),"loot safe exit "+seed+":"+pos);
      assert.ok(deepRoute(l.map,l.start,p,noEnemy),"loot safe entry "+seed+":"+pos);
    }
    const canonical=[deepRoute(l.map,l.start,l.exit),
      ...Object.keys(l.loot).flatMap(pos=>{
        const [x,y]=pos.split(",").map(Number),p={x,y};
        return [deepRoute(l.map,l.start,p),deepRoute(l.map,p,l.exit)];
      })].flat();
    for(const trap of l.traps){
      assert.ok(!canonical.some(p=>key(p)===key(trap)),
        "canonical loot/exit route never contains trap "+seed);
      assert.equal(l.map[trap.y][trap.x],".");
      assert.equal(dist(trap,trap.clue),1);
      assert.equal(trap.status,"hidden");
      assert.equal(trap.attempts,0);
      assert.equal(l.map[trap.clue.y][trap.clue.x],".");
      locations.add(trap.kind+":"+key(trap));
    }
    assert.deepEqual(generateDeepLayout(seed),l,"seed reproducibility "+seed);
  }
  assert.ok(locations.size>90,"procedural trap positions vary");
});

test("DEV-083: passive clue is not a free map reveal; search costs a turn",()=>{
  const state=at(2);
  assert.ok(validateSave(state));
  const trap=state.run.traps[0];
  assert.equal(nearbyTrapHint(state.run),null,"no remote clue through fog");
  const unknown=inspectTile(state,trap.x,trap.y);
  assert.ok(unknown&&["unknown","memory"].includes(unknown.kind));
  const {s}=beside(state,"alarm_wire");
  assert.ok(visibleCells(s.run).has(visionKey(s.run,trap.x,trap.y)));
  assert.equal(nearbyTrapHint(s.run)?.kind,"alarm_wire");
  assert.equal(trapAppearance(s.run,trap.x,trap.y)?.symbol,"~");
  const before=JSON.stringify(s),turns=s.run.turns;
  const result=searchTrap(s,trap.x,trap.y);
  assert.ok(result.changed);
  assert.equal(JSON.stringify(s),before,"actions are immutable");
  assert.equal(result.state.run.turns,turns+1);
  assert.equal(result.state.run.traps[0].status,"revealed");
  assert.equal(trapAppearance(result.state.run,trap.x,trap.y)?.symbol,"!");
  assert.ok(validateSave(result.state));
  assert.ok(validateSave(normalizeJournal(JSON.parse(JSON.stringify(result.state)))));
  assert.equal(searchTrap(result.state,trap.x,trap.y).changed,false,
    "no repeated search or XP farming");
});

test("DEV-083: walking blind shows a free warning before any damage or turn",()=>{
  const {s,trap}=beside(at(2),"unstable_slab");
  const originalTurns=s.run.turns,originalHealth=s.run.hp;
  const first=move(s,towards(s.run,trap));
  assert.ok(first.changed);
  assert.equal(first.state.run.turns,originalTurns);
  assert.deepEqual({x:first.state.run.x,y:first.state.run.y},trap.clue);
  assert.equal(first.state.run.hp,originalHealth);
  assert.equal(trapAt(first.state.run,trap.x,trap.y).status,"revealed");
  assert.match(first.state.journal[0].text,/ATTENTION/);
  assert.ok(validateSave(first.state));
  const second=move(first.state,towards(first.state.run,trap));
  assert.ok(second.changed);
  assert.equal(second.state.run.turns,originalTurns+1);
  assert.equal(second.state.run.hp,originalHealth-2);
  assert.equal(trapAt(second.state.run,trap.x,trap.y).status,"triggered");
  assert.ok(validateSave(second.state));
  let back=move(second.state,towards(second.state.run,trap.clue)).state;
  back=move(back,towards(back.run,trap)).state;
  assert.equal(back.run.hp,originalHealth-2,"triggered slab cannot hurt twice");
  assert.ok(validateSave(back));
});

test("DEV-083: alarm changes charognard alert window but never inflicts damage",()=>{
  const {s,trap}=beside(at(2),"alarm_wire");
  const discovered=searchTrap(s,trap.x,trap.y).state;
  const hp=discovered.run.hp;
  const stepped=move(discovered,towards(discovered.run,trap)).state;
  assert.ok(stepped.run);
  assert.equal(stepped.run.hp,hp);
  assert.equal(stepped.run.alarmUntil,stepped.run.turns+3);
  assert.equal(trapAt(stepped.run,trap.x,trap.y).status,"triggered");
  assert.ok(validateSave(stepped));
});

test("DEV-083: disarm spends stamina and saved RNG; failures never detonate",()=>{
  const {s,trap}=beside(at(2),"unstable_slab");
  const discovered=searchTrap(s,trap.x,trap.y).state;
  assert.ok(validateSave(discovered));
  const noStamina=structuredClone(discovered);
  noStamina.run.endurance=1;
  assert.equal(disarmTrap(noStamina,trap.x,trap.y).changed,false);
  assert.equal(noStamina.run.turns,discovered.run.turns);
  const a=disarmTrap(discovered,trap.x,trap.y);
  const b=disarmTrap(JSON.parse(JSON.stringify(discovered)),trap.x,trap.y);
  assert.deepEqual(a,b,"saved RNG gives exact same outcome");
  assert.ok(a.changed);
  assert.equal(a.state.run.turns,discovered.run.turns+1);
  assert.equal(a.state.run.endurance,discovered.run.endurance-2);
  assert.notEqual(a.state.run.rngState,discovered.run.rngState);
  assert.equal(a.state.run.hp,discovered.run.hp);
  assert.equal(a.state.run.traps[1].attempts,1);
  assert.ok(["disabled","revealed"].includes(a.state.run.traps[1].status));
  assert.ok(validateSave(a.state));
  if(a.state.run.traps[1].status==="disabled"){
    assert.equal(a.state.meta.hero.xp,discovered.meta.hero.xp+1);
    assert.equal(disarmTrap(a.state,trap.x,trap.y).changed,false,
      "disabled trap cannot be farmed for more XP");
    const entered=move(a.state,towards(a.state.run,trap)).state;
    assert.equal(entered.run.hp,a.state.run.hp,"disabled tile is safe");
  }else{
    assert.equal(a.state.meta.hero.xp,discovered.meta.hero.xp);
    assert.equal(a.state.run.traps[1].status,"revealed",
      "failure stays neutral without surprise trigger");
  }
});

test("DEV-083: traps are absent from old saves and cannot be retroactively generated",()=>{
  const s=at(2);
  const old=structuredClone(s);
  delete old.run.traps;
  assert.ok(validateSave(old));
  assert.equal(nearbyTrapHint(old.run),null);
  assert.equal(searchTrap(old,0,0).changed,false);
  assert.equal(disarmTrap(old,0,0).changed,false);
  assert.ok(validateSave(JSON.parse(JSON.stringify(old))));
  const intro=beginRun(newGame()).state;
  assert.equal(intro.run.traps,undefined);
  assert.ok(validateSave(intro));
});

test("DEV-083: malformed saved trap state rejected without corrupting source",()=>{
  const s=at(2);
  const variants=[
    t=>t[0].status="armed",
    t=>t[1].id="injected",
    t=>t[1].x=0,
    t=>t[0].clue.x=t[0].x,
    t=>t[0].attempts=-1,
    t=>t[0].kind="instant_death",
    t=>t[1].x=t[0].x
  ];
  const baseline=JSON.stringify(s);
  for(const mut of variants){
    const forged=structuredClone(s);
    mut(forged.run.traps);
    assert.equal(validateSave(forged),false);
  }
  const forged=structuredClone(s);
  forged.run.alarmUntil=forged.run.turns+4;
  assert.equal(validateSave(forged),false);
  assert.equal(JSON.stringify(s),baseline,"failed checks never modify live game");
});
