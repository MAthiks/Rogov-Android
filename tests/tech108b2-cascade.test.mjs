import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// TECH-108B2: check the exact link/cascade assumptions used when pruning
// source 106A. This is NOT a stand-in for the full Chromium visual/touch QA.
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("TECH-108B2: later 106E owns all compact Nhal mobile heights and map width",()=>{
  const html=read("docs/index.html");
  const sw=read("docs/sw.js");
  const older=read("docs/uiart106a.css");
  const newer=read("docs/uiart106e.css");
  const a='href="./uiart106a.css?v=1"';
  const e='href="./uiart106e.css?v=1"';

  assert.ok(html.indexOf(a)>=0&&html.indexOf(e)>html.indexOf(a),
    "A and E must load together, with E after A");
  assert.ok(sw.includes('"./uiart106a.css?v=1"'));
  assert.ok(sw.includes('"./uiart106e.css?v=1"'),
    "Both stylesheets must remain available through the PWA cache");

  // 106A only loses min-height declarations shadowed in *every* active
  // mobile breakpoint by the same selector in the later 106E layer.
  assert.doesNotMatch(older,/min-height:53px;min-width:0;max-width:100%/);
  assert.doesNotMatch(older,/@media\(max-width:730px\) and \(max-height:760px\)/);
  assert.match(older,/min-width:0;max-width:100%;gap:2px;padding:5px 1px 3px;/);

  assert.match(newer,/\.frame\.is-expedition #expedition \.dungeon-wrap>\.expedition-shortcuts button\{\s*min-height:45px;/);
  assert.match(newer,/\.frame\.is-expedition #expedition \.dungeon-wrap>\.expedition-shortcuts button\{\s*min-height:44px;/);
  assert.match(newer,/\.frame\.is-expedition #expedition>\.section-head\{\s*min-height:66px;margin-bottom:2px;padding-top:5px;/);
  assert.ok(newer.includes("width:min(100%,var(--nhal106e-map-width,100%),540px);"));
  assert.match(newer,/\.frame\.is-expedition \.nhal106-vitals\{margin-bottom:3px\}/);
});
