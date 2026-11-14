#!/usr/bin/env python3
"""Verify the built APK contains the native speech bridge and required Android declarations."""
from pathlib import Path
from zipfile import ZipFile
import sys
import shutil
import subprocess
import os

apk = Path("android/app/build/outputs/apk/debug/app-debug.apk")
if not apk.is_file():
    raise SystemExit("ERROR: APK was not generated.")

with ZipFile(apk) as archive:
    names = archive.namelist()
    dex_files = [name for name in names if name.startswith("classes") and name.endswith(".dex")]
    if not dex_files:
        raise SystemExit("ERROR: APK contains no DEX bytecode.")
    dex = b"".join(archive.read(name) for name in dex_files)
    required = (
        b"OfflineSpeechRecognition",
        b"OfflineSpeechRecognitionPlugin",
        b"com/eazytaxation/mobile/MainActivity",
        b"android/speech/SpeechRecognizer",
    )
    missing = [item.decode("ascii") for item in required if item not in dex]
    if missing:
        raise SystemExit("ERROR: Native speech bridge missing from APK DEX: " + ", ".join(missing))
# GitHub-hosted runners install the SDK under ANDROID_HOME, not ~/Android/Sdk.
aapt = shutil.which("aapt")
if not aapt:
    sdk_roots = []
    for variable in ("ANDROID_HOME", "ANDROID_SDK_ROOT"):
        value = os.environ.get(variable)
        if value:
            candidate = Path(value)
            if candidate not in sdk_roots:
                sdk_roots.append(candidate)
    sdk_roots.append(Path.home() / "Android" / "Sdk")
    candidates = []
    for sdk_root in sdk_roots:
        candidates.extend((sdk_root / "build-tools").glob("*/aapt"))
    if candidates:
        def version_key(path):
            return tuple(int(part) if part.isdigit() else 0 for part in path.parent.name.split("."))
        aapt = str(sorted(candidates, key=version_key)[-1])
if not aapt:
    raise SystemExit("ERROR: Android aapt tool not found; cannot verify packaged microphone permission.")
permissions = subprocess.run([aapt, "dump", "permissions", str(apk)], capture_output=True, text=True)
if permissions.returncode != 0 or "android.permission.RECORD_AUDIO" not in permissions.stdout:
    raise SystemExit("ERROR: APK manifest does not declare android.permission.RECORD_AUDIO.")

print("APK verification passed:")
print(" - Native OfflineSpeechRecognition plugin class is packaged")
print(" - Android MainActivity is packaged")
print(" - Android SpeechRecognizer API is referenced")
print(" - Microphone permission is packaged")
print(f" - APK size: {apk.stat().st_size:,} bytes")
