#!/usr/bin/env bash
set -euo pipefail
APK="webapp/build/outputs/apk/debug/webapp-debug.apk"
PACKAGE="com.rogov.webapk"

# A disconnected emulator must never hang logcat or PID collection until the
# GitHub job's 35-minute deadline. A missing PID remains a hard failure.
adb_diagnostic() {
  timeout --signal=TERM --kill-after=2s 7s adb "$@" || true
}
pid_of_app() {
  timeout --signal=TERM --kill-after=2s 7s adb shell pidof "$PACKAGE" 2>/dev/null | tr -d '\r' || true
}
diagnose_webview() {
  echo "::group::TECH-108B1 WebView failure evidence"
  echo "Package: $PACKAGE"
  echo "pidof: $(pid_of_app)"
  adb_diagnostic devices -l
  adb_diagnostic forward --list
  adb_diagnostic shell ps -A | grep -E 'rogov|webview|chromium' | tail -n 30 || true
  adb_diagnostic shell dumpsys activity activities | grep -E -i 'rogov|resumed|crash' | tail -n 40 || true
  curl --max-time 4 --silent --show-error http://127.0.0.1:9223/json/list || true
  adb_diagnostic logcat -d -t 1200 | grep -E -i 'AndroidRuntime|FATAL EXCEPTION|com\.rogov\.webapk|crash|chromium' | tail -n 100 || true
  echo "::endgroup::"
}

echo "APK-098A: install isolated Web/PWA APK on Android 13"
echo "Android WebView provider:"
adb_diagnostic shell cmd webviewupdate get-current-webview-package
adb install "$APK"
adb logcat -c
adb shell am start -W -n "$PACKAGE/.MainActivity"
sleep 5
pid="$(pid_of_app)"
if [[ -z "$pid" ]]; then
  echo "::error::Modern Web APK exited on launch"
  diagnose_webview
  exit 1
fi
adb forward "tcp:9223" "localabstract:webview_devtools_remote_$pid"

# Retry exactly once for a CDP-target/transport cold-start failure while the
# APK process still exists. Functional, save, fog and offline failures never retry.
if node --test tests/webapk-android-emulator.test.mjs 2>&1 | tee /tmp/rogov-webview-first.log; then
  echo "APK-098A: first WebView pass"
elif grep -Eq "Android WebView JS inspection failed: (ROGOV's real WebView target not yet available|fetch failed)" /tmp/rogov-webview-first.log; then
  echo "::warning::Android 13 WebView CDP unavailable on cold start; verifying live process before one retry"
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
  echo "::error::WebView failed a real assertion or non-permitted CDP disconnection"
  diagnose_webview
  exit 1
fi

adb shell screencap -p /sdcard/rogov-webapk-qa098a.png
adb pull /sdcard/rogov-webapk-qa098a.png rogov-webapk-qa098a.png
echo "Modern HTML/JS offline APK live UI, save and map passed Android 13 WebView"
