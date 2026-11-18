import test from "node:test";
import assert from "node:assert/strict";
import {generateDeepLayout,validateDeepLayout,deepRoute,deepTwoReturnWays,
  ROOM_GEOMETRY_VERSION,ROOM_SHAPES} from "../docs/deep-dungeon.js";
import {newGame,beginRun,move,validateSave} from "../docs/game.js";
import {lineOfSight,revealAround} from "../docs/exploration-visibility.js";

const key=p=>p.x+","+p.y;
const tile=(map,p)=>map[p.y]?.[p.x];
const shapeKinds=["l","pillar","collapsed","alcove"];
const gameAt=(seed=2)=>{
  const s=newGame();s.meta.descents=seed-1;
  return beginRun(s).state;
};

test("DEV-089A: 240 seeded maps include real shaped rooms and remain fair",()=>{
  const profiles=new Set();
  for(let seed=2;seed<=241;seed++){
    const layout=generateDeepLayout(seed);
    assert.ok(validateDeepLayout(layout),"invalid seed "+seed);
    assert.equal(layout.geometryVersion,ROOM_GEOMETRY_VERSION);
    assert.ok(layout.rooms.length>=8&&layout.rooms.length<=12);
    assert.equal(layout.doors.length,6);
    assert.equal(layout.sites.length,3);
    for(const kind of shapeKinds){
      const found=layout.rooms.filter(r=>r.shape===kind);
      assert.equal(found.length,1,"missing "+kind+" in seed "+seed);
      assert.ok(found[0].obstacles.length>0);
    }
    for(const room of layout.rooms){
      assert.ok(ROOM_SHAPES.includes(room.shape));
      for(const p of room.obstacles){
        assert.equal(tile(layout.map,p),"#","obstacle must be an actual wall");
        assert.ok(p.x>room.x&&p.x<room.x+room.width-1);
        assert.ok(p.y>room.y&&p.y<room.y+room.height-1);
      }
    }
    profiles.add(layout.rooms.filter(r=>r.shape!=="rectangle")
      .map(r=>r.id+":"+r.shape).join("|"));
    const blocked=new Set([...layout.enemies,...layout.traps].map(key));
    assert.ok(deepRoute(layout.map,layout.start,layout.exit,blocked));
    assert.ok(deepTwoReturnWays(layout.map,layout.start,layout.exit,
      new Set(layout.traps.map(key))));
    for(const pos of Object.keys(layout.loot)){
      const [x,y]=pos.split(",").map(Number),p={x,y};
      assert.ok(deepRoute(layout.map,layout.start,p,blocked));
      assert.ok(deepRoute(layout.map,p,layout.exit,blocked));
      assert.ok(deepTwoReturnWays(layout.map,p,layout.exit,
        new Set(layout.traps.map(key))));
    }
    for(const site of layout.sites){
      assert.equal(tile(layout.map,site),".");
      assert.ok(deepRoute(layout.map,layout.start,site,blocked));
    }
    assert.ok(layout.rooms.every(r=>r.obstacles.every(p=>
      !layout.secrets.some(s=>s.x===p.x&&s.y===p.y))));
    if([2,19,79,182].includes(seed))
      assert.deepEqual(generateDeepLayout(seed),layout,
        "seed must exactly reproduce geometry and loot");
  }
  assert.ok(profiles.size>=9,"shape locations must not be memorized");
});

test("DEV-089A: structural masonry changes movement and blocks line of sight",()=>{
  const s=gameAt(2);
  const pillar=s.run.rooms.find(r=>r.shape==="pillar").obstacles[0];
  assert.equal(tile(s.run.map,pillar),"#");
  const from={x:pillar.x-1,y:pillar.y},
    beyond={x:pillar.x+1,y:pillar.y};
  assert.equal(tile(s.run.map,from),".");
  assert.equal(tile(s.run.map,beyond),".");
  s.run.enemies=[];
  s.run.x=from.x;s.run.y=from.y;
  revealAround(s.run);
  assert.ok(validateSave(s));
  assert.equal(lineOfSight(s.run,beyond.x,beyond.y),false);
  const before=JSON.stringify(s);
  const blocked=move(s,"right");
  assert.equal(blocked.changed,false);
  assert.equal(blocked.state.run.turns,s.run.turns);
  assert.equal(JSON.stringify(s),before,"a rejected movement must not mutate the state");
  assert.ok(validateSave(blocked.state));
});

test("DEV-089A: original saves and first descent keep their old geometry",()=>{
  const tutorial=beginRun(newGame()).state;
  assert.equal(tutorial.run.geometryVersion,undefined);
  assert.ok(validateSave(tutorial));
  const shaped=gameAt(2);
  assert.equal(shaped.run.geometryVersion,ROOM_GEOMETRY_VERSION);
  assert.ok(validateSave(shaped));
  const copy=JSON.parse(JSON.stringify(shaped));
  assert.ok(validateSave(copy));
  const bad=structuredClone(shaped);
  const pillar=bad.run.rooms.find(r=>r.shape==="pillar");
  bad.run.map[pillar.obstacles[0].y]=bad.run.map[pillar.obstacles[0].y]
    .substring(0,pillar.obstacles[0].x)+"."+
    bad.run.map[pillar.obstacles[0].y].substring(pillar.obstacles[0].x+1);
  assert.equal(validateSave(bad),false,"corrupted room obstacle should be rejected");
  const stripped=structuredClone(shaped);
  delete stripped.run.topologyVersion;
  delete stripped.run.links;
  delete stripped.run.networkKind;
  assert.equal(validateSave(stripped),false,
    "a new variable network must retain its version and links");
});
