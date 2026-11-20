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
    assert.equal(await page.locator("#exploration-map-panel").evaluate(el=>el.hidden),false,
      "Fog-safe known map is available in the original Menu node");
    await page.locator("#jump-menu").tap();
    assert.equal(await page.locator("#ui099-info-slot #exploration-map-panel").isVisible(),true);
    await page.locator("#ui092-sheet-close").tap();
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
    // GAME-095B1: new Android expeditions stop at the Arche for a fair
    // voluntary choice; the first tutorial and older saves still auto-extract.
    state=await saved();
    assert.equal(state.run.floorDepth,1);
    assert.equal(await page.locator("#floor-choice").isVisible(),true);
    await page.locator("#floor-extract").tap();
    state=await saved();
    assert.equal(state.run,null,"Voluntary return to Veyr through the ordinary Arche");
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
        // UI-099: combat targets and actions live only in the real drawer.
        if(await page.locator("#ui092-sheet").isHidden())
          await page.locator("#jump-combat").tap();
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
        if(await page.locator("#ui092-sheet").isVisible())
          await page.locator("#ui092-sheet-close").tap();
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
    assert.equal(await page.locator("#room-site-options button").count(),3);
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

test("GAME-101B mobile: visible fork clues and guarded cache survive Android reload", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    const start=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=game.newGame();s.meta.descents=1;
      const active=game.beginRun(s).state;
      if(!game.validateSave(active))throw Error("GAME-101B deep start invalid");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(active));
      return active.run.branchPlanVersion;
    });
    assert.equal(start,1);
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#game101-branch-hint").count(),1);
    const entry=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      const room=state.run.rooms.find(r=>r.slot===8);
      return state.run.doors.filter(d=>d.x>=room.x&&d.x<room.x+room.width&&
        d.y>=room.y&&d.y<room.y+room.height)
        .map(d=>game.inspectTile(state,d.x,d.y).description);
    });
    assert.equal(entry.length,2);
    assert.ok(entry.some(t=>/entailles/.test(t))&&
      entry.some(t=>/copeaux de métal/.test(t)),
      "each seen threshold explains a different route");
    assert.ok(entry.every(t=>!/Gardien déchu|rondache|\d+,\d+/.test(t)),
      "no hidden foe identity or item detail in environmental clue");
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const {revealAround}=await import("./exploration-visibility.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      const cache=state.run.sites.find(s=>s.kind==="cache");
      const p=[[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>({x:cache.x+dx,y:cache.y+dy}))
        .find(q=>state.run.map[q.y]?.[q.x]==="."&&
          !state.run.traps.some(t=>t.x===q.x&&t.y===q.y));
      if(!p)throw Error("GAME-101B cache has no safe adjacent floor");
      state.run.x=p.x;state.run.y=p.y;
      state.run.enemies=[]; // Interaction isolated from AI; combat is tested elsewhere.
      revealAround(state.run);
      if(!game.validateSave(state))throw Error("GAME-101B guarded cache fixture invalid");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#room-site-panel").isVisible(),true);
    assert.equal(await page.locator("#room-site-options button").count(),3);
    const button=page.locator('[data-room-choice="buckler"]');
    assert.equal(await button.isEnabled(),true);
    await button.tap();
    const earned=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return {valid:game.validateSave(state),turns:state.run.turns,
        carry:state.run.carried["shield.worn_buckler"],
        end:state.run.endurance,endMax:state.run.enduranceMax,
        site:state.run.sites.find(s=>s.kind==="cache")};
    });
    assert.equal(earned.valid,true);
    assert.equal(earned.turns,1);
    assert.equal(earned.carry,1);
    assert.equal(earned.end,earned.endMax-3);
    assert.equal(earned.site.status,"resolved");
    assert.equal(earned.site.choice,"buckler");
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#room-site-panel").isHidden(),true);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("DEV-088 mobile: report is fog-safe, costs no turn and persists after reload", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await preloadDeepRun(page);
    assert.equal(await page.locator("#expedition-report").isHidden(),true,
      "Report is intentionally not repeated below the map");
    const before=await page.locator("#turns").textContent();
    await page.locator("#jump-report").tap();
    assert.equal(await page.locator("#ui092-sheet-body #expedition-report").count(),1);
    assert.equal(await page.locator("#expedition-report").isVisible(),true);
    assert.equal(await page.locator("#expedition-report").evaluate(el=>el.open),true);
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
    assert.equal(await page.locator("#expedition-report").isHidden(),true);
    await page.locator("#jump-report").tap();
    assert.equal(await page.locator("#expedition-report").evaluate(el=>el.open),true);
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
    assert.equal(await page.locator("#expedition-report").isHidden(),true);
    const geometry=await page.evaluate(()=>({
      scroll:document.documentElement.scrollWidth,
      viewport:document.documentElement.clientWidth}));
    assert.ok(geometry.scroll<=geometry.viewport+1,
      "Variable networks must not overflow mobile portrait");
    await page.locator("#jump-report").tap();
    assert.equal(await page.locator("#expedition-report").evaluate(el=>el.open),true);
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
    await page.locator("#ui092-sheet-close").tap();
    await page.locator("#jump-bag").tap();
    await page.locator("#ui092-sheet-close").tap();
    // When there are no enemies Combat is unavailable and remains free.
    await page.locator("#jump-combat").tap();
    if(await page.locator("#ui092-sheet").isVisible())
      await page.locator("#ui092-sheet-close").tap();
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
    await page.locator("#jump-menu").tap();
    assert.equal(await page.locator("#ui099-extras").isVisible(),true);
    await page.locator("#map-legend-details summary").tap();
    assert.equal(await page.locator("#ascii-legend").isVisible(),true);
    await page.locator("#ui092-sheet-close").tap();
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
    assert.equal(await dock.isHidden(),true,"UI-099 stores visible threats in Combat, not in long page");
    assert.equal(await page.locator("#target-choices button").count(),1);
    await page.locator("#jump-combat").tap();
    assert.equal(await dock.isVisible(),true,"real Combat drawer reveals the original dock");
    const placement=await page.evaluate(()=>{
      const field=document.getElementById("field-controls").getBoundingClientRect();
      const dock=document.getElementById("ui092-sheet").getBoundingClientRect();
      const map=document.getElementById("tile-map").getBoundingClientRect();
      return {drawerAboveDock:dock.bottom<=field.top-5,
        mapAboveDock:map.bottom<=field.top+1,
        fixedAtBottom:Math.abs(field.bottom-window.innerHeight)<=2,
        width:document.documentElement.clientWidth,
        overflow:document.documentElement.scrollWidth};
    });
    assert.ok(placement.drawerAboveDock&&placement.mapAboveDock&&placement.fixedAtBottom,
      "UI-099: tactical drawer stays clear of the fixed movement dock");
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
    assert.equal(actionLayout.count,6);
    assert.equal(actionLayout.rows,2,"six actions use two rows on 360px Android");
    assert.ok(actionLayout.minHeight>=44,"action targets support touch");
    await page.locator("#combat-analysis summary").tap();
    assert.equal(await page.locator("#combat-target-profile").isVisible(),true);
    assert.equal(await page.locator("#turns").textContent(),"0");
    assert.equal(await page.locator("#ui092-sheet").isVisible(),true);
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


test("ART-091D / GAME-095A1 mobile: all inventory pictograms and three Veyr concepts stay compact", {timeout:60000}, async()=>{
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
    const iconCount=await page.evaluate(async()=> (await import("./veyr-art.js")).ITEM_ART_IDS.length);
    assert.equal(iconCount,11,"five existing items and six new Sprite C candidates");
    assert.equal(await page.locator("#stash-items .item-row").count(),iconCount);
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
    assert.equal(new Set(items.map(x=>x.svg)).size,iconCount);
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
    assert.ok(metrics.nav.top>=metrics.map.bottom,
      "UI-097A2 moves the original six actions beneath the live dungeon map");
    assert.ok(metrics.nav.bottom<=metrics.field.top+1,
      "Map-footer shortcuts must not be covered by the fixed movement dock");
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
    await page.locator("#ui092-sheet-close").tap();
    await page.locator("#jump-bag").tap();
    assert.equal(await mount.locator("#bag-panel").count(),1);
    assert.equal(await mount.locator("#interaction-dock").count(),0);
    assert.equal(await page.locator("#bag-panel").evaluate(e=>e.open),true);
    await page.locator("#ui092-sheet-close").tap();
    await page.locator("#jump-report").tap();
    assert.equal(await mount.locator("#expedition-report").count(),1);
    assert.equal(await page.locator("#expedition-report").evaluate(e=>e.open),true);
    await page.locator("#ui092-sheet-close").tap();
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
    assert.equal(await page.locator("#combat-dock").isHidden(),true);
    const mapCount=await page.locator("#tile-map .pixel-tile").count();
    await page.locator("#jump-combat").tap();
    assert.equal(await page.locator("#ui092-sheet-body #combat-dock").count(),1);
    await page.locator("#target-choices button").first().tap();
    assert.equal(await page.locator("#combat-panel").isVisible(),true);
    assert.equal(await page.locator("#turns").textContent(),"0");
    await page.locator("#combat-dodge").tap();
    assert.equal(await page.locator("#turns").textContent(),"1");
    assert.equal(await page.locator("#tile-map .pixel-tile").count(),mapCount);
    await page.locator("#ui092-sheet-close").tap();
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
        await page.locator("#ui092-sheet-close").tap();
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
    await page.locator("#ui092-sheet-close").tap();
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
      assert.ok(geometry.navTop>=geometry.mapBottom&&geometry.navBottom<=geometry.dockTop+1,
        "Map footer remains below the map and above the dock at "+width+": "+JSON.stringify(geometry));
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


// GAME-095A2: exercise the actual Android portrait preparation/bag controls.
test("GAME-095A2 mobile: quantity selection, chosen loadout, tactical swap and stamina", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=game.newGame();
      for(const id of ["weapon.bone_dagger","weapon.iron_mace",
        "shield.worn_buckler","armor.scavenged_cuirass",
        "consumable.vigor_salts"])s.meta.stash[id]=1;
      if(!game.validateSave(s))throw Error("Invalid A2 refuge fixture");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(s));
    });
    await page.reload();
    await page.locator("#title-continue").tap();
    const choose=async name=>{
      const row=page.locator("#stash-items .item-row").filter({hasText:name});
      await row.locator('input[type="checkbox"]').check();
      return row;
    };
    const bandage=await choose("Bandage");
    await bandage.locator("select.prep-quantity").selectOption("2");
    for(const name of ["Dague d'ossement","Masse ferrée",
      "Rondache usée","Cuirasse de récupération","Sels de vigueur"])
      await choose(name);
    assert.match(await page.locator("#prep-summary").innerText(),/7 \/ 8/);
    await page.locator("#prep-mainHand").selectOption("weapon.bone_dagger");
    await page.locator("#prep-offHand").selectOption("shield.worn_buckler");
    await page.locator("#prep-body").selectOption("armor.scavenged_cuirass");
    await page.locator("#start-btn").tap();
    let state=await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      return JSON.parse(localStorage.getItem(SAVE_KEY));
    });
    assert.equal(state.run.carried["consumable.bandage"],2);
    assert.equal(state.run.loadout.mainHand,"weapon.bone_dagger");
    assert.equal(state.run.loadout.offHand,"shield.worn_buckler");
    assert.equal(state.run.loadout.body,"armor.scavenged_cuirass");
    assert.equal(state.run.turns,0);

    // Remove unrelated monsters to isolate real bag buttons and saved turns.
    await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(SAVE_KEY));
      s.run.enemies=[];s.run.endurance=3;
      if(!validateSave(s))throw Error("Invalid A2 bag fixture");
      localStorage.setItem(SAVE_KEY,JSON.stringify(s));
    });
    await page.reload();
    await page.locator("#title-continue").tap();
    await page.locator("#jump-bag").tap();
    const mace=page.locator("#bag-items .item-row").filter({hasText:"Masse ferrée"});
    await mace.getByRole("button",{name:/Équiper/}).tap();
    state=await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      return JSON.parse(localStorage.getItem(SAVE_KEY));
    });
    assert.equal(state.run.loadout.mainHand,"weapon.iron_mace");
    assert.equal(state.run.turns,1);
    assert.equal(state.run.carried["weapon.bone_dagger"],1);

    // The contextual bag sheet may remain open after a saved action.
    const salts=page.locator("#bag-items .item-row").filter({hasText:"Sels de vigueur"});
    if(!(await salts.isVisible()))await page.locator("#jump-bag").tap();
    await salts.getByRole("button",{name:/Utiliser/}).tap();
    state=await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      return JSON.parse(localStorage.getItem(SAVE_KEY));
    });
    assert.equal(state.run.endurance,9);
    assert.equal(state.run.carried["consumable.vigor_salts"],undefined);
    assert.equal(state.run.turns,2);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


