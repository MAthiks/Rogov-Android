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
  browser = await chromium.launch({headless:true, args:["--no-sandbox"],
    ...(process.env.ROGOV_USE_SYSTEM_CHROME==="1"?{channel:"chrome"}:{})});
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


test("DEV-082 mobile: visible clue, deliberate one-turn search, opened cache and saved one-off loot", {timeout:45000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage();
    const errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.goto(origin);
    const scenario=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const source=game.newGame();source.meta.descents=1;
      const state=game.beginRun(source).state;
      state.run.enemies=[];
      const secret=state.run.secrets[0];
      state.run.x=secret.clue.x;state.run.y=secret.clue.y;
      if(!game.validateSave(state))throw Error("Invalid new secret save");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
      return {secret,from:{x:secret.clue.x,y:secret.clue.y}};
    });
    await page.reload();
    await page.locator("#title-continue").click();
    await page.locator("#secret-clue").waitFor({state:"visible"});
    assert.equal(await page.locator("#secret-search").isEnabled(),true);
    assert.equal(await page.locator("#turns").textContent(),"0");
    assert.ok((await page.locator("#secret-clue").textContent()).length>30);
    const prior=await page.evaluate(async ({secret})=>{
      const game=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return game.inspectTile(s,secret.x,secret.y).kind;
    },scenario);
    assert.equal(prior,"wall","undiscovered secret must look like a wall");
    await page.locator("#secret-search").tap();
    assert.equal(await page.locator("#turns").textContent(),"1");
    assert.equal(await page.locator("#secret-clue").isHidden(),true);
    assert.ok(await page.locator("#tile-map .tile-secret_open").count()>0);
    const persisted=await page.evaluate(async()=>{
      const game=await import("./game.js");
      return JSON.parse(localStorage.getItem(game.SAVE_KEY));
    });
    assert.equal(persisted.run.secrets[0].revealed,true);
    assert.equal(persisted.run.secrets[0].claimed,false);
    assert.equal(persisted.run.map[scenario.secret.y][scenario.secret.x],".");
    await page.locator("#renderer-toggle").tap();
    assert.ok((await page.locator("#dungeon-map").textContent()).includes("?"));
    await page.reload();await page.locator("#title-continue").click();
    assert.equal(await page.locator("#turns").textContent(),"1");
    assert.ok((await page.locator("#dungeon-map").textContent()).includes("?"));
    const deltaX=scenario.secret.x-scenario.from.x;
    const deltaY=scenario.secret.y-scenario.from.y;
    const dir=deltaX===1?"right":deltaX===-1?"left":deltaY===1?"down":"up";
    await page.locator('[data-direction="'+dir+'"]').tap();
    assert.equal(await page.locator("#turns").textContent(),"2");
    const rewarded=await page.evaluate(async()=>{
      const game=await import("./game.js");
      return JSON.parse(localStorage.getItem(game.SAVE_KEY));
    });
    assert.equal(rewarded.run.secrets[0].claimed,true);
    assert.equal(rewarded.run.carried["consumable.bandage"],1);
    assert.equal(rewarded.meta.hero.xp,1);
    await page.reload();await page.locator("#title-continue").click();
    const savedAgain=await page.evaluate(async()=>{
      const game=await import("./game.js");
      return JSON.parse(localStorage.getItem(game.SAVE_KEY));
    });
    assert.equal(savedAgain.run.secrets[0].claimed,true);
    assert.equal(savedAgain.run.carried["consumable.bandage"],1);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


/**
 * QA-084 vertical slice: genuine touch-control travel from the title screen
 * through tutorial, deep descent, public loot, clue, search, optional cache,
 * regular-door interaction, extraction, title return and saved resume.
 * Only mobile-browser enemies are disabled to isolate pathing/UI from combat:
 * no teleportation, fast-forwarded turns, debug action dispatch or pre-revealed
 * secrets. Combat is covered by dedicated tactical suites.
 */
test("QA-084 mobile: end-to-end two descents, discovered secret, public extraction and saved loot", {timeout:150000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage();
    const errors=[];
    page.on("pageerror",err=>errors.push(err.message));
    await page.goto(origin);
    await page.locator("#title-continue").tap();
    await page.locator('#stash-items input[type="checkbox"]').first().check();
    await page.locator("#start-btn").tap();

    const saved=()=>page.evaluate(async()=>{
      const game=await import("./game.js");
      return JSON.parse(localStorage.getItem(game.SAVE_KEY));
    });
    const clearOnlyEnemies=async()=>{
      await page.evaluate(async()=>{
        const game=await import("./game.js");
        const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
        if(!state.run)throw Error("No active run for QA scenario");
        state.run.enemies=[];
        if(!game.validateSave(state))throw Error("QA scenario save invalid");
        localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
      });
      await page.reload({waitUntil:"load"});
      await page.locator("#title-continue").tap();
    };
    const directions={"1,0":"right","-1,0":"left","0,1":"down","0,-1":"up"};
    const routeTo=(destination)=>page.evaluate(async dest=>{
      const {SAVE_KEY}=await import("./game.js");
      const {deepRoute}=await import("./deep-dungeon.js");
      const state=JSON.parse(localStorage.getItem(SAVE_KEY));
      const blocked=new Set((state.run.traps||[]).map(t=>t.x+","+t.y));
      return deepRoute(state.run.map,{x:state.run.x,y:state.run.y},dest,blocked);
    },destination);
    const moveOne=async(a,b)=>{
      const direction=directions[(b.x-a.x)+","+(b.y-a.y)];
      assert.ok(direction,"Path must use ordinary adjacent tiles");
      await page.locator('[data-direction="'+direction+'"]').tap();
      const now=await saved();
      if(now.run)assert.deepEqual([now.run.x,now.run.y],[b.x,b.y],
        "Every real UI movement must match its public route");
      return now;
    };
    const walk=async(target,{verifyDoor=false}={})=>{
      const route=await routeTo(target);
      assert.ok(route&&route.length>1,
        "Public route must exist to "+JSON.stringify(target));
      let visitedDoor=false;
      for(let i=1;i<route.length;i++){
        const [a,b]=[route[i-1],route[i]];
        const state=await saved();
        assert.ok(state.run,"The player must remain in Nhal until the exit tile");
        if(verifyDoor&&!visitedDoor&&state.run.map[b.y][b.x]==="+"){
          const cell=page.locator('#tile-map .pixel-tile[data-x="'+b.x+'"][data-y="'+b.y+'"]');
          assert.equal(await cell.count(),1,"Adjacent ordinary door must be in the camera");
          const before=state.run.turns;
          await cell.tap();
          assert.equal((await saved()).run.turns,before,"Inspecting a door is free");
          await page.locator("#door-action").tap();
          assert.equal((await saved()).run.turns,before+1,"Closing a door costs one turn");
          await page.locator('[data-direction="'+directions[(b.x-a.x)+","+(b.y-a.y)]+'"]').tap();
          const blocked=await saved();
          assert.equal(blocked.run.turns,before+1,"A blocked move must not waste a turn");
          assert.deepEqual([blocked.run.x,blocked.run.y],[a.x,a.y]);
          await page.reload({waitUntil:"load"});
          await page.locator("#title-continue").tap();
          assert.equal((await saved()).run.doors.find(d=>d.x===b.x&&d.y===b.y).open,
            false,"The closed door persists after reload");
          await page.locator("#door-select").tap();
          assert.match(await page.locator("#door-action").textContent(),/Ouvrir/);
          await page.locator("#door-action").tap();
          assert.equal((await saved()).run.turns,before+2,"Reopening costs one turn");
          visitedDoor=true;
        }
        await moveOne(a,b);
      }
      return {visitedDoor,steps:route.length-1};
    };

    // The first descent is the genuine tutorial; its exit must lead to Veyr.
    let state=await saved();
    assert.equal(state.meta.descents,1);
    assert.ok(state.run);
    await clearOnlyEnemies();
    state=await saved();
    const tutorialExit=state.run.map.flatMap((row,y)=>
      [...row].map((tile,x)=>tile==="E"?{x,y}:null).filter(Boolean))[0];
    assert.ok(tutorialExit);
    await walk(tutorialExit);
    state=await saved();
    assert.equal(state.run,null,"Tutorial must end in Veyr");
    assert.equal(state.meta.extractions,1,"Tutorial extraction is recorded");
    assert.equal(state.meta.stash["weapon.rusty_sword"],1,
      "Equipment chosen on the title/refuge survives extraction");
    // The tutorial route may naturally pick up a fragment as well; use this
    // actual secured balance as the baseline, never assume the stash is empty.
    const relicBeforeDeep=state.meta.stash["relic.ashen_fragment"]||0;
    const bandagesBeforeDeep=state.meta.stash["consumable.bandage"]||0;

    // A second normal GUI start is the first deep procedural dungeon.
    await page.locator('#stash-items input[type="checkbox"]').first().check();
    await page.locator("#start-btn").tap();
    await clearOnlyEnemies();
    state=await saved();
    assert.equal(state.meta.descents,2);
    assert.equal(state.run.map.length,32);
    assert.equal(state.run.map[0].length,44);
    assert.equal(await page.locator("#tile-map .pixel-tile").count(),121);
    const bounds=await page.evaluate(()=>({
      page:document.documentElement.scrollWidth,
      screen:document.documentElement.clientWidth
    }));
    assert.ok(bounds.page<=bounds.screen+1,"No portrait horizontal overflow");
    const clue=state.run.secrets[0].clue;
    const secret={x:state.run.secrets[0].x,y:state.run.secrets[0].y};
    assert.equal(state.run.secrets[0].revealed,false);
    assert.equal(await page.locator("#secret-search").isHidden(),true);
    const lootPos=Object.entries(state.run.loot)
      .find(([,id])=>id==="relic.ashen_fragment")?.[0];
    assert.ok(lootPos);
    const [lx,ly]=lootPos.split(",").map(Number);
    // With sparse architectural doors, the entrance (not necessarily the
    // extraction route) guarantees a physical framed door to inspect.
    const publicLoot=await walk({x:lx,y:ly},{verifyDoor:true});
    assert.ok(publicLoot.steps>5);
    assert.ok(publicLoot.visitedDoor,"The entrance route tests a real one-turn door");
    state=await saved();
    assert.equal(state.run.carried["relic.ashen_fragment"],1,
      "Public loot enters the bag by normal movement");
    assert.equal(state.run.secrets[0].revealed,false,
      "Public treasure never forces secret discovery");

    const toClue=await walk(clue);
    assert.ok(toClue.steps>0);
    state=await saved();
    assert.equal(await page.locator("#secret-clue").isVisible(),true);
    assert.equal(await page.locator("#secret-search").isEnabled(),true);
    const turnBeforeSearch=state.run.turns;
    const bandagesBeforeSecret=state.run.carried["consumable.bandage"]||0;
    // QA-084 adds a real entry chest. A normal walk may legitimately collect it
    // before the secret; only the increment from the secret must be exactly one.
    const secretCell=page.locator('#tile-map .pixel-tile[data-x="'+secret.x+
      '"][data-y="'+secret.y+'"]');
    assert.equal(await secretCell.count(),1);
    await secretCell.tap();
    assert.equal((await saved()).run.turns,turnBeforeSearch,
      "Examining the wall costs no turn");
    assert.equal(await page.locator("#inspect-title").textContent(),"Mur de pierre");
    await page.locator("#secret-search").tap();
    state=await saved();
    assert.equal(state.run.turns,turnBeforeSearch+1,
      "A confirmed search costs exactly one turn");
    assert.equal(state.run.secrets[0].revealed,true);
    assert.equal(state.run.map[secret.y][secret.x],".");
    assert.equal(await page.locator("#tile-map .tile-secret_open").count(),1);
    assert.equal((await page.locator("#exploration-mini-map").textContent())
      .split("\n")[secret.y][secret.x],"?");

    await page.locator("#renderer-toggle").tap();
    assert.equal(await page.locator("#dungeon-map").isVisible(),true);
    assert.ok((await page.locator("#dungeon-map").textContent()).includes("?"));
    await page.locator("#renderer-toggle").tap();
    await moveOne(clue,secret);
    state=await saved();
    assert.equal(state.run.secrets[0].claimed,true);
    assert.equal(state.run.carried["consumable.bandage"],bandagesBeforeSecret+1);
    const xpAfterCache=state.meta.hero.xp;
    await moveOne(secret,clue);
    await moveOne(clue,secret);
    state=await saved();
    assert.equal(state.run.carried["consumable.bandage"],bandagesBeforeSecret+1,
      "Repeated visits never duplicate a secret reward");
    assert.equal(state.meta.hero.xp,xpAfterCache);

    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").tap();
    state=await saved();
    assert.ok(state.run.secrets[0].claimed);
    assert.equal(state.run.carried["consumable.bandage"],bandagesBeforeSecret+1);
    assert.equal(state.run.exploration.seen.length>0,true);
    assert.equal(state.run.secrets[0].revealed,true);
    const exit=state.run.exit;
    const finalPath=await walk(exit);
    assert.ok(finalPath.steps>0,"Public extraction remains possible without a mandatory door");
    state=await saved();
    assert.equal(state.run,null,"Return to Veyr through the ordinary Arche");
    assert.equal(state.meta.extractions,2);
    assert.equal(state.meta.stash["weapon.rusty_sword"],1);
    assert.equal(state.meta.stash["relic.ashen_fragment"],relicBeforeDeep+1,
      "A single extra public fragment is secured, never duplicated");
    assert.ok(state.meta.stash["consumable.bandage"]>=
      bandagesBeforeDeep+bandagesBeforeSecret+1,
      "The hidden cache's single bandage is secured; optional public chest may add another");
    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").tap();
    const persisted=await saved();
    assert.equal(persisted.run,null);
    assert.equal(persisted.meta.extractions,2);
    assert.equal(persisted.meta.stash["consumable.bandage"],
      state.meta.stash["consumable.bandage"]);
    assert.equal(persisted.meta.stash["relic.ashen_fragment"],relicBeforeDeep+1);
    assert.deepEqual(errors,[],"No browser error during both complete journeys");
    console.log("QA-084 FULL SESSION: tutorial + deep public loot + secret + "+
      "door + return + persist PASS; UI steps="+
      (publicLoot.steps+toClue.steps+finalPath.steps+4));
  }finally{await context.close();}
});


