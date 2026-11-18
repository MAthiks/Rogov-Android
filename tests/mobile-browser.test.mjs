// DEV-080 — browser-level Android portrait and offline smoke tests.
// This suite runs in Chromium/Playwright only in the isolated PR validation workflow.
// It does not replace physical Android QA.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = resolve(fileURLToPath(new URL("../docs/", import.meta.url)));
const TYPES = {
  ".html":"text/html; charset=utf-8",
  ".js":"text/javascript; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".svg":"image/svg+xml",
  ".webp":"image/webp",
  ".png":"image/png",
  ".webmanifest":"application/manifest+json"
};
let server;
let origin;
let browser;

before(async () => {
  server = createServer(async (req,res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
      const path = resolve(ROOT, "." + (pathname === "/" ? "/index.html" : pathname));
      if (!path.startsWith(ROOT + sep)) {
        res.writeHead(403).end("Forbidden");
        return;
      }
      const bytes = await readFile(path);
      res.writeHead(200, {
        "Content-Type":TYPES[extname(path)] || "application/octet-stream",
        "Cache-Control":"no-store"
      });
      res.end(bytes);
    } catch {
      res.writeHead(404).end("Not found");
    }
  });
  await new Promise((ok,fail) => server.once("error",fail).listen(0,"127.0.0.1",ok));
  origin = "http://127.0.0.1:" + server.address().port + "/";
  browser = await chromium.launch({headless:true, args:["--no-sandbox"]});
});

after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});

async function mobileContext(serviceWorkers="block") {
  return browser.newContext({
    viewport:{width:360,height:780},
    deviceScaleFactor:3,
    isMobile:true,
    hasTouch:true,
    serviceWorkers
  });
}

async function preloadDeepRun(page, besideDoor=false) {
  await page.goto(origin);
  const setup = await page.evaluate(async (byDoor) => {
    const game = await import("./game.js");
    const hero = game.newGame();
    hero.meta.descents=1;
    const saved = game.beginRun(hero).state;
    let position=null;
    let door=null;
    if (byDoor) {
      for (const candidate of saved.run.doors) {
        for (const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const x=candidate.x+dx,y=candidate.y+dy;
          const tile=saved.run.map[y]?.[x];
          if (tile && tile!== "#" && tile!== "^" && tile!=="E") {
            door=candidate;
            position={x,y};
            break;
          }
        }
        if (door) break;
      }
      if (!door) throw new Error("No approachable door");
      saved.run.x=position.x;
      saved.run.y=position.y;
    }
    // Isolate UI interactions from independent combat/AI tests.
    saved.run.enemies=[];
    if (!game.validateSave(saved)) throw new Error("Preloaded dungeon is invalid");
    localStorage.setItem(game.SAVE_KEY, JSON.stringify(saved));
    return {door,position};
  },besideDoor);
  await page.reload();
  await page.locator("#title-continue").click();
  await page.locator("#expedition").waitFor({state:"visible"});
  return setup;
}

test("DEV-080 mobile: 360px portrait, tactile doors, ASCII and persisted travel", {timeout:40000}, async () => {
  const context=await mobileContext();
  try {
    const page=await context.newPage();
    const errors=[];
    page.on("pageerror",e => errors.push(e.message));
    const {door,position}=await preloadDeepRun(page,true);
    const cells=page.locator("#tile-map .pixel-tile");
    assert.equal(await cells.count(),121,"11 × 11 graphic viewport");

    const geometry=await page.evaluate(() => {
      const el=document.querySelector("#tile-map");
      const r=el.getBoundingClientRect();
      return {scroll:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth,
        mapLeft:r.left,mapRight:r.right,mapWidth:r.width};
    });
    assert.ok(geometry.scroll<=geometry.viewport+1,"No horizontal overflow: "+JSON.stringify(geometry));
    assert.ok(geometry.mapLeft>=-1&&geometry.mapRight<=geometry.viewport+1,
      "Dungeon fits portrait: "+JSON.stringify(geometry));

    const doorCell=page.locator('#tile-map .pixel-tile[data-x="'+door.x+'"][data-y="'+door.y+'"]');
    await doorCell.tap();
    assert.match(await page.locator("#door-action").textContent(),/Fermer la porte/);
    assert.equal(await page.locator("#turns").textContent(),"0","Inspection is free");
    await page.locator("#door-action").tap();
    assert.equal(await page.locator("#turns").textContent(),"1","One turn to close");
    assert.equal(await page.locator("#tile-map .tile-door_closed").count(),1);

    await page.locator("#renderer-toggle").tap();
    let ascii=await page.locator("#dungeon-map").textContent();
    assert.equal(ascii.split("\n").length,11);
    assert.ok(ascii.split("\n").every(row=>row.length===11));
    assert.ok(ascii.includes("+"),"Closed door in ASCII");
    await page.reload();
    await page.locator("#title-continue").click();
    assert.equal(await page.locator("#turns").textContent(),"1","Closed-door turn restored");
    assert.ok((await page.locator("#dungeon-map").textContent()).includes("+"),
      "Closed door and ASCII renderer restored");

    // The first door in the generated list is adjacent to the seeded hero.
    await page.locator("#door-select").tap();
    assert.match(await page.locator("#door-action").textContent(),/Ouvrir la porte/);
    await page.locator("#door-action").tap();
    assert.equal(await page.locator("#turns").textContent(),"2");
    ascii=await page.locator("#dungeon-map").textContent();
    assert.ok(ascii.includes("/"),"Opened door in ASCII");

    await page.reload();
    await page.locator("#title-continue").click();
    assert.equal(await page.locator("#turns").textContent(),"2","Opened-door turn restored");
    assert.ok((await page.locator("#dungeon-map").textContent()).includes("/"),
      "Opened door and renderer restored");

    const direction=door.x>position.x?"right":door.x<position.x?"left":
      door.y>position.y?"down":"up";
    await page.locator('[data-direction="'+direction+'"]').tap();
    assert.equal(await page.locator("#turns").textContent(),"3");
    const persisted=await page.evaluate(async () => {
      const {SAVE_KEY}=await import("./game.js");
      return JSON.parse(localStorage.getItem(SAVE_KEY));
    });
    assert.deepEqual([persisted.run.x,persisted.run.y],[door.x,door.y],
      "Hero may traverse an opened door");
    assert.deepEqual(errors,[],"No browser JavaScript errors");
  } finally { await context.close(); }
});

