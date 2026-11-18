import test from "node:test";
import assert from "node:assert/strict";
import {
  DEEP_WIDTH,DEEP_HEIGHT,generateDeepLayout,validateDeepLayout,
  deepRoute,deepTwoReturnWays,isDeepMap
} from "../docs/deep-dungeon.js";

const key=p=>p.x+","+p.y;
const count=(layout,symbol)=>layout.map.join("").split(symbol).length-1;

test("DEV-080: 240 deterministic seeds build real rooms, corridors and doors",()=>{
  const distinct=new Set();
  for(let n=2;n<=241;n++){
    const l=generateDeepLayout(n);
    assert.ok(validateDeepLayout(l),"invalid deep map "+n);
    assert.equal(l.map.length,DEEP_HEIGHT);
    assert.equal(l.map[0].length,DEEP_WIDTH);
    assert.equal(l.rooms.length,12);
    assert.equal(l.doors.length,34);
    assert.equal(count(l,"+"),34);
    assert.equal(count(l,"S"),1);
    assert.equal(count(l,"E"),1);
    assert.deepEqual(generateDeepLayout(n),l,"seed mismatch "+n);
    distinct.add(l.map.join(""));
    for(const door of l.doors)assert.equal(l.map[door.y][door.x],"+");
    assert.ok(l.rooms.some(r=>r.role==="vestibule"));
    assert.ok(l.rooms.some(r=>r.role==="extraction"));
  }
  assert.ok(distinct.size>=220,"plans do not vary sufficiently");
});

test("DEV-080: two independent public return paths without forced combat",()=>{
  for(const n of [2,3,4,5,29,99,120,241,1001,82001,999999]){
    const l=generateDeepLayout(n);
    const blockers=new Set(l.enemies.map(key));
    assert.ok(deepTwoReturnWays(l.map,l.start,l.exit),"start articulation "+n);
    assert.ok(deepRoute(l.map,l.start,l.exit,blockers),"enemy-blocked extraction "+n);
    for(const pos of Object.keys(l.loot)){
      const [x,y]=pos.split(",").map(Number),p={x,y};
      assert.ok(deepTwoReturnWays(l.map,p,l.exit),"loot articulation "+n+":"+pos);
      assert.ok(deepRoute(l.map,p,l.exit,blockers),"mandatory combat at loot "+n);
      assert.ok(deepRoute(l.map,l.start,p,blockers),"mandatory combat to loot "+n);
    }
    // Non-secret open doorways never count as traps or one-way passages.
    assert.ok(l.doors.every(d=>d.open===true));
  }
});

test("DEV-080: invalid maps fail validation, original objects stay untouched",()=>{
  const l=generateDeepLayout(12);
  const original=JSON.stringify(l);
  const bad=structuredClone(l);
  bad.map[0]=".".repeat(DEEP_WIDTH);
  assert.equal(validateDeepLayout(bad),false);
  bad.map[0]=l.map[0];bad.doors.pop();
  assert.equal(validateDeepLayout(bad),false);
  assert.equal(JSON.stringify(l),original);
  assert.equal(isDeepMap(["##"]),false);
  assert.throws(()=>generateDeepLayout(1),RangeError);
});
