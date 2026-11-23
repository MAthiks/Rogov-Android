// APK-098A: real Android 13 WebView CDP test using built-in Node 22 WebSocket.
// WebView does NOT support Browser.setDownloadBehavior (Playwright connectOverCDP).
import {test} from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {writeFileSync} from "node:fs";

const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
const adb=(...args)=>execFileSync("adb",args,{encoding:"utf8",timeout:30000}).trim();
const ROOT="https://appassets.androidplatform.net/assets/";

async function connect(){
  let previous;
  for(let tries=0;tries<45;tries++){
    let socket;
    try{
      const resp=await fetch("http://127.0.0.1:9223/json/list");
      if(!resp.ok)throw Error("CDP HTTP "+resp.status);
      const discovered=await resp.json();
      const target=discovered.find(t=>t.url?.startsWith(ROOT)&&t.webSocketDebuggerUrl);
      if(!target)throw Error("ROGOV's real WebView target not yet available; listed targets="+
        JSON.stringify(discovered.map(t=>({type:t.type,url:t.url,
          hasSocket:Boolean(t.webSocketDebuggerUrl)})).slice(0,6)));
      socket=new WebSocket(target.webSocketDebuggerUrl);
      await new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>reject(Error("WebSocket timed out")),3500);
        socket.addEventListener("open",()=>{clearTimeout(timeout);resolve();},{once:true});
        socket.addEventListener("error",()=>{clearTimeout(timeout);reject(Error("CDP socket failed"));},{once:true});
      });
      let next=0;
      const outstanding=new Map();
      socket.addEventListener("message",event=>{
        const response=JSON.parse(event.data);
        if(response.method==="Runtime.exceptionThrown"){
          console.error("APK098A WEBVIEW JS EXCEPTION:",
            JSON.stringify(response.params?.exceptionDetails).slice(0,650));
        }
        if(!response.id)return;
        const job=outstanding.get(response.id);
        if(!job)return;
        outstanding.delete(response.id);
        if(response.error)job.reject(Error(JSON.stringify(response.error)));
        else job.resolve(response.result);
      });
      // Cold Android WebView sockets occasionally close between the CDP
      // target lookup and Runtime.enable. Keep an actual timeout for every
      // request: an unresolved promise alone does NOT keep Node's loop alive
      // and otherwise becomes an unhelpful cancelledByParent CI failure.
      socket.addEventListener("close",()=>{
        for(const [id,job] of outstanding){
          outstanding.delete(id);
          job.reject(Error("CDP WebSocket closed before response"));
        }
      });
      const call=(method,params={})=>new Promise((resolve,reject)=>{
        const id=++next;
        // Android emulators sometimes spend several seconds on compositing.
        // This remains a HARD deadline; a genuinely unresponsive WebView
        // still fails rather than leaving an unresolved CDP promise.
        const timeout=setTimeout(()=>{
          outstanding.delete(id);
          const detail=method==="Runtime.evaluate"?
            ": "+String(params.expression).slice(0,110):"";
          reject(Error("CDP startup or command timed out: "+method+detail));
        },15000);
        outstanding.set(id,{
          resolve:value=>{clearTimeout(timeout);resolve(value);},
          reject:error=>{clearTimeout(timeout);reject(error);}
        });
        try{socket.send(JSON.stringify({id,method,params}));}
        catch(error){
          outstanding.delete(id);clearTimeout(timeout);reject(error);
        }
      });
      const evaluate=async expression=>{
        const data=await call("Runtime.evaluate",{
          expression,returnByValue:true,awaitPromise:true,userGesture:true
        });
        if(data.exceptionDetails)throw Error("Page JS error: "+
          (data.exceptionDetails.text||JSON.stringify(data.exceptionDetails)));
        return data.result?.value;
      };
      await call("Runtime.enable");
      await call("Page.enable");
      return {call,evaluate,close:()=>socket.close()};
    }catch(e){
      previous=e;
      try{socket?.close();}catch{/* Socket already closed or connecting. */}
      await pause(750);
    }
  }
  throw Error("Android WebView JS inspection failed: "+previous?.message);
}

async function until(dev,expression,expect=true,timeout=30000){
  const start=Date.now();
  let value,last;
  while(Date.now()-start<timeout){
    try{
      value=await dev.evaluate(expression);
      if(expect(value))return value;
    }catch(e){last=e;}
    await pause(250);
  }
  throw Error("Wait for DOM failed: "+expression+" last="+(last?.message||JSON.stringify(value)));
}
const isTrue=x=>x===true;

