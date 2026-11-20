// APK-098A: verify the actual APK WebView loads the modern JS game offline.
import {test} from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {chromium} from "playwright";

const wait=ms=>new Promise(ok=>setTimeout(ok,ms));
const adb=(...args)=>execFileSync("adb",args,{encoding:"utf8",timeout:30000}).trim();
const ROOT="https://appassets.androidplatform.net/assets/";
async function connectWebView(){
  let last;
  for(let i=0;i<20;i++){
    try{
      const client=await chromium.connectOverCDP("http://127.0.0.1:9223",{timeout:5000});
      const context=client.contexts()[0];
      if(!context){await client.close();throw Error("No WebView context");}
      const page=context.pages().find(p=>p.url().startsWith(ROOT));
      if(!page){await client.close();throw Error("No modern ROGOV asset page");}
      return {client,page};
    }catch(e){last=e;await wait(1000);}
  }
  throw Error("Android WebView CDP unavailable: "+last?.message);
}

test("APK-098A Android 13: current Sprite C / 11x11 game, real panels, persistent offline save", {timeout:135000}, async()=>{
  let {client,page}=await connectWebView();
  try{
    await page.locator("#title-screen").waitFor({state:"visible",timeout:25000});
    const shell=await page.evaluate(()=>({
      host:location.hostname,path:location.pathname,
      ua:navigator.userAgent,secure:isSecureContext,
      title:document.title,
      hasCss:[...document.styleSheets].some(x=>x.href?.includes("art097c1.css")),
      hasApi:typeof localStorage.setItem==="function",
      offlineBypass:location.search.includes("rogov_apk=1")
    }));
    assert.equal(shell.host,"appassets.androidplatform.net");
    assert.equal(shell.path,"/assets/index.html");
    assert.match(shell.ua,/Android/);
    assert.equal(shell.secure,true);
    assert.match(shell.title,/ROGOV/);
    assert.equal(shell.hasCss,true);
    assert.equal(shell.hasApi,true);
    assert.equal(shell.offlineBypass,true);
    await page.locator("#title-continue").click();
    await page.locator("#refuge").waitFor({state:"visible"});
    await page.locator("#start-btn").click();
    await page.locator("#tile-map .pixel-tile").first().waitFor();
    assert.equal(await page.locator("#tile-map .pixel-tile").count(),121);
    assert.equal(await page.locator("#tile-map .tile-hero img").count(),1);
    const initial=await page.locator("#turns").textContent();
    await page.locator("#jump-bag").click();
    assert.equal(await page.locator("#ui092-sheet").isVisible(),true);
    assert.equal(await page.locator("#turns").textContent(),initial);
    await page.locator("#ui092-sheet-close").click();
    await page.locator("#renderer-toggle").click();
    assert.equal(await page.locator("#dungeon-map").isVisible(),true);
    await page.locator("#renderer-toggle").click();
    const state=await page.evaluate(()=>JSON.parse(localStorage.getItem("rogov-web-v1")));
    assert.ok(state?.run);
    assert.equal(state.schemaVersion??state.schema_version,1);
    await page.screenshot({path:"rogov-webapk-qa098a-nhal.png",animations:"disabled"});
    await client.close();

    // Android system process dies; the JS localStorage must survive.
    adb("shell","am","force-stop","com.rogov.webapk");
    adb("shell","am","start","-W","-n","com.rogov.webapk/.MainActivity");
    await wait(2500);
    // The WebView DevTools socket is PID-specific; the process has changed.
    const freshPid=adb("shell","pidof","com.rogov.webapk");
    assert.match(freshPid,/^\\d+$/);
    adb("forward","--remove","tcp:9223");
    adb("forward","tcp:9223","localabstract:webview_devtools_remote_"+freshPid);
    ({client,page}=await connectWebView());
    await page.locator("#title-screen").waitFor({state:"visible"});
    await page.locator("#title-continue").click();
    await page.locator("#tile-map .pixel-tile").first().waitFor();
    assert.equal(await page.locator("#tile-map .pixel-tile").count(),121);
    const continued=await page.evaluate(()=>JSON.parse(localStorage.getItem("rogov-web-v1")));
    assert.equal(continued.run.turns,state.run.turns);
    assert.equal(continued.meta.descents,state.meta.descents);

    // Network stays off: all resources live in APK /assets.
    adb("shell","svc","wifi","disable");
    adb("shell","svc","data","disable");
    await page.reload({waitUntil:"load"});
    await page.locator("#title-continue").click();
    assert.equal(await page.locator("#tile-map .pixel-tile").count(),121);
    assert.equal(await page.locator("#tile-map .tile-hero").count(),1);
    const offlineSave=await page.evaluate(()=>JSON.parse(localStorage.getItem("rogov-web-v1")));
    assert.equal(offlineSave.run.turns,state.run.turns);
  }finally{
    await client?.close().catch(()=>{});
    adb("shell","svc","wifi","enable");
  }
});