// GAME-095A3: the third deep chest awards real new loot in the existing
// tactile drawer, with an unchanged saved reward after restarting Chrome.
test("GAME-095A3 mobile: new deep equipment is awarded once and saved", {timeout:60000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    const fixture=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const loot=await import("./loot.js");
      const n=Array.from({length:80},(_,i)=>i+2).find(index=>
        loot.EQUIPMENT_LOOT_POOL.some(p=>p.id===loot.planDeepChestLoot(index).optional));
      if(!n)throw Error("No new equipment reward seed");
      const s=game.newGame();s.meta.descents=n-1;
      const state=game.beginRun(s).state;
      const [pos,id]=Object.entries(state.run.loot).find(([,reward])=>
        reward!=="relic.ashen_fragment"&&reward!=="consumable.bandage");
      const [x,y]=pos.split(",").map(Number);
      const neighbour=[[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>({x:x+dx,y:y+dy}))
        .find(p=>state.run.map[p.y]?.[p.x]===".");
      if(!neighbour)throw Error("No reachable optional chest");
      state.run.x=neighbour.x;state.run.y=neighbour.y;
      state.run.enemies=[];
      if(!game.validateSave(state))throw Error("Invalid A3 reward fixture");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
      return {x,y,id,pos,seed:state.run.rngState};
    });
    await page.reload();
    await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#expedition").isVisible(),true);
    if(!(await page.locator("#chest-action").isVisible()))
      await page.locator("#jump-action").tap();
    assert.equal(await page.locator("#chest-action").isEnabled(),true);
    await page.locator("#chest-action").tap();
    let state=await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      return JSON.parse(localStorage.getItem(SAVE_KEY));
    });
    assert.equal(state.run.carried[fixture.id],1);
    assert.equal(state.run.turns,1);
    assert.equal(state.run.rngState,fixture.seed);
    assert.ok(state.run.collected.includes(fixture.pos));
    await page.reload();
    await page.locator("#title-continue").tap();
    state=await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      return JSON.parse(localStorage.getItem(SAVE_KEY));
    });
    assert.equal(state.run.carried[fixture.id],1);
    assert.equal(state.run.turns,1);
    assert.equal(state.run.loot[fixture.pos],fixture.id);
    assert.equal(state.run.lootPlanVersion,1);
    await page.locator("#jump-bag").tap();
    assert.ok(await page.locator("#bag-items").getByText(
      await page.evaluate(async id=>(await import("./game.js")).ITEMS[id].name,fixture.id),
      {exact:true}).count()>0);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


