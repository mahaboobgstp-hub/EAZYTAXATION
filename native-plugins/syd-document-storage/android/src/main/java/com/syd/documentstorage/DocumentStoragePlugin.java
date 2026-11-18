package com.syd.documentstorage;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;

@CapacitorPlugin(name = "DocumentStorage")
public class DocumentStoragePlugin extends Plugin {

    @PluginMethod
    public void saveDocument(PluginCall call) {
        String fileName = call.getString("fileName");
        String folder = call.getString("folder");
        String encodedData = call.getString("data");
        String mimeType = call.getString("mimeType", "application/pdf");

        if (fileName == null || fileName.trim().isEmpty()
                || encodedData == null || encodedData.trim().isEmpty()) {
            call.reject("A file name and file data are required.");
            return;
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
            call.reject("Public Documents saving through MediaStore requires Android 10 or later.");
            return;
        }

        String safeName = fileName.replaceAll("[\\\\/\\\\\\\\]", "_");
        String safeFolder = folder == null || folder.trim().isEmpty()
                ? "SYD Documents"
                : folder.replaceAll("[\\\\/\\\\\\\\]", "_").trim();

        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.MediaColumns.DISPLAY_NAME, safeName);
        values.put(MediaStore.MediaColumns.MIME_TYPE, mimeType);
        values.put(
                MediaStore.MediaColumns.RELATIVE_PATH,
                Environment.DIRECTORY_DOCUMENTS + "/" + safeFolder
        );
        values.put(MediaStore.MediaColumns.IS_PENDING, 1);

        Uri collection = MediaStore.Files.getContentUri("external");
        Uri savedUri = null;
        try {
            savedUri = resolver.insert(collection, values);
            if (savedUri == null) {
                call.reject("Android could not create the document in Documents/" + safeFolder + ".");
                return;
            }

            byte[] bytes = Base64.decode(encodedData, Base64.DEFAULT);
            try (OutputStream output = resolver.openOutputStream(savedUri, "w")) {
                if (output == null) {
                    throw new IllegalStateException("Android did not provide a writable document stream.");
                }
                output.write(bytes);
                output.flush();
            }

            ContentValues publish = new ContentValues();
            publish.put(MediaStore.MediaColumns.IS_PENDING, 0);
            resolver.update(savedUri, publish, null, null);

            JSObject result = new JSObject();
            result.put("uri", savedUri.toString());
            result.put("fileName", safeName);
            result.put("relativePath", Environment.DIRECTORY_DOCUMENTS + "/" + safeFolder);
            call.resolve(result);
        } catch (Exception error) {
            if (savedUri != null) {
                try {
                    resolver.delete(savedUri, null, null);
                } catch (Exception ignored) {
                    // Preserve the original write error for the JavaScript caller.
                }
            }
            call.reject("Unable to save the PDF to Documents/" + safeFolder + ": " + error.getMessage(), error);
        }
    }
}
