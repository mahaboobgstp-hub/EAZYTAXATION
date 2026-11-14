#!/usr/bin/env python3
"""Inject strict Android on-device speech recognition into generated Capacitor project."""
from pathlib import Path
import re
import xml.etree.ElementTree as ET

root = Path("android")
if not root.exists():
    raise SystemExit("Android project does not exist; run npx cap add android first")

manifest = root / "app/src/main/AndroidManifest.xml"
text = manifest.read_text()
if "android.speech.RecognitionService" not in text:
    text = text.replace("<manifest", '<manifest', 1)
    insert = """
    <queries>
        <intent>
            <action android:name="android.speech.RecognitionService" />
        </intent>
    </queries>
"""
    text = re.sub(r"(\s*<application\b)", insert + r"\1", text, count=1)
manifest.write_text(text)

# Verify that Android launches the BridgeActivity subclass that registers the plugin.
ANDROID_NS = "http://schemas.android.com/apk/res/android"
ET.register_namespace("android", ANDROID_NS)
manifest_tree = ET.parse(manifest)
manifest_root = manifest_tree.getroot()
application = manifest_root.find("application")
if application is None:
    raise SystemExit("Android manifest has no application element.")
launcher = None
for activity in application.findall("activity"):
    intent_filter = activity.find("intent-filter")
    if intent_filter is None:
        continue
    actions = [x.get(f"{{{ANDROID_NS}}}name") for x in intent_filter.findall("action")]
    categories = [x.get(f"{{{ANDROID_NS}}}name") for x in intent_filter.findall("category")]
    if "android.intent.action.MAIN" in actions and "android.intent.category.LAUNCHER" in categories:
        launcher = activity
        break
if launcher is None:
    raise SystemExit("Could not locate Android MAIN/LAUNCHER activity.")
launcher_name = launcher.get(f"{{{ANDROID_NS}}}name", "")
if launcher_name not in (".MainActivity", "com.eazytaxation.mobile.MainActivity"):
    raise SystemExit(f"Unexpected launcher activity '{launcher_name}'. Refusing to build an APK that cannot register the speech plugin.")
manifest_tree.write(manifest, encoding="utf-8", xml_declaration=True)

main = root / "app/src/main/java/com/eazytaxation/mobile/MainActivity.java"
main.parent.mkdir(parents=True, exist_ok=True)
if not main.exists():
    main.write_text("""package com.eazytaxation.mobile;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(OfflineSpeechRecognitionPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
""")
else:
    source = main.read_text()
    if "OfflineSpeechRecognitionPlugin.class" not in source:
        source = source.replace("super.onCreate(savedInstanceState);", "registerPlugin(OfflineSpeechRecognitionPlugin.class);\n        super.onCreate(savedInstanceState);")
        main.write_text(source)

main_source = main.read_text()
if "extends BridgeActivity" not in main_source:
    raise SystemExit("ERROR: Android launcher MainActivity does not extend Capacitor BridgeActivity.")
if "registerPlugin(OfflineSpeechRecognitionPlugin.class);" not in main_source:
    raise SystemExit("ERROR: OfflineSpeechRecognitionPlugin is not registered in the actual launcher MainActivity.")

print(f"Verified Android launcher activity: {launcher_name}")
print("Verified Capacitor BridgeActivity subclass and explicit OfflineSpeechRecognition registration.")

