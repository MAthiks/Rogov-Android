import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {newGame,beginRun,validateSave,SAVE_KEY} from "../docs/game.js";
const read=file=>readFileSync(new URL("../"+file,import.meta.url),"utf8");

test("UI/ART-106E: portrait layout overrides after all graphical atlases",()=>{
  const html=read("docs/index.html"),css=read("docs/uiart106e.css");
  const sw=read("docs/sw.js");
  assert.ok(html.indexOf('href="./uiart106e.css?v=1"')>
    html.indexOf('href="./art106c-terrain.css?v=1"'));
  assert.ok(sw.includes('"./uiart106e.css?v=1"'));
  assert.match(sw,/uiart106e-portrait/);
  assert.match(css,/@media\(max-width:730px\)/);
  assert.match(css,/@media\(max-width:730px\) and \(max-height:760px\)/);
  assert.match(css,/@media\(max-width:350px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/art103b-nhal-ruins\.svg/);
  assert.match(css,/#jump-menu:focus-visible/);
});

test("UI/ART-106E: Menu icon retains a real 44px tap target and original handlers",()=>{
  const css=read("docs/uiart106e.css");
  const html=read("docs/index.html");
  assert.match(html,/id="jump-menu"[^>]*>☰ Menu<\/button>/);
  assert.match(css,/min-width:44px/);
  assert.match(css,/min-height:44px/);
  assert.match(css,/#jump-menu::before/);
  assert.match(css,/content:"☰"/);
  assert.match(html,/data-nhal106-proxy="jump-menu"/);
  assert.match(read("docs/uiart106a.js"),/target\.click\(\)/);
  assert.match(css,/#renderer-toggle/);
  assert.match(css,/\.pixel-map/);
  assert.doesNotMatch(css,/#tile-map\b|\.pixel-tile\b|\.tile-hero\b/,
    "The overlay must never render sprites or change fog");
  assert.doesNotMatch(css,/position\s*:\s*fixed|pointer-events\s*:\s*auto/,
    "Only the original touch dock is fixed");
});

test("UI/ART-106E: smaller screen still keeps square 24px camera cells",()=>{
  const css=read("docs/uiart106e.css");
  const base=read("docs/style.css");
  assert.match(base,/\.pixel-tile\{aspect-ratio:1 \/ 1/);
  assert.doesNotMatch(css,/aspect-ratio\s*:|grid-template-columns\s*:\s*repeat\(11|scale\(/);
  assert.match(css,/calc\(100dvh - 379px\)/);
  assert.match(css,/calc\(100dvh - 399px\)/);
  const before=newGame();
  before.meta.descents=1;
  const result=beginRun(before,[],null,{multiFloor:true});
  assert.equal(validateSave(result.state),true);
  assert.equal(result.state.run.floorDepth,1);
  assert.equal(SAVE_KEY,"rogov-web-v1");
});