test("QA-084 mobile: active AI charognard fight, public loot, extraction and reload via touch", {timeout:100000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage();
    const errors=[];
    page.on("pageerror",err=>errors.push(err.message));
    await page.goto(origin);
    const init=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=game.newGame();
      s.meta.descents=1;
      const state=game.beginRun(s,["weapon.rusty_sword","consumable.bandage"]).state;
      if(!game.validateSave(state))throw Error("Invalid original deep run");
      if(state.run.enemies.length!==4)throw Error("Four generated enemies must be present");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
      return {ids:state.run.enemies.map(e=>e.id),
        targetId:state.run.enemies.find(e=>e.id==="nhal-charognard-scout-01").id};
    });
    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").tap();
    const state=()=>page.evaluate(async()=>{
      const game=await import("./game.js");
      return JSON.parse(localStorage.getItem(game.SAVE_KEY));
    });
    const delta=(a,b)=>({
      "1,0":"right","-1,0":"left","0,1":"down","0,-1":"up"
    })[(b.x-a.x)+","+(b.y-a.y)];
    const step=async(a,b)=>{
      const dir=delta(a,b);
      assert.ok(dir,"Only legitimate 4-direction movements");
      await page.locator('[data-direction="'+dir+'"]').tap();
      const next=await state();
      if(next.run){
        assert.deepEqual([next.run.x,next.run.y],[b.x,b.y],
          "The mobile control must perform a real move");
      }
      return next;
    };
    const plan=async(target,approachEnemy=false,visits=[])=>page.evaluate(async({target,approachEnemy,visits})=>{
      const game=await import("./game.js");
      const {deepRoute}=await import("./deep-dungeon.js");
      const s=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      const key=p=>p.x+","+p.y;
      const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
      const blocked=new Set([...s.run.enemies,...(s.run.traps||[])].map(key));
      const origin={x:s.run.x,y:s.run.y};
      if(approachEnemy){
        const choices=[[1,0],[-1,0],[0,1],[0,-1]]
          .map(([dx,dy])=>({x:target.x+dx,y:target.y+dy}))
          .map(p=>deepRoute(s.run.map,origin,p,blocked))
          .filter(Boolean).sort((a,b)=>a.length-b.length);
        return choices[0]||null;
      }
      // End-to-end touch movements deliberately avoid real traps and mobile
      // enemies; cost for adjacent threats and visited tiles prevents oscillation.
      const visitsByCell=new Map(visits),goal=key(target),start=key(origin);
      const queue=[{point:origin,cost:0,estimate:0}];
      const costs=new Map([[start,0]]),parents=new Map();
      const points=new Map([[start,origin]]);
      while(queue.length){
        queue.sort((a,b)=>a.cost+a.estimate-b.cost-b.estimate);
        const {point,cost}=queue.shift(),id=key(point);
        if(cost!==costs.get(id))continue;
        if(id===goal){
          const path=[];let cursor=id;
          while(cursor){path.push(points.get(cursor));cursor=parents.get(cursor);}
          return path.reverse();
        }
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const next={x:point.x+dx,y:point.y+dy},nextKey=key(next);
          const terrain=s.run.map[next.y]?.[next.x];
          if(!terrain||terrain==="#"||terrain==="^"||blocked.has(nextKey))continue;
          let danger=0;
          for(const e of s.run.enemies){
            const gap=dist(next,e);
            danger+=gap===1?16:gap===2?4:0;
          }
          const score=cost+1+(visitsByCell.get(nextKey)||0)*12+danger;
          if(score>=(costs.get(nextKey)??Infinity))continue;
          costs.set(nextKey,score);
          parents.set(nextKey,id);points.set(nextKey,next);
          queue.push({point:next,cost:score,estimate:dist(next,target)});
        }
      }
      return null;
    },{target,approachEnemy,visits});
    let attacks=0,movements=0;
    for(let turn=0;turn<100;turn++){
      const now=await state();
      assert.ok(now.run,"The live character must not die during encounter");
      const foe=now.run.enemies.find(e=>e.id===init.targetId);
      if(!foe)break;
      const d=Math.abs(now.run.x-foe.x)+Math.abs(now.run.y-foe.y);
      if(d===1){
        if(now.run.targetId!==foe.id){
          await page.locator("#target-choices button")
            .filter({hasText:"Charognard"}).first().tap();
        }
        if(now.run.endurance<1){
          await page.locator("#wait-btn").tap();
        }else{
          const before=(await state()).run.turns;
          await page.locator("#combat-attack").tap();
          const after=await state();
          assert.ok(after.run,"Player survived a real combat round");
          assert.equal(after.run.turns,before+1);
          attacks++;
        }
      }else{
        const route=await plan(foe,true);
        assert.ok(route?.length>=2,"Mobile player can approach the live target");
        await step(now.run,route[1]);
        movements++;
      }
    }
    const postFight=await state();
    assert.ok(postFight.run);
    assert.ok(attacks>=1,"A real attack is required");
    assert.ok(!postFight.run.enemies.some(e=>e.id===init.targetId));
    assert.equal(postFight.run.enemies.length,init.ids.length-1,
      "The other three original enemies remain alive");

    const lootKey=Object.entries(postFight.run.loot)
      .find(([,id])=>id==="relic.ashen_fragment")?.[0];
    assert.ok(lootKey,"Public fragment exists");
    const [x,y]=lootKey.split(",").map(Number);
    const walk=async(destination)=>{
      const visits=new Map();
      for(let turn=0;turn<150;turn++){
        const current=await state();
        if(!current.run)return current;
        if(current.run.x===destination.x&&current.run.y===destination.y)return current;
        const here=current.run.x+","+current.run.y;
        visits.set(here,(visits.get(here)||0)+1);
        const route=await plan(destination,false,[...visits]);
        assert.ok(route?.length>=2,"Ordinary route remains available with active enemies");
        await step(current.run,route[1]);
        movements++;
        const next=await state();
        if(next.run&&next.run.hp<=7&&(next.run.carried["consumable.bandage"]||0)>0)
          await page.locator("#use-bandage").tap();
      }
      assert.fail("Live enemy route timed out");
    };
    const withLoot=await walk({x,y});
    assert.ok(withLoot.run);
    assert.equal(withLoot.run.carried["relic.ashen_fragment"],1);
    const afterExit=await walk(withLoot.run.exit);
    assert.equal(afterExit.run,null);
    assert.equal(afterExit.meta.extractions,1);
    assert.equal(afterExit.meta.recalls,0);
    assert.equal(afterExit.meta.stash["weapon.rusty_sword"],1);
    assert.equal(afterExit.meta.stash["relic.ashen_fragment"],1);
    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").tap();
    const persisted=await state();
    assert.equal(persisted.run,null);
    assert.equal(persisted.meta.stash["relic.ashen_fragment"],1);
    assert.deepEqual(errors,[]);
    console.log("QA-084 LIVE MOBILE UI: "+attacks+" attack(s), "+
      movements+" touch moves, 2 remaining active enemies, extraction PASS");
  }finally{await context.close();}
});