plugin = main.parent / "OfflineSpeechRecognitionPlugin.java"
plugin.write_text(r'''package com.eazytaxation.mobile;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.ArrayList;

@CapacitorPlugin(name = "OfflineSpeechRecognition")
public class OfflineSpeechRecognitionPlugin extends Plugin {
    private SpeechRecognizer recognizer;

    @PluginMethod
    public void checkAvailability(PluginCall call) {
        JSObject result = new JSObject();
        boolean available = SpeechRecognizer.isRecognitionAvailable(getContext());
        boolean onDevice = Build.VERSION.SDK_INT >= 31 && SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext());
        result.put("available", available);
        result.put("onDevice", onDevice);
        result.put("reason", available ? "" : "No Android speech recognition service is installed or available.");
        call.resolve(result);
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
            call.reject("No Android speech recognition service is available on this device.");
            return;
        }
        String language = call.getString("language", "auto");
        getActivity().runOnUiThread(() -> {
            try {
                destroyRecognizer();
                if (Build.VERSION.SDK_INT >= 31 && SpeechRecognizer.isOnDeviceRecognitionAvailable(getContext())) {
                    recognizer = SpeechRecognizer.createOnDeviceSpeechRecognizer(getContext());
                } else {
                    recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
                }
                recognizer.setRecognitionListener(new RecognitionListener() {
                    @Override public void onReadyForSpeech(Bundle params) { notifyListeners("speechStatus", status("ready")); }
                    @Override public void onBeginningOfSpeech() { notifyListeners("speechStatus", status("speaking")); }
                    @Override public void onRmsChanged(float rmsdB) {
                        JSObject data = new JSObject(); data.put("rmsdB", rmsdB); notifyListeners("audioLevel", data);
                    }
                    @Override public void onBufferReceived(byte[] buffer) {}
                    @Override public void onEndOfSpeech() { notifyListeners("speechStatus", status("processing")); }
                    @Override public void onError(int error) {
                        JSObject data = new JSObject(); data.put("code", error); data.put("message", errorMessage(error));
                        notifyListeners("recognitionError", data); destroyRecognizer();
                    }
                    @Override public void onResults(Bundle results) {
                        emitTranscript("recognized", results); destroyRecognizer();
                    }
                    @Override public void onPartialResults(Bundle partialResults) { emitTranscript("partialResults", partialResults); }
                    @Override public void onEvent(int eventType, Bundle params) {}
                });
                Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                if (!"auto".equals(language)) {
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
                    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language);
                }
                if (Build.VERSION.SDK_INT >= 34 && "auto".equals(language)) {
                    intent.putExtra(RecognizerIntent.EXTRA_ENABLE_LANGUAGE_DETECTION, true);
                }
                intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true);
                intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
                recognizer.startListening(intent);
                call.resolve();
            } catch (Exception error) {
                destroyRecognizer();
                call.reject("Could not start offline speech recognition: " + error.getMessage());
            }
        });
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (recognizer != null) {
                try { recognizer.stopListening(); } catch (Exception ignored) {}
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void cancelListening(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (recognizer != null) {
                try { recognizer.cancel(); } catch (Exception ignored) {}
                destroyRecognizer();
            }
            call.resolve();
        });
    }

    private void emitTranscript(String event, Bundle bundle) {
        ArrayList<String> matches = bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (matches == null || matches.isEmpty()) return;
        JSObject data = new JSObject();
        data.put("transcript", matches.get(0));
        data.put("alternatives", new org.json.JSONArray(matches));
        notifyListeners(event, data);
    }

    private JSObject status(String value) {
        JSObject data = new JSObject(); data.put("status", value); return data;
    }

    private String errorMessage(int error) {
        switch (error) {
            case SpeechRecognizer.ERROR_AUDIO: return "Audio recording error.";
            case SpeechRecognizer.ERROR_CLIENT: return "Speech recognition client error.";
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: return "Microphone permission is required.";
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: return "Offline recognition service reported a network error; online fallback is disabled.";
            case SpeechRecognizer.ERROR_NO_MATCH: return "No speech was recognized. Please try again.";
            case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: return "Speech recognizer is busy. Please try again.";
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: return "No speech was detected.";
            default: return "Speech recognition failed (code " + error + ").";
        }
    }

    private void destroyRecognizer() {
        if (recognizer != null) {
            try { recognizer.destroy(); } catch (Exception ignored) {}
            recognizer = null;
        }
    }

}
''')
print("Generated native Android SpeechRecognizer plugin. Offline availability depends on the device recognition provider and language pack.")
