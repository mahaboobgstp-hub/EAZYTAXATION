#!/usr/bin/env python3
"""Ensure Capacitor's generated Android app declares WebView microphone permissions."""
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

manifest_path = Path("android/app/src/main/AndroidManifest.xml")
if not manifest_path.is_file():
    raise SystemExit(f"ERROR: Android manifest not found: {manifest_path}")

ANDROID_NS = "http://schemas.android.com/apk/res/android"
ET.register_namespace("android", ANDROID_NS)

try:
    tree = ET.parse(manifest_path)
except ET.ParseError as exc:
    raise SystemExit(f"ERROR: Could not parse {manifest_path}: {exc}")

root = tree.getroot()
if root.tag != "manifest":
    raise SystemExit("ERROR: Unexpected Android manifest root element.")

required_permissions = (
    "android.permission.RECORD_AUDIO",
    "android.permission.MODIFY_AUDIO_SETTINGS",
)
existing = {
    node.get(f"{{{ANDROID_NS}}}name")
    for node in root.findall("uses-permission")
}

added = []
for permission in required_permissions:
    if permission not in existing:
        node = ET.Element("uses-permission")
        node.set(f"{{{ANDROID_NS}}}name", permission)
        application = root.find("application")
        if application is not None:
            root.insert(list(root).index(application), node)
        else:
            root.append(node)
        added.append(permission)

tree.write(manifest_path, encoding="utf-8", xml_declaration=True)

# Fail the build if either required declaration is absent.
verified_tree = ET.parse(manifest_path)
verified = {
    node.get(f"{{{ANDROID_NS}}}name")
    for node in verified_tree.getroot().findall("uses-permission")
}
missing = [permission for permission in required_permissions if permission not in verified]
if missing:
    raise SystemExit("ERROR: Required microphone permissions missing: " + ", ".join(missing))

print("Android microphone permissions verified:")
for permission in required_permissions:
    print(f"  - {permission}" + (" (added)" if permission in added else " (already present)"))