test("QA-084 feedback mobile: an actual new descent shows an enemy, chest and rift before any movement", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    const chest=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=game.newGame();s.meta.descents=1;
      const deep=game.beginRun(s).state;
      if(!game.validateSave(deep))throw Error("Generated deep save invalid");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(deep));
      const pos=Object.keys(deep.run.loot).find(k=>
        deep.run.loot[k]==="consumable.bandage");
      const [x,y]=pos.split(",").map(Number);
      return {x,y};
    });
    await page.reload();
    await page.locator("#title-continue").tap();
    if(await page.locator("#tile-map").isHidden())
      await page.locator("#renderer-toggle").tap();
    assert.ok(await page.locator("#tile-map .tile-charognard").count()>0,
      "At least one enemy must already be visible on entering Nhal");
    assert.ok(await page.locator("#tile-map .tile-loot").count()>0,
      "An actual chest must already be visible on entering Nhal");
    assert.ok(await page.locator("#tile-map .tile-hazard").count()>0,
      "A visible rift must already be in the entry viewport");
    assert.equal(await page.locator("#chest-action").isDisabled(),true,
      "Chest opening needs proximity");
    // Isolate the chest interaction from combat while using real mobile D-pad.
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      state.run.enemies=[];
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();
    await page.locator("#title-continue").tap();
    const steps=await page.evaluate(async(chest)=>{
      const game=await import("./game.js");
      const {deepRoute}=await import("./deep-dungeon.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return deepRoute(state.run.map,{x:state.run.x,y:state.run.y},chest);
    },chest);
    assert.ok(steps?.length>=3);
    for(let i=1;i<steps.length-1;i++){
      const a=steps[i-1],b=steps[i];
      const dir=b.x>a.x?"right":b.x<a.x?"left":b.y>a.y?"down":"up";
      await page.locator('[data-direction="'+dir+'"]').tap();
    }
    assert.equal(await page.locator("#chest-action").isEnabled(),true);
    const before=Number(await page.locator("#turns").textContent());
    await page.locator("#chest-action").tap();
    assert.equal(Number(await page.locator("#turns").textContent()),before+1);
    const stored=await page.evaluate(async()=>{
      const game=await import("./game.js");
      return JSON.parse(localStorage.getItem(game.SAVE_KEY));
    });
    assert.equal(stored.run.carried["consumable.bandage"],1);
    assert.ok(stored.run.collected.includes(chest.x+","+chest.y));
    assert.ok(await page.locator("#tile-map .tile-chest_open").count()>0);
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#chest-action").isDisabled(),true);
    assert.deepEqual(errors,[]);
    console.log("QA-084 MOBILE FEEDBACK: entry enemy / chest / rift / tactile open / persistence PASS");
  }finally{await context.close();}
});

test("DEV-083 mobile: visible clue, tactile search, disarm, ASCII and reload", {timeout:40000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    const position=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const fog=await import("./exploration-visibility.js");
      const base=game.newGame();base.meta.descents=1;
      const s=game.beginRun(base).state;
      const trap=s.run.traps.find(t=>t.kind==="unstable_slab");
      s.run.enemies=[];s.run.x=trap.clue.x;s.run.y=trap.clue.y;
      fog.revealAround(s.run);
      if(!game.validateSave(s))throw Error("DEV-083 preloaded state invalid");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(s));
      return {x:trap.x,y:trap.y,clue:trap.clue};
    });
    await page.reload();
    await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#trap-clue").isVisible(),true);
    assert.equal(await page.locator("#trap-search").isEnabled(),true);
    assert.equal(await page.locator("#trap-disarm").isHidden(),true);
    const turns=Number(await page.locator("#turns").textContent());
    await page.locator("#trap-search").tap();
    assert.equal(Number(await page.locator("#turns").textContent()),turns+1);
    assert.equal(await page.locator("#trap-disarm").isEnabled(),true);
    let saved=await page.evaluate(async()=>{
      const game=await import("./game.js");
      return JSON.parse(localStorage.getItem(game.SAVE_KEY));
    });
    assert.equal(saved.run.traps[1].status,"revealed");
    const rng=saved.run.rngState;
    await page.locator("#trap-disarm").tap();
    saved=await page.evaluate(async()=>{
      const game=await import("./game.js");
      return JSON.parse(localStorage.getItem(game.SAVE_KEY));
    });
    assert.ok(["disabled","revealed"].includes(saved.run.traps[1].status));
    assert.equal(saved.run.traps[1].attempts,1);
    assert.notEqual(saved.run.rngState,rng);
    assert.equal(Number(await page.locator("#turns").textContent()),turns+2);
    await page.locator("#renderer-toggle").tap();
    const map=await page.locator("#dungeon-map").textContent();
    assert.match(map,saved.run.traps[1].status==="disabled"?/x/:/!/);
    await page.reload();await page.locator("#title-continue").tap();
    const reloaded=await page.evaluate(async()=>{
      const game=await import("./game.js");
      return {run:JSON.parse(localStorage.getItem(game.SAVE_KEY)).run,
        valid:game.validateSave(JSON.parse(localStorage.getItem(game.SAVE_KEY)))};
    });
    assert.ok(reloaded.valid);
    assert.equal(reloaded.run.traps[1].attempts,1);
    assert.equal(reloaded.run.traps[1].status,saved.run.traps[1].status);
    assert.deepEqual(errors,[]);
    console.log("DEV-083 MOBILE TRAPS: visible hint / tactile search / disarm / ASCII / reload PASS");
  }finally{await context.close();}
});