// GAME-095B1: test the real Android controls, persisted depth and escape
// choice. Normal routing/geometry is covered by the deterministic engine tests.
test("GAME-095B1 mobile: explicit floor choice, resume and extraction", {timeout:65000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    page.on("dialog",dialog=>dialog.accept());
    await page.goto(origin);
    const entry=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=game.newGame();s.meta.descents=1;
      const run=game.beginRun(s,["weapon.rusty_sword"],null,{multiFloor:true}).state;
      const goal=run.run.exit;
      const path=[[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>({x:goal.x-dx,y:goal.y-dy,
          dir:dx===1?"right":dx===-1?"left":dy===1?"down":"up"}))
        .find(p=>run.run.map[p.y]?.[p.x]===".");
      if(!path)throw Error("No safe route into floor-1 Arche");
      run.run.x=path.x;run.run.y=path.y;
      run.run.hp=8;run.run.endurance=4;run.run.enemies=[];
      if(!game.validateSave(run))throw Error("Invalid initial multi-floor fixture");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(run));
      return {dir:path.dir};
    });
    await page.reload();
    await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#floor-depth").textContent(),"1 / 3");
    assert.equal(await page.locator("#floor-choice").isHidden(),true);
    await page.locator('[data-direction="'+entry.dir+'"]').tap();
    assert.equal(await page.locator("#floor-choice").isVisible(),true);
    assert.equal(await page.locator("#floor-extract").isEnabled(),true);
    assert.equal(await page.locator("#floor-descend").isEnabled(),true);
    const turn=Number(await page.locator("#turns").textContent());
    await page.locator("#floor-descend").tap();
    assert.equal(await page.locator("#floor-depth").textContent(),"2 / 3");
    assert.equal(await page.locator("#floor-choice").isHidden(),true);
    assert.equal(Number(await page.locator("#turns").textContent()),turn,
      "Choosing to continue doesn't add a second turn");

    let stored=await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      return JSON.parse(localStorage.getItem(SAVE_KEY));
    });
    assert.equal(stored.run.floorDepth,2);
    assert.equal(stored.run.hp,8);
    assert.equal(stored.run.endurance,5);
    assert.equal(stored.run.carried["weapon.rusty_sword"],1);
    assert.equal(stored.meta.bestDepth,2);
    const map=stored.run.map.join("");
    await page.reload();
    await page.locator("#title-continue").tap();
    stored=await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      return JSON.parse(localStorage.getItem(SAVE_KEY));
    });
    assert.equal(stored.run.floorDepth,2);
    assert.equal(stored.run.map.join(""),map);
    assert.equal(await page.locator("#floor-depth").textContent(),"2 / 3");

    const next=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      const goal=state.run.exit;
      const p=[[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>({x:goal.x-dx,y:goal.y-dy,
          dir:dx===1?"right":dx===-1?"left":dy===1?"down":"up"}))
        .find(p=>state.run.map[p.y]?.[p.x]===".");
      if(!p)throw Error("No exit approach on floor 2");
      state.run.x=p.x;state.run.y=p.y;state.run.enemies=[];
      if(!game.validateSave(state))throw Error("Invalid persisted floor-2 fixture");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
      return {dir:p.dir};
    });
    await page.reload();
    await page.locator("#title-continue").tap();
    await page.locator('[data-direction="'+next.dir+'"]').tap();
    await page.setViewportSize({width:320,height:720});
    assert.equal(await page.locator("#floor-choice").isVisible(),true);
    const metrics=await page.evaluate(()=>({
      client:document.documentElement.clientWidth,
      scroll:document.documentElement.scrollWidth
    }));
    assert.ok(metrics.scroll<=metrics.client+1,
      "Floor decision must fit a narrow 320px Android portrait");
    await page.locator("#floor-extract").tap();
    assert.equal(await page.locator("#refuge").isVisible(),true);
    assert.equal(await page.locator("#floor-choice").isHidden(),true);
    stored=await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      return JSON.parse(localStorage.getItem(SAVE_KEY));
    });
    assert.equal(stored.run,null);
    assert.equal(stored.meta.extractions,1);
    assert.equal(stored.meta.bestDepth,2);
    assert.equal(stored.meta.stash["weapon.rusty_sword"],1);
    assert.equal(await page.locator("#refuge-depth-record").isVisible(),true);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("GAME-095B2 mobile: depth risk forecast, balanced encounters and resume", {timeout:75000},async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    page.on("dialog",dialog=>dialog.accept());
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const state=game.newGame();state.meta.descents=1;
      const run=game.beginRun(state,["weapon.rusty_sword"],null,{multiFloor:true}).state;
      run.run.x=run.run.exit.x;run.run.y=run.run.exit.y;
      run.run.enemies=[];
      if(!game.validateSave(run))throw Error("B2 initial fixture rejected");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(run));
    });
    await page.reload();
    await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#floor-depth").textContent(),"1 / 3");
    assert.match(await page.locator("#floor-choice-description").textContent(),
      /Résonances de la Faille.*soins/);
    assert.equal(await page.locator("#floor-descend").isEnabled(),true);
    await page.locator("#floor-descend").tap();
    assert.equal(await page.locator("#floor-depth").textContent(),"2 / 3");
    const second=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(s),depth:s.run.floorDepth,version:s.run.depthBalanceVersion,
        enemies:s.run.enemies.map(e=>e.kind),
        reward:Object.values(s.run.loot).find(id=>
          id!=="relic.ashen_fragment"&&id!=="consumable.bandage"),
        rng:s.run.rngState,map:s.run.map.join("")};
    });
    assert.equal(second.valid,true);
    assert.equal(second.depth,2);
    assert.equal(second.version,1);
    assert.equal(second.enemies.filter(x=>x==="rift_larva").length,2);
    assert.ok(second.reward);
    await page.reload();
    await page.locator("#title-continue").tap();
    const replay=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(s),depth:s.run.floorDepth,version:s.run.depthBalanceVersion,
        enemies:s.run.enemies.map(e=>e.kind),
        reward:Object.values(s.run.loot).find(id=>
          id!=="relic.ashen_fragment"&&id!=="consumable.bandage"),
        rng:s.run.rngState,map:s.run.map.join("")};
    });
    assert.deepEqual(replay,second,"Reload cannot reroll enemy composition or loot");
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      s.run.x=s.run.exit.x;s.run.y=s.run.exit.y;s.run.enemies=[];
      if(!game.validateSave(s))throw Error("B2 second Arche fixture rejected");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(s));
    });
    await page.reload();
    await page.locator("#title-continue").tap();
    assert.match(await page.locator("#floor-choice-description").textContent(),
      /Veille de pierre.*équipements/);
    await page.locator("#floor-descend").tap();
    assert.equal(await page.locator("#floor-depth").textContent(),"3 / 3");
    const third=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(s),depth:s.run.floorDepth,
        version:s.run.depthBalanceVersion,
        guardians:s.run.enemies.filter(e=>e.kind==="guardian").length};
    });
    assert.deepEqual(third,{valid:true,depth:3,version:1,guardians:2});
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("GAME-095C1 Android portrait: visible charge warning, reload and sidestep", {timeout:70000},async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=game.beginRun(game.newGame(),["weapon.rusty_sword"]).state;
      s.run.x=1;s.run.y=7;
      s.run.enemies=[{id:"mobile-charge",kind:"charognard",
        x:3,y:7,hp:3,tactic:"stalking"}];
      if(!game.validateSave(s))throw Error("C1 mobile fixture invalid");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(s));
    });
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#expedition").isVisible(),true);
    assert.equal(await page.locator(".hostile-tile.enemy-charge").count(),0);
    await page.locator("#wait-btn").tap();
    assert.equal(await page.locator("#turns").textContent(),"1");
    assert.equal(await page.locator(".hostile-tile.enemy-charge").count(),1);
    // A real imminent charge must appear in the persistent map warning;
    // the detailed forecast lives in Combat rather than below the map.
    assert.equal(await page.locator("#ui096-threat-banner").isVisible(),true);
    await page.locator("#jump-combat").tap();
    assert.equal(await page.locator("#threat-forecast").isVisible(),true);
    assert.match(await page.locator("#threat-forecast").textContent(),
      /Charge imminente/);
    await page.locator("#ui092-sheet-close").tap();
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator(".hostile-tile.enemy-charge").count(),1);
    const during=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(s),state:s.run.enemies[0].tactic,
        hp:s.run.hp,seed:s.run.rngState,turns:s.run.turns};
    });
    assert.equal(during.valid,true);
    assert.equal(during.state,"winding");
    await page.locator('[data-direction="up"]').tap();
    assert.equal(await page.locator("#turns").textContent(),"2");
    assert.equal(await page.locator(".hostile-tile.enemy-charge").count(),0);
    await page.locator("#jump-combat").tap();
    assert.equal(await page.locator("#threat-forecast").isHidden(),true);
    if(await page.locator("#ui092-sheet").isVisible())
      await page.locator("#ui092-sheet-close").tap();
    const escaped=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(s),state:s.run.enemies[0].tactic,
        hp:s.run.hp,seed:s.run.rngState,turns:s.run.turns};
    });
    assert.deepEqual(escaped,{valid:true,state:"stalking",hp:during.hp,
      seed:during.seed,turns:2});
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("GAME-095C2 Android portrait: shove button, stamina and save persistence", {timeout:70000},async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",err=>errors.push(err.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=game.beginRun(game.newGame(),["weapon.rusty_sword"]).state;
      s.run.x=1;s.run.y=5;
      s.run.enemies=[{id:"c2-mobile",kind:"charognard",
        x:2,y:5,hp:3,tactic:"stalking"}];
      s.run.targetId="c2-mobile";
      if(!game.validateSave(s))throw Error("Invalid C2 mobile fixture");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(s));
    });
    await page.reload();
    await page.locator("#title-continue").tap();
    await page.locator("#jump-combat").tap();
    assert.equal(await page.locator("#combat-shove").isVisible(),true);
    assert.equal(await page.locator("#combat-shove").isEnabled(),true);
    assert.match(await page.locator("#combat-shove-hint").textContent(),
      /aucun dégât en terrain normal/);
    const first=await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {hp:s.run.hp,turns:s.run.turns,end:s.run.endurance,
        rng:s.run.rngState};
    });
    await page.locator("#combat-shove").tap();
    const after=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return {valid:game.validateSave(s),hp:s.run.hp,turns:s.run.turns,
        end:s.run.endurance,rng:s.run.rngState,
        x:s.run.enemies[0].x,y:s.run.enemies[0].y};
    });
    assert.equal(after.valid,true);
    assert.equal(after.hp,first.hp);
    assert.equal(after.turns,first.turns+1);
    assert.equal(after.end,first.end-3);
    assert.equal(after.rng,first.rng);
    assert.deepEqual([after.x,after.y],[3,5]);
    assert.equal(await page.locator("#combat-shove").isEnabled(),false);
    await page.reload();
    await page.locator("#title-continue").tap();
    const persisted=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return {valid:game.validateSave(s),hp:s.run.hp,turns:s.run.turns,
        end:s.run.endurance,rng:s.run.rngState,
        x:s.run.enemies[0].x,y:s.run.enemies[0].y};
    });
    assert.deepEqual(persisted,after);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("GAME-095D2 Android portrait: one-turn chest exchange never reveals mystery reward early", {timeout:75000},async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    page.on("dialog",d=>d.accept());
    await page.goto(origin);
    const chest=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const base=game.newGame();base.meta.descents=1;
      const s=game.beginRun(base,["weapon.rusty_sword"],null,{multiFloor:true}).state;
      const [key,reward]=Object.entries(s.run.loot)
        .find(([,id])=>id==="consumable.bandage");
      const [x,y]=key.split(",").map(Number);
      const point=[[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>({x:x+dx,y:y+dy}))
        .find(p=>s.run.map[p.y]?.[p.x]==="."&&
          !(s.run.traps||[]).some(t=>t.x===p.x&&t.y===p.y));
      if(!point)throw Error("No reachable chest neighbor");
      s.run.enemies=[];
      s.run.x=point.x;s.run.y=point.y;
      s.run.carried={
        "weapon.rusty_sword":1,"weapon.iron_mace":1,
        "consumable.bandage":2,"consumable.dusk_tonic":1,
        "consumable.vigor_salts":1,"armor.scavenged_cuirass":1,
        "relic.ashen_fragment":1
      };
      if(!game.validateSave(s)||game.inventoryCount(s)!==8)
        throw Error("Invalid D2 full-bag mobile fixture");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(s));
      return {key,reward};
    });
    await page.reload();
    await page.locator("#title-continue").tap();
    await page.locator("#jump-action").tap();
    assert.equal(await page.locator("#chest-swap-panel").isVisible(),true);
    assert.equal(await page.locator("#chest-action").isDisabled(),true);
    assert.equal(await page.locator("#chest-swap-action").isEnabled(),true);
    assert.equal(await page.locator("#chest-swap-item option[value='weapon.rusty_sword']").count(),0);
    assert.doesNotMatch(await page.locator("#chest-swap-panel").textContent(),
      /Contenu :.*Bandage/,"unknown chest reward must not appear in the preview");
    await page.locator("#chest-swap-item").selectOption("weapon.iron_mace");
    const prior=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return {turns:s.run.turns,seed:s.run.rngState,end:s.run.endurance};
    });
    await page.locator("#chest-swap-action").tap();
    const after=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return {valid:game.validateSave(s),count:game.inventoryCount(s),
        turns:s.run.turns,seed:s.run.rngState,
        iron:s.run.carried["weapon.iron_mace"]||0,
        bandages:s.run.carried["consumable.bandage"],
        opened:s.run.collected};
    });
    assert.equal(after.valid,true);
    assert.equal(after.count,8);
    assert.equal(after.turns,prior.turns+1);
    assert.equal(after.seed,prior.seed);
    assert.equal(after.iron,0);
    assert.equal(after.bandages,3);
    assert.deepEqual(after.opened,[chest.key]);
    await page.reload();
    await page.locator("#title-continue").tap();
    const saved=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return {valid:game.validateSave(s),count:game.inventoryCount(s),
        turns:s.run.turns,seed:s.run.rngState,
        iron:s.run.carried["weapon.iron_mace"]||0,
        bandages:s.run.carried["consumable.bandage"],
        opened:s.run.collected};
    });
    assert.deepEqual(saved,after,"exchanged reward survives reload without reroll");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("UI-096B mobile: 320/360/393px keep the map clear of the dock and real actions reachable", {timeout:110000}, async()=>{
  for(const viewport of [{width:320,height:640},{width:360,height:780},{width:393,height:704}]){
    const context=await browser.newContext({
      viewport,deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:"block"
    });
    try{
      const page=await context.newPage(),errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      await preloadDeepRun(page);
      assert.equal(await page.locator("#ui096-threat-banner").isHidden(),true,
        "A deserted visible map must not show a fabricated threat");
      const metrics=await page.evaluate(()=>{
        const box=id=>document.getElementById(id).getBoundingClientRect();
        const m=box("tile-map"),dock=box("field-controls");
        return {map:m.toJSON(),dock:dock.toJSON(),
          viewport:window.innerHeight,
          clientWidth:document.documentElement.clientWidth,
          pageWidth:document.documentElement.scrollWidth,
          shortcuts:[...document.querySelectorAll("#expedition-shortcuts button")]
            .map(el=>({id:el.id,height:el.getBoundingClientRect().height})),
          stylesheets:[...document.styleSheets].map(s=>s.href||""),
          saveKey:localStorage.getItem("rogov-web-v1")!==null};
      });
      assert.ok(metrics.pageWidth<=metrics.clientWidth+1,
        "No sideways scroll at "+JSON.stringify(viewport)+": "+JSON.stringify(metrics));
      assert.ok(metrics.map.bottom<=metrics.dock.top+1,
        "Map cannot hide under bottom dock at "+JSON.stringify(viewport)+": "+JSON.stringify(metrics));
      assert.ok(metrics.map.height>=175,
        "11x11 map still readable at "+JSON.stringify(viewport));
      assert.equal(metrics.shortcuts.length,6);
      assert.ok(metrics.shortcuts.every(s=>s.height>=44),
        "All six existing navigation hit targets remain >=44 px");
      assert.ok(metrics.stylesheets.some(href=>href.includes("ui096.css?v=1")),
        "UI-096B stylesheet must really load");
      assert.equal(metrics.saveKey,true);
      const before=Number(await page.locator("#turns").textContent());
      await page.locator("#wait-btn").tap();
      assert.equal(await page.locator("#turns").textContent(),String(before+1));
      await page.locator("#renderer-toggle").tap();
      assert.equal(await page.locator("#dungeon-map").isVisible(),true,
        "ASCII renderer remains usable in portrait");
      await page.reload();await page.locator("#title-continue").tap();
      assert.equal(await page.locator("#turns").textContent(),String(before+1));
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test("UI-096B mobile: visible enemies show pressure, unseen ones cannot leak via HUD", {timeout:40000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const fog=await import("./exploration-visibility.js");
      const state=game.newGame();state.meta.descents=1;
      const run=game.beginRun(state).state;
      const enemy=run.run.enemies[0];
      const adjacent=[[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>({x:enemy.x+dx,y:enemy.y+dy}))
        .find(p=>run.run.map[p.y]?.[p.x]==="." &&
          !run.run.enemies.some(e=>e.x===p.x&&e.y===p.y));
      if(!adjacent)throw Error("Missing safe adjacent space");
      run.run.x=adjacent.x;run.run.y=adjacent.y;
      run.run.enemies=[enemy];fog.revealAround(run.run);
      if(!game.validateSave(run))throw Error("Invalid focus save");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(run));
    });
    await page.reload();await page.locator("#title-continue").tap();
    const imminent=await page.locator("#threat-forecast").evaluate(el=>!el.hidden);
    assert.equal(await page.locator("#ui096-threat-banner").isVisible(),imminent,
      "Threat banner follows existing engine forecast, even when Combat drawer is closed");
    assert.match(await page.locator("#threat-state").textContent(),/HOSTILE/);
    const turns=await page.locator("#turns").textContent();
    await page.locator("#jump-combat").tap();
    assert.equal(await page.locator("#ui092-sheet").isVisible(),true);
    assert.equal(await page.locator("#turns").textContent(),turns,
      "Warning and opening combat panel cost no turn");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("ART-096A mobile: Sprite C stone and door states render at 24px without fog leaks", {timeout:50000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    const {door}=await preloadDeepRun(page,true);
    const assets=await page.evaluate(()=>{
      const cells=[...document.querySelectorAll("#tile-map .pixel-tile")];
      const known=cells.filter(el=>el.dataset.knowledge==="visible");
      const backgrounds=known.map(el=>el.style.backgroundImage);
      const unknown=cells.filter(el=>el.dataset.knowledge==="unknown");
      return {
        count:cells.length,known:known.length,unknown:unknown.length,
        floor:backgrounds.some(url=>url.includes("worn-floor-slabs")),
        wall:backgrounds.some(url=>url.includes("raised-stone-ledge")),
        unknownEmpty:unknown.every(el=>!el.querySelector("img")&&!el.style.backgroundImage)
      };
    });
    assert.equal(assets.count,121);
    assert.ok(assets.known>0);
    assert.ok(assets.floor,"Worn stone is rendered by the real map");
    assert.ok(assets.wall,"Raised masonry is rendered by the real map");
    assert.equal(assets.unknownEmpty,true,"Unknown fog cells have no graphic asset");
    const doorCell=page.locator('#tile-map .pixel-tile[data-x="'+door.x+'"][data-y="'+door.y+'"]');
    let src=await doorCell.locator("img").getAttribute("src");
    assert.match(decodeURIComponent(src),/arch-keystone/);
    const size=await doorCell.locator("img").evaluate(async img=>{
      await img.decode();return {width:img.naturalWidth,height:img.naturalHeight};
    });
    assert.deepEqual(size,{width:24,height:24});
    const before=Number(await page.locator("#turns").textContent());
    await doorCell.tap();
    assert.equal(await page.locator("#turns").textContent(),String(before),
      "Examining enhanced art is free");
    await page.locator("#door-action").tap();
    assert.equal(await page.locator("#turns").textContent(),String(before+1));
    src=await doorCell.locator("img").getAttribute("src");
    assert.match(decodeURIComponent(src),/opaque-door-lock/);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("ART-096B mobile: only currently visible foes expose their true intent on the map", {timeout:65000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const fog=await import("./exploration-visibility.js");
      const hero=game.newGame();hero.meta.descents=1;
      const saved=game.beginRun(hero).state,run=saved.run;
      const guardian=run.enemies.find(e=>e.kind==="guardian");
      const charognard=run.enemies.find(e=>e.kind==="charognard");
      if(!guardian||!charognard)throw Error("Guardian and Charognard missing");
      const adjacent=[[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>({x:guardian.x+dx,y:guardian.y+dy}))
        .find(p=>run.map[p.y]?.[p.x]==="." &&
          !run.enemies.some(e=>e.x===p.x&&e.y===p.y));
      if(!adjacent)throw Error("No accessible Guardian approach");
      run.x=adjacent.x;run.y=adjacent.y;
      const far=run.map.flatMap((row,y)=>[...row].map((tile,x)=>
        tile==="."&&Math.abs(x-run.x)+Math.abs(y-run.y)>14?{x,y}:null))
        .find(Boolean);
      if(!far)throw Error("No distant hidden hostile cell");
      guardian.tactic="winding";
      run.enemies=[guardian,{...charognard,id:"art096b-hidden-charognard",...far}];
      fog.revealAround(run);
      if(!game.validateSave(saved))throw Error("Invalid tactical artwork fixture");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(saved));
    });
    await page.reload();await page.locator("#title-continue").tap();
    const cell=page.locator("#tile-map .tile-guardian");
    assert.equal(await cell.count(),1);
    assert.equal(await cell.getAttribute("data-intent"),"guardian_heavy");
    assert.equal(await cell.locator(".tile-intent-marker").textContent(),"!");
    assert.equal(await cell.locator(".tile-intent-marker").getAttribute("aria-hidden"),"true");
    assert.match(await cell.getAttribute("title"),/Coup lourd imminent/);
    assert.equal(await page.locator('[data-enemy-id="art096b-hidden-charognard"]').count(),0,
      "Unseen enemy is never rendered or forecast in the DOM");
    assert.equal(await page.locator("#ui096-threat-banner").isVisible(),true);
    const before=await page.locator("#turns").textContent();
    await cell.tap();
    assert.equal(await page.locator("#turns").textContent(),before,
      "Target selection remains an informational tap");
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      state.run.enemies.find(e=>e.kind==="guardian").tactic="ready";
      if(!game.validateSave(state))throw Error("Invalid ready guardian");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#tile-map .tile-guardian").getAttribute("data-intent"),
      "guardian_prepare");
    assert.equal(await page.locator("#tile-map .tile-guardian .tile-intent-marker").textContent(),"…");
    assert.equal(await page.locator("#turns").textContent(),before);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("ART-096B mobile: trap states use authentic pixel sprites without changing turns", {timeout:65000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js"),fog=await import("./exploration-visibility.js");
      const hero=game.newGame();hero.meta.descents=1;
      const state=game.beginRun(hero).state,run=state.run;
      const trap=run.traps[0];
      if(!trap)throw Error("No generated trap");
      run.enemies=[];
      run.x=trap.clue.x;run.y=trap.clue.y;
      trap.status="revealed";
      fog.revealAround(run);
      if(!game.validateSave(state))throw Error("Invalid trap fixture");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();await page.locator("#title-continue").tap();
    const current=()=>page.locator("#tile-map .tile-trap_revealed");
    assert.equal(await current().count(),1);
    const armed=await current().locator("img").getAttribute("src");
    assert.match(decodeURIComponent(armed),/armed-trap-fangs/);
    const bounds=await current().locator("img").evaluate(async img=>{
      await img.decode();return [img.naturalWidth,img.naturalHeight];
    });
    assert.deepEqual(bounds,[24,24]);
    const before=await page.locator("#turns").textContent();
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      state.run.traps[0].status="disabled";
      if(!game.validateSave(state))throw Error("Invalid disabled trap");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();await page.locator("#title-continue").tap();
    const disabled=page.locator("#tile-map .tile-trap_disabled");
    assert.equal(await disabled.count(),1);
    assert.match(decodeURIComponent(await disabled.locator("img").getAttribute("src")),
      /disarmed-trap-lockout/);
    assert.equal(await page.locator("#turns").textContent(),before);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("UI-096C mobile: refuge navigation, secured stash, real shared character and fixed launch on three portraits", {timeout:125000}, async()=>{
  for(const viewport of [{width:320,height:640},{width:360,height:780},{width:393,height:704}]){
    const context=await browser.newContext({
      viewport,deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:"block"
    });
    try{
      const page=await context.newPage(),errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      await page.goto(origin);
      await page.evaluate(async()=>{
        const game=await import("./game.js"),state=game.newGame();
        if(!game.validateSave(state))throw Error("Invalid refuge fixture");
        localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
      });
      await page.reload();
      await page.locator("#title-continue").tap();
      assert.equal(await page.locator("#refuge").isVisible(),true);
      assert.equal(await page.locator("#game-shell").evaluate(e=>e.classList.contains("is-refuge")),true);
      assert.equal(await page.locator("#refuge-character-slot #actor-stats-sheet").count(),1);
      assert.equal(await page.locator("#actor-stats-sheet .actor-stat-chip").count(),6);
      assert.equal(await page.locator("#expedition #actor-stats-sheet").count(),0);
      const initial=await page.evaluate(()=>localStorage.getItem("rogov-web-v1"));
      const nav=page.locator("#refuge-quick-nav button");
      assert.equal(await nav.count(),4);
      const metrics=await page.evaluate(()=>{
        const box=id=>document.getElementById(id).getBoundingClientRect();
        const launch=box("start-btn"),banner=box("refuge-prep-meter");
        return {vw:document.documentElement.clientWidth,full:document.documentElement.scrollWidth,
          launch:launch.toJSON(),banner:banner.toJSON(),
          viewportH:window.innerHeight,
          tapSizes:[...document.querySelectorAll("#refuge-quick-nav button")].map(b=>b.getBoundingClientRect().height),
          imageLoaded:getComputedStyle(document.querySelector(".refuge-banner")).backgroundImage.includes("veyr-refuge-banner.svg")};
      });
      assert.ok(metrics.full<=metrics.vw+1,"Refuge cannot scroll sideways: "+JSON.stringify(viewport));
      assert.ok(metrics.tapSizes.every(height=>height>=44),"Refuge buttons need >=44 CSS px");
      assert.ok(metrics.launch.y>=0 && metrics.launch.bottom<=metrics.viewportH+1,
        "Start stays in the safe viewport");
      assert.ok(metrics.banner.height>0,"Real preparation capacity is displayed");
      assert.equal(metrics.imageLoaded,true,"Veyr panorama is the original local art");
      await page.locator('[data-refuge-go="character"]').tap();
      assert.equal(await page.locator("#actor-stats-sheet").evaluate(e=>e.open),true);
      await page.locator('[data-refuge-go="echoes"]').tap();
      assert.equal(await page.locator("#echo-dossier-refuge").evaluate(e=>e.open),true);
      await page.locator('[data-refuge-go="prepare"]').tap();
      assert.equal(await page.evaluate(()=>localStorage.getItem("rogov-web-v1")),initial,
        "Navigation and reading a sheet must never change the save");
      const choice=page.locator('#stash-items input[type="checkbox"]').first();
      await choice.check();
      assert.match(await page.locator("#prep-summary").textContent(),/1 \/ 8/);
      assert.equal(await page.locator("#refuge-prep-meter").evaluate(e=>e.value),1);
      assert.equal(await page.locator("#start-btn").isEnabled(),true);
      await page.locator("#start-btn").tap();
      assert.equal(await page.locator("#expedition").isVisible(),true);
      assert.equal(await page.locator("#game-shell").evaluate(e=>e.classList.contains("is-refuge")),false);
      assert.equal(await page.locator("#options-panel #actor-stats-sheet").count(),1,
        "UI-099 keeps the original character panel within the mobile Menu");
      assert.equal(await page.locator("#refuge-character-slot #actor-stats-sheet").count(),0);
      assert.equal(await page.locator("#actor-stats-sheet .actor-stat-chip").count(),6);
      const restored=await page.evaluate(async()=>{
        const game=await import("./game.js"),saved=JSON.parse(localStorage.getItem(game.SAVE_KEY));
        return {valid:game.validateSave(saved),turns:saved.run?.turns,
          count:game.inventoryCount(saved)};
      });
      assert.equal(restored.valid,true);
      assert.equal(restored.turns,0);
      assert.equal(restored.count,1);
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test("UI-096C mobile: actual forge recipe updates secured resources without touching turns", {timeout:50000}, async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js"),state=game.newGame();
      state.meta.stash["relic.ashen_fragment"]=2;
      if(!game.validateSave(state))throw Error("Invalid forge fixture");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();await page.locator("#title-continue").tap();
    assert.match(await page.locator("#forge-fragments").textContent(),/2 Fragments/);
    await page.locator('[data-refuge-go="forge"]').tap();
    const before=await page.evaluate(()=>{
      const saved=JSON.parse(localStorage.getItem("rogov-web-v1"));
      return {fragments:saved.meta.stash["relic.ashen_fragment"],
        bandages:saved.meta.stash["consumable.bandage"]||0};
    });
    await page.locator("#forge-bandages").tap();
    const after=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const saved=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return {fragments:saved.meta.stash["relic.ashen_fragment"]||0,
        bandages:saved.meta.stash["consumable.bandage"]||0,
        valid:game.validateSave(saved),run:saved.run};
    });
    assert.equal(after.fragments,before.fragments-1);
    assert.equal(after.bandages,before.bandages+2);
    assert.equal(after.valid,true);
    assert.equal(after.run,null);
    assert.match(await page.locator("#forge-fragments").textContent(),/1 Fragment/);
    assert.equal(await page.locator("#refuge-character-slot #actor-stats-sheet").count(),1);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("QA-096 mobile: visual evidence, contrast and hit-area measurements on three Android portraits", {timeout:145000}, async()=>{
  // CI provides six genuine Chromium screenshots, not photographs of a physical Android.
  const {mkdir,writeFile}=await import("node:fs/promises");
  const folder="qa096-screenshots";
  await mkdir(folder,{recursive:true});
  const observations=[];
  for(const viewport of [{width:320,height:640},{width:360,height:780},{width:393,height:704}]){
    const label=viewport.width+"x"+viewport.height;
    const context=await browser.newContext({
      viewport,deviceScaleFactor:3,isMobile:true,hasTouch:true,
      reducedMotion:"reduce",serviceWorkers:"block"
    });
    try{
      const page=await context.newPage(),errors=[];
      page.on("pageerror",err=>errors.push(err.message));
      await page.goto(origin);
      await page.evaluate(async()=>{
        const game=await import("./game.js");
        const state=game.newGame();
        if(!game.validateSave(state))throw Error("Invalid QA-096 refuge state");
        localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
      });
      await page.reload();
      await page.locator("#title-continue").tap();
      await page.locator("#refuge").waitFor({state:"visible"});
      await page.screenshot({path:folder+"/qa096-veyr-"+label+".png",animations:"disabled"});
      const refuge=await page.evaluate(()=>{
        const rect=id=>document.getElementById(id).getBoundingClientRect();
        const box=rect("start-btn");
        const nav=[...document.querySelectorAll("#refuge-quick-nav button")]
          .map(n=>n.getBoundingClientRect().height);
        const rgb=(s)=>(s.match(/\d+(?:\.\d+)?/g)||[]).slice(0,3).map(Number);
        const lum=(s)=>{
          const c=rgb(s).map(n=>{
            const v=n/255;
            return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
          });
          return c[0]*.2126+c[1]*.7152+c[2]*.0722;
        };
        const contrast=(fg,bg)=>{
          const a=lum(getComputedStyle(document.querySelector(fg)).color);
          const b=lum(getComputedStyle(document.querySelector(bg)).backgroundColor);
          return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
        };
        return {
          viewportHeight:innerHeight,clientWidth:document.documentElement.clientWidth,
          scrollWidth:document.documentElement.scrollWidth,
          launch:{top:box.top,bottom:box.bottom,height:box.height},
          nav,characterNodes:document.querySelectorAll("#actor-stats-sheet").length,
          contrasts:{
            launch:contrast("#start-btn","#start-btn"),
            safeLabel:contrast(".refuge-secured-label",".refuge-secured-label"),
            mission:contrast("#mission-refuge-text","#mission-refuge")
          }
        };
      });
      assert.ok(refuge.scrollWidth<=refuge.clientWidth+1,
        "QA-096 Veyr horizontal overflow at "+label+": "+JSON.stringify(refuge));
      assert.ok(refuge.launch.top>=0&&refuge.launch.bottom<=refuge.viewportHeight+1,
        "QA-096 Veyr departure CTA not usable at "+label);
      assert.ok(refuge.nav.length===4&&refuge.nav.every(h=>h>=44),
        "QA-096 Veyr four touch shortcuts must be at least 44 CSS px at "+label);
      assert.equal(refuge.characterNodes,1,"QA-096 single character sheet");
      assert.ok(Object.values(refuge.contrasts).every(c=>c>=4.5),
        "QA-096 solid-background text should reach contrast 4.5:1 at "+label);

      await preloadDeepRun(page);
      await page.screenshot({path:folder+"/qa096-nhal-"+label+".png",animations:"disabled"});
      const nhal=await page.evaluate(async()=>{
        const map=document.getElementById("tile-map").getBoundingClientRect();
        const dock=document.getElementById("field-controls").getBoundingClientRect();
        const hero=document.querySelector("#tile-map .tile-hero");
        const sprite=hero?.querySelector("img");
        if(sprite)await sprite.decode();
        const tiles=[...document.querySelectorAll("#tile-map .pixel-tile")];
        const tap=id=>document.getElementById(id).getBoundingClientRect().height;
        const nav=[...document.querySelectorAll("#expedition-shortcuts button")]
          .map(n=>n.getBoundingClientRect().height);
        return {
          clientWidth:document.documentElement.clientWidth,
          scrollWidth:document.documentElement.scrollWidth,
          viewportHeight:innerHeight,
          map:{left:map.left,right:map.right,top:map.top,bottom:map.bottom,
            width:map.width,height:map.height},
          dock:{top:dock.top,bottom:dock.bottom},
          tileCount:tiles.length,tileWidth:tiles[0]?.getBoundingClientRect().width,
          heroCount:document.querySelectorAll("#tile-map .tile-hero").length,
          nativeHero:sprite?[sprite.naturalWidth,sprite.naturalHeight]:null,
          shortcuts:nav,
          controls:["wait-btn","use-bandage","use-tonic"].map(tap),
          moveButtons:[...document.querySelectorAll("#field-controls .dpad button")]
            .filter(n=>getComputedStyle(n).display!=="none")
            .map(n=>n.getBoundingClientRect().height)
        };
      });
      assert.ok(nhal.scrollWidth<=nhal.clientWidth+1,
        "QA-096 Nhal horizontal overflow at "+label+": "+JSON.stringify(nhal));
      assert.ok(nhal.map.left>=-1&&nhal.map.right<=nhal.clientWidth+1,
        "QA-096 map must fit screen at "+label);
      assert.ok(nhal.map.bottom<=nhal.dock.top+1,
        "QA-096 map must not overlap fixed dock at "+label);
      assert.equal(nhal.tileCount,121,"QA-096 deep-map viewport 11x11");
      assert.ok(nhal.tileWidth>=16,"QA-096 legible minimum map cell width at "+label);
      assert.equal(nhal.heroCount,1);
      assert.deepEqual(nhal.nativeHero,[24,24],"QA-096 original 24px Sprite C");
      assert.ok(nhal.shortcuts.length===6&&nhal.shortcuts.every(h=>h>=44),
        "QA-096 six tactically neutral shortcuts must be reachable at "+label);
      assert.ok([...nhal.moveButtons,...nhal.controls].every(h=>h>=44),
        "QA-096 critical movement, wait and healing targets >=44px at "+label);
      assert.deepEqual(errors,[],"QA-096 no browser script errors at "+label);
      observations.push({viewport:label,refuge,nhal});
    }finally{await context.close();}
  }
  await writeFile(folder+"/report.json",JSON.stringify({
    source:"Chromium emulation only — not physical Android user QA",
    measurements:observations
  },null,2)+"\n");
});


test("UI-096D mobile: short screens recover dungeon pixels and keep the fixed controls", {timeout:115000}, async()=>{
  for(const viewport of [{width:320,height:640,minMap:214},{width:393,height:704,minMap:276}]){
    const context=await browser.newContext({
      viewport:{width:viewport.width,height:viewport.height},
      deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:"block"
    });
    try{
      const page=await context.newPage(),errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      await preloadDeepRun(page);
      const v=await page.evaluate(()=>{
        const map=document.getElementById("tile-map").getBoundingClientRect();
        const dock=document.getElementById("field-controls").getBoundingClientRect();
        return {
          mapWidth:map.width,mapBottom:map.bottom,dockTop:dock.top,
          scrollWidth:document.documentElement.scrollWidth,
          clientWidth:document.documentElement.clientWidth,
          controls:[...document.querySelectorAll("#field-controls button")]
            .filter(n=>getComputedStyle(n).display!=="none")
            .map(n=>n.getBoundingClientRect().height),
          stylesheet:[...document.styleSheets].some(s=>s.href?.includes("ui096d.css?v=1"))
        };
      });
      assert.equal(v.stylesheet,true);
      assert.ok(v.mapWidth>=viewport.minMap,
        "QA-096D must recover pixels at "+viewport.width+"x"+viewport.height+": "+JSON.stringify(v));
      assert.ok(v.mapBottom<=v.dockTop+1,"Larger map must not hide under movement dock");
      assert.ok(v.scrollWidth<=v.clientWidth+1,"No sideways scroll");
      assert.ok(v.controls.every(h=>h>=44),"All critical buttons stay touch-accessible");
      assert.equal(await page.locator("#ui096-threat-banner").isHidden(),true);
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test("UI-096D mobile: urgent warnings still fit above the dock without fog leaks", {timeout:60000}, async()=>{
  const context=await browser.newContext({
    viewport:{width:393,height:704},deviceScaleFactor:3,
    isMobile:true,hasTouch:true,serviceWorkers:"block"
  });
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const fog=await import("./exploration-visibility.js");
      const hero=game.newGame();hero.meta.descents=1;
      const s=game.beginRun(hero).state,run=s.run;
      const guardian=run.enemies.find(e=>e.kind==="guardian");
      if(!guardian)throw Error("No guardian for UI-096D visual alert test");
      const adjacent=[[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>({x:guardian.x+dx,y:guardian.y+dy}))
        .find(p=>run.map[p.y]?.[p.x]==="." &&
          !run.enemies.some(e=>e.x===p.x&&e.y===p.y));
      if(!adjacent)throw Error("No safe adjacent tile");
      run.x=adjacent.x;run.y=adjacent.y;guardian.tactic="winding";
      run.enemies=[guardian];fog.revealAround(run);
      if(!game.validateSave(s))throw Error("Invalid UI-096D urgent fixture");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(s));
    });
    await page.reload();await page.locator("#title-continue").tap();
    const banner=page.locator("#ui096-threat-banner");
    assert.equal(await banner.isVisible(),true);
    assert.equal(await banner.getAttribute("data-urgent"),"true");
    const g=await page.evaluate(()=>{
      const rect=id=>document.getElementById(id).getBoundingClientRect();
      return {map:rect("tile-map").toJSON(),dock:rect("field-controls").toJSON(),
        scrollWidth:document.documentElement.scrollWidth,
        width:document.documentElement.clientWidth};
    });
    assert.ok(g.map.bottom<=g.dock.top+1,
      "Even an imminent forecast cannot cover the map: "+JSON.stringify(g));
    assert.ok(g.scrollWidth<=g.width+1);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("UI-096D mobile: Veyr keeps its real controls above an unchanged safe launch", {timeout:70000}, async()=>{
  for(const viewport of [{width:360,height:780},{width:393,height:704}]){
    const context=await browser.newContext({
      viewport,deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:"block"
    });
    try{
      const page=await context.newPage(),errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      await page.goto(origin);
      await page.evaluate(async()=>{
        const game=await import("./game.js");
        localStorage.setItem(game.SAVE_KEY,JSON.stringify(game.newGame()));
      });
      await page.reload();await page.locator("#title-continue").tap();
      const g=await page.evaluate(()=>{
        const b=id=>document.getElementById(id).getBoundingClientRect();
        const nav=b("refuge-quick-nav"),cta=b("start-btn"),progress=b("refuge-prep-meter");
        const stats=[...document.querySelectorAll(".hero-bar .stat")]
          .filter(n=>getComputedStyle(n).display!=="none");
        return {navTop:nav.top,navBottom:nav.bottom,ctaTop:cta.top,ctaBottom:cta.bottom,
          vh:innerHeight,progressHeight:progress.height,stats:stats.length,
          scrollWidth:document.documentElement.scrollWidth,
          width:document.documentElement.clientWidth};
      });
      assert.ok(g.navTop<g.ctaTop,
        "Veyr shortcuts should arrive sooner than the fixed departure CTA: "+JSON.stringify(g));
      assert.ok(g.ctaBottom<=g.vh+1);
      assert.equal(g.stats,3,"Single-row progression keeps level/XP/runs");
      assert.equal(g.progressHeight>0,true);
      assert.ok(g.scrollWidth<=g.width+1);
      assert.equal(await page.locator("#actor-stats-sheet").count(),1);
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});


test("UI-097A1 mobile: branded cockpit keeps real HUD, map and touch controls usable", {timeout:95000}, async()=>{
  for(const viewport of [{width:320,height:640},{width:360,height:780},{width:393,height:704}]){
    const context=await browser.newContext({
      viewport,deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:"block",
      reducedMotion:"reduce"
    });
    try{
      const page=await context.newPage(),errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      await preloadDeepRun(page);
      const ui=await page.evaluate(()=>{
        const box=id=>document.getElementById(id).getBoundingClientRect();
        const header=document.querySelector("#expedition>.section-head");
        const brand=document.querySelector("#expedition .ui097-brand");
        const health=box("health-meter"),endurance=box("endurance-meter");
        return {
          cssLoaded:[...document.styleSheets].some(s=>s.href?.includes("ui097a.css?v=1")),
          brand:brand?.textContent.trim(),
          brandDisplay:brand?getComputedStyle(brand).display:"missing",
          headerImage:getComputedStyle(header).backgroundImage,
          header:header.getBoundingClientRect().toJSON(),
          menu:box("jump-menu").toJSON(),
          health:health.toJSON(),endurance:endurance.toJSON(),
          hp:document.getElementById("hp").textContent.trim(),
          stamina:document.getElementById("endurance-state").textContent.trim(),
          depth:document.getElementById("floor-depth").textContent.trim(),
          map:box("tile-map").toJSON(),dock:box("field-controls").toJSON(),
          clientWidth:document.documentElement.clientWidth,
          scrollWidth:document.documentElement.scrollWidth,
          buttons:[...document.querySelectorAll("#expedition-shortcuts button")]
            .map(b=>b.getBoundingClientRect().height)
        };
      });
      assert.equal(ui.cssLoaded,true,"UI-097A1 CSS loaded");
      assert.equal(ui.brand,"ROGOV");
      assert.notEqual(ui.brandDisplay,"none");
      assert.match(ui.headerImage,/ui097-nhal-frieze\.svg/);
      assert.ok(ui.menu.height>=44,"The menu must remain a 44px target");
      assert.ok(ui.health.left<ui.endurance.left&&Math.abs(ui.health.top-ui.endurance.top)<=2,
        "Both real gauges should share a compact HUD row: "+JSON.stringify(ui));
      assert.ok(ui.hp.length>0&&ui.stamina.length>0&&ui.depth.length>0,
        "Existing engine-owned numbers must remain visible");
      assert.equal(ui.buttons.length,6);
      assert.ok(ui.buttons.every(h=>h>=44));
      assert.ok(ui.scrollWidth<=ui.clientWidth+1,"No horizontal overflow");
      assert.ok(ui.map.bottom<=ui.dock.top+1,
        "Decorative header must not push the map behind the fixed dock: "+JSON.stringify(ui));
      await page.locator("#jump-bag").tap();
      assert.equal(await page.locator("#ui092-sheet").isVisible(),true,
        "The real bag should open inside the existing sheet");
      await page.locator("#ui092-sheet-close").tap();
      assert.equal(await page.locator("#ui092-sheet").isHidden(),true);
      assert.equal((await page.locator("#turns").textContent()).trim(),"0",
        "Opening the bag must never spend a turn");
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});


test("UI-097A2 mobile: six real shortcuts follow the map and stay above the fixed dock", {timeout:125000}, async()=>{
  for(const viewport of [{width:320,height:640},{width:360,height:780},{width:393,height:704}]){
    const context=await browser.newContext({
      viewport,deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:"block",
      reducedMotion:"reduce"
    });
    try{
      const page=await context.newPage(),errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      await preloadDeepRun(page);
      const geom=await page.evaluate(()=>{
        const box=id=>document.getElementById(id).getBoundingClientRect().toJSON();
        return {
          map:box("tile-map"),nav:box("expedition-shortcuts"),dock:box("field-controls"),
          warningHidden:document.getElementById("ui096-threat-banner").hidden,
          children:[...document.querySelector(".dungeon-wrap").children].map(el=>el.id),
          navParent:document.getElementById("expedition-shortcuts").parentElement?.className,
          navPosition:getComputedStyle(document.getElementById("expedition-shortcuts")).position,
          scrollWidth:document.documentElement.scrollWidth,
          width:document.documentElement.clientWidth,
          buttons:[...document.querySelectorAll("#expedition-shortcuts button")]
            .map(el=>({id:el.id,height:el.getBoundingClientRect().height}))
        };
      });
      assert.equal(geom.warningHidden,true);
      assert.match(geom.navParent,/dungeon-wrap/);
      assert.equal(geom.navPosition,"relative");
      assert.ok(geom.children.indexOf("dungeon-map")<geom.children.indexOf("ui096-threat-banner"));
      assert.ok(geom.children.indexOf("ui096-threat-banner")<geom.children.indexOf("expedition-shortcuts"));
      assert.ok(geom.nav.top>=geom.map.bottom-1,
        "UI-097A2 navigation must follow the map: "+JSON.stringify(geom));
      assert.ok(geom.nav.bottom<=geom.dock.top+1,
        "All six shortcuts must remain visible above the fixed controls: "+JSON.stringify(geom));
      assert.equal(geom.buttons.length,6);
      assert.ok(geom.buttons.every(b=>b.height>=44));
      assert.ok(geom.scrollWidth<=geom.width+1);
      const initial=(await page.locator("#turns").textContent()).trim();
      await page.locator("#jump-bag").tap();
      assert.equal(await page.locator("#ui092-sheet").isVisible(),true);
      await page.locator("#ui092-sheet-close").tap();
      await page.locator("#renderer-toggle").tap();
      assert.equal(await page.locator("#dungeon-map").isVisible(),true);
      await page.locator("#jump-map").tap();
      assert.equal((await page.locator("#turns").textContent()).trim(),initial);
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test("UI-097A2 browser: urgent visible-only warning stays between map and shortcuts", {timeout:75000}, async()=>{
  const context=await browser.newContext({
    viewport:{width:393,height:704},deviceScaleFactor:3,
    isMobile:true,hasTouch:true,serviceWorkers:"block"
  });
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js"),fog=await import("./exploration-visibility.js");
      const hero=game.newGame();hero.meta.descents=1;
      const state=game.beginRun(hero).state,run=state.run;
      const guardian=run.enemies.find(e=>e.kind==="guardian");
      if(!guardian)throw Error("Missing guardian");
      const adjacent=[[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>({x:guardian.x+dx,y:guardian.y+dy}))
        .find(p=>run.map[p.y]?.[p.x]==="." &&
          !run.enemies.some(e=>e.x===p.x&&e.y===p.y));
      if(!adjacent)throw Error("No adjacent floor");
      run.x=adjacent.x;run.y=adjacent.y;guardian.tactic="winding";
      run.enemies=[guardian];fog.revealAround(run);
      if(!game.validateSave(state))throw Error("Invalid visual fixture");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#ui096-threat-banner").isVisible(),true);
    const geom=await page.evaluate(()=>{
      const box=id=>document.getElementById(id).getBoundingClientRect().toJSON();
      return {map:box("tile-map"),warning:box("ui096-threat-banner"),
        nav:box("expedition-shortcuts"),dock:box("field-controls"),
        urgent:document.getElementById("ui096-threat-banner").dataset.urgent,
        turns:document.getElementById("turns").textContent};
    });
    assert.equal(geom.urgent,"true");
    assert.ok(geom.map.bottom<=geom.warning.top+1);
    assert.ok(geom.warning.bottom<=geom.nav.top+1);
    assert.ok(geom.nav.bottom<=geom.dock.top+1,
      "Imminent attack alert and six shortcuts should fit above fixed dock: "+JSON.stringify(geom));
    assert.equal(geom.turns,"0");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("ART-097B1 browser: decode seven character sprites and capture native/nearest-neighbor QA sheet", {timeout:65000}, async()=>{
  const {mkdir}=await import("node:fs/promises");
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await preloadDeepRun(page);
    const before=await page.evaluate(()=>({
      save:localStorage.getItem("rogov-web-v1"),
      turns:document.getElementById("turns").textContent
    }));
    const sources=await page.evaluate(async()=>{
      const {HERO_SPRITES}=await import("./hero-art.js");
      const {ENEMY_SPRITES}=await import("./enemy-art.js");
      const roster=[
        ...["down","up","left","right"].map(x=>["Sprite C "+x,HERO_SPRITES[x]]),
        ...["charognard","guardian","rift_larva"].map(x=>[x,ENEMY_SPRITES[x]])
      ];
      const root=document.createElement("section");
      root.id="art097b1-qa-sheet";
      root.style.cssText="position:fixed;z-index:99999;top:8px;left:4px;display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding:16px;background:#111d26;color:#e7d4b0;font:12px monospace;width:352px;box-sizing:border-box;";
      for(const [label,src] of roster){
        const cell=document.createElement("div");
        cell.style.cssText="display:flex;align-items:center;flex-direction:column;gap:4px;padding:4px;background:#25313d;";
        const title=document.createElement("span");title.textContent=label;
        title.style.cssText="font-size:9px;white-space:nowrap;max-width:70px;overflow:hidden;text-overflow:ellipsis;";
        const big=document.createElement("img");big.src=src;big.alt=label;
        big.style.cssText="display:block;width:60px;height:60px;image-rendering:pixelated;";
        const native=document.createElement("img");native.src=src;native.alt="";
        native.style.cssText="display:block;width:24px;height:24px;image-rendering:pixelated;";
        cell.append(title,big,native);root.append(cell);
      }
      document.body.append(root);
      await Promise.all([...root.querySelectorAll("img")].map(img=>img.decode()));
      const dimensions=[...root.querySelectorAll("img")].map(img=>({
        natural:[img.naturalWidth,img.naturalHeight],
        rendered:[img.getBoundingClientRect().width,img.getBoundingClientRect().height],
        dataUri:img.src.startsWith("data:image/svg+xml;charset=UTF-8,")
      }));
      return {dimensions,labels:roster.map(x=>x[0])};
    });
    assert.equal(sources.labels.length,7);
    assert.equal(sources.dimensions.length,14);
    assert.ok(sources.dimensions.every(x=>x.natural[0]===24&&x.natural[1]===24&&x.dataUri));
    assert.equal(sources.dimensions.filter(x=>x.rendered[0]===24).length,7);
    await mkdir("qa096-screenshots",{recursive:true});
    await page.locator("#art097b1-qa-sheet").screenshot({
      path:"qa096-screenshots/art097b1-seven-character-views.png",animations:"disabled"});
    const after=await page.evaluate(()=>({
      save:localStorage.getItem("rogov-web-v1"),
      turns:document.getElementById("turns").textContent
    }));
    assert.deepEqual(after,before,"Visual inspection must never spend turns or write saves");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("ART-097B2 mobile: a real step triggers one-shot sprites, free menus and reload never do", {timeout:90000}, async()=>{
  const context=await browser.newContext({
    viewport:{width:360,height:780},deviceScaleFactor:3,
    isMobile:true,hasTouch:true,serviceWorkers:"block",reducedMotion:"no-preference"
  });
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await preloadDeepRun(page);
    assert.equal(await page.locator("#tile-map .art097b2-step").count(),0);
    assert.equal(await page.locator("#tile-map .art097b2-foe-turn").count(),0);
    const before=await page.locator("#turns").textContent();
    await page.locator("#jump-bag").tap();
    assert.equal(await page.locator("#ui092-sheet").isVisible(),true);
    await page.locator("#ui092-sheet-close").tap();
    assert.equal(await page.locator("#turns").textContent(),before);
    assert.equal(await page.locator("#tile-map .art097b2-step").count(),0);

    const step=await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      const r=JSON.parse(localStorage.getItem(SAVE_KEY)).run;
      const choices=[
        {name:"up",dx:0,dy:-1},{name:"down",dx:0,dy:1},
        {name:"left",dx:-1,dy:0},{name:"right",dx:1,dy:0}
      ];
      return choices.find(d=>r.map[r.y+d.dy]?.[r.x+d.dx]===".")||null;
    });
    assert.ok(step,"Deep map has a traversable floor neighbor");
    await page.locator('[data-direction="'+step.name+'"]').tap();
    assert.equal(await page.locator("#tile-map .tile-hero.art097b2-step").count(),1);
    const facts=await page.evaluate(()=>{
      const hero=document.querySelector("#tile-map .tile-hero.art097b2-step img");
      const foes=[...document.querySelectorAll("#tile-map .art097b2-foe-turn")];
      return {
        heroName:getComputedStyle(hero).animationName,
        heroCount:document.querySelectorAll("#tile-map .tile-hero").length,
        foeCount:foes.length,
        allVisible:foes.every(el=>el.dataset.knowledge==="visible"),
        allEnemies:foes.every(el=>el.classList.contains("hostile-tile")),
        noHiddenMotion:[...document.querySelectorAll("#tile-map [data-knowledge='unknown'],#tile-map [data-knowledge='remembered']")]
          .every(el=>!el.classList.contains("art097b2-step")&&!el.classList.contains("art097b2-foe-turn")),
        scrollWidth:document.documentElement.scrollWidth,
        viewportWidth:document.documentElement.clientWidth
      };
    });
    assert.match(facts.heroName,/art097b2-step/);
    assert.equal(facts.heroCount,1);
    assert.ok(facts.foeCount<=3,"The animation budget must never exceed 3 visible enemies");
    assert.equal(facts.allVisible,true);
    assert.equal(facts.allEnemies,true);
    assert.equal(facts.noHiddenMotion,true);
    assert.ok(facts.scrollWidth<=facts.viewportWidth+1);
    assert.equal(Number(await page.locator("#turns").textContent()),Number(before)+1);

    await page.emulateMedia({reducedMotion:"reduce"});
    const reduced=await page.locator("#tile-map .tile-hero.art097b2-step img")
      .evaluate(el=>getComputedStyle(el).animationName);
    assert.equal(reduced,"none","OS reduce-motion preference disables all motion");
    await page.locator("#renderer-toggle").tap();
    assert.equal(await page.locator("#dungeon-map").isVisible(),true);
    await page.locator("#renderer-toggle").tap();
    assert.equal(await page.locator("#tile-map .art097b2-step").count(),0,
      "A UI-only redraw must not replay the last movement");
    await page.reload();
    await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#tile-map .art097b2-step").count(),0,
      "Resuming an old save never creates artificial movement");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("ART-097C1 browser: real visible wall torches, Arche and Faille glow without fog leaks", {timeout:75000}, async()=>{
  const {mkdir}=await import("node:fs/promises");
  const context=await browser.newContext({
    viewport:{width:360,height:780},deviceScaleFactor:3,
    isMobile:true,hasTouch:true,serviceWorkers:"block",reducedMotion:"reduce"
  });
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",err=>errors.push(err.message));
    await preloadDeepRun(page);
    const original=await page.evaluate(()=>({
      save:localStorage.getItem("rogov-web-v1"),
      turn:document.getElementById("turns").textContent
    }));
    const data=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const {drawTileMap}=await import("./tiles.js");
      const {terrainHash}=await import("./terrain-art.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      const run=state.run;
      const map=[
        "###########","#.........#","#.........#","#.........#",
        "#....#....#","#..^......#","#...E.....#",
        "#.........#","#.........#","#.........#","###########"
      ];
      run.map=map;
      run.x=4;run.y=4;
      run.enemies=[];run.traps=[];run.secrets=[];run.doors=[];run.rooms={};
      let seed;
      for(let k=0;k<1000;k++){
        const candidate="art097c-qa-"+k;
        if(terrainHash(candidate,5,4)%13===0){seed=candidate;break;}
      }
      if(!seed)throw Error("Unable to seed a deterministic torch");
      run.layoutId=seed;
      const el=document.createElement("div");
      el.id="art097c1-qa-map";el.className="pixel-map";
      el.style.cssText="position:fixed;top:0;left:0;z-index:999999;width:330px;height:330px;";
      document.body.append(el);
      drawTileMap(state,el,"down",null);
      const cells=[...el.querySelectorAll(".pixel-tile")];
      const at=(x,y)=>cells.find(cell=>cell.dataset.x===String(x)&&cell.dataset.y===String(y));
      const torch=at(5,4),arch=at(4,6),rift=at(3,5);
      if(!torch||!arch||!rift)throw Error("Missing map fixture cells");
      await Promise.all([...el.querySelectorAll("img")].map(img=>img.decode()));
      return {
        count:cells.length,
        torchClass:torch.className,torchKnowledge:torch.dataset.knowledge,
        torchImages:torch.querySelectorAll("img.art097c-wall-sconce").length,
        torchColor:getComputedStyle(torch).boxShadow,
        archClass:arch.className,archKnowledge:arch.dataset.knowledge,
        riftClass:rift.className,riftKnowledge:rift.dataset.knowledge,
        unknownCount:cells.filter(cell=>cell.dataset.knowledge!=="visible").length,
        badCells:cells.filter(cell=>cell.dataset.knowledge!=="visible"&&
          (cell.querySelector(".art097c-wall-sconce")||
           [...cell.classList].some(n=>n.startsWith("art097c-")))).length,
        visibleLight:cells.filter(cell=>cell.dataset.knowledge==="visible"&&
          [...cell.classList].some(n=>n.startsWith("art097c-"))).length,
        atSize:[el.getBoundingClientRect().width,el.getBoundingClientRect().height],
        scrollWidth:document.documentElement.scrollWidth,
        clientWidth:document.documentElement.clientWidth
      };
    });
    assert.equal(data.count,121);
    assert.match(data.torchClass,/art097c-sconce/);
    assert.equal(data.torchKnowledge,"visible");
    assert.equal(data.torchImages,1,"One decorative-only SVG on the real wall");
    assert.notEqual(data.torchColor,"none");
    assert.match(data.archClass,/art097c-arch/);
    assert.match(data.riftClass,/art097c-rift/);
    assert.equal(data.archKnowledge,"visible");
    assert.equal(data.riftKnowledge,"visible");
    assert.ok(data.unknownCount>0,"QA fixture must retain active fog, not fake all-visible cells");
    assert.equal(data.badCells,0,"Unknown or remembered tiles must carry no light class");
    assert.ok(data.visibleLight>=3);
    assert.ok(data.scrollWidth<=data.clientWidth+1);
    await mkdir("qa096-screenshots",{recursive:true});
    await page.locator("#art097c1-qa-map").screenshot({
      path:"qa096-screenshots/art097c1-visible-lighting.png",animations:"disabled"
    });
    const after=await page.evaluate(()=>({
      save:localStorage.getItem("rogov-web-v1"),
      turn:document.getElementById("turns").textContent
    }));
    assert.deepEqual(after,original,"Cosmetic lighting must not write saves or turns");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("QA-097 Android acceptance: actual hit centers, fog-safe redraw budget and captures", {timeout:170000}, async()=>{
  // A browser benchmark is NOT an Android hardware FPS measurement.
  // Keep this report informational; turn time / real touch latency require device QA.
  const {mkdir,writeFile}=await import("node:fs/promises");
  const folder="qa096-screenshots";
  await mkdir(folder,{recursive:true});
  const results=[];
  for(const viewport of [{width:320,height:640},{width:360,height:780},{width:393,height:704}]){
    const context=await browser.newContext({
      viewport,deviceScaleFactor:3,isMobile:true,hasTouch:true,
      serviceWorkers:"block",reducedMotion:"reduce"
    });
    try{
      const page=await context.newPage(),errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      await preloadDeepRun(page);
      const outcome=await page.evaluate(async()=>{
        const {SAVE_KEY,validateSave}=await import("./game.js");
        const {drawTileMap}=await import("./tiles.js");
        const saved=localStorage.getItem(SAVE_KEY);
        const state=JSON.parse(saved);
        if(!validateSave(state))throw Error("QA-097 run invalid");
        const turns=document.getElementById("turns").textContent.trim();
        const map=document.getElementById("tile-map");
        const dock=document.getElementById("field-controls").getBoundingClientRect();
        const nav=document.getElementById("expedition-shortcuts").getBoundingClientRect();
        const mapRect=map.getBoundingClientRect();
        const controls=[
          ...document.querySelectorAll("#expedition-shortcuts button"),
          ...document.querySelectorAll("#field-controls .dpad button"),
          ...document.querySelectorAll("#field-controls .field-quick-actions button")
        ].filter(el=>getComputedStyle(el).display!=="none");
        const centers=controls.map(el=>{
          const r=el.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2;
          const target=document.elementFromPoint(x,y);
          return {
            id:el.id||el.dataset.direction||el.textContent.trim(),
            w:r.width,h:r.height,
            center:[Math.round(x),Math.round(y)],
            inViewport:x>=0&&x<innerWidth&&y>=0&&y<innerHeight,
            hit:target===el||el.contains(target),
            blocker:target?.id||target?.className||null
          };
        });
        const times=[];
        // One live draw per iteration, same saved state and presentation; no
        // movement, AI advance, RNG action, save mutation, or forced animation.
        for(let i=0;i<22;i++){
          const start=performance.now();
          drawTileMap(state,map,"down",null);
          times.push(performance.now()-start);
        }
        times.sort((a,b)=>a-b);
        const tileCells=[...map.querySelectorAll(".pixel-tile")];
        const nonVisible=tileCells.filter(el=>el.dataset.knowledge!=="visible");
        const lightLeak=nonVisible.filter(el=>
          [...el.classList].some(k=>k.startsWith("art097c-"))||
          el.querySelector(".art097c-wall-sconce")).length;
        const enemyLeak=nonVisible.filter(el=>
          el.dataset.enemyId||el.classList.contains("hostile-tile")||
          el.querySelector(".tile-intent-marker")).length;
        const hero=[...map.querySelectorAll(".tile-hero")];
        const portrait={
          size:[innerWidth,innerHeight],
          mapWidth:mapRect.width,mapBottom:mapRect.bottom,
          navTop:nav.top,navBottom:nav.bottom,dockTop:dock.top,
          scrollWidth:document.documentElement.scrollWidth,
          clientWidth:document.documentElement.clientWidth
        };
        return {
          viewport:portrait,controls:centers,
          renderMs:{
            samples:times.length,median:times[Math.floor(times.length/2)],
            p95:times[Math.ceil(times.length*.95)-1],
            max:times[times.length-1]
          },
          tiles:tileCells.length,heroCount:hero.length,
          nonVisible:nonVisible.length,lightLeak,enemyLeak,
          saveUnchanged:localStorage.getItem(SAVE_KEY)===saved,
          turnsUnchanged:document.getElementById("turns").textContent.trim()===turns
        };
      });
      const label=viewport.width+"x"+viewport.height;
      assert.equal(outcome.tiles,121,"11x11 tiles at "+label);
      assert.equal(outcome.heroCount,1,"One Sprite C at "+label);
      assert.ok(outcome.nonVisible>0,"QA-097 requires active fog at "+label);
      assert.equal(outcome.lightLeak,0,"No lighting on unseen cells at "+label);
      assert.equal(outcome.enemyLeak,0,"No hostile/intent leak at "+label);
      assert.equal(outcome.saveUnchanged,true,"No writes to saved game at "+label);
      assert.equal(outcome.turnsUnchanged,true,"Rendering spends no turns at "+label);
      assert.ok(outcome.controls.length===14,"Six shortcuts, five movement controls + listening, two quick items: "+label);
      assert.ok(outcome.controls.every(x=>x.w>=44&&x.h>=44),
        "All existing targets remain >=44x44 CSS px at "+label+": "+JSON.stringify(outcome.controls));
      assert.ok(outcome.controls.every(x=>x.inViewport&&x.hit),
        "Controls must be genuinely hit-testable without overlays at "+label+": "+JSON.stringify(outcome.controls));
      assert.ok(outcome.viewport.mapBottom<=outcome.viewport.navTop+1,
        "Map must precede navigation at "+label);
      assert.ok(outcome.viewport.navBottom<=outcome.viewport.dockTop+1,
        "Navigation must stay above fixed D-pad at "+label);
      assert.ok(outcome.viewport.scrollWidth<=outcome.viewport.clientWidth+1);
      assert.deepEqual(errors,[]);
      await page.screenshot({
        path:folder+"/qa097-nhal-"+label+".png",animations:"disabled"
      });
      results.push({label,...outcome});
    }finally{await context.close();}
  }
  await writeFile(folder+"/qa097-report.json",JSON.stringify({
    title:"ROGOV QA-097 — Chromium portrait acceptance",
    source:"Automated Chromium touch emulation only; no real Android FPS/gestures",
    measuredAt:"GitHub Actions run",
    hardGates:["121 visible-or-fogged tiles","no hidden enemy/light data",
      "14 touch centers actually target their controls","all controls >=44x44 CSS px",
      "no map/navigation/dock overlap","no save or turn mutation"],
    renderTiming:"22 redraws per portrait; diagnostic only, not a physical-device budget",
    results
  },null,2)+"\n");
});


// UI-098B1 — physical-device report triggered a drawer/dock occlusion fix.
// Geometry is verified in real Chromium layouts; never claim hardware QA.
test("UI-098B1 mobile: empty and full bags scroll above the measured D-pad", {timeout:110000}, async()=>{
  for(const [width,height] of [[320,640],[360,780],[393,704]]){
    const context=await browser.newContext({
      viewport:{width,height},deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:"block"
    });
    try{
      const page=await context.newPage(),errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      await preloadDeepRun(page);
      const initial=await page.evaluate(()=>localStorage.getItem("rogov-web-v1"));
      const turns=await page.locator("#turns").textContent();
      await page.locator("#jump-bag").tap();
      const empty=page.locator("#bag-items .empty");
      assert.match(await empty.innerText(),/Ton sac est vide/);
      await empty.scrollIntoViewIfNeeded();
      const assertGeometry=async(label)=>{
        const g=await page.evaluate(()=>{
          const rect=id=>document.getElementById(id).getBoundingClientRect();
          const sheet=rect("ui092-sheet"),dock=rect("field-controls");
          const body=rect("ui092-sheet-body"),close=rect("ui092-sheet-close");
          const target=document.elementFromPoint(close.left+close.width/2,close.top+close.height/2);
          const btn=document.getElementById("ui092-sheet-close");
          return {
            sheetTop:sheet.top,sheetBottom:sheet.bottom,dockTop:dock.top,
            bodyTop:body.top,bodyBottom:body.bottom,closeHeight:close.height,
            closeHit:target===btn||btn.contains(target),
            width:document.documentElement.scrollWidth,viewport:innerWidth,
            scrollHeight:document.getElementById("ui092-sheet-body").scrollHeight,
            clientHeight:document.getElementById("ui092-sheet-body").clientHeight
          };
        });
        assert.ok(g.sheetTop>=-1,label+" drawer is inside the viewport: "+JSON.stringify(g));
        assert.ok(g.sheetBottom<=g.dockTop-5,label+" drawer may not overlap D-pad: "+JSON.stringify(g));
        assert.ok(g.bodyTop>=g.sheetTop&&g.bodyBottom<=g.sheetBottom+1,
          label+" body must remain within fixed sheet: "+JSON.stringify(g));
        assert.ok(g.closeHeight>=44&&g.closeHit,label+" Fermer remains tappable: "+JSON.stringify(g));
        assert.ok(g.width<=g.viewport+1,label+" no horizontal overflow");
        return g;
      };
      await assertGeometry(width+"×"+height+" empty");
      const emptyRect=await page.evaluate(()=>{
        const r=document.querySelector("#bag-items .empty").getBoundingClientRect();
        const body=document.getElementById("ui092-sheet-body").getBoundingClientRect();
        return {top:r.top,bottom:r.bottom,bodyTop:body.top,bodyBottom:body.bottom};
      });
      assert.ok(emptyRect.top>=emptyRect.bodyTop-1&&emptyRect.bottom<=emptyRect.bodyBottom+1,
        "The actual empty-bag message must be readable above the D-pad");
      await page.locator("#ui092-sheet-close").tap();
      assert.equal(await page.locator("#ui092-sheet").isHidden(),true);
      assert.equal(await page.evaluate(()=>localStorage.getItem("rogov-web-v1")),initial);
      assert.equal(await page.locator("#turns").textContent(),turns);

      await page.evaluate(async()=>{
        const {SAVE_KEY,validateSave}=await import("./game.js");
        const state=JSON.parse(localStorage.getItem(SAVE_KEY));
        state.run.carried={
          "weapon.bone_dagger":1,"weapon.iron_mace":1,
          "shield.worn_buckler":1,"armor.scavenged_cuirass":1,
          "consumable.bandage":1,"consumable.vigor_salts":1,
          "consumable.dusk_tonic":1,"relic.ashen_fragment":1
        };
        if(!validateSave(state))throw Error("Invalid 8-item UI-098B1 fixture");
        localStorage.setItem(SAVE_KEY,JSON.stringify(state));
      });
      await page.reload();await page.locator("#title-continue").tap();
      const fullSave=await page.evaluate(()=>localStorage.getItem("rogov-web-v1"));
      const fullTurns=await page.locator("#turns").textContent();
      await page.locator("#jump-bag").tap();
      assert.equal(await page.locator("#bag-items .item-row").count(),8);
      const lastAction=page.locator("#bag-items .item-row button").last();
      await lastAction.scrollIntoViewIfNeeded();
      const hit=await lastAction.evaluate(btn=>{
        const r=btn.getBoundingClientRect();
        const b=document.getElementById("ui092-sheet-body").getBoundingClientRect();
        const target=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
        return {visible:r.top>=b.top-1&&r.bottom<=b.bottom+1,
          hit:target===btn||btn.contains(target)};
      });
      assert.ok(hit.visible&&hit.hit,
        width+"×"+height+" the final real inventory action must be reachable: "+JSON.stringify(hit));
      const full=await assertGeometry(width+"×"+height+" full");
      assert.ok(full.scrollHeight>full.clientHeight,"Eight real items must scroll in the drawer");

      // Simulate a taller Android safe-area / scaled dock: ResizeObserver must
      // maintain clearance without reducing the touch targets.
      await page.locator("#ui092-sheet-close").tap();
      await page.locator("#field-controls").evaluate(el=>el.style.paddingBottom="44px");
      await page.locator("#jump-bag").tap();
      await page.waitForFunction(()=>{
        const sheet=document.getElementById("ui092-sheet").getBoundingClientRect();
        const dock=document.getElementById("field-controls").getBoundingClientRect();
        return sheet.bottom<=dock.top-5;
      },null,{timeout:5000});
      await assertGeometry(width+"×"+height+" taller dock");
      await page.locator("#ui092-sheet-close").tap();
      assert.equal(await page.evaluate(()=>localStorage.getItem("rogov-web-v1")),fullSave);
      assert.equal(await page.locator("#turns").textContent(),fullTurns);
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test("UI-098B1 mobile: Combat actions scroll and Fermer restores the map", {timeout:65000}, async()=>{
  const context=await browser.newContext({
    viewport:{width:320,height:640},deviceScaleFactor:3,
    isMobile:true,hasTouch:true,serviceWorkers:"block"
  });
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js"),fog=await import("./exploration-visibility.js");
      const source=game.newGame();source.meta.descents=1;
      const state=game.beginRun(source).state;
      const foe=state.run.enemies[0];
      const beside=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>
        ({x:foe.x+dx,y:foe.y+dy})).find(p=>state.run.map[p.y]?.[p.x]==="."&&
        !state.run.enemies.some(e=>e.x===p.x&&e.y===p.y));
      if(!beside)throw Error("No adjacent floor for combat drawer");
      state.run.x=beside.x;state.run.y=beside.y;
      state.run.enemies=[foe];fog.revealAround(state.run);
      if(!game.validateSave(state))throw Error("Invalid UI-098B1 combat fixture");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();await page.locator("#title-continue").tap();
    const turns=await page.locator("#turns").textContent();
    await page.locator("#jump-combat").tap();
    assert.equal(await page.locator("#ui092-sheet-body #combat-dock").count(),1);
    await page.locator("#target-choices button").first().tap();
    assert.equal(await page.locator("#combat-panel").isVisible(),true);
    // Target selection intentionally persists targetId without costing a turn;
    // record the post-selection save to isolate the drawer close action.
    const save=await page.evaluate(()=>localStorage.getItem("rogov-web-v1"));
    const retreat=page.locator("#combat-retreat");
    await retreat.scrollIntoViewIfNeeded();
    const hit=await retreat.evaluate(el=>{
      const r=el.getBoundingClientRect(),b=document.getElementById("ui092-sheet-body").getBoundingClientRect();
      const t=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
      return {visible:r.top>=b.top-1&&r.bottom<=b.bottom+1,hit:t===el||el.contains(t)};
    });
    assert.ok(hit.visible&&hit.hit,"Last combat action must be in scrollable body: "+JSON.stringify(hit));
    const clear=await page.evaluate(()=>{
      const sheet=document.getElementById("ui092-sheet").getBoundingClientRect();
      const dock=document.getElementById("field-controls").getBoundingClientRect();
      return sheet.bottom<=dock.top-5;
    });
    assert.equal(clear,true,"Combat drawer must clear the fixed controls");
    await page.locator("#ui092-sheet-close").tap();
    assert.equal(await page.locator("#ui092-sheet").isHidden(),true);
    assert.equal(await page.locator("#tile-map").isVisible(),true);
    assert.equal(await page.locator("#turns").textContent(),turns);
    assert.equal(await page.evaluate(()=>localStorage.getItem("rogov-web-v1")),save);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


test("ART-097C2 mobile: inspect 54-material family and seven Sprite C portraits without touching a run", {timeout:45000},async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await preloadDeepRun(page);
    const before=await page.evaluate(()=>localStorage.getItem("rogov-web-v1"));
    const turns=await page.locator("#turns").textContent();
    const evidence=await page.evaluate(async()=>{
      const {HERO_SPRITES}=await import("./hero-art.js");
      const {ENEMY_SPRITES}=await import("./enemy-art.js");
      const {TERRAIN_SPRITES}=await import("./terrain-art.js");
      const hero=Object.entries(HERO_SPRITES).map(([name,src])=>["Égaré "+name,src]);
      const foes=Object.entries(ENEMY_SPRITES).map(([name,src])=>[name,src]);
      const floors=TERRAIN_SPRITES.floor.map((src,i)=>["Sol "+(i+1),src]);
      const walls=[0,1,2].map(i=>["Mur "+(i+1),TERRAIN_SPRITES.wall[5][i]]);
      const group=document.createElement("section");group.id="art097c2-qa-gallery";
      group.style.cssText="position:fixed;inset:0;z-index:1000;overflow:auto;background:#0b151a;color:#e2e0ce;padding:12px;box-sizing:border-box;font:12px/1.3 system-ui,sans-serif";
      const title=document.createElement("h2");title.textContent="ART-097C2 / NHAL — Galerie de contrôle";
      title.style.cssText="font:700 16px system-ui;margin:4px 0 12px";
      group.append(title);
      const addSection=(caption,entries)=>{
        const heading=document.createElement("h3");heading.textContent=caption;
        heading.style.cssText="font:700 12px system-ui;margin:10px 0 5px;color:#bed4c6";group.append(heading);
        const grid=document.createElement("div");
        grid.style.cssText="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px";
        for(const [name,src] of entries){
          const slot=document.createElement("div");
          slot.style.cssText="display:grid;justify-items:center;gap:3px;min-width:0;background:#1a2930;padding:5px 2px;border:1px solid #415059";
          const img=document.createElement("img");img.src=src;img.alt="";
          img.style.cssText="display:block;width:48px;height:48px;image-rendering:pixelated";
          const label=document.createElement("span");label.textContent=name;
          label.style.cssText="font:10px/1.1 system-ui;text-align:center;color:#bdc8bd";
          slot.append(img,label);grid.append(slot);
        }
        group.append(grid);
      };
      addSection("PERSONNAGES — 4 directions et 3 adversaires",hero.concat(foes));
      addSection("MATIÈRES — 6 dalles et 3 parements",floors.concat(walls));
      document.body.append(group);
      await Promise.all([...group.querySelectorAll("img")].map(img=>img.decode()));
      return {
        images:group.querySelectorAll("img").length,
        size24:[...group.querySelectorAll("img")].every(img=>img.naturalWidth===24&&img.naturalHeight===24),
        noHorizontalOverflow:group.scrollWidth<=innerWidth+1,
        fogSafe:[...document.querySelectorAll("#tile-map .pixel-tile[data-knowledge=unknown]")].every(
          cell=>!cell.querySelector("img")&&!cell.style.backgroundImage),
        mapCells:document.querySelectorAll("#tile-map .pixel-tile").length
      };
    });
    assert.equal(evidence.images,16);
    assert.equal(evidence.size24,true);
    assert.equal(evidence.noHorizontalOverflow,true);
    assert.equal(evidence.fogSafe,true);
    assert.equal(evidence.mapCells,121);
    const {mkdir}=await import("node:fs/promises");
    await mkdir("qa096-screenshots",{recursive:true});
    await page.locator("#art097c2-qa-gallery").screenshot({
      path:"qa096-screenshots/art097c2-material-silhouette-gallery.png",
      animations:"disabled"
    });
    await page.locator("#art097c2-qa-gallery").evaluate(el=>el.remove());
    assert.equal(await page.evaluate(()=>localStorage.getItem("rogov-web-v1")),before);
    assert.equal(await page.locator("#turns").textContent(),turns);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});


// UI/ART-099 — the large bundled Android-only improvement.
// Screen captures deliberately use normal Chromium emulated touch, not a real
// device. No synthetic sprites replace the running map.
test("UI-099 mobile: map first, no duplicate long document, original Menu knowledge and real drawers", {timeout:160000},async()=>{
  const {mkdir}=await import("node:fs/promises");
  await mkdir("qa096-screenshots",{recursive:true});
  for(const [width,height] of [[320,640],[360,780],[393,704]]){
    const context=await browser.newContext({
      viewport:{width,height},deviceScaleFactor:3,isMobile:true,hasTouch:true,
      serviceWorkers:"block",reducedMotion:"reduce"
    });
    try{
      const page=await context.newPage(),errors=[];
      page.on("pageerror",e=>errors.push(e.message));
      await preloadDeepRun(page);
      const before=await page.evaluate(()=>localStorage.getItem("rogov-web-v1"));
      const turns=await page.locator("#turns").textContent();
      const state=await page.evaluate(()=>{
        const box=id=>document.getElementById(id).getBoundingClientRect();
        const map=box("tile-map"),nav=box("expedition-shortcuts"),dock=box("field-controls");
        const display=id=>getComputedStyle(document.getElementById(id)).display;
        return {
          mapBottom:map.bottom,navTop:nav.top,navBottom:nav.bottom,
          dockTop:dock.top,dockBottom:dock.bottom,vh:innerHeight,
          width:document.documentElement.scrollWidth,vw:document.documentElement.clientWidth,
          tiles:document.querySelectorAll("#tile-map .pixel-tile").length,
          hero:document.querySelectorAll("#tile-map .tile-hero").length,
          bagDisplay:display("bag-panel"),
          actionPanelDisplay:display("action-panel"),
          statusDisplay:display("ui099-feedback"),
          actorInMenu:document.querySelectorAll("#options-panel #actor-stats-sheet").length,
          infoOriginalCount:document.querySelectorAll("#ui099-info-slot > *").length
        };
      });
      assert.equal(state.tiles,121);assert.equal(state.hero,1);
      assert.equal(state.bagDisplay,"none","No duplicate bag below map");
      assert.equal(state.actionPanelDisplay,"none","No long journal below map");
      assert.notEqual(state.statusDisplay,"none","Public action feedback survives compacting");
      assert.equal(state.actorInMenu,1);
      assert.equal(state.infoOriginalCount,5);
      assert.ok(state.mapBottom<=state.navTop+1,JSON.stringify(state));
      assert.ok(state.navBottom<=state.dockTop+1,JSON.stringify(state));
      assert.ok(Math.abs(state.dockBottom-state.vh)<=2);
      assert.ok(state.width<=state.vw+1,"No sideways page scrolling");

      await page.locator("#jump-menu").tap();
      assert.equal(await page.locator("#ui092-sheet").isVisible(),true);
      assert.equal(await page.locator("#ui099-extras").isVisible(),true);
      assert.equal(await page.locator("#ui099-info-slot #actor-stats-sheet").count(),1);
      assert.equal(await page.locator("#ui099-info-slot #route-hint").count(),1);
      assert.equal(await page.locator("#ui099-info-slot #inspect-panel").count(),1);
      assert.equal(await page.locator("#ui099-info-slot #exploration-map-panel").count(),1);
      await page.locator("#actor-stats-sheet summary").tap();
      assert.equal(await page.locator("#actor-stat-values").isVisible(),true);
      await page.locator("#map-legend-details summary").tap();
      assert.equal(await page.locator("#graphic-legend").isVisible(),true);
      const edges=await page.evaluate(()=>{
        const sheet=document.getElementById("ui092-sheet").getBoundingClientRect();
        const dock=document.getElementById("field-controls").getBoundingClientRect();
        return {sheetBottom:sheet.bottom,dockTop:dock.top};
      });
      assert.ok(edges.sheetBottom<=edges.dockTop-5,JSON.stringify(edges));
      await page.locator("#ui092-sheet-close").tap();
      assert.equal(await page.locator("#ui092-sheet").isHidden(),true);

      await page.locator("#jump-bag").tap();
      assert.equal(await page.locator("#ui092-sheet-body #bag-panel").count(),1);
      assert.equal(await page.locator("#bag-panel").isVisible(),true);
      await page.locator("#ui092-sheet-close").tap();

      const tile=page.locator("#tile-map .pixel-tile[data-knowledge=visible]").filter({
        hasNot:page.locator("img")
      }).first();
      // Some visible floors have a torch/sprite; at minimum an exposed cell
      // must be inspected without spending a turn.
      await page.locator("#tile-map .pixel-tile[data-knowledge=visible]").first().tap();
      const inspectText=await page.locator("#ui099-inspect").textContent();
      assert.ok(inspectText.trim().length>0);
      assert.equal(await page.evaluate(()=>localStorage.getItem("rogov-web-v1")),before);
      assert.equal(await page.locator("#turns").textContent(),turns);
      await page.screenshot({
        path:"qa096-screenshots/ui099-map-first-"+width+"x"+height+".png",
        animations:"disabled"
      });
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});

test("UI-099 mobile: a visible hostile opens Combat only on request and can be defended against", {timeout:70000},async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin);
    await page.evaluate(async()=>{
      const game=await import("./game.js"),fog=await import("./exploration-visibility.js");
      const hero=game.newGame();hero.meta.descents=1;
      const state=game.beginRun(hero).state,run=state.run,foe=run.enemies[0];
      const adjacent=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>
        ({x:foe.x+dx,y:foe.y+dy})).find(p=>run.map[p.y]?.[p.x]==="." &&
          !run.enemies.some(e=>e.x===p.x&&e.y===p.y));
      if(!adjacent)throw Error("No adjacent visible combat fixture");
      run.x=adjacent.x;run.y=adjacent.y;run.enemies=[foe];
      fog.revealAround(run);
      if(!game.validateSave(state))throw Error("UI-099 invalid fixture");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    });
    await page.reload();await page.locator("#title-continue").tap();
    const before=await page.locator("#turns").textContent();
    assert.equal(await page.locator("#combat-dock").evaluate(el=>el.hidden),false);
    assert.equal(await page.locator("#combat-dock").isHidden(),true,
      "The real combat dock no longer elongates the map-first page");
    await page.locator("#jump-combat").tap();
    assert.equal(await page.locator("#ui092-sheet-body #combat-dock").count(),1);
    assert.equal(await page.locator("#combat-dock").isVisible(),true);
    await page.locator("#target-choices button").first().tap();
    assert.equal(await page.locator("#combat-panel").isVisible(),true);
    assert.equal(await page.locator("#turns").textContent(),before,
      "Target selection is still free");
    await page.locator("#combat-dodge").tap();
    assert.equal(Number(await page.locator("#turns").textContent()),Number(before)+1);
    await page.locator("#ui092-sheet-close").tap();
    assert.equal(await page.locator("#combat-dock").isHidden(),true);
    assert.equal(await page.locator("#tile-map").isVisible(),true);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("UI/ART-100: three Android portraits retain 121 pixels, six real targets and no overflow", {timeout:90000}, async()=>{
  for(const viewport of [{width:320,height:640},{width:360,height:780},{width:393,height:704}]){
    const context=await browser.newContext({
      viewport,deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:"block"
    });
    try{
      const page=await context.newPage();
      const errors=[];
      page.on("pageerror",error=>errors.push(error.message));
      await preloadDeepRun(page);
      assert.equal(await page.locator("#tile-map .pixel-tile").count(),121);
      assert.equal(await page.locator('link[href="./ui100.css?v=1"]').count(),1);
      const m=await page.evaluate(()=>{
        const rect=document.querySelector("#tile-map").getBoundingClientRect();
        return {left:rect.left,right:rect.right,width:rect.width,
          controls:[...document.querySelectorAll("#expedition-shortcuts button")]
            .map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})),
          documentWidth:document.documentElement.scrollWidth,
          viewportWidth:document.documentElement.clientWidth,
          sheetHidden:document.querySelector("#ui092-sheet").hidden};
      });
      assert.ok(m.width>0&&m.left>=-1&&m.right<=viewport.width+1,JSON.stringify({viewport,m}));
      assert.ok(m.documentWidth<=m.viewportWidth+1,JSON.stringify({viewport,m}));
      assert.equal(m.controls.length,6);
      assert.ok(m.controls.every(c=>c.w>=44&&c.h>=44),JSON.stringify({viewport,m}));
      assert.ok(m.sheetHidden);
      assert.deepEqual(errors,[]);
    }finally{await context.close();}
  }
});


test("GAME-101A mobile: one tactile listening turn, feedback, reload, and low-stamina lock", {timeout:60000},async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await preloadDeepRun(page);
    const button=page.locator("#listen-btn");
    assert.equal(await button.isEnabled(),true);
    const before=await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      const run=JSON.parse(localStorage.getItem(SAVE_KEY)).run;
      return {endurance:run.endurance,seen:run.exploration.seen,map:run.map};
    });
    const rect=await button.boundingBox();
    assert.ok(rect.width>=44&&rect.height>=44,"Touch target stays 44px");
    await button.tap();
    assert.equal(await page.locator("#turns").textContent(),"1");
    const reading=page.locator("#game101-listen-result");
    assert.equal(await reading.isVisible(),true);
    assert.match(await reading.textContent(),/ÉCOUTE/);
    const after=await page.evaluate(async()=>{
      const {SAVE_KEY,validateSave}=await import("./game.js");
      const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
      return {valid:validateSave(saved),run:saved.run};
    });
    assert.equal(after.valid,true);
    assert.equal(after.run.endurance,before.endurance-2);
    assert.deepEqual(after.run.exploration.seen,before.seen);
    assert.deepEqual(after.run.map,before.map);
    assert.equal(await page.locator("#tile-map .hostile-tile").count(),0);
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#turns").textContent(),"1");
    assert.equal(await button.isEnabled(),true);
    // The legacy save schema accepts a low-stamina run without migration.
    await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      const saved=JSON.parse(localStorage.getItem(SAVE_KEY));
      saved.run.endurance=1;
      localStorage.setItem(SAVE_KEY,JSON.stringify(saved));
    });
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await button.isDisabled(),true);
    assert.equal(await page.locator("#turns").textContent(),"1");
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});

test("GAME-101C mobile: three workshop choices, paid retreat sketch and persistence", {timeout:60000},async()=>{
  const context=await mobileContext();
  try{
    const page=await context.newPage(),errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await preloadDeepRun(page);
    const before=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const {revealAround}=await import("./exploration-visibility.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      const site=state.run.sites.find(s=>s.kind==="atelier");
      const at=[[1,0],[-1,0],[0,1],[0,-1]]
        .map(([dx,dy])=>({x:site.x+dx,y:site.y+dy}))
        .find(p=>state.run.map[p.y]?.[p.x]==="."&&
          !state.run.traps.some(t=>t.x===p.x&&t.y===p.y));
      if(!at)throw Error("Atelier unreachable");
      state.run.x=at.x;state.run.y=at.y;state.run.enemies=[];
      revealAround(state.run);
      if(!game.validateSave(state))throw Error("GAME-101C invalid workshop");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
      return {endurance:state.run.endurance,seen:state.run.exploration.seen.length};
    });
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#jump-action").isEnabled(),true);
    await page.locator("#jump-action").tap();
    assert.equal(await page.locator("#room-site-options button").count(),3);
    const sketch=page.locator('[data-room-choice="cartographie"]');
    assert.equal(await sketch.isEnabled(),true);
    await sketch.tap();
    const after=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const saved=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return {valid:game.validateSave(saved),endurance:saved.run.endurance,
        turns:saved.run.turns,seen:saved.run.exploration.seen.length,
        choice:saved.run.sites.find(s=>s.kind==="atelier").choice};
    });
    assert.equal(after.valid,true);
    assert.equal(after.choice,"cartographie");
    assert.equal(after.endurance,before.endurance-2);
    assert.equal(after.turns,1);
    assert.ok(after.seen>before.seen,"Cartographic memory persists in stored save");
    await page.reload();await page.locator("#title-continue").tap();
    assert.equal(await page.locator("#turns").textContent(),"1");
    assert.equal(await page.locator("#room-site-options button").count(),0);
    assert.deepEqual(errors,[]);
  }finally{await context.close();}
});
