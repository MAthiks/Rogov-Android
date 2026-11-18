// DEV-080 — Android 13 emulator + real Chrome CDP smoke (not desktop emulation).
// The separate runner starts a local PWA server on port 8765 and forwards it via ADB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const URL="http://127.0.0.1:8765/index.html";
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
const adb=(...args)=>execFileSync("adb",args,{encoding:"utf8",timeout:25000});

async function androidBrowser() {
  let last;
  for(let i=0;i<20;i++) {
    try {
      return await chromium.connectOverCDP("http://127.0.0.1:9222",{timeout:4000});
    } catch (e) {
      last=e;
      await sleep(1000);
    }
  }
  throw new Error("Android Chrome DevTools connection unavailable: "+last?.message);
}

test("DEV-080: Android 13 Chrome runs the deep PWA, doors, persistence and offline", {timeout:115000}, async()=>{
  const browser=await androidBrowser();
  let forwarding=true;
  try {
    const context=browser.contexts()[0];
    assert.ok(context,"Android Chrome default browser context");
    const existing=context.pages().find(p=>p.url().startsWith(URL.slice(0,-10)));
    const page=existing||await context.newPage();
    await page.goto(URL,{waitUntil:"load",timeout:20000});
    const device=await page.evaluate(()=>({
      ua:navigator.userAgent,width:document.documentElement.clientWidth,
      height:window.innerHeight,touchPoints:navigator.maxTouchPoints,
      secure:window.isSecureContext
    }));
    console.log("ANDROID CHROME DEVICE:",JSON.stringify(device));
    assert.match(device.ua,/Android/i,"Real Android Chrome user agent required");
    assert.ok(device.width>=320&&device.width<=520,"Android portrait viewport width");
    assert.ok(device.height>device.width,"portrait orientation");
    assert.ok(device.touchPoints>0,"touch-capable Android display");
    assert.ok(device.secure,"localhost service worker scope is secure");
    await page.locator("#title-screen").waitFor({state:"visible",timeout:12000});
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:30000});

    const chosen=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const state=game.newGame();
      state.meta.descents=1;
      const deep=game.beginRun(state).state;
      deep.run.enemies=[]; // isolate mobile UI test from combat/AI regressions.
      let selected=null,from=null;
      for(const door of deep.run.doors){
        for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const x=door.x+dx,y=door.y+dy;
          if(deep.run.map[y]?.[x] && !["#","^","E"].includes(deep.run.map[y][x])){
            selected=door;from={x,y};break;
          }
        }
        if(selected)break;
      }
      if(!selected)throw new Error("No accessible ordinary door");
      deep.run.x=from.x;deep.run.y=from.y;
      if(!game.validateSave(deep))throw new Error("Invalid generated deep save");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(deep));
      return {door:selected,from};
    });

    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").click();
    await page.locator("#tile-map .pixel-tile").first().waitFor();
    assert.equal(await page.locator("#tile-map .pixel-tile").count(),121);
    const geometry=await page.evaluate(()=>{
      const rect=document.querySelector("#tile-map").getBoundingClientRect();
      return {scrollWidth:document.documentElement.scrollWidth,
        viewport:document.documentElement.clientWidth,mapLeft:rect.left,mapRight:rect.right};
    });
    assert.ok(geometry.scrollWidth<=geometry.viewport+1,
      "No horizontal overflow: "+JSON.stringify(geometry));
    assert.ok(geometry.mapLeft>=-1&&geometry.mapRight<=geometry.viewport+1,
      "11x11 map fits Android screen: "+JSON.stringify(geometry));

    await page.locator("#jump-action").click();
    assert.equal(await page.locator("#ui092-sheet").isVisible(),true);
    await page.locator("#door-select").click();
    assert.match(await page.locator("#door-action").textContent(),/Fermer la porte/);
    assert.equal(await page.locator("#turns").textContent(),"0");
    await page.locator("#door-action").click();
    assert.equal(await page.locator("#turns").textContent(),"1");
    await page.locator("#renderer-toggle").click();
    const txt=await page.locator("#dungeon-map").textContent();
    assert.equal(txt.split("\n").length,11);
    assert.ok(txt.includes("+"),"Door closed in ASCII on Android");

    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").click();
    assert.equal(await page.locator("#turns").textContent(),"1");
    assert.ok((await page.locator("#dungeon-map").textContent()).includes("+"));
    await page.locator("#jump-action").click();
    assert.equal(await page.locator("#ui092-sheet").isVisible(),true);
    await page.locator("#door-select").click();
    assert.match(await page.locator("#door-action").textContent(),/Ouvrir la porte/);
    await page.locator("#door-action").click();
    assert.equal(await page.locator("#turns").textContent(),"2");
    await page.locator("#renderer-toggle").click();
    // Diagnostic capture is handled by the runner exit trap: avoid ADB screenshot
    // contention while the Android Chrome DevTools session is active.

    // Make the local host unreachable from the device, with Chrome still alive:
    // the document and ES modules must be served from the PWA cache.
    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:10000});
    adb("reverse","--remove","tcp:8765");
    forwarding=false;
    await page.reload({waitUntil:"load",timeout:20000});
    await page.locator("#title-continue").click();
    assert.equal(await page.locator("#tile-map .pixel-tile").count(),121);
    assert.equal(await page.locator("#turns").textContent(),"2");
    const saved=await page.evaluate(async()=>{
      const {SAVE_KEY}=await import("./game.js");
      return JSON.parse(localStorage.getItem(SAVE_KEY));
    });
    assert.deepEqual([saved.run.x,saved.run.y],[chosen.from.x,chosen.from.y]);
    assert.equal(saved.run.doors.find(d=>d.x===chosen.door.x&&d.y===chosen.door.y).open,true);
    console.log("ANDROID 13 PWA: camera / door action / ASCII / save / offline PASS");
  } finally {
    if(!forwarding)adb("reverse","tcp:8765","tcp:8765");
    await browser.close();
  }
});


