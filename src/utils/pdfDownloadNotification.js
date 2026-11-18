import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";

/**
 * Post a native Android notification for a PDF already saved on-device.
 * The notification carries the exact file URI so App.jsx can open it on tap.
 */
export async function notifyPdfDownloaded({ fileUri, fileName, documentLabel = "PDF" }) {
  if (!fileUri || !fileName) {
    return { ok: false, reason: "missing-file", message: "The PDF file location is missing." };
  }

  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") {
    return { ok: false, reason: "not-android", message: "Native Android notifications are available only in the installed Android app." };
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
        message: "Android notification permission is disabled. Enable notifications for SYD Billing & Accounting in Android Settings."
      };
    }

    await LocalNotifications.createChannel({
      id: "pdf-downloads",
      name: "PDF downloads",
      description: "Notifications when sales invoice PDFs are downloaded",
      importance: 5,
      visibility: 1,
      sound: "default",
      vibration: true
    });

    const notificationId = Math.max(1, Date.now() % 2147483647);
    await LocalNotifications.schedule({
      notifications: [{
        id: notificationId,
        title: documentLabel + " downloaded",
        body: "Tap to open " + fileName,
        largeBody: fileName,
        channelId: "pdf-downloads",
        autoCancel: true,
        ongoing: false,
        extra: {
          fileUri,
          fileName,
          mimeType: "application/pdf",
          notificationType: "downloaded-pdf"
        },
        schedule: { at: new Date(Date.now() + 1000), allowWhileIdle: true }
      }]
    });

    return { ok: true, notificationId };
  } catch (error) {
    console.error("Native PDF notification failed:", error);
    return {
      ok: false,
      reason: "notification-error",
      message: error?.message || "Android could not post the download notification."
    };
  }
}