test("DEV-087 mobile: hidden exploration rooms become visible and choices persist after reload", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage();
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    const initial=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=game.newGame();s.meta.descents=1;
      const active=game.beginRun(s).state;
      active.run.enemies=[];
      if(!game.validateSave(active))throw Error("Invalid DEV-087 initial deep run");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(active));
      return active.run.sites[0];
    });
    await page.reload();
    await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#room-site-panel").isHidden(),true,
      "Undiscovered atelier must never appear in action UI");
    assert.equal(await page.locator("#room-site-options button").count(),0);
    await page.evaluate(async(site)=>{
      const game=await import("./game.js");
      const {revealAround}=await import("./exploration-visibility.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      const near=[[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>({x:site.x+dx,y:site.y+dy}))
        .find(p=>state.run.map[p.y]?.[p.x]==="."&&
          !state.run.traps.some(t=>t.x===p.x&&t.y===p.y));
      if(!near)throw Error("Atelier has no safe adjacent square");
      state.run.x=near.x;state.run.y=near.y;
      revealAround(state.run);
      if(!game.validateSave(state))throw Error("DEV-087 near-site save invalid");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    },initial);
    await page.reload();
    await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#room-site-panel").isVisible(),true);
    assert.match(await page.locator("#room-site-title").textContent(),/Atelier abandonné/);
    assert.equal(await page.locator("#room-site-options button").count(),2);
    await page.locator('[data-room-choice="fragment"]').tap();
    const after=await page.evaluate(async()=>{
      const game=await import("./game.js");
      return JSON.parse(localStorage.getItem(game.SAVE_KEY));
    });
    assert.equal(after.run.turns,1,"Choice takes exactly one turn");
    assert.equal(after.run.sites[0].status,"resolved");
    assert.equal(after.run.sites[0].choice,"fragment");
    assert.equal(after.run.carried["relic.ashen_fragment"],1);
    assert.equal(after.meta.hero.xp,1);
    assert.equal(await page.locator("#room-site-panel").isHidden(),true);
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#room-site-panel").isHidden(),true);
    assert.equal(await page.locator("#room-site-options button").count(),0);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("DEV-088 mobile: report is fog-safe, costs no turn and persists after reload", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await preloadDeepRun(page);
    assert.equal(await page.locator("#expedition-report").isVisible(),true);
    const before=await page.locator("#turns").textContent();
    await page.locator("#expedition-report summary").tap();
    assert.match(await page.locator("#report-route").textContent(),/Arche non repérée/);
    assert.equal(await page.locator("#report-carried").textContent(),"0 objet");
    assert.equal(await page.locator("#report-fragments").textContent(),"0");
    assert.match(await page.locator("#report-advice").textContent(),/Arche n'a pas encore été repérée/);
    assert.equal(await page.locator("#turns").textContent(),before,
      "Opening and reading the report is free");
    const bounds=await page.evaluate(()=>({
      outer:document.documentElement.scrollWidth,
      inner:document.documentElement.clientWidth
    }));
    assert.ok(bounds.outer<=bounds.inner+1,"Mobile report must not overflow viewport");
    await page.reload();
    await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#expedition-report").isVisible(),true);
    await page.locator("#expedition-report summary").tap();
    assert.match(await page.locator("#report-route").textContent(),/Arche non repérée/);
    assert.equal(await page.locator("#turns").textContent(),before);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("DEV-089A mobile: actual interior pillar blocks touch movement, LOS and survives reload", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    const p=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const {revealAround,lineOfSight}=await import("./exploration-visibility.js");
      const state=game.newGame();state.meta.descents=1;
      const active=game.beginRun(state).state;
      const pillar=active.run.rooms.find(r=>r.shape==="pillar").obstacles[0];
      active.run.enemies=[];
      active.run.x=pillar.x-1;active.run.y=pillar.y;
      revealAround(active.run);
      if(!game.validateSave(active))throw new Error("Invalid interior wall saved state");
      if(lineOfSight(active.run,pillar.x+1,pillar.y))throw new Error("Wall does not block LOS");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(active));
      return pillar;
    });
    await page.reload();await page.locator("#title-continue").tap();
    const wall=page.locator('#tile-map .pixel-tile[data-x="'+p.x+'"][data-y="'+p.y+'"]');
    assert.equal(await wall.count(),1,"pillar must be inside mobile camera");
    const wallImage=await wall.evaluate(node=>node.style.backgroundImage);
    const adjacent=page.locator('#tile-map .pixel-tile[data-x="'+(p.x-1)+'"][data-y="'+p.y+'"]');
    assert.notEqual(wallImage,await adjacent.evaluate(node=>node.style.backgroundImage),
      "the pillar is drawn as solid masonry, not a cosmetic floor decal");
    assert.equal(await page.locator("#turns").textContent(),"0");
    await page.locator('[data-direction="right"]').tap();
    assert.equal(await page.locator("#turns").textContent(),"0",
      "walking into a pillar should not spend a turn");
    await page.locator("#renderer-toggle").tap();
    assert.equal(await page.locator("#dungeon-map").isVisible(),true);
    assert.ok((await page.locator("#dungeon-map").textContent()).includes("#"),
      "ASCII representation still shows walls");
    await page.reload();await page.locator("#title-continue").tap();
    const restored=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return {valid:game.validateSave(state),geometry:state.run.geometryVersion,
        shape:state.run.rooms.find(r=>r.shape==="pillar")?.shape};
    });
    assert.equal(restored.valid,true);
    assert.equal(restored.geometry,1);
    assert.equal(restored.shape,"pillar");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("DEV-089B mobile: masonry palette, floor diversity and fog-safe tiles remain readable", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await preloadDeepRun(page);
    const sample=await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      const {terrainSpriteAt}=await import("./terrain-art.js");
      const run=JSON.parse(localStorage.getItem(SAVE_KEY)).run;
      const cells=[...document.querySelectorAll("#tile-map .pixel-tile")];
      const known=new Set([...run.exploration.seen]);
      const {visibleCells,visionKey}=await import("./exploration-visibility.js");
      const live=visibleCells(run);
      const knows=(x,y)=>live.has(visionKey(run,x,y))||
        known.has(visionKey(run,x,y));
      const variants=new Set(),walls=[];
      let hidden=0;
      for(const node of cells){
        const x=Number(node.dataset.x),y=Number(node.dataset.y),tile=run.map[y][x];
        if(node.dataset.knowledge==="unknown"){
          hidden++;
          if(node.style.backgroundImage!=="none"&&node.style.backgroundImage!=="")
            throw Error("Unexplored cell received hidden terrain data");
          if(node.querySelector("img"))throw Error("Hidden entity leaked");
          continue;
        }
        const expected=terrainSpriteAt(run.map,x,y,knows,run.layoutId);
        if(!node.style.backgroundImage.includes(expected))
          throw Error("Wrong known terrain texture at "+x+","+y);
        if(tile==="#")walls.push(node);
        else if(tile===".")variants.add(expected);
      }
      return {count:cells.length,hidden,walls:walls.length,
        variants:variants.size,scroll:document.documentElement.scrollWidth,
        viewport:document.documentElement.clientWidth};
    });
    assert.equal(sample.count,121,"11x11 Android dungeon viewport");
    assert.ok(sample.hidden>0,"Fog continues to hide unknown tiles");
    assert.ok(sample.walls>0,"New masonry walls appear in the visible viewport");
    assert.ok(sample.variants>=3,"Floor patterns are varied without visual noise");
    assert.ok(sample.scroll<=sample.viewport+1,"Art may not add horizontal scrolling");
    await page.reload();await page.locator("#title-continue").tap();
    const restored=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(state),turns:state.run.turns};
    });
    assert.equal(restored.valid,true);
    assert.equal(restored.turns,0,"Rendering never advances gameplay turns");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("DEV-089C mobile: eight-room network and expedition UI survive reload", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    const first=await page.evaluate(async()=>{
      const game=await import("./game.js");
      // Seed 4 intentionally selects the smallest supported graph.
      const newState=game.newGame();newState.meta.descents=3;
      const state=game.beginRun(newState).state;
      if(state.run.rooms.length!==8||state.run.topologyVersion!==1)
        throw Error("Eight-room graph seed no longer reproducible");
      if(!game.validateSave(state))throw Error("New topology rejected by save validation");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
      return {layoutId:state.run.layoutId,rooms:state.run.rooms.length,
        links:state.run.links.length,start:state.run.start};
    });
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#tile-map .pixel-tile").count(),121);
    assert.ok(await page.locator("#tile-map .tile-unknown").count()>0);
    assert.equal(await page.locator("#expedition-report").isVisible(),true);
    const geometry=await page.evaluate(()=>({
      scroll:document.documentElement.scrollWidth,
      viewport:document.documentElement.clientWidth}));
    assert.ok(geometry.scroll<=geometry.viewport+1,
      "Variable networks must not overflow mobile portrait");
    await page.locator("#expedition-report summary").tap();
    assert.match(await page.locator("#report-route").textContent(),/Arche non repérée/);
    assert.equal(await page.locator("#turns").textContent(),"0");
    await page.reload();await page.locator("#title-continue").tap();
    const restored=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return {valid:game.validateSave(s),layoutId:s.run.layoutId,
        rooms:s.run.rooms.length,links:s.run.links.length};
    });
    assert.ok(restored.valid);
    assert.deepEqual(restored,{valid:true,layoutId:first.layoutId,
      rooms:first.rooms,links:first.links});
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("DEV-090A mobile cockpit: map touches controls, shortcuts cost no turns and layout fits 360px", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await preloadDeepRun(page);
    const geometry=await page.evaluate(()=>{
      const rect=id=>document.getElementById(id).getBoundingClientRect();
      const map=rect("tile-map"),control=rect("field-controls");
      const nav=rect("jump-map"),dpad=rect("wait-btn"),quick=rect("use-bandage");
      const expedition=document.querySelector("#expedition");
      return {
        mapBottom:map.bottom,controlTop:control.top,
        dpadWithin: dpad.top>=control.top&&dpad.bottom<=control.bottom+1,
        healingWithin:quick.top>=control.top&&quick.bottom<=control.bottom+1,
        mapWidth:map.width,navHeight:nav.height,
        width:document.documentElement.clientWidth,
        scroll:document.documentElement.scrollWidth,
        visible:!expedition.hidden,
        reportAfter:document.getElementById("expedition-report")
          .compareDocumentPosition(document.getElementById("field-controls"))
          & Node.DOCUMENT_POSITION_PRECEDING
      };
    });
    assert.equal(geometry.visible,true);
    assert.ok(geometry.mapBottom<=geometry.controlTop&&
      geometry.controlTop-geometry.mapBottom<140,
      "UI-092A: map and fixed controls share the first mobile viewport");
    assert.ok(geometry.dpadWithin&&geometry.healingWithin);
    assert.ok(geometry.navHeight>=42);
    assert.ok(geometry.scroll<=geometry.width+1,
      "new cockpit must not cause horizontal overflow");
    assert.equal(await page.locator("#map-legend-details").evaluate(n=>n.open),false,
      "legend is collapsed by default");
    const before=await page.locator("#turns").textContent();
    await page.locator("#jump-report").tap();
    assert.equal(await page.locator("#expedition-report").evaluate(n=>n.open),true);
    await page.locator("#jump-bag").tap();
    await page.locator("#jump-combat").tap();
    await page.locator("#jump-map").tap();
    assert.equal(await page.locator("#turns").textContent(),before,
      "navigation never consumes a turn");
    await page.locator("#wait-btn").tap();
    assert.equal(await page.locator("#turns").textContent(),String(Number(before)+1),
      "waiting in the dpad is one deliberate turn");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("DEV-090A cockpit remains functional in ASCII and after reload", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage();
    await preloadDeepRun(page);
    await page.locator("#renderer-toggle").tap();
    assert.equal(await page.locator("#dungeon-map").isVisible(),true);
    await page.locator("#jump-map").tap();
    assert.equal(await page.locator("#turns").textContent(),"0");
    await page.locator("#map-legend-details summary").tap();
    assert.equal(await page.locator("#ascii-legend").isVisible(),true);
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#field-controls").isVisible(),true);
    assert.equal(await page.locator("#dungeon-map").isVisible(),true);
    assert.equal(await page.locator("#wait-btn").isEnabled(),true);
    assert.equal(await page.locator("#turns").textContent(),"0");
  }finally{await context.close();}
});


