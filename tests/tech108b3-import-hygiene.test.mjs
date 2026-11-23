import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

// TECH-108B3: a deliberately narrow static gate for five core modules.
// Full behavior stays checked by engine, Chromium and Android suites.
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const checkedModules=[
  "docs/app.js",
  "docs/game.js",
  "docs/deep-dungeon.js",
  "docs/tiles.js",
  "docs/combat.js"
];
const importsRE=/\bimport\s*\{([^}]+)\}\s*from\s*["']([^"']+)["']\s*;?/g;
const quoteRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");

test("TECH-108B3: all named imports retain references beyond declarations",()=>{
  for(const path of checkedModules){
    const source=read(path);
    const imports=[...source.matchAll(importsRE)];
    const body=source.replace(importsRE,"");
    assert.ok(imports.length>0,path+" must retain its dependencies");
    const modules=imports.map(match=>match[2]);
    assert.equal(modules.length,new Set(modules).size,
      path+" must not import the same module twice");
    for(const [,members,from] of imports){
      assert.ok(from.startsWith("./"),path+": expects local imports only");
      for(const entry of members.split(",")){
        const symbol=entry.trim().split(/\s+as\s+/).at(-1);
        assert.match(symbol,/^[A-Za-z_$][\w$]*$/);
        assert.match(body,new RegExp("\\b"+quoteRE(symbol)+"\\b"),
          path+": unused named import "+symbol+" from "+from);
      }
    }
  }
});

test("TECH-108B3: save format and core module dependencies remain in place",()=>{
  const game=read("docs/game.js");
  const app=read("docs/app.js");
  const tiles=read("docs/tiles.js");
  const combat=read("docs/combat.js");
  assert.match(game,/export const SAVE_KEY\s*=\s*"rogov-web-v1"/);
  assert.match(app,/import\s*\{[^}]*newGame[^}]*\}\s*from\s*"\.\/game\.js"/);
  assert.match(tiles,/import\s*\{[^}]*cameraBounds[^}]*\}\s*from\s*"\.\/game\.js"/);
  assert.match(combat,/import\s*\{[^}]*ENEMY_TYPES[^}]*\}\s*from\s*"\.\/game\.js"/);
  assert.equal([...game.matchAll(/\bfrom\s*["']\.\/stats\.js["']/g)].length,1,
    "stats.js stays imported exactly once");
});