test("DEV-080 mobile: a v0.7f in-progress save stays on its old map", {timeout:30000}, async () => {
  const context=await mobileContext();
  try {
    const page=await context.newPage();
    await page.goto(origin);
    await page.evaluate(async () => {
      const {newGame,beginRun,SAVE_KEY}=await import("./game.js");
      const old=beginRun(newGame()).state;
      localStorage.setItem(SAVE_KEY, JSON.stringify(old));
    });
    await page.reload();
    await page.locator("#title-continue").click();
    assert.equal(await page.locator("#tile-map .pixel-tile").count(),135,"Old 15 × 9 map unchanged");
    assert.equal(await page.locator("#door-select").isDisabled(),true);
    assert.equal(await page.locator("#turns").textContent(),"0");
  } finally { await context.close(); }
});

test("DEV-080 mobile: cached deep dungeon resumes offline after reload", {timeout:50000}, async () => {
  const context=await mobileContext("allow");
  try {
    const page=await context.newPage();
    let initialLoads=0;
    page.on("load",()=>{ initialLoads++; });
    await page.goto(origin);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller),null,{timeout:25000});
    assert.equal(initialLoads,1,"First PWA installation must not interrupt the game");
    await preloadDeepRun(page);
    await context.setOffline(true);
    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").click();
    assert.equal(await page.locator("#tile-map .pixel-tile").count(),121);
    assert.equal(await page.locator("#turns").textContent(),"0");
  } finally {
    await context.setOffline(false);
    await context.close();
  }
});

test("DEV-081 mobile: fog hides unseen enemies from DOM, target panel, ASCII and minimap", {timeout:35000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage();
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    const point=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const {visionKey}=await import("./exploration-visibility.js");
      const source=game.newGame();source.meta.descents=1;
      const state=game.beginRun(source).state;
      const run=state.run;
      let far=null;
      for(let y=1;y<run.map.length-1&&!far;y++)
        for(let x=1;x<run.map[0].length-1;x++)
          if(run.map[y][x]==="."&&Math.hypot(run.x-x,run.y-y)>12){
            far={x,y};break;
          }
      if(!far)throw Error("No hidden enemy position");
      run.enemies=[{...run.enemies[0],id:"hidden-creature",x:far.x,y:far.y}];
      run.targetId="hidden-creature"; // target IDs must not reveal stale offscreen targets.
      const dx=run.x+5<run.map[0].length?5:-5,dy=run.y+5<run.map.length?5:-5;
      const remembered=visionKey(run,run.x+dx,run.y+dy);
      run.exploration.seen=[...new Set([...run.exploration.seen,remembered])].sort((a,b)=>a-b);
      if(!game.validateSave(state))throw Error("Fog save invalid");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
      return far;
    });
    await page.reload();
    await page.locator("#title-continue").click();
    assert.ok(await page.locator("#tile-map .tile-unknown").count()>0);
    assert.ok(await page.locator("#tile-map .tile-remembered").count()>0);
    assert.equal(await page.locator("#tile-map [data-enemy-id]").count(),0);
    assert.equal(await page.locator("#target-choices button").count(),0);
    assert.equal(await page.locator("#combat-panel").isHidden(),true);
    assert.equal(await page.locator("#threat-forecast").isHidden(),true);
    assert.match(await page.locator("#threat-state").textContent(),/AUCUNE MENACE VISIBLE/);
    assert.equal(await page.locator("#exploration-map-panel").isHidden(),false);
    const mini=await page.locator("#exploration-mini-map").textContent();
    assert.equal(mini.split("\n").length,32);
    assert.equal(mini.split("\n")[point.y][point.x]," ");
    await page.locator("#renderer-toggle").tap();
    assert.ok((await page.locator("#dungeon-map").textContent()).includes(" "));
    const unknown=await page.evaluate(async pos=>{
      const game=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return game.inspectTile(s,pos.x,pos.y);
    },point);
    assert.equal(unknown.kind,"unknown");
    assert.deepEqual(errors,[]);
  } finally {await context.close();}
});