test("DEV-081: Android 13 Chrome tests opaque doors, remembered fog, no target leak and offline reload", {timeout:115000}, async()=>{
  const browser=await androidBrowser();
  let forwarding=true;
  try{
    const context=browser.contexts()[0];
    assert.ok(context,"Chrome Android browser context");
    const page=context.pages().find(p=>p.url().includes("127.0.0.1:8765"))||await context.newPage();
    await page.goto(URL,{waitUntil:"load",timeout:20000});
    const scenario=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const fog=await import("./exploration-visibility.js");
      const start=game.newGame();start.meta.descents=1;
      const state=game.beginRun(start).state;
      const run=state.run;
      const enemy=structuredClone(run.enemies[0]);
      run.enemies=[];
      let chosen=null;
      for(const door of run.doors){
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
          const from={x:door.x-dx,y:door.y-dy};
          const behind={x:door.x+dx,y:door.y+dy};
          if(![".","S","$"].includes(run.map[from.y]?.[from.x]))continue;
          if(![".","S","$"].includes(run.map[behind.y]?.[behind.x]))continue;
          door.open=false;
          run.x=from.x;run.y=from.y;
          run.exploration.seen=[];
          fog.revealAround(run);
          if(fog.explorationState(run,behind.x,behind.y)==="unknown"){
            chosen={door:{x:door.x,y:door.y},behind,from};
            break;
          }
          door.open=true;
        }
        if(chosen)break;
      }
      if(!chosen)throw Error("No closed door with unknown safe tile behind it");
      if(!game.validateSave(state))throw Error("Invalid DEV-081 door scenario");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
      return {...chosen,enemy};
    });
    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").click();
    assert.equal(await page.locator("#tile-map .pixel-tile").count(),121);
    assert.ok(await page.locator("#tile-map .tile-unknown").count()>0,
      "Unexplored room is black on actual Android Chrome");
    assert.equal(await page.locator("#exploration-map-panel").isHidden(),false);
    const first=await page.evaluate(async loc=>{
      const game=await import("./game.js");
      const saved=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      const fog=await import("./exploration-visibility.js");
      return {inspection:game.inspectTile(saved,loc.x,loc.y),
        knowledge:fog.explorationState(saved.run,loc.x,loc.y)};
    },scenario.behind);
    assert.equal(first.inspection.kind,"unknown");
    assert.equal(first.knowledge,"unknown");
    const mini0=(await page.locator("#exploration-mini-map").textContent()).split("\n");
    assert.equal(mini0[scenario.behind.y][scenario.behind.x]," ",
      "Door opacity hides its room in the minimap");

    await page.locator("#jump-action").click();
    assert.equal(await page.locator("#ui092-sheet").isVisible(),true);
    await page.locator("#door-select").click();
    assert.match(await page.locator("#door-action").textContent(),/Ouvrir/);
    await page.locator("#door-action").click();
    assert.equal(await page.locator("#turns").textContent(),"1");
    const seen=await page.evaluate(async loc=>{
      const game=await import("./game.js");
      const fog=await import("./exploration-visibility.js");
      const s=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return fog.explorationState(s.run,loc.x,loc.y);
    },scenario.behind);
    assert.equal(seen,"visible","Opened door makes the room visible");
    await page.locator("#door-action").click();
    assert.equal(await page.locator("#turns").textContent(),"2");
    const mini1=(await page.locator("#exploration-mini-map").textContent()).split("\n");
    assert.equal(mini1[scenario.behind.y][scenario.behind.x],":",
      "Door closed again: knowledge persists, but vision stops");
    await page.locator("#renderer-toggle").click();
    assert.ok((await page.locator("#dungeon-map").textContent()).includes(":"));
    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").click();
    assert.equal(await page.locator("#turns").textContent(),"2");
    assert.equal((await page.locator("#exploration-mini-map").textContent()).split("\n")
      [scenario.behind.y][scenario.behind.x],":");

    await page.evaluate(({behind,enemy})=>{
      const saveKey="rogov-web-v1";
      const s=JSON.parse(localStorage.getItem(saveKey));
      s.run.enemies=[{...enemy,x:behind.x,y:behind.y}];
      s.run.targetId=enemy.id;
      localStorage.setItem(saveKey,JSON.stringify(s));
    },scenario);
    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").click();
    assert.equal(await page.locator("#tile-map [data-enemy-id]").count(),0);
    assert.equal(await page.locator("#target-choices button").count(),0);
    assert.equal(await page.locator("#combat-panel").isHidden(),true);
    assert.equal(await page.locator("#threat-forecast").isHidden(),true);
    assert.match(await page.locator("#threat-state").textContent(),/AUCUNE MENACE VISIBLE/);

    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:10000});
    adb("reverse","--remove","tcp:8765");
    forwarding=false;
    await page.reload({waitUntil:"load",timeout:20000});
    await page.locator("#title-continue").click();
    assert.equal(await page.locator("#turns").textContent(),"2");
    assert.equal((await page.locator("#exploration-mini-map").textContent()).split("\n")
      [scenario.behind.y][scenario.behind.x],":");
    assert.equal(await page.locator("#target-choices button").count(),0);
    console.log("DEV-081 ANDROID FOG: door LOS / memory / hidden threats / offline PASS");
  }finally{
    if(!forwarding)adb("reverse","tcp:8765","tcp:8765");
    await browser.close();
  }
});


