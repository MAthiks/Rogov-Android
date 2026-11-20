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
  for(let tries=0;tries<30;tries++){
    try{
      const resp=await fetch("http://127.0.0.1:9223/json/list");
      if(!resp.ok)throw Error("CDP HTTP "+resp.status);
      const target=(await resp.json()).find(t=>t.url?.startsWith(ROOT)&&t.webSocketDebuggerUrl);
      if(!target)throw Error("ROGOV's real WebView target not yet available");
      const socket=new WebSocket(target.webSocketDebuggerUrl);
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
      const call=(method,params={})=>new Promise((resolve,reject)=>{
        const id=++next;
        outstanding.set(id,{resolve,reject});
        socket.send(JSON.stringify({id,method,params}));
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
    }catch(e){previous=e;await pause(750);}
  }
  throw Error("Android WebView JS inspection failed: "+previous?.message);
}

async function until(dev,expression,expect=true,timeout=14000){
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

test("APK-098A: actual Android WebView loads 11x11 modern game, retains save and works offline", {timeout:145000},async()=>{
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
    await dev.evaluate('document.querySelector("#title-continue").click();true');
    await until(dev,'!document.querySelector("#game-shell").hidden && !document.querySelector("#refuge").hidden',isTrue);
    await dev.evaluate('document.querySelector("#start-btn").click();true');
    // Actual first run is the *legacy tutorial* 15x9 = 135 tiles.
    await until(dev,'document.querySelectorAll("#tile-map .pixel-tile").length===135',isTrue);
    const tutorial=await dev.evaluate(`({
      tiles:document.querySelectorAll("#tile-map .pixel-tile").length,
      hero:document.querySelectorAll("#tile-map .tile-hero img").length,
      run:JSON.parse(localStorage.getItem("rogov-web-v1"))?.run
    })`);
    assert.equal(tutorial.tiles,135);
    assert.equal(tutorial.hero,1);
    assert.ok(tutorial.run);

    // Next, test the actual 11x11 procedural Nhal camera independently.
    await dev.evaluate(`(async()=>{
      const game=await import("./game.js");
      const newHero=game.newGame();
      newHero.meta.descents=1;
      const deep=game.beginRun(newHero).state;
      if(!game.validateSave(deep))throw Error("Invalid deep expedition fixture");
      localStorage.setItem(game.SAVE_KEY,JSON.stringify(deep));
      return true;
    })()`);
    await dev.call("Page.reload",{ignoreCache:true});
    // Merely finding a button in parsed HTML is not enough: it must be
    // initialized by app.js with the restored-run description before click.
    await until(dev,'document.querySelector("#title-save-info")?.textContent.includes("Descente en cours")',isTrue,25000);
    await dev.evaluate('document.querySelector("#title-continue").click();true');
    await until(dev,'!document.querySelector("#game-shell").hidden && !document.querySelector("#expedition").hidden',isTrue);
    await until(dev,'document.querySelectorAll("#tile-map .pixel-tile").length===121',isTrue);
    const scene=await dev.evaluate(`({
      tiles:document.querySelectorAll("#tile-map .pixel-tile").length,
      hero:document.querySelectorAll("#tile-map .tile-hero img").length,
      shortcuts:document.querySelectorAll("#expedition-shortcuts button").length,
      turn:document.querySelector("#turns").textContent.trim(),
      save:JSON.parse(localStorage.getItem("rogov-web-v1"))
    })`);
    assert.equal(scene.tiles,121);
    assert.equal(scene.hero,1);
    assert.equal(scene.shortcuts,6);
    assert.equal(scene.save.schemaVersion,1);
    assert.ok(scene.save.run);
    await dev.evaluate('document.querySelector("#jump-bag").click();true');
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
    adb("shell","screencap","-p","/sdcard/rogov-webapk-ui098b1-bag.png");
    execFileSync("adb",["pull","/sdcard/rogov-webapk-ui098b1-bag.png",
      "rogov-webapk-ui098b1-bag.png"],{stdio:"pipe",timeout:30000});
    await dev.evaluate('document.querySelector("#ui092-sheet-close").click();true');
    await dev.evaluate('document.querySelector("#renderer-toggle").click();true');
    await until(dev,'!document.querySelector("#dungeon-map").hidden',isTrue);
    await dev.evaluate('document.querySelector("#renderer-toggle").click();true');
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
    await dev.evaluate('document.querySelector("#title-continue").click();true');
    await until(dev,'!document.querySelector("#game-shell").hidden && !document.querySelector("#expedition").hidden',isTrue);
    const afterResume=await dev.evaluate(`({
      tiles:document.querySelectorAll("#tile-map .pixel-tile").length,
      expeditionHidden:document.querySelector("#expedition").hidden,
      refugeHidden:document.querySelector("#refuge").hidden,
      run:JSON.parse(localStorage.getItem("rogov-web-v1")||"null")?.run?.turns
    })`);
    console.log("APK098A AFTER RESUME:",JSON.stringify(afterResume));
    await until(dev,'document.querySelectorAll("#tile-map .pixel-tile").length===121',isTrue);
    const resumed=await dev.evaluate('JSON.parse(localStorage.getItem("rogov-web-v1"))');
    assert.equal(resumed.run.turns,scene.save.run.turns);
    assert.equal(resumed.meta.descents,scene.save.meta.descents);

    // No remote connection: local appassets works with Wi-Fi and data off.
    adb("shell","svc","wifi","disable");
    adb("shell","svc","data","disable");
    await dev.call("Page.reload",{ignoreCache:true});
    await until(dev,'document.querySelector("#title-continue")!==null',isTrue);
    await dev.evaluate('document.querySelector("#title-continue").click();true');
    await until(dev,'document.querySelectorAll("#tile-map .pixel-tile").length===121',isTrue);
    const offline=await dev.evaluate(`({
      count:document.querySelectorAll("#tile-map .pixel-tile").length,
      hero:document.querySelectorAll("#tile-map .tile-hero").length,
      state:JSON.parse(localStorage.getItem("rogov-web-v1"))
    })`);
    assert.equal(offline.count,121);
    assert.equal(offline.hero,1);
    assert.equal(offline.state.run.turns,resumed.run.turns);
    // Android-native screenshot confirms what an installed user would see.
    adb("shell","screencap","-p","/sdcard/rogov-webapk-qa098a-nhal.png");
    execFileSync("adb",["pull","/sdcard/rogov-webapk-qa098a-nhal.png","rogov-webapk-qa098a-nhal.png"],{stdio:"pipe",timeout:30000});
  }finally{
    dev?.close();
    adb("shell","svc","wifi","enable");
  }
});
