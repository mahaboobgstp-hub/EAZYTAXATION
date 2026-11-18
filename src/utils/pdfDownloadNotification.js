import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

/**
 * Project-wide native download notification service.
 *
 * Use this for every document saved by the Android app: sales invoices,
 * purchase invoices, quotations, expenses, reports and future exports.
 * The notification stores the file URI so the app can open the exact file
 * when the user taps the notification.
 */
export async function notifyDocumentDownloaded({
  fileUri,
  fileName,
  documentLabel = "Document",
  mimeType = "application/pdf",
  channelId = "document-downloads"
}) {
  if (!fileUri || !fileName) {
    return { ok: false, reason: "missing-file", message: "The downloaded file location is missing." };
  }

  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    return { ok: false, reason: "not-android", message: "Native download notifications are available only in the installed Android app." };
  }

  // Detect a stale shell / missing native plugin before attempting a call.
  if (!Capacitor.isPluginAvailable("LocalNotifications")) {
    return {
      ok: false,
      reason: "native-plugin-missing",
      message: 'The Android Local Notifications plugin is not installed in this APK. Please install the latest SYD Android shell.'
    };
  }

  try {
    let permission = await LocalNotifications.checkPermissions();
    if (permission.display !== "granted") {
      permission = await LocalNotifications.requestPermissions();
    }

    if (permission.display !== "granted") {
      return {
        ok: false,
        reason: "permission-denied",
        permission: permission.display,
        message: "Android notifications are disabled. Enable notifications for SYD Billing & Accounting in Android Settings."
      };
    }

    // One shared channel for all downloadable documents across SYD.
    await LocalNotifications.createChannel({
      id: channelId,
      name: "Document downloads",
      description: "Notifications when SYD documents and reports are downloaded",
      importance: 5,
      visibility: 1,
      sound: "default",
      vibration: true
    });

    const notificationId = Math.max(1, Date.now() % 2147483647);
    const result = await LocalNotifications.schedule({
      notifications: [{
        id: notificationId,
        title: documentLabel + " downloaded",
        body: "Tap to open " + fileName,
        largeBody: fileName,
        channelId,
        autoCancel: true,
        ongoing: false,
        isExactNotification: false,
        extra: {
          fileUri,
          fileName,
          mimeType,
          notificationType: "downloaded-document",
          documentLabel
        },
        schedule: { at: new Date(Date.now() + 500) }
      }]
    });

    return {
      ok: true,
      notificationId,
      warning: result?.warning?.message || null
    };
  } catch (error) {
    console.error("Native document download notification failed:", error);
    return {
      ok: false,
      reason: "notification-error",
      message: error?.message || "Android could not post the download notification."
    };
  }
}

/**
 * Backwards-compatible alias for existing sales invoice download callers.
 * New modules should call notifyDocumentDownloaded directly.
 */
export function notifyPdfDownloaded(options) {
  return notifyDocumentDownloaded({
    ...options,
    documentLabel: options?.documentLabel || "Sales invoice",
    mimeType: options?.mimeType || "application/pdf"
  });
}
