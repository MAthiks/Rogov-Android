import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL(p,import.meta.url),"utf8");

test("APK-098A: separate package bundles exact Web/PWA sources via HTTPS asset loader",()=>{
  const gradle=read("../webapp/build.gradle.kts");
  const activity=read("../webapp/src/main/java/com/rogov/webapk/MainActivity.kt");
  const manifest=read("../webapp/src/main/AndroidManifest.xml");
  const settings=read("../settings.gradle.kts");
  const legacy=read("../app/build.gradle.kts");
  assert.match(gradle,/applicationId = "com\.rogov\.webapk"/);
  assert.match(gradle,/assets\.srcDir\("\.\.\/docs"\)/);
  assert.match(gradle,/targetSdk = 33/);
  assert.match(activity,/WebViewAssetLoader\.Builder\(\)/);
  assert.match(activity,/AssetsPathHandler\(this\)/);
  assert.match(activity,/androidplatform\.net\/assets\/index\.html\?rogov_apk=1/);
  assert.match(activity,/domStorageEnabled = true/);
  assert.match(activity,/javaScriptEnabled = true/);
  assert.match(activity,/allowFileAccess = false/);
  assert.match(activity,/request\.url\.host != APP_HOST/);
  assert.match(manifest,/android:allowBackup="false"/);
  assert.match(manifest,/android:screenOrientation="portrait"/);
  assert.match(settings,/include\(":webapp"\)/);
  assert.match(legacy,/applicationIdSuffix = "\.compat"/);
  assert.doesNotMatch(activity,/GameEngine\(|LocalSaveStore\(|AsciiRenderer/);
});
test("APK-098A: web engine untouched except bundled-only service-worker skip",()=>{
  const app=read("../docs/app.js");
  const game=read("../docs/game.js");
  const sw=read("../docs/sw.js");
  assert.match(app,/location\.hostname !== "appassets\.androidplatform\.net"/);
  assert.match(app,/"serviceWorker" in navigator/);
  assert.match(game,/rogov-web-v1/);
  assert.match(sw,/CORE = \[/);
  assert.match(app,/drawTileMap/);
  assert.match(app,/setupUi097A2/);
});
