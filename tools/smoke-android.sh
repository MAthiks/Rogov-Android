#!/usr/bin/env bash
set -euo pipefail
APK="app/build/outputs/apk/debug/app-debug.apk"
PACKAGE="com.rogov.android.installtest"
ACTIVITY="com.rogov.android.MainActivity"

echo "Installing ROGOV on Android emulator"
adb install "$APK"
adb logcat -c
echo "Launching ROGOV"
adb shell am start -W -n "$PACKAGE/$ACTIVITY"
sleep 5
if ! adb shell pidof "$PACKAGE"; then
  echo "ROGOV did not remain running after launch"
  adb logcat -d -s AndroidRuntime:E
  exit 1
fi
adb shell screencap -p /sdcard/rogov-screen.png
adb pull /sdcard/rogov-screen.png rogov-screen.png
echo "ROGOV installed, started and remained alive for 5 seconds."
