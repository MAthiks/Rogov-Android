#!/usr/bin/env bash
# DEV-080 QA — real Android 13 emulator + Chrome Web/PWA (NOT the legacy Kotlin APK).
set -euo pipefail
PORT=8765
echo "Launching local DEV-080 PWA web server on host (loopback only)"
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory docs > /tmp/rogov-dev080-web.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
for attempt in $(seq 1 30); do
  if curl --silent --fail "http://127.0.0.1:$PORT/index.html" >/dev/null; then break; fi
  sleep 1
done
curl --fail --silent "http://127.0.0.1:$PORT/deep-dungeon.js" >/dev/null
echo "Android emulator properties:"
adb shell getprop ro.build.version.release
adb shell wm size
if ! adb shell pm list packages | grep -q '^package:com.android.chrome'; then
  echo "::error::Android Chrome is not installed on the Google Play emulator image."
  exit 1
fi
# The device sees the host server at 127.0.0.1 through ADB only; no public deployment.
adb reverse "tcp:$PORT" "tcp:$PORT"
adb forward tcp:9222 localabstract:chrome_devtools_remote
adb shell settings put global window_animation_scale 0 || true
adb shell settings put global transition_animation_scale 0 || true
adb shell settings put global animator_duration_scale 0 || true
echo "Opening ROGOV PWA in Android Chrome, separate from public GitHub Pages"
adb shell am start -W -a android.intent.action.VIEW -d "http://127.0.0.1:$PORT/index.html" -p com.android.chrome --ez com.android.chrome.firstrun.skip true
node --test tests/android-emulator-browser.test.mjs
