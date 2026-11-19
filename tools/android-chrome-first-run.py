#!/usr/bin/env python3
"""Handle Chrome's fresh-emulator onboarding before attaching DevTools.

Automation is limited to an isolated Android emulator (no real device/account).
Never signs into Google or accepts optional sync.
"""
import re
import subprocess
import time
import xml.etree.ElementTree as ET

URL = "http://127.0.0.1:8765/index.html"
PREFERRED = [
    "use without an account",
    "continue without an account",
    "use chrome without an account",
    "no thanks",
    "not now",
    "skip",
    "accept & continue",
    "accept and continue",
    "continue",
    "next",
    "got it",
    "done",
]
DECLINE = ["add account", "sign in", "turn on sync", "sign in to chrome"]


def cmd(*args, timeout=30):
    return subprocess.run(
        ["adb", *args],
        text=True, capture_output=True, timeout=timeout, check=False
    )


def dump_ui():
    result = cmd("shell", "uiautomator", "dump", "/sdcard/chrome-first-run.xml", timeout=30)
    xml = cmd("shell", "cat", "/sdcard/chrome-first-run.xml").stdout
    if "<hierarchy" not in xml:
        print("UI dump unavailable:", result.stdout, result.stderr, flush=True)
        return []
    root = ET.fromstring(xml[xml.find("<hierarchy"):])
    return [n.attrib for n in root.iter("node")]


def tap(node):
    match = re.search(r"\[(\d+),(\d+)\]\[(\d+),(\d+)\]", node.get("bounds", ""))
    if not match:
        return False
    x1, y1, x2, y2 = map(int, match.groups())
    if x2 <= x1 or y2 <= y1:
        return False
    result = cmd("shell", "input", "tap", str((x1+x2)//2), str((y1+y2)//2))
    return result.returncode == 0


def is_first_run():
    activity = cmd("shell", "dumpsys", "activity", "activities").stdout
    lines = [s for s in activity.splitlines()
             if "ResumedActivity" in s or "topResumedActivity" in s or "mCurrentFocus" in s]
    return "FirstRunActivity" in " ".join(lines)


for step in range(12):
    time.sleep(2)
    nodes = dump_ui()
    # Android 13 may briefly expose a null accessibility root immediately
    # after Chrome starts. This is not a dismissed onboarding screen: retry
    # rather than treating it as an unknown button and failing the build.
    if not nodes and is_first_run():
        print("Chrome first-run UI is not ready; retrying safe inspection.",
              flush=True)
        continue
    labels = [(n.get("text") or n.get("content-desc") or "").strip()
              for n in nodes]
    displayed = [x for x in labels if x]
    print("Chrome onboarding", step, ":", displayed[:35], flush=True)

    if not is_first_run() and not any("welcome to chrome" in s.lower() for s in displayed):
        print("Chrome is no longer showing FirstRunActivity.", flush=True)
        break

    selected = None
    for label in PREFERRED:
        options = [n for n in nodes
                   if (n.get("text", "") + " " + n.get("content-desc", "")).strip().lower() == label
                   and not any(d in label for d in DECLINE)]
        if options:
            selected = options[-1]
            break
    if selected:
        print("Tapping non-account Chrome onboarding:", label, flush=True)
        tap(selected)
    else:
        # On Android 13 Chrome can expose only the "Welcome to Chrome"
        # heading before its acceptance buttons enter the accessibility tree.
        # Waiting is safer than tapping unknown coordinates or aborting.
        print("Chrome first-run controls not ready; retrying safe inspection.",
              flush=True)
        continue

# Explicitly launch the real PWA after the Chrome welcome screen, if passed.
result = cmd("shell", "am", "start", "-W", "-a", "android.intent.action.VIEW",
             "-d", URL, "-p", "com.android.chrome")
print("Opening ROGOV after onboarding:", result.stdout, result.stderr, flush=True)
if "FirstRunActivity" in result.stdout:
    raise SystemExit("Chrome first-run is still active; see UI dump above")
