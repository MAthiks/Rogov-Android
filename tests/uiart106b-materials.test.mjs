import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");

test("UI/ART-106B: forged styling extends the actual live 106A cockpit",()=>{
  const html=read("docs/index.html"),css=read("docs/uiart106b.css");
  const sw=read("docs/sw.js");
  assert.ok(html.indexOf('href="./uiart106b.css?v=1"')>
    html.indexOf('href="./uiart106a.css?v=1"'));
  assert.match(sw,/uiart106a-nhal-uiart106b-materials/);
  for(const name of [
    "uiart106b.css?v=1","art106b-gilded-frame.svg","art106b-bandage.svg",
    "art106b-tonic.svg"
  ])assert.ok(sw.includes("./"+name),"Missing offline asset "+name);
  for(const selector of [
    "#expedition>.section-head",".nhal106-vital",".dungeon-wrap",
    ".expedition-shortcuts button",".dpad button","#use-bandage",
    "#use-tonic","#nhal106-actions","#ui096-threat-banner"
  ])assert.ok(css.includes(selector),"Missing screenshot component "+selector);
  assert.ok(css.length>7000&&css.length<19000);
  assert.match(css,/@media\(max-width:730px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test("UI/ART-106B: offline original art has transparent centers and crisp edges",()=>{
  const frame=read("docs/art106b-gilded-frame.svg");
  assert.match(frame,/width="96" height="96"/);
  assert.match(frame,/viewBox="0 0 96 96"/);
  assert.match(frame,/shape-rendering="crispEdges"/);
  assert.match(frame,/transparent center/);
  for(const path of ["docs/art106b-bandage.svg","docs/art106b-tonic.svg"]){
    const svg=read(path);
    assert.match(svg,/viewBox="0 0 48 48"/);
    assert.match(svg,/shape-rendering="crispEdges"/);
    assert.match(svg,/<\/svg>/);
    assert.doesNotMatch(svg,/<(?:image|script|foreignObject)\b/i);
    assert.doesNotMatch(svg,/(?:xlink:)?href=/i);
  }
});

test("UI/ART-106B: no map-covering decoration or gameplay modification",()=>{
  const css=read("docs/uiart106b.css");
  assert.doesNotMatch(css,/https?:\/\//,"No remote image fonts or URLs");
  assert.doesNotMatch(css,/#tile-map\b|\.pixel-tile\b/,
    "No decoration is allowed over fog/actors/touch map cells");
  assert.doesNotMatch(css,/position\s*:\s*(?:fixed|sticky)\b/,
    "The 106A controller owns fixed positioning");
  assert.doesNotMatch(css,/pointer-events\s*:\s*auto\b/i);
  const game=read("docs/game.js");
  assert.match(game,/rogov-web-v1/);
  assert.match(game,/SCHEMA_VERSION\s*=\s*1/);
});
