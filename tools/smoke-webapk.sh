#!/usr/bin/env bash
set -euo pipefail
APK="webapp/build/outputs/apk/debug/webapp-debug.apk"
PACKAGE="com.rogov.webapk"
echo "APK-098A: install isolated Web/PWA APK on Android 13"
adb install "$APK"
adb logcat -c
adb shell am start -W -n "$PACKAGE/.MainActivity"
sleep 5
pid="$(adb shell pidof "$PACKAGE" | tr -d '\r')"
if [[ -z "$pid" ]]; then
  echo "::error::Modern Web APK exited on launch"
  adb logcat -d -s AndroidRuntime:E
  exit 1
fi
adb forward "tcp:9223" "localabstract:webview_devtools_remote_$pid"
# Cold-starting Android 13 emulators can expose the WebView debug target late.
# Retry only this precisely diagnosed CDP startup issue. Real game assertion
# failures (layout, offline, save, input) stay hard failures.
if node --test tests/webapk-android-emulator.test.mjs 2>&1 | tee /tmp/rogov-webview-first.log; then
  echo "APK-098A: first WebView pass"
elif grep -q "Android WebView JS inspection failed: ROGOV's real WebView target not yet available" /tmp/rogov-webview-first.log; then
  echo "::warning::Android 13 WebView debug target was unavailable on cold start; retrying one clean launch"
  adb shell am force-stop "$PACKAGE"
  adb shell am start -W -n "$PACKAGE/.MainActivity"
  sleep 10
  pid="$(adb shell pidof "$PACKAGE" | tr -d '\r')"
  if [[ -z "$pid" ]]; then
    echo "::error::Modern APK exited on WebView retry"
    adb logcat -d -s AndroidRuntime:E
    exit 1
  fi
  adb forward --remove tcp:9223 || true
  adb forward "tcp:9223" "localabstract:webview_devtools_remote_$pid"
  node --test tests/webapk-android-emulator.test.mjs
else
  echo "::error::WebView failed a real functional assertion, not a cold-start CDP error"
  exit 1
fi
adb shell screencap -p /sdcard/rogov-webapk-qa098a.png
adb pull /sdcard/rogov-webapk-qa098a.png rogov-webapk-qa098a.png
echo "Modern HTML/JS offline APK live UI, save and map passed Android 13 WebView"
