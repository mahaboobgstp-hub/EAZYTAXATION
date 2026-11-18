import { Capacitor, registerPlugin } from "@capacitor/core";

const CameraPermission = registerPlugin("CameraPermission");

/**
 * Request camera access only when the user chooses to capture a document.
 * Image and document imports should use Android's system Photo Picker /
 * Storage Access Framework so the app never needs broad gallery or storage access.
 */
export async function requestInvoiceCameraPermission() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    return { granted: true, native: false };
  }

  const result = await CameraPermission.requestPermission();
  return { granted: Boolean(result?.granted), native: true };
}

export async function checkInvoiceCameraPermission() {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    return { granted: true, native: false };
  }

  const result = await CameraPermission.checkPermission();
  return { granted: Boolean(result?.granted), native: true };
}
