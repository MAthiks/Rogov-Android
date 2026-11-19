// GAME-095D3C — optional two-enemy treasure encounter, without forced fighting.
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {coordinateOptionalDuo,OPTIONAL_DUO_VERSION}
  from "../docs/optional-duo.js";
import {generateDeepLayout,validateDeepLayout,deepRoute,deepTwoReturnWays}
  from "../docs/deep-dungeon.js";
import {balanceDepthLayout} from "../docs/depth-balance.js";
import {deepFloorSeed} from "../docs/floors.js";
import {pressureSnapshot} from "../tools/pressure-audit.mjs";
import {newGame,beginRun,resolveFloorExit,validateSave,SCHEMA_VERSION,SAVE_KEY}
  from "../docs/game.js";

const key=p=>p.x+","+p.y;
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const neighbors=p=>[
  {x:p.x+1,y:p.y},{x:p.x-1,y:p.y},
  {x:p.x,y:p.y+1},{x:p.x,y:p.y-1}
];
const independent=run=>new Set([
  ...(run.traps||[]).map(key),...run.enemies.map(key)
]);
const optional=run=>{
  const [id]=Object.entries(run.loot).find(([,item])=>
    item!=="relic.ashen_fragment"&&item!=="consumable.bandage");
  const [x,y]=id.split(",").map(Number);
  return {x,y};
};

test("GAME-095D3C: genuine visible optional duel without altering world safety",()=>{
  let moved=0;
  const examples=[];
  for(let descent=2;descent<34;descent++){
    for(const depth of [2,3]){
      const base=generateDeepLayout(deepFloorSeed(descent,depth));
      const prior=JSON.stringify(base);
      const actual=balanceDepthLayout(base,descent,depth);
      const repeat=balanceDepthLayout(base,descent,depth);
      assert.equal(JSON.stringify(base),prior);
      assert.deepEqual(actual,repeat);
      assert.equal(actual.enemies.length,4);
      assert.deepEqual(actual.map,base.map);
      assert.deepEqual(actual.rooms,base.rooms);
      assert.deepEqual(actual.doors,base.doors);
      assert.deepEqual(actual.traps,base.traps);
      assert.deepEqual(actual.sites,base.sites);
      assert.deepEqual(actual.secrets,base.secrets);
      assert.ok(validateDeepLayout(actual),"invalid "+descent+"/"+depth);
      const blockers=independent(actual);
      assert.ok(deepTwoReturnWays(actual.map,actual.start,actual.exit,
        new Set(actual.traps.map(key))));
      assert.ok(deepRoute(actual.map,actual.start,actual.exit,blockers));
      for(const pos of Object.keys(actual.loot)){
        const [x,y]=pos.split(",").map(Number);
        assert.ok(deepRoute(actual.map,actual.start,{x,y},blockers));
        assert.ok(deepRoute(actual.map,{x,y},actual.exit,blockers));
      }
      const guard=actual.enemies.find(e=>e.id==="nhal-guardian-01");
      const former=base.enemies.find(e=>e.id==="nhal-guardian-01");
      const larva=actual.enemies.find(e=>e.id==="nhal-rift_larva-01");
      const side=actual.rooms.find(r=>r.slot===10);
      assert.ok(guard&&former&&larva&&side);
      if(key(guard)===key(former))continue;
      moved++;
      assert.ok(guard.x>side.x&&guard.x<side.x+side.width-1);
      assert.ok(guard.y>side.y&&guard.y<side.y+side.height-1);
      const chest=optional(actual);
      const approached=neighbors(chest).filter(p=>
        actual.map[p.y]?.[p.x]==="."&&!blockers.has(key(p))&&
        dist(p,guard)<=3&&dist(p,larva)<=3);
      assert.ok(approached.length>0);
      assert.ok(approached.some(p=>{
        const sample=pressureSnapshot({
          ...actual,x:p.x,y:p.y,exploration:{seen:[]}
        });
        return sample.nearby>=2&&sample.visible>=2;
      }),"both threats must be truly visible from the optional chest");
      examples.push({descent,depth});
    }
  }
  assert.equal(OPTIONAL_DUO_VERSION,1);
  assert.ok(moved>=2,"at least some generated side chambers must form a duo");
  assert.ok(examples.some(e=>e.depth===2));
  assert.ok(examples.some(e=>e.depth===3));
});

test("GAME-095D3C: no forced changes on incompatible historical layouts",()=>{
  assert.throws(()=>coordinateOptionalDuo(null),TypeError);
  const old=generateDeepLayout(2);
  const stripped=structuredClone(old);
  delete stripped.rooms;
  assert.throws(()=>coordinateOptionalDuo(stripped),TypeError);
  const noAtelier=structuredClone(old);
  noAtelier.rooms=noAtelier.rooms.filter(r=>r.slot!==10);
  assert.equal(coordinateOptionalDuo(noAtelier),noAtelier);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
});

test("GAME-095D3C: replay, transition, no unrequested save field",()=>{
  const initial=newGame();initial.meta.descents=6;
  const first=beginRun(initial,["weapon.rusty_sword"],null,{multiFloor:true}).state;
  const atExit=structuredClone(first);
  atExit.run.enemies=[];
  atExit.run.x=atExit.run.exit.x;atExit.run.y=atExit.run.exit.y;
  const second=resolveFloorExit(atExit,"descend");
  assert.ok(second.changed);
  assert.ok(validateSave(second.state));
  const same=resolveFloorExit(atExit,"descend");
  assert.deepEqual(second.state,same.state);
  const restored=JSON.parse(JSON.stringify(second.state));
  assert.ok(validateSave(restored));
  assert.equal(restored.run.floorDepth,2);
  assert.equal(restored.run.optionalDuoVersion,undefined);
  const earlier=beginRun(newGame()).state;
  assert.equal(earlier.run.floorDepth,undefined);
});

test("GAME-095D3C: new rule must be precached for offline Android",()=>{
  const src=readFileSync(new URL("../docs/optional-duo.js",import.meta.url),"utf8");
  const sw=readFileSync(new URL("../docs/sw.js",import.meta.url),"utf8");
  assert.match(src,/deepTwoReturnWays/);
  assert.match(src,/lineOfSight/);
  assert.match(sw,/"\.\/optional-duo\.js"/);
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-[a-z0-9-]+"/);
});
