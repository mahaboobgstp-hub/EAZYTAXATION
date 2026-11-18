import { Capacitor } from "@capacitor/core";
import { DocumentStorage } from "syd-document-storage";

/**
 * Save a generated document in Android's shared Documents collection.
 * Android MediaStore handles scoped storage; the web app never calls this API.
 * This service is intentionally shared by every SYD document module.
 */
export async function saveDocumentToPublicStorage({
  blob,
  fileName,
  folder = "SYD Documents",
  mimeType = "application/pdf"
}) {
  if (!blob || typeof blob.arrayBuffer !== "function") {
    throw new Error("A valid document file is required.");
  }
  if (!fileName) {
    throw new Error("A file name is required.");
  }
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    throw new Error("Public Android document storage is available only in the installed Android app.");
  }
  if (!Capacitor.isPluginAvailable("DocumentStorage")) {
    throw new Error("The native document storage service is missing from this Android APK. Install the latest SYD remote-shell build.");
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }

  const saved = await DocumentStorage.saveDocument({
    fileName,
    folder,
    data: btoa(binary),
    mimeType
  });

  if (!saved?.uri) {
    throw new Error("Android did not return a saved document location.");
  }
  return saved;
}
