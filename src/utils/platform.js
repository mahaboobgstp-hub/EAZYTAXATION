import { Capacitor } from "@capacitor/core";

/**
 * Platform detection.
 *
 * The app currently loads its React UI from a remote Vercel URL.
 * Use the mobile viewport as a fallback when the Capacitor bridge
 * is not detected.
 */

const capacitorPlatform = Capacitor.getPlatform();

const isMobileViewport =
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 768px)").matches;

export const isNativeApp = Capacitor.isNativePlatform();

export const isAndroidApp =
  capacitorPlatform === "android" || isMobileViewport;

export const isWebApp = !isNativeApp;