test("DEV-082: Android Chrome confirms visible clue, one-turn secret search, one-off loot and offline save", {timeout:115000}, async()=>{
  const browser=await androidBrowser();
  let forwarded=true;
  try{
    const context=browser.contexts()[0];
    assert.ok(context);
    const page=context.pages().find(p=>p.url().includes("127.0.0.1:8765"))||await context.newPage();
    await page.goto(URL,{waitUntil:"load",timeout:20000});
    const scenario=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const init=game.newGame();
      init.meta.descents=1;
      const state=game.beginRun(init).state;
      state.run.enemies=[];
      const secret=state.run.secrets[0];
      state.run.x=secret.clue.x;
      state.run.y=secret.clue.y;
      if(!game.validateSave(state))throw Error("Invalid DEV-082 secret layout");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
      return {x:secret.x,y:secret.y,clue:secret.clue,kind:secret.kind};
    });
    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").click();
    // Tests share the same persistent Android Chrome profile: a previous test
    // can leave ASCII selected, so explicitly select the graphics renderer.
    if(await page.locator("#tile-map").isHidden())
      await page.locator("#renderer-toggle").click();
    assert.equal(await page.locator("#tile-map").isVisible(),true);
    assert.equal(await page.locator("#turns").textContent(),"0");
    assert.equal(await page.locator("#secret-clue").isVisible(),true);
    assert.equal(await page.locator("#secret-search").isEnabled(),true);
    const before=await page.evaluate(async({x,y})=>{
      const game=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return game.inspectTile(state,x,y).kind;
    },scenario);
    assert.equal(before,"wall");
    await page.locator("#jump-action").click();
    assert.equal(await page.locator("#ui092-sheet").isVisible(),true);
    await page.locator("#secret-search").click();
    assert.equal(await page.locator("#turns").textContent(),"1");
    assert.ok(await page.locator("#tile-map .tile-secret_open").count()>0);
    assert.equal(await page.locator("#secret-clue").isHidden(),true);
    const revealed=await page.evaluate(async()=>{
      const game=await import("./game.js");
      return JSON.parse(localStorage.getItem(game.SAVE_KEY));
    });
    assert.equal(revealed.run.secrets[0].revealed,true);
    assert.equal(revealed.run.secrets[0].claimed,false);
    assert.equal(revealed.run.map[scenario.y][scenario.x],".");
    assert.equal((await page.locator("#exploration-mini-map").textContent()).split("\n")
      [scenario.y][scenario.x],"?");
    await page.locator("#renderer-toggle").click();
    assert.equal(await page.locator("#dungeon-map").isVisible(),true);
    assert.ok((await page.locator("#dungeon-map").textContent()).includes("?"),
      "Revealed secret must also appear in ASCII on Android");
    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").click();
    assert.equal(await page.locator("#turns").textContent(),"1");
    const dx=scenario.x-scenario.clue.x;
    const dy=scenario.y-scenario.clue.y;
    const dir=dx===1?"right":dx===-1?"left":dy===1?"down":"up";
    await page.locator('[data-direction="'+dir+'"]').click();
    assert.equal(await page.locator("#turns").textContent(),"2");
    const reward=await page.evaluate(async()=>{
      const game=await import("./game.js");
      return JSON.parse(localStorage.getItem(game.SAVE_KEY));
    });
    assert.equal(reward.run.secrets[0].claimed,true);
    assert.equal(reward.run.carried["consumable.bandage"],1);
    assert.equal(reward.meta.hero.xp,1);

    await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{timeout:10000});
    adb("reverse","--remove","tcp:8765");
    forwarded=false;
    await page.reload({waitUntil:"load",timeout:20000});
    await page.locator("#title-continue").click();
    const offline=await page.evaluate(async()=>{
      const game=await import("./game.js");
      return JSON.parse(localStorage.getItem(game.SAVE_KEY));
    });
    assert.equal(offline.run.secrets[0].claimed,true);
    assert.equal(offline.run.carried["consumable.bandage"],1);
    assert.equal(offline.run.turns,2);
    console.log("DEV-082 ANDROID SECRET: clue / search / reveal / one-off loot / offline PASS");
  }finally{
    if(!forwarded)adb("reverse","tcp:8765","tcp:8765");
    await browser.close();
  }
});


