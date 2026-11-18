import test from "node:test";
import assert from "node:assert/strict";
import {
  generateDeepLayout,validateDeepLayout,deepTwoReturnWays,deepRoute
} from "../docs/deep-dungeon.js";
import {GRAPH_VERSION,CORE_SLOTS,topologyEdges,GRAPH_ROOM_MIN,GRAPH_ROOM_MAX}
  from "../docs/deep-topology.js";
import {newGame,beginRun,validateSave,extract} from "../docs/game.js";
import {visibleCells,visionKey} from "../docs/exploration-visibility.js";

const key=p=>p.x+","+p.y;
const pos=s=>{const [x,y]=s.split(",").map(Number);return {x,y};};
const graphKey=(a,b)=>Math.min(a,b)+","+Math.max(a,b);

test("DEV-089C: 240 deterministic seeds yield genuinely varied 8–12 room networks",()=>{
  const roomCounts=new Set(),edgeCounts=new Set(),families=new Set();
  const graphSignatures=new Set(),roomPositions=new Set();
  for(let seed=2;seed<=241;seed++){
    const l=generateDeepLayout(seed);
    assert.ok(validateDeepLayout(l),"invalid layout "+seed);
    assert.equal(l.topologyVersion,GRAPH_VERSION);
    assert.ok(l.rooms.length>=GRAPH_ROOM_MIN&&l.rooms.length<=GRAPH_ROOM_MAX);
    assert.equal(l.rooms.length,new Set(l.rooms.map(r=>r.slot)).size);
    for(const slot of CORE_SLOTS)assert.ok(l.rooms.some(r=>r.slot===slot));
    assert.ok(l.rooms.every((r,i)=>r.id===i));
    assert.equal(l.doors.length,6);
    assert.ok(l.links.length>=l.rooms.length);
    const bySlot=new Map(l.rooms.map(r=>[r.slot,r]));
    const expected=topologyEdges(l.rooms.map(r=>r.slot));
    const actual=new Set(l.links.map(c=>graphKey(
      l.rooms[c.a]?.slot,l.rooms[c.b]?.slot)));
    assert.equal(actual.size,l.links.length);
    assert.deepEqual(actual,new Set(expected.map(c=>graphKey(c.a,c.b))));
    const degree=Array(l.rooms.length).fill(0);
    for(const {a,b} of l.links){
      assert.ok(a>=0&&a<l.rooms.length&&b>=0&&b<l.rooms.length&&a!==b);
      degree[a]++;degree[b]++;
      const first=l.rooms[a],second=l.rooms[b];
      assert.ok(first.cx===second.cx||first.cy===second.cy,
        "only readable straight corridors allowed");
    }
    assert.ok(degree.every(v=>v>=2),"rooms must have alternative connectors");
    assert.equal(bySlot.get(8).role,"vestibule");
    assert.equal(bySlot.get(3).role,"extraction");
    assert.equal(bySlot.get(10).role,"atelier_abandonne");
    assert.ok(l.sites.length===3&&l.traps.length===2&&l.secrets.length===1);
    assert.ok(deepTwoReturnWays(l.map,l.start,l.exit,
      new Set(l.traps.map(key))),"two trap-free extraction routes");
    const blocked=new Set([...l.traps,...l.enemies].map(key));
    assert.ok(deepRoute(l.map,l.start,l.exit,blocked));
    for(const chest of Object.keys(l.loot)){
      const p=pos(chest);
      assert.ok(deepTwoReturnWays(l.map,p,l.exit,new Set(l.traps.map(key))));
      assert.ok(deepRoute(l.map,l.start,p,blocked));
      assert.ok(deepRoute(l.map,p,l.exit,blocked));
    }
    for(const site of l.sites)
      assert.ok(deepRoute(l.map,l.start,site,blocked));
    const seen=visibleCells({...l,x:l.start.x,y:l.start.y,
      exploration:{seen:[]}});
    assert.ok(l.enemies.some(e=>seen.has(visionKey(l,e.x,e.y))));
    assert.ok(Object.keys(l.loot).some(chest=>seen.has(
      visionKey(l,pos(chest).x,pos(chest).y))));
    assert.ok(l.map.some((row,y)=>[...row].some((ch,x)=>
      ch==="^"&&seen.has(visionKey(l,x,y)))));
    if([2,3,17,88,160,241].includes(seed))
      assert.deepEqual(generateDeepLayout(seed),l);
    roomCounts.add(l.rooms.length);edgeCounts.add(l.links.length);
    families.add(l.networkKind);
    graphSignatures.add(l.rooms.map(r=>r.slot).join(",")+"/"+
      l.links.map(c=>graphKey(l.rooms[c.a].slot,l.rooms[c.b].slot))
        .sort().join(";"));
    roomPositions.add(l.rooms.map(r=>r.cx+","+r.cy).join(";"));
  }
  assert.deepEqual([...roomCounts].sort((a,b)=>a-b),[8,9,10,11,12]);
  assert.ok(edgeCounts.size>=5,"corridor count must differ between descents");
  assert.ok(families.size>=3,"several authentic topology families");
  assert.ok(graphSignatures.size>=10,"networks must not be memorisable");
  assert.ok(roomPositions.size>=20,"rooms must not be locked on a rigid grid");
});

test("DEV-089C: graph corruption is rejected without mutating original layouts",()=>{
  const l=generateDeepLayout(4),previous=JSON.stringify(l);
  const changed=structuredClone(l);
  changed.links.pop();
  assert.equal(validateDeepLayout(changed),false);
  changed.links=structuredClone(l.links);
  changed.rooms[0].slot=changed.rooms[1].slot;
  assert.equal(validateDeepLayout(changed),false);
  changed.rooms=structuredClone(l.rooms);
  delete changed.topologyVersion;
  assert.equal(validateDeepLayout(changed),false);
  assert.equal(JSON.stringify(l),previous);
});

test("DEV-089C: first descent unchanged, new networks survive save and extraction",()=>{
  const tutorial=beginRun(newGame()).state;
  assert.ok(validateSave(tutorial));
  assert.equal(tutorial.run.topologyVersion,undefined);
  const game=newGame();game.meta.descents=1;
  const started=beginRun(game).state;
  assert.ok(validateSave(started));
  assert.equal(started.run.topologyVersion,GRAPH_VERSION);
  const reloaded=JSON.parse(JSON.stringify(started));
  assert.ok(validateSave(reloaded));
  assert.deepEqual(reloaded.run.rooms,started.run.rooms);
  assert.deepEqual(reloaded.run.links,started.run.links);
  reloaded.run.x=reloaded.run.exit.x;reloaded.run.y=reloaded.run.exit.y;
  const after=extract(reloaded).state;
  assert.ok(validateSave(after));
  assert.equal(after.run,null);
  assert.equal(after.meta.extractions,1);
  const next=beginRun(after).state;
  assert.ok(validateSave(next));
  assert.notEqual(next.run.layoutId,started.run.layoutId);
  assert.equal(next.run.topologyVersion,GRAPH_VERSION);
});
