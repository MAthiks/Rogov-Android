// DEV-080 — Android 13 emulator + real Chrome CDP smoke (not desktop emulation).
// The separate runner starts a local PWA server on port 8765 and forwards it via ADB.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const URL="http://127.0.0.1:8765/index.html";
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
const adb=(...args)=>execFileSync("adb",args,{encoding:"utf8",timeout:12000});

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
    await page.locator("#door-select").click();
    assert.match(await page.locator("#door-action").textContent(),/Ouvrir la porte/);
    await page.locator("#door-action").click();
    assert.equal(await page.locator("#turns").textContent(),"2");
    await page.locator("#renderer-toggle").click();
    // Android Chrome CDP may disconnect on Page.captureScreenshot.
    // Use the emulator's native screenshot API without forcing a CDP render.
    adb("shell","screencap","-p","/sdcard/rogov-dev080-android13.png");
    adb("pull","/sdcard/rogov-dev080-android13.png","rogov-dev080-android13.png");

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