test("DEV-090B mobile: combat panel stays hidden without visible enemies", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await preloadDeepRun(page);
    assert.equal(await page.locator("#combat-dock").isHidden(),true);
    assert.equal(await page.locator("#combat-panel").isHidden(),true);
    assert.equal(await page.locator("#target-choices button").count(),0);
    const before=await page.locator("#turns").textContent();
    await page.locator("#jump-combat").tap();
    assert.equal(await page.locator("#turns").textContent(),before,
      "navigating to an empty combat dock does not advance the game");
    assert.equal(await page.locator("#combat-dock").isHidden(),true);
    await page.locator("#renderer-toggle").tap();
    assert.equal(await page.locator("#dungeon-map").isVisible(),true);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("DEV-090B mobile: compact visible-enemy combat, detail drawer and real tactical turn", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    const setup=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const vision=await import("./exploration-visibility.js");
      const s=game.newGame();
      s.meta.descents=1;
      const active=game.beginRun(s).state;
      const enemy=active.run.enemies[0];
      const around=[[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>({x:enemy.x+dx,y:enemy.y+dy}))
        .find(p=>active.run.map[p.y]?.[p.x]==="." &&
          !active.run.enemies.some(e=>e.x===p.x&&e.y===p.y));
      if(!around)throw Error("No free adjacent tile for mobile combat QA");
      active.run.x=around.x;
      active.run.y=around.y;
      active.run.enemies=[enemy];
      vision.revealAround(active.run);
      if(!game.validateSave(active))throw Error("Invalid tactical test save");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(active));
      return {hp:enemy.hp,kind:enemy.kind};
    });
    await page.reload();
    await page.locator("#title-continue").tap();
    const dock=page.locator("#combat-dock");
    assert.equal(await dock.isVisible(),true,"visible enemy reveals the dock");
    assert.equal(await page.locator("#target-choices button").count(),1);
    const placement=await page.evaluate(()=>{
      const field=document.getElementById("field-controls").getBoundingClientRect();
      const dock=document.getElementById("combat-dock").getBoundingClientRect();
      const map=document.getElementById("tile-map").getBoundingClientRect();
      return {dockAfterMap:dock.top>=map.bottom-1,
        fixedAtBottom:Math.abs(field.bottom-window.innerHeight)<=2,
        width:document.documentElement.clientWidth,
        overflow:document.documentElement.scrollWidth};
    });
    assert.ok(placement.dockAfterMap&&placement.fixedAtBottom,
      "UI-092A: tactical dock remains in DOM and movement stays anchored");
    assert.ok(placement.overflow<=placement.width+1);
    assert.equal(await page.locator("#combat-panel").isHidden(),true,
      "combat actions require explicit target choice");
    await page.locator("#target-choices button").first().tap();
    assert.equal(await page.locator("#combat-panel").isVisible(),true);
    assert.equal(await page.locator("#combat-analysis").evaluate(n=>n.open),false,
      "statistics are folded to leave room for actions");
    assert.match(await page.locator("#combat-target-distance").textContent(),/CONTACT/);
    const meter=await page.locator("#combat-target-meter").evaluate(n=>({
      value:n.value,max:n.max,label:n.getAttribute("aria-valuetext")
    }));
    assert.equal(meter.value,setup.hp);
    assert.ok(meter.max>=meter.value);
    assert.match(meter.label,/points de vie/);
    assert.equal(await page.locator("#turns").textContent(),"0",
      "target selection must cost no turn");
    const actionLayout=await page.evaluate(()=>{
      const buttons=[...document.querySelectorAll(".tactic-actions button")];
      return {count:buttons.length,rows:new Set(buttons.map(b=>
        Math.round(b.getBoundingClientRect().top))).size,
        minHeight:Math.min(...buttons.map(b=>b.getBoundingClientRect().height))};
    });
    assert.equal(actionLayout.count,5);
    assert.equal(actionLayout.rows,2,"five actions use two rows on 360px Android");
    assert.ok(actionLayout.minHeight>=44,"action targets support touch");
    await page.locator("#combat-analysis summary").tap();
    assert.equal(await page.locator("#combat-target-profile").isVisible(),true);
    assert.equal(await page.locator("#turns").textContent(),"0");
    await page.locator("#jump-combat").tap();
    assert.equal(await page.locator("#turns").textContent(),"0");
    await page.locator("#combat-dodge").tap();
    assert.equal(await page.locator("#turns").textContent(),"1",
      "a deliberate tactical defense still consumes exactly one turn");
    await page.reload();
    await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#turns").textContent(),"1");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("DEV-090C mobile: nearby doors surface in the action dock without spending a turn", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await preloadDeepRun(page,true);
    const dock=page.locator("#interaction-dock");
    assert.equal(await dock.isVisible(),true);
    assert.equal(await page.locator("#jump-action").isEnabled(),true);
    assert.match(await page.locator("#interaction-summary").textContent(),/Porte/);
    const coordinates=await page.evaluate(()=>{
      const controls=document.getElementById("field-controls").getBoundingClientRect();
      const action=document.getElementById("interaction-dock").getBoundingClientRect();
      const combat=document.getElementById("combat-dock");
      const map=document.getElementById("tile-map").getBoundingClientRect();
      return {controlEnd:controls.bottom,actionTop:action.top,
        mapBottom:map.bottom,viewHeight:window.innerHeight,
        combatHidden:combat.hidden,overflow:document.documentElement.scrollWidth,
        width:document.documentElement.clientWidth};
    });
    assert.equal(coordinates.combatHidden,true);
    assert.ok(coordinates.actionTop>=coordinates.mapBottom-1&&
      Math.abs(coordinates.controlEnd-coordinates.viewHeight)<=2,
      "UI-092A: interactions remain accessible while the D-pad is fixed");
    assert.ok(coordinates.overflow<=coordinates.width+1);
    const before=await page.locator("#turns").textContent();
    await page.locator("#jump-action").tap();
    await page.locator("#door-select").tap();
    assert.equal(await page.locator("#turns").textContent(),before,
      "shortcut and door selection never advance turns");
    await page.locator("#door-action").tap();
    assert.equal(await page.locator("#turns").textContent(),String(Number(before)+1),
      "door activation is still a deliberate one-turn action");
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#interaction-dock").isVisible(),true);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("DEV-090C mobile: expedition bag remains compact, grouped and free to inspect", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const source=game.newGame();source.meta.descents=1;
      const state=game.beginRun(source).state;
      state.run.enemies=[];
      state.run.carried={"consumable.bandage":7,"relic.ashen_fragment":1};
      if(!game.validateSave(state))throw Error("Invalid eight-item QA save");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#bag-panel").evaluate(e=>e.open),false);
    assert.match(await page.locator("#bag-summary").textContent(),/SAC PLEIN.*8 \/ 8/);
    const before=await page.locator("#turns").textContent();
    await page.locator("#jump-bag").tap();
    assert.equal(await page.locator("#bag-panel").evaluate(e=>e.open),true);
    assert.equal(await page.locator("#bag-meter").evaluate(e=>e.value),8);
    assert.equal(await page.locator("#bag-items .item-row").count(),2);
    assert.equal(await page.locator("#bag-items .bag-category").count(),2);
    assert.equal(await page.locator("#turns").textContent(),before);
    const g=await page.evaluate(()=>({
      scroll:document.documentElement.scrollWidth,
      width:document.documentElement.clientWidth}));
    assert.ok(g.scroll<=g.width+1);
    await page.reload();await page.locator("#title-continue").tap();
    assert.match(await page.locator("#bag-summary").textContent(),/SAC PLEIN/);
    assert.equal(await page.locator("#bag-meter").evaluate(e=>e.value),8);
    assert.equal(await page.locator("#turns").textContent(),before);
  }finally{await context.close();}
});

test("DEV-090C mobile: nearby secret clue remains visible without exposing the hidden route", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    const scenario=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const source=game.newGame();source.meta.descents=1;
      const s=game.beginRun(source).state;
      s.run.enemies=[];
      const clue=s.run.secrets[0].clue;
      s.run.x=clue.x;s.run.y=clue.y;
      if(!game.validateSave(s))throw Error("Invalid secret test state");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(s));
      return {x:s.run.secrets[0].x,y:s.run.secrets[0].y};
    });
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#interaction-dock").isVisible(),true);
    assert.match(await page.locator("#interaction-summary").textContent(),/Indice/);
    assert.equal(await page.locator("#secret-search").isEnabled(),true);
    const before=await page.locator("#turns").textContent();
    await page.locator("#jump-action").tap();
    assert.equal(await page.locator("#turns").textContent(),before);
    await page.locator("#secret-search").tap();
    assert.equal(await page.locator("#turns").textContent(),String(Number(before)+1));
    const persisted=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return {valid:game.validateSave(state),revealed:state.run.secrets[0].revealed};
    });
    assert.deepEqual(persisted,{valid:true,revealed:true});
  }finally{await context.close();}
});


test("ART-091A mobile: hooded 4-way renderer tracks steps, ASCII and saved resume", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await preloadDeepRun(page);
    const hero=page.locator("#tile-map .pixel-tile.tile-hero");
    assert.equal(await hero.count(),1,"Exactly one player silhouette");
    assert.equal(await hero.getAttribute("data-facing"),"down");
    const first=await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      const run=JSON.parse(localStorage.getItem(SAVE_KEY)).run;
      const choices=[
        {name:"up",back:"down",dx:0,dy:-1},
        {name:"down",back:"up",dx:0,dy:1},
        {name:"left",back:"right",dx:-1,dy:0},
        {name:"right",back:"left",dx:1,dy:0}
      ];
      return choices.find(d=>run.map[run.y+d.dy]?.[run.x+d.dx]===".")||null;
    });
    assert.ok(first,"Starting room must have a traversable floor neighbor");
    const before=await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      return JSON.parse(localStorage.getItem(SAVE_KEY)).run.turns;
    });
    await page.locator('[data-direction="'+first.name+'"]').tap();
    assert.equal(await hero.getAttribute("data-facing"),first.name);
    const src=await hero.locator("img").getAttribute("src");
    const expected=await page.evaluate(async facing=>{
      const {HERO_SPRITES}=await import("./hero-art.js");
      return HERO_SPRITES[facing];
    },first.name);
    assert.equal(src,expected,"Correct hood-up view is rendered for the movement");
    assert.match(decodeURIComponent(src),/<g data-feature="hood">/);
    assert.equal(await page.locator("#turns").textContent(),String(before+1));
    const geometry=await page.evaluate(()=>({
      viewport:document.documentElement.clientWidth,
      scroll:document.documentElement.scrollWidth,
      hero:document.querySelector("#tile-map .tile-hero img").getBoundingClientRect().width
    }));
    assert.ok(geometry.scroll<=geometry.viewport+1,"No Android portrait overflow");
    assert.ok(geometry.hero>=18,"Player silhouette remains legible in the 11x11 viewport");
    await page.locator("#renderer-toggle").tap();
    assert.equal(await page.locator("#dungeon-map").isVisible(),true,"ASCII remains active");
    await page.locator("#renderer-toggle").tap();
    assert.equal(await hero.getAttribute("data-facing"),first.name,
      "Switching from ASCII must not reset the graphical orientation");
    await page.locator('[data-direction="'+first.back+'"]').tap();
    assert.equal(await hero.getAttribute("data-facing"),first.back);
    const saved=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(state),turns:state.run.turns,
        addedFacing:Object.hasOwn(state.run,"facing")};
    });
    assert.equal(saved.valid,true);
    assert.equal(saved.turns,before+2);
    assert.equal(saved.addedFacing,false,"Saved schema is unchanged");
    await page.reload();
    await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#tile-map .pixel-tile.tile-hero").count(),1);
    assert.equal(await page.locator("#turns").textContent(),String(before+2));
    assert.equal(await page.locator("#tile-map .tile-hero").getAttribute("data-facing"),"down",
      "Fresh UI session starts facing front, without altering the save");
    assert.deepEqual(errors,[]);
  } finally {await context.close();}
});


