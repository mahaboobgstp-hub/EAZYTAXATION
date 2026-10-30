import { Capacitor } from "@capacitor/core";

/**
 * Platform detection for app-specific behaviour.
 *
 * Keep mobile-only UI and navigation checks behind
 * these helpers. Normal browser behaviour remains unchanged.
 */

export const isNativeApp = Capacitor.isNativePlatform();

export const isAndroidApp =
  Capacitor.getPlatform() === "android";

export const isWebApp = !isNativeApp;
