import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const css=read("docs/ui103a.css");
const html=read("docs/index.html");
const sw=read("docs/sw.js");

test("UI-103A: the shared art direction loads after Veyr UI-102",()=>{
  const prior=html.indexOf('href="./ui102.css?v=1"');
  const after=html.indexOf('href="./ui103a.css?v=1"');
  assert.ok(prior>=0 && after>prior,"New CSS must override the existing styles, not replace them");
  assert.equal(html.match(/href="\.\/ui103a\.css\?v=1"/g)?.length,1);
  assert.match(sw,/\.\/ui103a\.css\?v=1/,"PWA must precache the skin offline");
  assert.match(sw,/ui103a-four-screen-art/,"Cache namespace must change for the new art asset");
});

test("UI-103A: all four actual gameplay views are styled without invented controls",()=>{
  for(const selector of [
    ".frame.is-expedition #expedition",
    ".frame.is-refuge #refuge",
    ".frame.is-expedition #bag-panel",
    ".frame #actor-stats-sheet",
    "#title-screen.title-screen"
  ])assert.ok(css.includes(selector),"Missing existing view: "+selector);
  assert.match(css,/--da103-void:#080e15/);
  assert.match(css,/--da103-gold:#e2bd83/);
  assert.match(css,/--da103-danger:#d9857a/);
  assert.match(css,/--da103-arc:#6dd0c0/);
  assert.doesNotMatch(css,/https?:\/\//,"Art skin must remain local/offline");
  assert.doesNotMatch(css,/pointer-events\s*:\s*none\s*;/,"No decorative layer may steal or disable existing controls");
});

test("UI-103A: safe mobile presentation preserves map and Veyr action targets",()=>{
  assert.match(css,/@media\(max-width:730px\)/);
  assert.match(css,/@media\(max-width:350px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/#expedition \.pixel-map/);
  assert.match(css,/background-color:#d9b17b;/,
    "The departure button needs a solid contrast fallback on Android");
  for(const forbidden of [
    /#tile-map\s*\{[^}]*\b(display|visibility|position|height|width|opacity)\s*:/s,
    /#field-controls\s*\{[^}]*\b(position|bottom|height|width)\s*:/s,
    /#ui092-sheet\s*\{[^}]*\b(position|bottom|height|width)\s*:/s
  ])assert.doesNotMatch(css,forbidden,"The artistic skin may not alter gameplay geometry");
  assert.match(html,/id="start-btn"/);
  assert.match(html,/id="bag-panel"/);
  assert.match(html,/id="actor-stats-sheet"/);
});

test("UI-103A: game/save ownership is unchanged and the CSS is a separate asset",()=>{
  const game=read("docs/game.js");
  assert.match(game,/rogov-web-v1/);
  assert.match(game,/SCHEMA_VERSION\s*=\s*1/);
  const app=read("docs/app.js");
  assert.match(app,/refugeDashboard/);
  assert.ok(css.length>4000 && css.length<30000);
});