// Schedule synthetic controls instead of forcing the whole synchronous scene
// render to complete before Runtime.evaluate can respond. The subsequent
// DOM, save, offline and viewport assertions remain the acceptance gate.
async function queueClick(dev,selector){
  const submitted=await dev.evaluate(`(()=>{
    const button=document.querySelector(${JSON.stringify(selector)});
    if(!button||button.disabled)throw Error("UI control unavailable");
    setTimeout(()=>button.click(),0);
    return true;
  })()`);
  assert.equal(submitted,true,"UI click must be queued: "+selector);
}

test("APK-098A: actual Android WebView loads 11x11 modern game, retains save and works offline", {timeout:200000},async()=>{
  let dev=await connect();
  try{
    await until(dev,'document.querySelector("#title-continue")?.textContent.trim()==="COMMENCER"',isTrue,20000);
    const shell=await dev.evaluate(`({
      host:location.hostname,path:location.pathname,
      ua:navigator.userAgent,secure:isSecureContext,
      title:document.title,
      css:[...document.styleSheets].some(s=>s.href?.includes("art097c1.css")),
      bypass:location.search.includes("rogov_apk=1")
    })`);
    assert.equal(shell.host,"appassets.androidplatform.net");
    assert.equal(shell.path,"/assets/index.html");
    assert.match(shell.ua,/Android/i);
    assert.equal(shell.secure,true);
    assert.match(shell.title,/ROGOV/);
    assert.equal(shell.css,true);
    assert.equal(shell.bypass,true);
    await queueClick(dev,"#title-continue");
    await until(dev,'!document.querySelector("#game-shell").hidden && !document.querySelector("#refuge").hidden',isTrue);
    // QA-104: DOM scene readiness is insufficient if the opaque title layer
    // still paints over the game after Android WebView's first frame.
    await until(dev,'document.querySelector("#title-screen").hidden',isTrue);
    await queueClick(dev,"#start-btn");
    // Actual first run is the *legacy tutorial* 15x9 = 135 tiles.
    await until(dev,'document.querySelectorAll("#tile-map .pixel-tile").length===135',isTrue);
    const tutorial=await dev.evaluate(`({
      tiles:document.querySelectorAll("#tile-map .pixel-tile").length,
      hero:document.querySelectorAll("#tile-map .tile-hero img").length,
      hasRun:Boolean(JSON.parse(localStorage.getItem("rogov-web-v1"))?.run)
    })`);
    assert.equal(tutorial.tiles,135);
    assert.equal(tutorial.hero,1);
    assert.equal(tutorial.hasRun,true);

    // Produce the fixture with the SAME real, shared game engine in Node.
    // Generating the full 44x32 deep dungeon *inside* a Debug WebView CDP
    // Runtime.evaluate can stall compositing >10s and kill the Android emulator.
    // Keep all WebView validation real: its restored save must still be parsed,
    // validated, rendered, interacted with, resumed and loaded offline.
    const game=await import("../docs/game.js");
    const newHero=game.newGame();
    newHero.meta.descents=1;
    const deep=game.beginRun(newHero).state;
    assert.equal(game.validateSave(deep),true,"Shared engine fixture must validate");
    const stored=JSON.stringify(deep);
    const mapRows=await dev.evaluate(`(()=>{
      localStorage.setItem("rogov-web-v1",${JSON.stringify(stored)});
      return JSON.parse(localStorage.getItem("rogov-web-v1"))?.run?.map?.length;
    })()`);
    assert.equal(mapRows,deep.run.map.length,"Real Android WebView must persist the fixture");
    await dev.call("Page.reload",{ignoreCache:true});
    // Merely finding a button in parsed HTML is not enough: it must be
    // initialized by app.js with the restored-run description before click.
    await until(dev,'document.querySelector("#title-save-info")?.textContent.includes("Descente en cours")',isTrue,25000);
    await queueClick(dev,"#title-continue");
    await until(dev,'!document.querySelector("#game-shell").hidden && !document.querySelector("#expedition").hidden',isTrue);
    // QA-104: DOM scene readiness is insufficient if the opaque title layer
    // still paints over the game after Android WebView's first frame.
    await until(dev,'document.querySelector("#title-screen").hidden',isTrue);
    await until(dev,'document.querySelectorAll("#tile-map .pixel-tile").length===121',isTrue);
    // Return a compact snapshot. Passing the complete deep map and inventory
    // through CDP returnByValue needlessly blocks constrained Android emulators.
    const scene=await dev.evaluate(`(()=>{
      const s=JSON.parse(localStorage.getItem("rogov-web-v1")||"null");
      return {
        tiles:document.querySelectorAll("#tile-map .pixel-tile").length,
        hero:document.querySelectorAll("#tile-map .tile-hero img").length,
        shortcuts:document.querySelectorAll("#expedition-shortcuts button").length,
        turn:document.querySelector("#turns").textContent.trim(),
        schemaVersion:s?.schemaVersion,hasRun:Boolean(s?.run),
        runTurns:s?.run?.turns,descents:s?.meta?.descents
      };
    })()`);
    assert.equal(scene.tiles,121);
    assert.equal(scene.hero,1);
    assert.equal(scene.shortcuts,6);
    assert.equal(scene.schemaVersion,1);
    assert.equal(scene.hasRun,true);
    await queueClick(dev,"#jump-bag");
    await until(dev,'!document.querySelector("#ui092-sheet").hidden',isTrue);
    // The sheet may be flagged open before Android's first composited frame;
    // insist on a genuinely laid-out, >=44px close button before testing.
    await until(dev,'(()=>{const s=document.getElementById("ui092-sheet"),c=document.getElementById("ui092-sheet-close");return !s.hidden && s.getBoundingClientRect().height>0 && c.getBoundingClientRect().height>=44})()',isTrue,20000);
    assert.equal(await dev.evaluate('document.querySelector("#turns").textContent.trim()'),scene.turn);
    // UI-098B1: inspect the actual rendered Android WebView rather than
    // assuming a green Chromium/PWA result proves the APK has no overlap.
    const drawer=await dev.evaluate(`(()=>{
      const get=id=>document.getElementById(id);
      const sheet=get("ui092-sheet"),dock=get("field-controls"),
        body=get("ui092-sheet-body"),close=get("ui092-sheet-close"),
        empty=get("bag-items").querySelector(".empty");
      empty?.scrollIntoView({block:"end",inline:"nearest"});
      const s=sheet.getBoundingClientRect(),d=dock.getBoundingClientRect(),
        b=body.getBoundingClientRect(),c=close.getBoundingClientRect(),
        e=empty?.getBoundingClientRect();
      const target=document.elementFromPoint(c.left+c.width/2,c.top+c.height/2);
      return {
        loaded:[...document.styleSheets].some(x=>x.href?.includes("ui098b1.css")),
        clearance:d.top-s.bottom,
        closeHeight:c.height,
        closeHit:target===close||close.contains(target),
        bodyOverflow:getComputedStyle(body).overflowY,
        emptyFullyVisible:Boolean(e&&e.top>=b.top-1&&e.bottom<=b.bottom+1),
        emptyText:empty?.textContent.trim(),
        horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1
      };
    })()`);
    assert.equal(drawer.loaded,true,"Actual APK must ship UI-098B1 CSS");
    assert.ok(drawer.clearance>=5,"Android WebView panel must clear D-pad: "+JSON.stringify(drawer));
    assert.ok(drawer.closeHeight>=44&&drawer.closeHit,"Close remains touchable: "+JSON.stringify(drawer));
    assert.equal(drawer.bodyOverflow,"auto");
    assert.equal(drawer.emptyFullyVisible,true,"Real empty-bag message must not be clipped");
    assert.match(drawer.emptyText,/Ton sac est vide/);
    assert.equal(drawer.horizontalOverflow,false);
    // Android SurfaceFlinger can still show the PREVIOUS composited frame
    // after DOM assertions pass. Let the opened drawer actually paint.
    await pause(1100);
    adb("shell","screencap","-p","/sdcard/rogov-webapk-ui098b1-bag.png");
    execFileSync("adb",["pull","/sdcard/rogov-webapk-ui098b1-bag.png",
      "rogov-webapk-ui098b1-bag.png"],{stdio:"pipe",timeout:30000});
    await queueClick(dev,"#ui092-sheet-close");
    await until(dev,'document.querySelector("#ui092-sheet").hidden',isTrue);
    await queueClick(dev,"#renderer-toggle");
    await until(dev,'!document.querySelector("#dungeon-map").hidden',isTrue);
    await queueClick(dev,"#renderer-toggle");
    await until(dev,'document.querySelector("#dungeon-map").hidden',isTrue);
    // Let WebView's disk-backed DOM Storage finish persisting before a
    // simulated OS process death. This does not modify gameplay state.
    await pause(3000);
    dev.close();

    // Kill/restart the native application; Web localStorage must persist.
    adb("shell","am","force-stop","com.rogov.webapk");
    adb("shell","am","start","-W","-n","com.rogov.webapk/.MainActivity");
    await pause(2300);
    const pid=adb("shell","pidof","com.rogov.webapk");
    assert.match(pid,/^\d+$/);
    adb("forward","--remove","tcp:9223");
    adb("forward","tcp:9223","localabstract:webview_devtools_remote_"+pid);
    dev=await connect();
    await until(dev,'document.querySelector("#title-save-info")?.textContent.includes("Descente en cours")',isTrue,25000);
    const beforeResume=await dev.evaluate(`({
      savePresent:!!localStorage.getItem("rogov-web-v1"),
      run:JSON.parse(localStorage.getItem("rogov-web-v1")||"null")?.run?.turns,
      title:document.querySelector("#title-continue")?.textContent,
      warning:document.querySelector("#warning")?.textContent,
      saveInfo:document.querySelector("#title-save-info")?.textContent
    })`);
    console.log("APK098A AFTER PROCESS RESTART:",JSON.stringify(beforeResume));
    // A previous successful restore must reopen the actual scene, not only
    // leave a stale button in the DOM. Queue the click and check real pixels.
    // Android may replace a debug WebView target while processing the click.
    // If transport closes, verify the native PID is still alive and reattach
    // to that SAME app; never skip the save, scene, map or offline assertions.
    try{
      await queueClick(dev,"#title-continue");
    }catch(error){
      if(!/CDP WebSocket closed before response|CDP startup or command timed out/i.test(String(error)))
        throw error;
      let currentPid;
      try{currentPid=adb("shell","pidof","com.rogov.webapk");}
      catch{
        try{console.error("APK098A PROCESS LOGCAT:",adb("logcat","-d","-s","AndroidRuntime:E").slice(-3000));}
        catch{/* Keep the original missing-process diagnosis. */}
        throw Error("APK098A native application died while resuming a saved run: "+error.message);
      }
      assert.match(currentPid,/^[0-9]+$/,"WebView native process must remain alive");
      console.warn("APK098A transport replaced during resume; native PID still alive:",currentPid);
      try{dev.close();}catch{/* Debug socket already closed. */}
      try{adb("forward","--remove","tcp:9223");}catch{/* Old debug forward already gone. */}
      adb("forward","tcp:9223","localabstract:webview_devtools_remote_"+currentPid);
      dev=await connect();
      const reattached=await dev.evaluate(`(()=>{
        const saved=JSON.parse(localStorage.getItem("rogov-web-v1")||"null");
        return {hasSave:Boolean(saved?.run),schema:saved?.schemaVersion,
          runTurns:saved?.run?.turns,
          sceneVisible:!document.querySelector("#game-shell").hidden &&
            !document.querySelector("#expedition").hidden};
      })()`);
      assert.equal(reattached.hasSave,true,"Save must survive WebView debug reattachment");
      assert.equal(reattached.schema,1);
      assert.equal(reattached.runTurns,scene.runTurns);
      if(!reattached.sceneVisible)
        await queueClick(dev,"#title-continue");
    }
    await until(dev,'!document.querySelector("#game-shell").hidden && !document.querySelector("#expedition").hidden',isTrue,25000);
    // QA-104: DOM scene readiness is insufficient if the opaque title layer
    // still paints over the game after Android WebView's first frame.
    await until(dev,'document.querySelector("#title-screen").hidden',isTrue);
    const afterResume=await dev.evaluate(`({
      tiles:document.querySelectorAll("#tile-map .pixel-tile").length,
      expeditionHidden:document.querySelector("#expedition").hidden,
      refugeHidden:document.querySelector("#refuge").hidden,
      run:JSON.parse(localStorage.getItem("rogov-web-v1")||"null")?.run?.turns
    })`);
    console.log("APK098A AFTER RESUME:",JSON.stringify(afterResume));
    await until(dev,'document.querySelectorAll("#tile-map .pixel-tile").length===121',isTrue);
    const resumed=await dev.evaluate(`(()=>{
      const s=JSON.parse(localStorage.getItem("rogov-web-v1")||"null");
      return {hasRun:Boolean(s?.run),turns:s?.run?.turns,
        descents:s?.meta?.descents,schema:s?.schemaVersion};
    })()`);
    assert.equal(resumed.hasRun,true);
    assert.equal(resumed.schema,1);
    assert.equal(resumed.turns,scene.runTurns);
    assert.equal(resumed.descents,scene.descents);

    // No remote connection: local appassets works with Wi-Fi and data off.
    adb("shell","svc","wifi","disable");
    adb("shell","svc","data","disable");
    // A WebView CDP target can replace its debugger socket on an offline
    // reload, especially after Android toggles Wi-Fi/data in the emulator.
    // Reattach only if the *transport* times out; then perform the exact
    // same save, screen and 11x11 offline assertions. Never skip QA.
    const offlineReady='document.querySelector("#title-save-info")?.textContent.includes("Descente en cours")';
    try{
      await dev.call("Page.reload",{ignoreCache:true});
      await until(dev,offlineReady,isTrue,25000);
    }catch(error){
      if(!/CDP startup or command timed out|CDP WebSocket closed/i.test(String(error)))
        throw error;
      try{dev.close();}catch{/* Stale debugger target already closed. */}
      // Native reloads may recreate WebView's devtools Unix socket even if
      // the app itself is still alive. Forward the CURRENT PID, exactly as
      // we already do after the earlier intentional process restart.
      const currentPid=adb("shell","pidof","com.rogov.webapk");
      assert.match(currentPid,/^[0-9]+$/,"Native WebView must remain alive offline");
      try{adb("forward","--remove","tcp:9223");}catch{/* Old tunnel closed. */}
      adb("forward","tcp:9223","localabstract:webview_devtools_remote_"+currentPid);
      dev=await connect();
      await until(dev,offlineReady,isTrue,30000);
    }
    await queueClick(dev,"#title-continue");
    await until(dev,'!document.querySelector("#game-shell").hidden && !document.querySelector("#expedition").hidden',isTrue);
    // QA-104: DOM scene readiness is insufficient if the opaque title layer
    // still paints over the game after Android WebView's first frame.
    await until(dev,'document.querySelector("#title-screen").hidden',isTrue);
    await until(dev,'document.querySelectorAll("#tile-map .pixel-tile").length===121',isTrue);
    const offline=await dev.evaluate(`(()=>{
      const s=JSON.parse(localStorage.getItem("rogov-web-v1")||"null");
      return {
        count:document.querySelectorAll("#tile-map .pixel-tile").length,
        hero:document.querySelectorAll("#tile-map .tile-hero").length,
        hasRun:Boolean(s?.run),turns:s?.run?.turns,
        descents:s?.meta?.descents,schema:s?.schemaVersion
      };
    })()`);
    assert.equal(offline.count,121);
    assert.equal(offline.hero,1);
    assert.equal(offline.hasRun,true);
    assert.equal(offline.schema,1);
    assert.equal(offline.descents,resumed.descents);
    assert.equal(offline.turns,resumed.turns);
    // Android-native screenshot confirms what an installed user would see.
    // The offline resume and scene have already passed every functional
    // assertion. Let the native screen draw it before taking evidence.
    await pause(1100);
    adb("shell","screencap","-p","/sdcard/rogov-webapk-qa098a-nhal.png");
    execFileSync("adb",["pull","/sdcard/rogov-webapk-qa098a-nhal.png","rogov-webapk-qa098a-nhal.png"],{stdio:"pipe",timeout:30000});
  }finally{
    dev?.close();
    // A vanished Android emulator must not replace the first CDP/gameplay
    // assertion with a secondary adb cleanup error. The actual functional
    // checks above remain hard failures; this only restores host Wi-Fi.
    try{adb("shell","svc","wifi","enable");}
    catch(error){console.warn("APK098A cleanup: emulator unavailable; "+
      "preserving the original test result:",String(error.message).slice(0,200));}
  }
});
