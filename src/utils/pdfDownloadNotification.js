import { LocalNotifications } from "@capacitor/local-notifications";

/**
 * Show a native Android notification for a PDF saved on the device.
 * The file URI is carried in notification.extra and handled by the app-level
 * notification listener so tapping the notification opens the exact PDF.
 */
export async function notifyPdfDownloaded({ fileUri, fileName, documentLabel = "PDF" }) {
  if (!fileUri || !fileName) return false;

  try {
    const permission = await LocalNotifications.checkPermissions();
    if (permission.display !== "granted") {
      const requested = await LocalNotifications.requestPermissions();
      if (requested.display !== "granted") return false;
    }

    await LocalNotifications.createChannel({
      id: "pdf-downloads",
      name: "PDF downloads",
      description: "Download notifications for invoices and quotations",
      importance: 4,
      visibility: 1,
      sound: "default"
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
        extra: { fileUri, fileName, mimeType: "application/pdf" },
        schedule: { at: new Date(Date.now() + 700) }
      }]
    });
    return true;
  } catch (error) {
    console.warn("PDF download notification could not be displayed:", error);
    return false;
  }
}
