import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const file=path=>readFileSync(new URL("../docs/"+path,import.meta.url),"utf8");
const css=file("art103b.css"),html=file("index.html"),sw=file("sw.js");

test("ART-103B: Nhal, Veyr and riveted borders are local, portable SVG assets",()=>{
  for(const name of ["art103b-veyr-panorama.svg","art103b-nhal-ruins.svg","art103b-iron-frame.svg"]){
    const svg=file(name);
    assert.match(svg,/<svg\s/,"SVG has a root: "+name);
    assert.match(svg,/viewBox=/,"Art has scalable geometry: "+name);
    assert.match(svg,/shape-rendering="crispEdges"/,"Crisp pixel-art edges: "+name);
    const safeSvg=svg.replace('xmlns="http://www.w3.org/2000/svg"',"");
    assert.doesNotMatch(safeSvg,/<script\b|<foreignObject\b|https?:\/\/|onload\s*=/i,
      "Decorative art is self-contained and inert: "+name);
    assert.ok(svg.length>850&&svg.length<75000,"APK asset stays lightweight: "+name);
    assert.ok(sw.includes('"./'+name+'"'),"PWA cache must ship "+name);
    assert.ok(css.includes('./'+name),"Production CSS must reference "+name);
  }
});

test("ART-103B: stylesheet applies AFTER UI-103A and is cached offline",()=>{
  const prior=html.indexOf('href="./ui103a.css?v=1"');
  const next=html.indexOf('href="./art103b.css?v=1"');
  assert.ok(prior>=0&&next>prior);
  assert.equal(html.match(/href="\.\/art103b\.css\?v=1"/g)?.length,1);
  assert.ok(sw.includes('"./art103b.css?v=1"'));
  assert.match(sw,/ui102-veyr-hub-ui103a-four-screen-art-art103b-scenery/);
  assert.match(css,/border-image-source:url\("\.\/art103b-iron-frame\.svg"\)/);
});

test("ART-103B: painting never reveals an unseen map tile or changes its hit areas",()=>{
  assert.match(css,/\[data-knowledge="visible"\]\.art097c-sconce/);
  assert.match(css,/\[data-knowledge="visible"\]\.art097c-arch/);
  assert.match(css,/\[data-knowledge="visible"\]\.art097c-rift/);
  assert.doesNotMatch(css,/tile-unknown|tile-remembered|data-knowledge="remembered"/);
  assert.doesNotMatch(css,/\#tile-map\s*\{|\.pixel-tile\s*\{/, "No global map cell styling");
  assert.doesNotMatch(css,/(?:\.pixel-map|\.dungeon-wrap)\s*\{[^}]*\b(?:width|height|position|z-index|overflow|background-image)\s*:/s);
  assert.doesNotMatch(css,/\#field-controls\s*\{[^}]*\b(?:position|top|bottom|width|height)\s*:/s);
  assert.match(css,/pointer-events:none/,"Decorative overlay must not intercept clicks");
  assert.match(css,/@media\(max-width:350px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});

test("ART-103B: the game contract remains the real ROGOV experience",()=>{
  const game=file("game.js");
  assert.match(game,/rogov-web-v1/);
  assert.match(game,/SCHEMA_VERSION\s*=\s*1/);
  for(const id of ["refuge","veyr-forge","stash-items","start-btn","expedition","tile-map",
    "field-controls","bag-panel","actor-stats-sheet"])
    assert.equal(html.split('id="'+id+'"').length-1,1,id+" remains in DOM once");
  assert.match(css,/\.frame\.is-refuge #refuge \.veyr-hero>\.refuge-banner/);
  assert.match(css,/\.frame\.is-expedition #expedition>\.section-head/);
});