test("ART-091B mobile: three distinct Sprite C enemies keep HP and targeting in 360px viewport", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const state=game.beginRun(game.newGame(),[]).state;
      if(!game.validateSave(state))throw Error("Invalid baseline save");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();
    await page.locator("#title-continue").tap();
    const kinds=["charognard","guardian","rift_larva"];
    const expectedHp={charognard:"3",guardian:"5",rift_larva:"4"};
    const features={charognard:"low-carrion-silhouette",
      guardian:"heavy-stone-sentinel",rift_larva:"segmented-horizontal-larva"};
    const sources=[];
    for(const kind of kinds){
      const tile=page.locator("#tile-map .hostile-tile.tile-"+kind);
      assert.equal(await tile.count(),1,"Visible unique enemy "+kind);
      assert.equal(await tile.getAttribute("data-hp"),expectedHp[kind]);
      assert.equal(await tile.getAttribute("data-entity"),"enemy");
      const img=tile.locator("img");
      await img.evaluate(async el=>el.decode());
      const src=await img.getAttribute("src");
      assert.ok(decodeURIComponent(src).includes('data-feature="'+features[kind]+'"'));
      assert.equal(await img.evaluate(el=>el.naturalWidth),24,
        "Sprite should decode as 24px art, not remote image");
      sources.push(src);
      const style=await tile.evaluate(el=>getComputedStyle(el,"::before").borderTopColor);
      assert.ok(style.startsWith("rgb"),"Threat border remains visible for "+kind);
    }
    assert.equal(new Set(sources).size,3);
    const before=await page.locator("#turns").textContent();
    await page.locator("#tile-map .tile-charognard").tap();
    assert.equal(await page.locator("#turns").textContent(),before,
      "Selecting an enemy must stay a free inspection");
    assert.equal(await page.locator("#tile-map .selected-target-tile.tile-charognard").count(),1);
    const layout=await page.evaluate(()=>({
      width:document.documentElement.clientWidth,
      scroll:document.documentElement.scrollWidth,
      mapWidth:document.getElementById("tile-map").getBoundingClientRect().width
    }));
    assert.ok(layout.scroll<=layout.width+1,"Enemy art cannot widen the phone viewport");
    assert.ok(layout.mapWidth<=layout.width);
    await page.locator("#renderer-toggle").tap();
    const ascii=await page.locator("#dungeon-map").textContent();
    assert.ok(ascii.includes("c")&&ascii.includes("G")&&ascii.includes("L"),
      "Legacy enemy ASCII symbols remain intact");
    await page.locator("#renderer-toggle").tap();
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#tile-map .hostile-tile").count(),3);
    const saved=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const saved=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return {valid:game.validateSave(saved),turns:saved.run.turns,
        foes:saved.run.enemies.map(e=>e.kind),spriteFields:
          saved.run.enemies.some(e=>Object.hasOwn(e,"sprite"))};
    });
    assert.equal(saved.valid,true);
    assert.equal(saved.turns,0);
    assert.deepEqual(saved.foes,kinds);
    assert.equal(saved.spriteFields,false);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("ART-091B mobile: Sprite C enemies do not leak through unexplored Nhal fog", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await preloadDeepRun(page);
    const setup=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const fog=await import("./exploration-visibility.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      const original=game.newGame();original.meta.descents=1;
      // Use real generated enemy positions. The deep-layout validator refuses
      // invented locations that break fair arrival/escape constraints.
      const foes=game.beginRun(original).state.run.enemies;
      state.run.enemies=foes;
      if(!game.validateSave(state))throw Error("Original generated encounter must be valid");
      const live=fog.visibleCells(state.run);
      const visible=foes.filter(e=>live.has(fog.visionKey(state.run,e.x,e.y)));
      const hidden=foes.filter(e=>!live.has(fog.visionKey(state.run,e.x,e.y)));
      if(!hidden.length)throw Error("Need at least one genuinely hidden enemy");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
      return {visible:visible.map(e=>e.kind),hidden:hidden.map(e=>e.kind)};
    });
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#tile-map .hostile-tile").count(),setup.visible.length);
    for(const kind of ["charognard","guardian","rift_larva"]){
      const visibleCount=setup.visible.filter(name=>name===kind).length;
      assert.equal(await page.locator("#tile-map .tile-"+kind).count(),visibleCount,
        "Only visible "+kind+" tiles may receive enemy sprites");
    }
    const unknown=await page.evaluate(()=>{
      const cells=[...document.querySelectorAll("#tile-map .pixel-tile.tile-unknown")];
      return {count:cells.length,leaks:cells.filter(c=>
        c.querySelector("img")||c.dataset.entity||c.dataset.enemyId||c.dataset.hp||
        [...c.classList].some(name=>["tile-rift_larva","tile-guardian","tile-charognard"].includes(name))
      ).length};
    });
    assert.ok(unknown.count>0,"The dungeon needs unexplored camera cells");
    assert.equal(unknown.leaks,0,"No hidden enemy knowledge is exposed in DOM");
    await page.locator("#renderer-toggle").tap();
    assert.equal(await page.locator("#dungeon-map").isVisible(),true);
    const saved=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return {valid:game.validateSave(state),turns:state.run.turns};
    });
    assert.deepEqual(saved,{valid:true,turns:0});
    assert.ok(setup.hidden.length>0);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("ART-091C mobile: all 15 interactive assets decode at 24px with no overflow", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",err=>errors.push(err.message));
    await preloadDeepRun(page);
    const sample=await page.evaluate(async()=>{
      const {INTERACTIVE_IDS,INTERACTIVE_SPRITES}=await import("./interaction-art.js");
      const {TILE_SPRITES}=await import("./tiles.js");
      const dimensions=[];
      for(const id of INTERACTIVE_IDS){
        const img=new Image();
        img.src=TILE_SPRITES[id];
        await img.decode();
        dimensions.push({id,w:img.naturalWidth,h:img.naturalHeight,
          mapped:img.src===INTERACTIVE_SPRITES[id]});
      }
      return {dimensions,scroll:document.documentElement.scrollWidth,
        viewport:document.documentElement.clientWidth,
        cells:document.querySelectorAll("#tile-map .pixel-tile").length};
    });
    assert.equal(sample.dimensions.length,15);
    for(const image of sample.dimensions)
      assert.deepEqual([image.w,image.h,image.mapped],[24,24,true],image.id);
    assert.equal(sample.cells,121);
    assert.ok(sample.scroll<=sample.viewport+1,"Android portrait must not overflow");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("ART-091C mobile: state-driven chests, traps, sites, secret, exit and rift use distinct graphics", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",err=>errors.push(err.message));
    await preloadDeepRun(page);
    const result=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const {drawTileMap,TILE_SPRITES}=await import("./tiles.js");
      const baseline=JSON.parse(localStorage.getItem(SAVE_KEY));
      const expected=[],shown=[];
      const copy=()=>JSON.parse(JSON.stringify(baseline));
      const adjacent=(run,p)=>{
        const options=[[0,-1],[1,0],[0,1],[-1,0]]
          .map(([dx,dy])=>({x:p.x+dx,y:p.y+dy}));
        const safe=options.find(q=>run.map[q.y]?.[q.x]==="." &&
          !run.sites.some(site=>site.x===q.x&&site.y===q.y)&&
          !run.traps.some(t=>t.x===q.x&&t.y===q.y));
        const fallback=options.find(q=>run.map[q.y]?.[q.x]===".");
        if(!safe&&!fallback)throw Error("No nearby legal floor at "+p.x+","+p.y);
        return safe||fallback;
      };
      const prove=(sprite,target,prepare=()=>{},preferred=null)=>{
        const state=copy(),r=state.run;
        prepare(r);
        const player=preferred||adjacent(r,target);
        r.x=player.x;r.y=player.y;
        r.enemies=[]; // Existing game fixture is combat-free; isolate art only.
        if(!validateSave(state))throw Error("Invalid scene "+sprite);
        const host=document.createElement("div");
        drawTileMap(state,host);
        const cell=host.querySelector('.pixel-tile[data-x="'+target.x+'"][data-y="'+target.y+'"]');
        if(!cell)throw Error("Target fell outside camera "+sprite);
        if(!cell.classList.contains("tile-"+sprite))
          throw Error("Wrong rendered sprite "+sprite+": "+cell.className);
        if(cell.querySelector("img")?.src!==TILE_SPRITES[sprite])
          throw Error("Wrong graphic for "+sprite);
        const unknown=[...host.querySelectorAll(".tile-unknown")];
        if(unknown.some(c=>c.querySelector("img")||c.dataset.entity||c.dataset.enemyId))
          throw Error("Hidden tiles exposed visual data");
        shown.push(sprite);
      };
      const r=baseline.run,door=r.doors[0];
      const chestKey=Object.keys(r.loot)[0];
      const [cx,cy]=chestKey.split(",").map(Number),chest={x:cx,y:cy};
      const trap=r.traps[0],secret=r.secrets[0];
      prove("door_open",door,r=>{r.doors[0].open=true;});
      prove("door_closed",door,r=>{r.doors[0].open=false;});
      prove("loot",chest);
      prove("chest_open",chest,r=>{r.collected.push(chestKey);});
      for(const [status,sprite] of [
        ["hidden","trap_clue"],["revealed","trap_revealed"],
        ["disabled","trap_disabled"],["triggered","trap_triggered"]
      ]){
        prove(sprite,trap,r=>{r.traps[0].status=status;},trap.clue);
      }
      for(let i=0;i<3;i++){
        const site=r.sites[i];
        prove("site_"+(site.kind==="atelier"?"atelier":
          site.kind==="echo"?"echo":"cache"),site);
        prove("site_resolved",site,r=>{
          r.sites[i].status="resolved";
          r.sites[i].choice=Object.keys({
            atelier:{fragment:true},echo:{inscription:true},cache:{tonic:true}
          }[site.kind])[0];
        });
      }
      prove("exit",r.exit);
      const hazard=r.map.flatMap((row,y)=>[...row].flatMap((cell,x)=>
        cell==="^"?[{x,y}]:[])).find(point=>
          [[0,-1],[1,0],[0,1],[-1,0]].some(([dx,dy])=>
            r.map[point.y+dy]?.[point.x+dx]==="."));
      if(!hazard)throw Error("No readable dangerous rift");
      prove("hazard",hazard);
      prove("secret_open",secret,r=>{
        r.secrets[0].revealed=true;
        r.map[secret.y]=r.map[secret.y].slice(0,secret.x)+"."+
          r.map[secret.y].slice(secret.x+1);
      },secret.clue);
      return {shown,validBaseline:validateSave(baseline),turns:baseline.run.turns};
    });
    for(const expected of ["door_open","door_closed","loot","chest_open",
      "trap_clue","trap_revealed","trap_disabled","trap_triggered",
      "site_atelier","site_echo","site_cache","site_resolved","exit","hazard","secret_open"])
      assert.ok(result.shown.includes(expected),"Missing art render: "+expected);
    assert.equal(result.validBaseline,true);
    assert.equal(result.turns,0,"Visual scene checks must never spend turns");
    assert.equal(await page.locator("#turns").textContent(),"0");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("ART-091C mobile: real door action swaps silhouette, ASCII and saved state", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",err=>errors.push(err.message));
    const {door}=await preloadDeepRun(page,true);
    const cell=page.locator('#tile-map .pixel-tile[data-x="'+door.x+'"][data-y="'+door.y+'"]');
    assert.equal(await cell.locator("img").count(),1);
    assert.ok((await cell.locator("img").getAttribute("src")).includes("open-void"));
    await cell.tap();
    assert.equal(await page.locator("#turns").textContent(),"0");
    await page.locator("#door-action").tap();
    assert.equal(await page.locator("#turns").textContent(),"1");
    assert.ok((await cell.locator("img").getAttribute("src")).includes("opaque-timber"));
    await page.locator("#renderer-toggle").tap();
    assert.ok((await page.locator("#dungeon-map").textContent()).includes("+"));
    await page.reload();await page.locator("#title-continue").tap();
    const saved=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(state),turns:state.run.turns};
    });
    assert.deepEqual(saved,{valid:true,turns:1});
    await page.locator("#renderer-toggle").tap();
    assert.ok((await cell.locator("img").getAttribute("src")).includes("opaque-timber"));
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("ART-091D mobile: all five inventory pictograms and three Veyr concepts stay compact", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const {newGame,SAVE_KEY,validateSave}=await import("./game.js");
      const {ITEM_ART_IDS}=await import("./veyr-art.js");
      const state=newGame();
      for(const id of ITEM_ART_IDS)state.meta.stash[id]=1;
      if(!validateSave(state))throw Error("ART-091D item fixture invalid");
      localStorage.setItem(SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#refuge").isVisible(),true);
    assert.equal(await page.locator("#stash-items .item-row").count(),5);
    const items=await page.locator("#stash-items .item-row").evaluateAll(async rows=>{
      return Promise.all(rows.map(async row=>{
        const icon=row.querySelector(".item-icon"),img=icon.querySelector("img");
        await img.decode();
        return {name:row.querySelector(".item-label strong")?.textContent,
          natural:[img.naturalWidth,img.naturalHeight], alt:img.alt,
          width:img.getBoundingClientRect().width,
          hasCheckbox:!!row.querySelector('input[type="checkbox"]'),
          svg:decodeURIComponent(img.src)};
      }));
    });
    assert.equal(new Set(items.map(x=>x.svg)).size,5);
    for(const item of items){
      assert.deepEqual(item.natural,[24,24]);
      assert.equal(item.alt,"","A visible text label provides the accessible name");
      assert.ok(item.width>=27);
      assert.equal(item.hasCheckbox,true);
      assert.ok(item.name);
    }
    const panel=page.locator("#veyr-concepts");
    assert.equal(await panel.evaluate(el=>el.open),false,
      "NPC concepts stay collapsed by default on 360px screen");
    await panel.locator("summary").tap();
    assert.equal(await panel.evaluate(el=>el.open),true);
    const portraits=await page.locator("#veyr-concept-grid .veyr-concept-card").evaluateAll(async cards=>
      Promise.all(cards.map(async card=>{
        const img=card.querySelector("img");
        await img.decode();
        return {label:card.querySelector("strong")?.textContent,
          note:card.querySelector("small")?.textContent,
          natural:[img.naturalWidth,img.naturalHeight],
          width:img.getBoundingClientRect().width,
          source:decodeURIComponent(img.src),
          buttons:card.querySelectorAll("button,input,a").length};
      }))
    );
    assert.equal(portraits.length,3);
    assert.equal(new Set(portraits.map(x=>x.source)).size,3);
    for(const portrait of portraits){
      assert.deepEqual(portrait.natural,[24,24]);
      assert.ok(portrait.width>=44);
      assert.ok(portrait.note?.startsWith("Concept ·"));
      assert.equal(portrait.buttons,0,"Preview characters have no gameplay controls");
    }
    assert.deepEqual(portraits.map(x=>x.label),[
      "Gardien du refuge","Forgeron de reliques","Érudite de l'Écho"]);
    const metrics=await page.evaluate(()=>({
      width:document.documentElement.clientWidth,
      scroll:document.documentElement.scrollWidth,
      height:document.querySelector("#veyr-concept-grid").getBoundingClientRect().height
    }));
    assert.ok(metrics.scroll<=metrics.width+1,"No horizontal overflow on Android");
    assert.ok(metrics.height<180,"Concepts remain compact in the collapsed dock");
    const current=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(state),run:state.run,
        hasNpcs:Object.hasOwn(state.meta,"npcs")};
    });
    assert.deepEqual(current,{valid:true,run:null,hasNpcs:false});
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("ART-091D mobile: pictogram selection, bag, ASCII and save resume keep gameplay intact", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const {newGame,SAVE_KEY,validateSave}=await import("./game.js");
      const state=newGame();
      if(!validateSave(state))throw Error("Original refuge save invalid");
      localStorage.setItem(SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();await page.locator("#title-continue").tap();
    const checkbox=page.locator('#stash-items input[aria-label="Emporter Épée usée"]');
    await checkbox.check();
    await page.locator("#start-btn").tap();
    assert.equal(await page.locator("#expedition").isVisible(),true);
    assert.equal(await page.locator("#bag-items .item-row").count(),1);
    const icon=page.locator("#bag-items .item-row .item-icon img");
    assert.equal(await icon.count(),1);
    await icon.evaluate(async img=>img.decode());
    assert.ok((await icon.getAttribute("src")).startsWith("data:image/svg+xml"));
    assert.equal(await icon.evaluate(img=>img.naturalWidth),24);
    assert.equal(await page.locator("#turns").textContent(),"0");
    const first=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(saved),turns:saved.run.turns,
        carried:saved.run.carried["weapon.rusty_sword"],npcs:saved.run.npcs};
    });
    assert.deepEqual(first,{valid:true,turns:0,carried:1,npcs:undefined});
    await page.locator("#renderer-toggle").tap();
    assert.equal(await page.locator("#dungeon-map").isVisible(),true);
    assert.equal(await page.locator("#turns").textContent(),"0");
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#bag-items .item-icon img").count(),1);
    assert.equal(await page.locator("#dungeon-map").isVisible(),true);
    const restored=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(saved),turns:saved.run.turns,
        carried:saved.run.carried["weapon.rusty_sword"]};
    });
    assert.deepEqual(restored,{valid:true,turns:0,carried:1});
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("UI-092A mobile: immersive screen gives map, HUD, navigation and fixed movement first-view priority", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await preloadDeepRun(page);
    const metrics=await page.evaluate(()=>{
      const rect=id=>document.getElementById(id).getBoundingClientRect();
      const m=rect("tile-map"),f=rect("field-controls"),nav=rect("expedition-shortcuts");
      const hud=rect("health-meter");
      return {map:m.toJSON(),field:f.toJSON(),nav:nav.toJSON(),hud:hud.toJSON(),
        viewport:window.innerHeight,width:document.documentElement.clientWidth,
        scrollWidth:document.documentElement.scrollWidth,
        heroSize:document.querySelector(".tile-hero img")?.getBoundingClientRect().width,
        headerHidden:getComputedStyle(document.querySelector(".masthead")).display==="none",
        tabCount:document.querySelectorAll("#expedition-shortcuts button").length,
        dockPosition:getComputedStyle(document.getElementById("field-controls")).position};
    });
    assert.equal(metrics.headerHidden,true,"Old desktop header must not displace the map");
    assert.equal(metrics.tabCount,6);
    assert.equal(metrics.dockPosition,"fixed");
    assert.ok(Math.abs(metrics.field.bottom-metrics.viewport)<=2);
    assert.ok(metrics.map.top<metrics.field.top);
    assert.ok(metrics.map.bottom<=metrics.field.top+1,
      "The visible 11×11 graphic map must not be covered by controls");
    assert.ok(metrics.map.height>=245&&metrics.heroSize>=18,
      "The game map remains useful at actual Android portrait scale");
    assert.ok(metrics.nav.top>=0&&metrics.nav.bottom<metrics.map.top);
    assert.ok(metrics.hud.top>=0&&metrics.hud.bottom<=metrics.map.top);
    assert.ok(metrics.scrollWidth<=metrics.width+1,"No horizontal overflow");
    for(const id of ["wait-btn","use-bandage","use-tonic"]){
      const box=await page.locator("#"+id).boundingBox();
      assert.ok(box.y>=metrics.field.top-1&&box.y+box.height<=metrics.viewport+1);
      assert.ok(box.height>=44);
    }
    const before=await page.locator("#turns").textContent();
    await page.locator("#wait-btn").tap();
    assert.equal(await page.locator("#turns").textContent(),String(Number(before)+1));
    await page.locator("#renderer-toggle").tap();
    assert.equal(await page.locator("#dungeon-map").isVisible(),true);
    assert.ok(await page.locator("#field-controls").isVisible());
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#turns").textContent(),String(Number(before)+1));
    assert.equal(await page.locator("#dungeon-map").isVisible(),true);
    assert.equal(await page.locator("#ui092-sheet").isHidden(),true);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("UI-092A mobile: contextual sheets reuse real doors, bag, journal and report without turns", {timeout:65000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await preloadDeepRun(page,true);
    const sheet=page.locator("#ui092-sheet"),mount=page.locator("#ui092-sheet-body");
    assert.equal(await sheet.isHidden(),true);
    await page.locator("#jump-action").tap();
    assert.equal(await sheet.isVisible(),true);
    assert.equal(await mount.locator("#interaction-dock").count(),1);
    assert.equal(await page.locator("#jump-action").getAttribute("aria-expanded"),"true");
    const before=await page.locator("#turns").textContent();
    await page.locator("#door-select").tap();
    assert.equal(await page.locator("#turns").textContent(),before);
    await page.locator("#door-action").tap();
    assert.equal(await page.locator("#turns").textContent(),String(Number(before)+1));
    await page.locator("#jump-bag").tap();
    assert.equal(await mount.locator("#bag-panel").count(),1);
    assert.equal(await mount.locator("#interaction-dock").count(),0);
    assert.equal(await page.locator("#bag-panel").evaluate(e=>e.open),true);
    await page.locator("#jump-report").tap();
    assert.equal(await mount.locator("#expedition-report").count(),1);
    assert.equal(await page.locator("#expedition-report").evaluate(e=>e.open),true);
    await page.locator("#jump-journal").tap();
    assert.equal(await mount.locator("#history-details").count(),1);
    await page.locator("#ui092-sheet-close").tap();
    assert.equal(await sheet.isHidden(),true);
    assert.equal(await mount.locator("#history-details").count(),0);
    assert.equal(await page.locator("#run-log-slot #history-details").count(),1,
      "Existing journal returns to its original DOM position");
    const after=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(s),turns:s.run.turns,
        doorClosed:s.run.doors.some(d=>!d.open)};
    });
    assert.equal(after.valid,true);
    assert.equal(after.turns,1);
    assert.equal(await page.locator("#turns").textContent(),"1");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("UI-092A mobile: combat sheet keeps targeting and active tactical defenses intact", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js"),fog=await import("./exploration-visibility.js");
      const s=game.newGame();s.meta.descents=1;
      const state=game.beginRun(s).state;
      const foe=state.run.enemies[0];
      const adjacent=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>
        ({x:foe.x+dx,y:foe.y+dy})).find(p=>state.run.map[p.y]?.[p.x]==="." &&
          !state.run.enemies.some(e=>e.x===p.x&&e.y===p.y));
      if(!adjacent)throw Error("No legal fighter start");
      state.run.x=adjacent.x;state.run.y=adjacent.y;
      state.run.enemies=[foe];fog.revealAround(state.run);
      if(!game.validateSave(state))throw Error("Invalid tactical save");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#combat-dock").isVisible(),true);
    const mapCount=await page.locator("#tile-map .pixel-tile").count();
    await page.locator("#jump-combat").tap();
    assert.equal(await page.locator("#ui092-sheet-body #combat-dock").count(),1);
    await page.locator("#target-choices button").first().tap();
    assert.equal(await page.locator("#combat-panel").isVisible(),true);
    assert.equal(await page.locator("#turns").textContent(),"0");
    await page.locator("#combat-dodge").tap();
    assert.equal(await page.locator("#turns").textContent(),"1");
    assert.equal(await page.locator("#tile-map .pixel-tile").count(),mapCount);
    await page.locator("#jump-map").tap();
    assert.equal(await page.locator("#ui092-sheet").isHidden(),true);
    assert.equal(await page.locator("#combat-dock").count(),1);
    const restored=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(state),turns:state.run.turns};
    });
    assert.deepEqual(restored,{valid:true,turns:1});
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("QA-092 Android portrait: a real player journey from Veyr earns loot, extracts, forges and descends again", {timeout:95000},async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.goto(origin);
    assert.match(await page.locator("#title-premise").textContent(),/Égaré.*Rappel.*Fragment de cendre/);
    await page.locator("#title-new").tap();
    assert.equal(await page.locator("#refuge").isVisible(),true);
    assert.match(await page.locator("#mission-refuge-title").textContent(),/Première mission/);
    assert.match(await page.locator("#mission-refuge-text").textContent(),/Arche d.extraction/);
    await page.locator("#lore-primer").locator("summary").tap();
    assert.match(await page.locator("#lore-terms").textContent(),/Le Rappel.*sac transporté est perdu/);
    await page.locator('#stash-items input[aria-label="Emporter Épée usée"]').check();
    await page.locator('#stash-items input[aria-label="Emporter Bandage"]').check();
    await page.locator("#start-btn").tap();
    assert.equal(await page.locator("#expedition").isVisible(),true);
    assert.match(await page.locator("#mission-compact").textContent(),/1 FRAGMENT/);
    assert.equal(await page.locator("#turns").textContent(),"0");
    const path=["up","right","right",...Array(9).fill("right"),"down"];
    for(const [i,direction] of path.entries()){
      await page.locator('[data-direction="'+direction+'"]').tap();
      if(i===2) {
        assert.equal(await page.locator("#bag-count").textContent(),"3 / 8",
          "The first relic is now exposed in the carried bag");
        assert.equal(await page.locator("#turns").textContent(),"3");
        assert.match(await page.locator("#mission-compact").textContent(),/REJOINDRE L.ARCHE/);
        assert.match(await page.locator("#route-hint").textContent(),/Rappel.*perdre tout ton sac/);
        await page.locator("#jump-bag").tap();
        assert.equal(await page.locator("#ui092-sheet-body #bag-panel").count(),1);
        assert.match(await page.locator("#bag-items").textContent(),/Fragment de cendre/);
        await page.locator("#jump-map").tap();
        assert.equal(await page.locator("#ui092-sheet").isHidden(),true);
      }
    }
    await page.locator("#refuge").waitFor({state:"visible"});
    assert.equal(await page.locator("#expedition").isHidden(),true);
    assert.match(await page.locator("#mission-refuge-text").textContent(),/1 Fragment de cendre au coffre/);
    const arrived=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(state),extractions:state.meta.extractions,
        fragments:state.meta.stash["relic.ashen_fragment"],
        sword:state.meta.stash["weapon.rusty_sword"]};
    });
    assert.deepEqual(arrived,{valid:true,extractions:1,fragments:1,sword:1});
    await page.locator('[data-recipe="supply.bandages"]').tap();
    const crafted=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(s),fragments:s.meta.stash["relic.ashen_fragment"],
        bandages:s.meta.stash["consumable.bandage"]};
    });
    assert.deepEqual(crafted,{valid:true,fragments:0,bandages:4});
    assert.match(await page.locator("#mission-refuge-title").textContent(),/Poursuivre l.enquête/);
    await page.locator('#stash-items input[aria-label="Emporter Bandage"]').check();
    await page.locator("#start-btn").tap();
    assert.equal(await page.locator("#turns").textContent(),"0");
    assert.equal(await page.locator("#bag-count").textContent(),"1 / 8");
    assert.match(await page.locator("#mission-compact").textContent(),/EXPLORER NHAL/);
    await page.locator("#jump-report").tap();
    assert.equal(await page.locator("#ui092-sheet-body #expedition-report").count(),1);
    assert.match(await page.locator("#report-route").textContent(),/Arche non repérée/);
    const previous=await page.locator("#turns").textContent();
    await page.locator("#jump-map").tap();
    assert.equal(await page.locator("#turns").textContent(),previous);
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#turns").textContent(),"0");
    assert.equal(await page.locator("#bag-count").textContent(),"1 / 8");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("QA-092 mobile: 320/360/393px cockpit, no covered controls, options and continued save", {timeout:75000},async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await preloadDeepRun(page);
    for(const [width,height] of [[320,640],[360,780],[393,704]]){
      await page.setViewportSize({width,height});
      const geometry=await page.evaluate(()=>{
        const get=id=>document.getElementById(id).getBoundingClientRect();
        const map=get("tile-map"),dock=get("field-controls"),nav=get("expedition-shortcuts");
        return {view:window.innerHeight,scrollWidth:document.documentElement.scrollWidth,
          width:document.documentElement.clientWidth,
          mapTop:map.top,mapBottom:map.bottom,dockTop:dock.top,dockBottom:dock.bottom,
          navTop:nav.top,navBottom:nav.bottom,
          startHidden:document.getElementById("refuge").hidden};
      });
      assert.equal(geometry.startHidden,true);
      assert.ok(Math.abs(geometry.dockBottom-geometry.view)<=2,
        "Movement dock should align with bottom at "+width);
      assert.ok(geometry.mapBottom<=geometry.dockTop+1,
        "No player tile is blocked by touch controls at "+width+": "+JSON.stringify(geometry));
      assert.ok(geometry.navTop>=0&&geometry.navBottom<=geometry.mapTop,
        "Navigation remains before the map at "+width);
      assert.ok(geometry.scrollWidth<=geometry.width+1,"No horizontal overflow at "+width);
      await page.locator("#jump-menu").tap();
      assert.equal(await page.locator("#ui092-sheet-body #options-panel").count(),1,
        "The in-run options must not disappear behind the fixed controls");
      const t=await page.locator("#turns").textContent();
      await page.locator("#ui092-sheet-close").tap();
      assert.equal(await page.locator("#turns").textContent(),t,
        "Opening and closing options must cost no game turn");
    }
    await page.locator("#jump-menu").tap();
    await page.locator("#back-to-title").tap();
    assert.equal(await page.locator("#title-screen").isVisible(),true);
    await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#expedition").isVisible(),true);
    assert.equal(await page.locator("#turns").textContent(),"0");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("NAR-094 Android: Echo evidence survives reload and Rappel, second room unlocks only the next clue", {timeout:100000},async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const state=game.newGame();state.meta.descents=1;
      const active=game.beginRun(state).state;
      active.run.enemies=[]; // Only the evidence action is under test.
      if(!game.validateSave(active))throw Error("NAR094 invalid deep save");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(active));
    });
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#echo-expedition-count").textContent(),"0 / 3");
    assert.equal(await page.locator("#echo-expedition-list li").count(),0,
      "An undiscovered Echo must not appear in the DOM as a clue");
    assert.equal(await page.locator("#room-site-panel").isHidden(),true);
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const {revealAround}=await import("./exploration-visibility.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      const site=state.run.sites.find(s=>s.kind==="echo");
      const near=[[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>({x:site.x+dx,y:site.y+dy}))
        .find(p=>state.run.map[p.y]?.[p.x]==="."&&
          !state.run.traps.some(t=>t.x===p.x&&t.y===p.y));
      if(!near)throw Error("No adjacent Echo floor");
      state.run.x=near.x;state.run.y=near.y;
      revealAround(state.run);
      if(!game.validateSave(state))throw Error("NAR094 near-Echo save invalid");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();await page.locator("#title-continue").tap();
    await page.locator("#jump-action").tap();
    assert.match(await page.locator("#room-site-title").textContent(),/Chambre de l'Écho/);
    await page.locator('[data-room-choice="inscription"]').tap();
    assert.equal(await page.locator("#turns").textContent(),"1");
    assert.equal(await page.locator("#echo-expedition-count").textContent(),"1 / 3");
    assert.equal(await page.locator("#echo-expedition-list li").count(),1);
    assert.match(await page.locator("#echo-expedition-list").textContent(),/cité enfouie/);
    assert.doesNotMatch(await page.locator("#echo-expedition-list").textContent(),/voix en avance|marque du retour/i);
    const earned=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return {valid:game.validateSave(state),ids:state.meta.echoFindings,turns:state.run.turns};
    });
    assert.equal(earned.valid,true);
    assert.deepEqual(earned.ids,["buried_city"]);
    assert.equal(earned.turns,1);
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#echo-expedition-count").textContent(),"1 / 3");
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      const after=game.recall(s).state;
      if(!game.validateSave(after))throw Error("NAR094 post-recall save invalid");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(after));
    });
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#refuge").isVisible(),true);
    assert.equal(await page.locator("#echo-refuge-count").textContent(),"1 / 3");
    await page.locator("#echo-dossier-refuge summary").tap();
    assert.match(await page.locator("#echo-refuge-list").textContent(),/cité enfouie/);
    assert.doesNotMatch(await page.locator("#echo-refuge-list").textContent(),/voix en avance|marque du retour/i);

    await page.locator("#start-btn").tap();
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const {revealAround}=await import("./exploration-visibility.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      const site=state.run.sites.find(s=>s.kind==="echo");
      state.run.enemies=[];
      const near=[[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>({x:site.x+dx,y:site.y+dy}))
        .find(p=>state.run.map[p.y]?.[p.x]==="."&&
          !state.run.traps.some(t=>t.x===p.x&&t.y===p.y));
      if(!near)throw Error("Second Echo inaccessible");
      state.run.x=near.x;state.run.y=near.y;revealAround(state.run);
      if(!game.validateSave(state))throw Error("NAR094 second run invalid");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();await page.locator("#title-continue").tap();
    await page.locator("#jump-action").tap();
    await page.locator('[data-room-choice="resonance"]').tap();
    assert.equal(await page.locator("#echo-expedition-count").textContent(),"2 / 3");
    assert.equal(await page.locator("#echo-expedition-list li").count(),2);
    const after=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return {valid:game.validateSave(s),ids:s.meta.echoFindings,turns:s.run.turns};
    });
    assert.equal(after.valid,true);
    assert.deepEqual(after.ids,["buried_city","early_voice"]);
    assert.equal(after.turns,1);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});
