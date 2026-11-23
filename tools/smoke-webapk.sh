#!/usr/bin/env bash
set -euo pipefail
APK="webapp/build/outputs/apk/debug/webapp-debug.apk"
PACKAGE="com.rogov.webapk"
echo "APK-098A: install isolated Web/PWA APK on Android 13"
adb install "$APK"
adb logcat -c
adb shell am start -W -n "$PACKAGE/.MainActivity"
sleep 5
# Missing PID must reach the explicit error block even under pipefail.
pid_of_app() {
  local found
  found="$(adb shell pidof "$PACKAGE" 2>/dev/null || true)"
  printf '%s' "${found//
adb forward "tcp:9223" "localabstract:webview_devtools_remote_$pid"
# Cold-starting Android 13 emulators can expose the WebView debug target late.
# Retry only this precisely diagnosed CDP startup issue. Real game assertion
# failures (layout, offline, save, input) stay hard failures.
if node --test tests/webapk-android-emulator.test.mjs 2>&1 | tee /tmp/rogov-webview-first.log; then
  echo "APK-098A: first WebView pass"
elif grep -Eq "Android WebView JS inspection failed: (ROGOV\x27s real WebView target not yet available|fetch failed)" /tmp/rogov-webview-first.log; then
  echo "::warning::Android 13 WebView CDP unavailable on cold start; checking live process before one clean retry"
  if [[ -z "$(pid_of_app)" ]]; then
    echo "::error::WebView process ended before permitted CDP retry"
    diagnose_webview
    exit 1
  fi
  adb shell am force-stop "$PACKAGE"
  adb shell am start -W -n "$PACKAGE/.MainActivity"
  sleep 10
  pid="$(pid_of_app)"
  if [[ -z "$pid" ]]; then
    echo "::error::Modern APK exited on WebView retry"
    diagnose_webview
    exit 1
  fi
  adb forward --remove tcp:9223 || true
  adb forward "tcp:9223" "localabstract:webview_devtools_remote_$pid"
  if ! node --test tests/webapk-android-emulator.test.mjs; then
    echo "::error::WebView retry failed a functional assertion or CDP connection"
    diagnose_webview
    exit 1
  fi
else
  echo "::error::WebView failed a real functional assertion, not a permitted cold-start CDP error"
  diagnose_webview
  exit 1
fi
adb shell screencap -p /sdcard/rogov-webapk-qa098a.png
adb pull /sdcard/rogov-webapk-qa098a.png rogov-webapk-qa098a.png
echo "Modern HTML/JS offline APK live UI, save and map passed Android 13 WebView"
\r'/}"
}
diagnose_webview() {
  echo "::group::TECH-108A WebView failure evidence"
  echo "Package: $PACKAGE"
  echo "pidof: $(pid_of_app)"
  adb forward --list || true
  adb shell ps -A | grep -E 'rogov|webview|chromium' | tail -n 30 || true
  adb shell dumpsys activity activities | grep -E -i 'rogov|resumed|crash' | tail -n 40 || true
  curl --max-time 4 --silent --show-error http://127.0.0.1:9223/json/list || true
  adb logcat -d -t 1200 | grep -E -i 'AndroidRuntime|FATAL EXCEPTION|com\.rogov\.webapk|crash|chromium' | tail -n 100 || true
  echo "::endgroup::"
}
pid="$(pid_of_app)"
if [[ -z "$pid" ]]; then
  echo "::error::Modern Web APK exited on launch"
  diagnose_webview
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