test("QA-084 Android Chrome: first deep chamber visibly contains foe, chest, rift; tactile chest opens", {timeout:90000}, async()=>{
  const browser=await androidBrowser();
  try{
    const context=browser.contexts()[0];
    const page=context.pages().find(p=>p.url().includes("127.0.0.1:8765"))||await context.newPage();
    await page.goto(URL,{waitUntil:"load",timeout:20000});
    const chest=await page.evaluate(async()=>{
      const game=await import("./game.js");
      const s=game.newGame();s.meta.descents=1;
      const state=game.beginRun(s).state;
      if(!game.validateSave(state))throw Error("QA-084 deep save invalid");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
      const k=Object.keys(state.run.loot).find(key=>state.run.loot[key]==="consumable.bandage");
      const [x,y]=k.split(",").map(Number);
      return {x,y};
    });
    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").click();
    if(await page.locator("#tile-map").isHidden())
      await page.locator("#renderer-toggle").click();
    assert.ok(await page.locator("#tile-map .tile-charognard").count()>0,"Missing visible first enemy on Android");
    assert.ok(await page.locator("#tile-map .tile-loot").count()>0,"Missing visible first chest on Android");
    assert.ok(await page.locator("#tile-map .tile-hazard").count()>0,"Missing visible first rift on Android");
    const evidence=await page.evaluate(()=>{
      return {
        enemies:document.querySelectorAll("#tile-map .tile-charognard").length,
        chests:document.querySelectorAll("#tile-map .tile-loot").length,
        rifts:document.querySelectorAll("#tile-map .tile-hazard").length
      };
    });
    await page.evaluate(async()=>{
      const game=await import("./game.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      state.run.enemies=[]; // isolate interaction once visual encounter confirmed
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(state));
    });
    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").click();
    const route=await page.evaluate(async chest=>{
      const game=await import("./game.js");
      const {deepRoute}=await import("./deep-dungeon.js");
      const state=JSON.parse(localStorage.getItem(game.SAVE_KEY));
      return deepRoute(state.run.map,{x:state.run.x,y:state.run.y},chest);
    },chest);
    assert.ok(route?.length>=3);
    for(let i=1;i<route.length-1;i++){
      const a=route[i-1],b=route[i];
      const direction=b.x>a.x?"right":b.x<a.x?"left":b.y>a.y?"down":"up";
      await page.locator('[data-direction="'+direction+'"]').click();
    }
    assert.equal(await page.locator("#chest-action").isEnabled(),true);
    const before=Number(await page.locator("#turns").textContent());
    await page.locator("#jump-action").click();
    assert.equal(await page.locator("#ui092-sheet").isVisible(),true);
    await page.locator("#chest-action").click();
    assert.equal(Number(await page.locator("#turns").textContent()),before+1);
    const saved=await page.evaluate(async()=>{
      const game=await import("./game.js");
      return JSON.parse(localStorage.getItem(game.SAVE_KEY));
    });
    assert.ok(saved.run.collected.includes(chest.x+","+chest.y));
    assert.equal(saved.run.carried["consumable.bandage"],1);
    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").click();
    assert.equal(await page.locator("#chest-action").isDisabled(),true,"No chest reward duplication after reload");
    console.log("QA-084 ANDROID ENTRY: "+JSON.stringify(evidence)+" / open chest / save PASS");
  }finally{await browser.close();}
});
