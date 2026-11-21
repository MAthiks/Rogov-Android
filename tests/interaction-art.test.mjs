import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {INTERACTIVE_IDS,INTERACTIVE_SVGS,INTERACTIVE_SPRITES} from "../docs/interaction-art.js";
import {TILE_SPRITES,LEGEND_ITEMS} from "../docs/tiles.js";
import {SAVE_KEY,SCHEMA_VERSION,newGame,beginRun,validateSave,mapViewportText} from "../docs/game.js";
import {trapAppearance} from "../docs/traps.js";
import {ROOM_SITES,roomSiteAppearance} from "../docs/room-events.js";

const decode=uri=>decodeURIComponent(uri.slice("data:image/svg+xml;charset=UTF-8,".length));

test("ART-091C / GAME-101D: 18 original standalone, offline 24px SVG sprites map to existing keys",()=>{
  assert.equal(INTERACTIVE_IDS.length,18);
  assert.equal(new Set(INTERACTIVE_IDS).size,18);
  assert.equal(new Set(Object.values(INTERACTIVE_SVGS)).size,18);
  assert.equal(new Set(Object.values(INTERACTIVE_SPRITES)).size,18);
  for(const id of INTERACTIVE_IDS){
    const xml=INTERACTIVE_SVGS[id],uri=INTERACTIVE_SPRITES[id];
    assert.match(xml,/viewBox="0 0 24 24" width="24" height="24"/);
    assert.match(xml,/shape-rendering="crispEdges"/);
    assert.match(xml,/<g data-feature="[a-z-]+">/);
    assert.doesNotMatch(xml,/<(?:script|image|foreignObject|text|animate)\b|(?:xlink:)?href\s*=/i,
      "No external calls, embedded scripts, text, sprite-sheet backgrounds or links");
    assert.match(uri,/^data:image\/svg\+xml;charset=UTF-8,/);
    assert.equal(decode(uri),xml);
    assert.equal(TILE_SPRITES[id],uri,"Map and legend must use same new sprite: "+id);
  }
});
test("ART-091C: stateful interaction pairs use structural contrasts",()=>{
  assert.match(INTERACTIVE_SVGS.door_open,/data-feature="open-void"/);
  assert.match(INTERACTIVE_SVGS.door_open,/#09121b/);
  assert.match(INTERACTIVE_SVGS.door_closed,/data-feature="opaque-timber"/);
  assert.match(INTERACTIVE_SVGS.door_closed,/#504237/);
  assert.notEqual(INTERACTIVE_SVGS.door_open,INTERACTIVE_SVGS.door_closed);
  assert.match(INTERACTIVE_SVGS.loot,/data-feature="sealed-lid"/);
  assert.match(INTERACTIVE_SVGS.chest_open,/data-feature="raised-lid"/);
  assert.match(INTERACTIVE_SVGS.chest_open,/#101820/,"Open chest has visible empty cavity");
  assert.match(INTERACTIVE_SVGS.trap_clue,/data-feature="subtle-floor-scratches"/);
  assert.match(INTERACTIVE_SVGS.trap_revealed,/data-feature="exposed-spikes"/);
  assert.match(INTERACTIVE_SVGS.trap_disabled,/data-feature="broken-spikes"/);
  assert.match(INTERACTIVE_SVGS.trap_triggered,/data-feature="spent-mechanism"/);
  assert.match(INTERACTIVE_SVGS.exit,/data-feature="turquoise-extraction-arch"/);
  assert.match(INTERACTIVE_SVGS.hazard,/data-feature="fractured-lethal-rift"/);
  assert.doesNotMatch(INTERACTIVE_SVGS.hazard,/turquoise-extraction-arch/);
  assert.match(INTERACTIVE_SVGS.secret_open,/data-feature="discovered-fractured-wall"/);
  assert.match(INTERACTIVE_SVGS.site_atelier,/data-feature="abandoned-forge"/);
  assert.match(INTERACTIVE_SVGS.site_echo,/data-feature="echo-ritual-ring"/);
  assert.match(INTERACTIVE_SVGS.site_cache,/data-feature="forgotten-reliquary"/);
  assert.match(INTERACTIVE_SVGS.site_resolved,/data-feature="explored-site"/);
});
test("ART-091C: original symbols, site statuses and trap reveals remain authoritative",()=>{
  const s=newGame();s.meta.descents=1;
  const state=beginRun(s,[]).state;
  assert.equal(SAVE_KEY,"rogov-web-v1");
  assert.equal(SCHEMA_VERSION,1);
  assert.equal(validateSave(state),true);
  assert.ok(state.run.traps.length===2&&state.run.sites.length===3);
  const before=JSON.stringify(state);
  for(const trap of state.run.traps){
    const render=trapAppearance({...state.run,x:trap.clue.x,y:trap.clue.y},trap.x,trap.y);
    assert.ok(!render||render.sprite==="trap_clue",
      "Hidden traps must not expose the identified spikes");
  }
  for(const site of state.run.sites){
    const render=roomSiteAppearance({...state.run,x:site.x,y:site.y},site.x,site.y);
    assert.equal(render?.sprite,ROOM_SITES[site.kind].sprite,
      "Unresolved room markers use existing site gameplay IDs");
  }
  const text=mapViewportText(state);
  assert.equal(typeof text,"string");
  assert.equal(JSON.stringify(state),before,"Only immutable asset data is read");
  for(const id of ["loot","chest_open","trap_clue","trap_revealed","trap_disabled",
    "exit","hazard","secret_open","site_atelier","site_echo","site_cache"])
    assert.ok(LEGEND_ITEMS.some(([key])=>key===id),"Legend key remains supported: "+id);
});
test("ART-091C: unknown cells remain asset-free and fresh art is offline-cached",()=>{
  const source=readFileSync(new URL("../docs/tiles.js",import.meta.url),"utf8");
  assert.match(source,/if\(!visible&&!remembered\)[\s\S]*?continue;/);
  assert.match(source,/else if\(visible&&trapAppearance\(run,x,y\)\)/);
  assert.match(source,/else if\(visible&&roomSiteAppearance\(run,x,y\)\)/);
  assert.match(source,/s\.revealed&&s\.x===x&&s\.y===y/);
  assert.match(source,/run\.collected\.includes\(x\+","\+y\)\?"chest_open":"loot"/);
  const sw=readFileSync(new URL("../docs/sw.js",import.meta.url),"utf8");
  assert.match(sw,/const CACHE_NAME = "rogov-v0\.7f-[a-z0-9-]+"/,
    "PWA cache stays versioned for later Sprite C modules");
  for(const asset of ['"./interaction-art.js"','"./hero-art.js"','"./enemy-art.js"'])
    assert.ok(sw.includes(asset),"Offline module not precached: "+asset);
});
