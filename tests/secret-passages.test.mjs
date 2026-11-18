import test from "node:test";
import assert from "node:assert/strict";
import {generateDeepLayout,validateDeepLayout,deepRoute,deepTwoReturnWays} from "../docs/deep-dungeon.js";
import {SECRET_REWARD,validSecrets,nearbySecretHint} from "../docs/secrets.js";
import {newGame,beginRun,searchSecret,move,inspectTile,validateSave,mapText} from "../docs/game.js";
import {explorationState,minimapText} from "../docs/exploration-visibility.js";

function deepState(index=2){
  const s=newGame();s.meta.descents=index-1;
  const next=beginRun(s).state;
  next.run.enemies=[]; // Geometry and rewards isolated from independent combat AI
  return next;
}
function atClue(state){
  const s=structuredClone(state);
  const clue=s.run.secrets[0].clue;
  s.run.x=clue.x;s.run.y=clue.y;
  return s;
}
const vector=(a,b)=>({
  "1,0":"right","-1,0":"left","0,1":"down","0,-1":"up"
})[(b.x-a.x)+","+(b.y-a.y)];

test("DEV-082: 240 seeds contain one deterministic, optional secret; public returns stay safe",()=>{
  const kinds=new Set(),positions=new Set();
  for(let index=2;index<242;index++){
    const layout=generateDeepLayout(index);
    assert.ok(validateDeepLayout(layout),"bad public plan "+index);
    assert.equal(layout.secrets.length,1,"one secret "+index);
    assert.ok(validSecrets(layout),"bad secret data "+index);
    const secret=layout.secrets[0];
    assert.equal(layout.map[secret.y][secret.x],"#","concealed wall not open at spawn");
    assert.equal(layout.map[secret.clue.y][secret.clue.x],".");
    assert.ok(["cache","shortcut"].includes(secret.kind));
    assert.deepEqual(generateDeepLayout(index),layout,"seeds must be stable");
    assert.ok(deepTwoReturnWays(layout.map,layout.start,layout.exit),
      "secret must never be necessary "+index);
    for(const pos of Object.keys(layout.loot)){
      const [x,y]=pos.split(",").map(Number);
      assert.ok(deepTwoReturnWays(layout.map,{x,y},layout.exit),
        "mandatory secret for loot return "+index);
    }
    kinds.add(secret.kind);positions.add(secret.x+","+secret.y);
  }
  assert.ok(positions.size>30,"secrets should vary between descents");
  assert.ok(kinds.has("cache"),"at least cache variant exists");
});
test("DEV-082: a non-visible clue cannot be searched, no turn consumed",()=>{
  const state=deepState();
  const secret=state.run.secrets[0];
  assert.equal(nearbySecretHint(state.run),null);
  const original=JSON.stringify(state);
  const failure=searchSecret(state);
  assert.equal(failure.changed,false);
  assert.equal(failure.state.run.turns,0);
  assert.equal(JSON.stringify(state),original);
  const visible=explorationState(state.run,secret.x,secret.y);
  assert.equal(visible,"unknown","hidden secret cannot be exposed by vision");
  assert.equal(mapText(state).split("\n")[secret.y][secret.x]," ");
  assert.equal(minimapText(state.run).split("\n")[secret.y][secret.x]," ");
});
test("DEV-082: visible local clue is free, explicit search opens wall in one turn",()=>{
  const state=atClue(deepState());
  const secret=state.run.secrets[0];
  const hint=nearbySecretHint(state.run);
  assert.ok(hint?.canSearch);
  assert.ok(hint.text.length>20);
  assert.equal(state.run.turns,0);
  const before=JSON.stringify(state);
  const result=searchSecret(state);
  assert.ok(result.changed);
  assert.equal(result.state.run.turns,1);
  assert.equal(JSON.stringify(state),before,"search must not modify the input");
  assert.ok(result.state.run.secrets[0].revealed);
  assert.equal(result.state.run.map[secret.y][secret.x],".");
  assert.equal(mapText(result.state).split("\n")[secret.y][secret.x],"?");
  assert.equal(minimapText(result.state.run).split("\n")[secret.y][secret.x],"?");
  assert.ok(validateSave(result.state),"revealed topology is valid");
  const restored=JSON.parse(JSON.stringify(result.state));
  assert.ok(validateSave(restored),"reloading preserves revelation");
  assert.deepEqual(restored.run.secrets,result.state.run.secrets);
  assert.equal(searchSecret(restored).changed,false,"no double search or extra turns");
});
test("DEV-082: optional secret reward can be collected once; reload cannot duplicate it",()=>{
  let state=atClue(deepState());
  const secret=state.run.secrets[0];
  state=searchSecret(state).state;
  assert.equal(state.run.secrets[0].claimed,false);
  const dir=vector(state.run,secret);
  assert.ok(dir,"clue tile must border revealed wall");
  state=move(state,dir).state;
  assert.ok(state.run);
  assert.equal(state.run.secrets[0].claimed,true);
  assert.equal(state.run.carried[SECRET_REWARD],1);
  assert.equal(state.meta.hero.xp,1);
  assert.ok(validateSave(state));
  const remembered=JSON.parse(JSON.stringify(state));
  assert.ok(validateSave(remembered));
  const back=move(remembered,vector(secret,remembered.run.secrets[0].clue));
  assert.ok(back.changed);
  const again=move(back.state,dir).state;
  assert.equal(again.run.carried[SECRET_REWARD],1,"never duplicate collected reward");
  assert.equal(again.meta.hero.xp,1,"XP only once");
});
test("DEV-082: full bag postpones reward without duplicates",()=>{
  let state=atClue(deepState());
  state=searchSecret(state).state;
  state.run.carried={"consumable.bandage":8};
  const secret=state.run.secrets[0];
  const entered=move(state,vector(state.run,secret)).state;
  assert.equal(entered.run.secrets[0].claimed,false);
  assert.equal(entered.run.carried["consumable.bandage"],8);
  assert.equal(entered.meta.hero.xp,0);
  assert.ok(validateSave(entered));
});
test("DEV-082: invalid forged secrets fail save validation; no secrets on old runs",()=>{
  const base=deepState();
  const invalid=[
    s=>s.revealed=true,
    s=>s.claimed=true,
    s=>s.reward="relic.ashen_fragment",
    s=>s.x=0,
    s=>{s.clue.x=s.x;s.clue.y=s.y;},
    s=>s.clueType=99,
    s=>s.kind="mandatory"
  ];
  for(const change of invalid){
    const forged=structuredClone(base);
    change(forged.run.secrets[0]);
    assert.equal(validateSave(forged),false);
  }
  const old=structuredClone(base);
  delete old.run.secrets; // in-progress DEV-080/081 runs are not retrofitted
  assert.ok(validateSave(old));
  assert.equal(nearbySecretHint(old.run),null);
  const original=JSON.stringify(old);
  assert.equal(searchSecret(old).changed,false);
  assert.equal(JSON.stringify(old),original);
});
test("DEV-082: extraction remains reachable on the public route before search",()=>{
  const state=deepState(18);
  const l=generateDeepLayout(18);
  // DEV-086/087: avoid intentionally warned traps while validating the normal route.
  const route=deepRoute(l.map,l.start,l.exit,new Set(l.traps.map(t=>t.x+","+t.y)));
  assert.ok(route);
  const secret=state.run.secrets[0];
  assert.ok(route.every(p=>p.x!==secret.x||p.y!==secret.y));
  let current=state;
  for(let i=1;i<route.length;i++){
    const dir=vector(route[i-1],route[i]);
    assert.ok(dir);
    const changed=move(current,dir);
    assert.ok(changed.changed);
    current=changed.state;
  }
  assert.equal(current.run,null,"normal public route extracts safely");
  assert.equal(current.meta.extractions,1);
  assert.equal(current.meta.recalls,0);
});
