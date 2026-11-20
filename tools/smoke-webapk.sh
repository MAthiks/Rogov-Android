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
node --test tests/webapk-android-emulator.test.mjs
adb shell screencap -p /sdcard/rogov-webapk-qa098a.png
adb pull /sdcard/rogov-webapk-qa098a.png rogov-webapk-qa098a.png
echo "Modern HTML/JS offline APK live UI, save and map passed Android 13 WebView"
