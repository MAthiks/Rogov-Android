import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {characterMotionForTurn} from "../docs/character-motion.js";
import {SAVE_KEY,SCHEMA_VERSION,newGame,beginRun,validateSave} from "../docs/game.js";

const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");
const run=(x=5,y=6,turns=0,floorDepth=1,layoutId="nhal-a")=>({x,y,turns,floorDepth,layoutId});

test("ART-097B2: motion only on genuine, same-floor, forward game turns",()=>{
  const start=run(),save=JSON.stringify(start);
  assert.equal(characterMotionForTurn(null,start),null);
  assert.equal(characterMotionForTurn(start,null),null);
  assert.equal(characterMotionForTurn(start,start),null);
  assert.equal(characterMotionForTurn(start,run(6,6,0)),null);
  assert.equal(characterMotionForTurn(start,run(5,6,-1)),null);
  assert.equal(characterMotionForTurn(start,run(6,6,1,2)),null);
  assert.equal(characterMotionForTurn(start,run(6,6,1,1,"nhal-b")),null);
  assert.equal(characterMotionForTurn(start,{...start,turns:NaN}),null);
  const step=characterMotionForTurn(start,run(6,6,1));
  assert.deepEqual(step,{step:true,foeTurn:true});
  assert.equal(Object.isFrozen(step),true);
  assert.deepEqual(characterMotionForTurn(start,run(5,6,1)),{step:false,foeTurn:true});
  assert.deepEqual(characterMotionForTurn(start,run(7,7,1)),{step:false,foeTurn:true});
  assert.equal(JSON.stringify(start),save,"No run data mutation");
});

test("ART-097B2: only real visible tile sprites receive single-shot CSS cues",()=>{
  const source=read("../docs/tiles.js");
  const app=read("../docs/app.js");
  const css=read("../docs/art097b2.css");
  assert.match(source,/drawTileMap\(state,host,heroFacing="down",motion=null\)/);
  assert.match(source,/if\(!visible&&!remembered\)[\s\S]*?continue/);
  assert.match(source,/if\(motion\?\.step&&visible\)cell\.classList\.add\("art097b2-step"\)/);
  assert.match(source,/const enemy=visible\?enemyAt\(run,x,y\):null/);
  assert.match(source,/if\(motion\?\.foeTurn&&remainingAnimatedFoes>0\)/);
  assert.match(source,/let remainingAnimatedFoes=3/);
  assert.match(app,/pendingCharacterMotion=characterMotionForTurn\(previousRun,state\.run\)/);
  assert.match(app,/drawTileMap\(state, \$\("tile-map"\), heroFacing, pendingCharacterMotion\)/);
  assert.match(app,/pendingCharacterMotion = null;/);
  assert.doesNotMatch(css,/infinite|filter:|backdrop-filter:|box-shadow:|translate3d|will-change:/i);
  assert.match(css,/@media \(prefers-reduced-motion: no-preference\)/);
  assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css,/animation:none!important/);
  assert.match(css,/\[data-knowledge="visible"\]/);
  for(const key of ["tile-hero","tile-charognard","tile-guardian","tile-rift_larva"])
    assert.ok(css.includes(key),"Missing motion style "+key);
  assert.match(css,/steps\(2,end\) 1 both/);
  assert.doesNotMatch(app,/setInterval\(.*art097b2|requestAnimationFrame\(.*art097b2/);
});

test("ART-097B2: no animation fields enter old saves; styles and module are precached",()=>{
  const old=beginRun(newGame(),[]).state;
  old.meta.descents=1;
  const serialized=JSON.stringify(old);
  const cue=characterMotionForTurn(run(),run(5,5,1));
  assert.deepEqual(cue,{step:true,foeTurn:true});
  assert.equal(JSON.stringify(old),serialized);
  assert.equal(validateSave(old),true);
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  const sw=read("../docs/sw.js"),html=read("../docs/index.html");
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-art097b2-turn-motion"/);
  assert.ok(sw.includes('"./art097b2.css?v=1"'));
  assert.ok(sw.includes('"./character-motion.js"'));
  assert.ok(sw.includes('"./tiles.js"'));
  assert.ok(sw.includes('"./hero-art.js"'));
  assert.ok(sw.includes('"./enemy-art.js"'));
  assert.match(html,/href="\.\/art097b2\.css\?v=1"/);
});
