import test from "node:test";
import assert from "node:assert/strict";
import {TERRAIN_SVGS,TERRAIN_SPRITES,TERRAIN_PALETTE,
  terrainHash,terrainSpriteAt,floorVariantAt,wallVariantAt,wallEdgeMask
} from "../docs/terrain-art.js";
import {generateDeepLayout} from "../docs/deep-dungeon.js";

const known=()=>true;
const view=(map,x,y,predicate=known,seed="dev-089b")=>
  terrainSpriteAt(map,x,y,predicate,seed);
const decode=data=>decodeURIComponent(data.slice("data:image/svg+xml;charset=UTF-8,".length));

test("DEV-089B: original 24px SVG atlas has readable floors and 16 framed wall states",()=>{
  assert.equal(TERRAIN_SVGS.floor.length,6);
  assert.equal(TERRAIN_SVGS.wall.length,16);
  assert.ok(TERRAIN_SVGS.wall.every(row=>row.length===3));
  assert.equal(TERRAIN_SPRITES.floor.length,6);
  assert.ok(TERRAIN_SPRITES.wall.every(row=>row.length===3));
  const all=[...TERRAIN_SPRITES.floor,...TERRAIN_SPRITES.wall.flat()];
  assert.equal(new Set(all).size,54,"all 54 terrain variants must be distinct");
  for(const src of all){
    assert.match(src,/^data:image\/svg\+xml;charset=UTF-8,/);
    const xml=decode(src);
    assert.match(xml,/viewBox="0 0 24 24"/);
    assert.match(xml,/shape-rendering="crispEdges"/);
    assert.doesNotMatch(xml,/<script|<image|https?:\/\/|<foreignObject/i);
  }
  assert.equal(TERRAIN_PALETTE.floor,"#202d33");
  assert.equal(TERRAIN_PALETTE.wall,"#4b5c63");
});

test("DEV-089B: materials are deterministic and independent from dungeon RNG",()=>{
  const seed="nhal-deep-43-0";
  const hashes=new Set(),floors=new Set(),walls=new Set();
  for(let y=0;y<32;y++)for(let x=0;x<44;x++){
    assert.equal(terrainHash(seed,x,y),terrainHash(seed,x,y));
    assert.equal(floorVariantAt(seed,x,y),floorVariantAt(seed,x,y));
    assert.equal(wallVariantAt(seed,x,y),wallVariantAt(seed,x,y));
    assert.ok(floorVariantAt(seed,x,y)<6);
    assert.ok(wallVariantAt(seed,x,y)<3);
    hashes.add(terrainHash(seed,x,y));
    floors.add(floorVariantAt(seed,x,y));
    walls.add(wallVariantAt(seed,x,y));
  }
  assert.ok(hashes.size>1300);
  assert.equal(floors.size,6);
  assert.equal(walls.size,3);
  const map=["#####","#...#","#...#","#...#","#####"];
  const before=JSON.stringify(map);
  assert.equal(view(map,2,2),view(map,2,2));
  assert.notEqual(view(map,2,2,known,seed),view(map,2,2,known,"other-layout"));
  assert.equal(JSON.stringify(map),before,"visual selection never mutates the saved map");
});

test("DEV-089B: wall edge connectors only consider already known neighbors",()=>{
  const a=["#####","#.#.#","#####"];
  const b=["#####","#.###","#####"];
  const seen=new Set(["2,1","1,1"]);
  const isKnown=(x,y)=>seen.has(x+","+y);
  assert.equal(wallEdgeMask(a,2,1,isKnown),8);
  assert.equal(wallEdgeMask(b,2,1,isKnown),8);
  assert.equal(view(a,2,1,isKnown),view(b,2,1,isKnown),
    "an undiscovered opening must not alter a visible wall graphic");
  seen.add("3,1");
  assert.equal(wallEdgeMask(a,2,1,isKnown),10);
  assert.equal(wallEdgeMask(b,2,1,isKnown),8);
  assert.notEqual(view(a,2,1,isKnown),view(b,2,1,isKnown),
    "a discovered opening should gain a readable framed edge");
  assert.equal(wallEdgeMask(a,1,1,isKnown),0,
    "floor cells are never accidentally classified as solid walls");
});

test("DEV-089B: every seeded descent gets non-repeating terrain without gameplay changes",()=>{
  for(const seed of [2,3,7,19,27,89,241]){
    const layout=generateDeepLayout(seed);
    const before=JSON.stringify(layout);
    const floorVariants=new Set(),wallMasks=new Set();
    for(let y=0;y<layout.map.length;y++)for(let x=0;x<layout.map[y].length;x++){
      const url=view(layout.map,x,y,known,layout.layoutId);
      assert.match(url,/^data:image\/svg\+xml;charset=UTF-8,/);
      if(layout.map[y][x]==="#")wallMasks.add(wallEdgeMask(layout.map,x,y,known));
      else floorVariants.add(floorVariantAt(layout.layoutId,x,y));
    }
    assert.ok(floorVariants.size>=5,"subtle stone variations must exist "+seed);
    assert.ok(wallMasks.size>=4,"wall edge variation must exist "+seed);
    assert.equal(JSON.stringify(layout),before);
  }
});
