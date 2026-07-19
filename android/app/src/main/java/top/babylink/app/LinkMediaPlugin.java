package top.babylink.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.widget.Toast;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(
    name = "LinkMedia",
    permissions = {
        @Permission(alias = "storage", strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE })
    }
)
public class LinkMediaPlugin extends Plugin {
    private static final int MAX_ENCODED_IMAGE_LENGTH = 48 * 1024 * 1024;

    @PluginMethod
    public void saveImage(PluginCall call) {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storagePermissionCallback");
            return;
        }
        saveImageData(call);
    }

    @PermissionCallback
    private void storagePermissionCallback(PluginCall call) {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.P
            && ContextCompat.checkSelfPermission(getContext(), Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            call.reject("需要存储权限才能保存图片。");
            return;
        }
        saveImageData(call);
    }

    private void saveImageData(PluginCall call) {
        String dataUrl = call.getString("dataUrl", "");
        String requestedName = call.getString("fileName", "link-image.jpg");
        int commaIndex = dataUrl.indexOf(',');
        if (!dataUrl.startsWith("data:image/") || commaIndex < 0 || dataUrl.length() > MAX_ENCODED_IMAGE_LENGTH) {
            call.reject("图片数据无效或超过 36MB。");
            return;
        }

        String mimeType = dataUrl.substring(5, Math.min(commaIndex, dataUrl.length())).split(";", 2)[0];
        String fileName = sanitizeFileName(requestedName, mimeType);
        byte[] bytes;
        try {
            bytes = Base64.decode(dataUrl.substring(commaIndex + 1), Base64.DEFAULT);
        } catch (IllegalArgumentException error) {
            call.reject("图片数据无法解码。", error);
            return;
        }

        getBridge().execute(() -> {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) saveWithMediaStore(bytes, fileName, mimeType);
                else saveLegacy(bytes, fileName, mimeType);
                getActivity().runOnUiThread(() -> Toast.makeText(getContext(), "图片已保存到相册", Toast.LENGTH_SHORT).show());
                JSObject result = new JSObject();
                result.put("saved", true);
                result.put("fileName", fileName);
                call.resolve(result);
            } catch (Exception error) {
                call.reject("图片保存失败。", error);
            }
        });
    }

    private void saveWithMediaStore(byte[] bytes, String fileName, String mimeType) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, fileName);
        values.put(MediaStore.Images.Media.MIME_TYPE, mimeType);
        values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/BabyLink");
        values.put(MediaStore.Images.Media.IS_PENDING, 1);
        Uri uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
        if (uri == null) throw new IllegalStateException("无法创建系统图片文件。");
        try {
            try (OutputStream output = resolver.openOutputStream(uri)) {
                if (output == null) throw new IllegalStateException("无法打开系统图片文件。");
                output.write(bytes);
            }
            values.clear();
            values.put(MediaStore.Images.Media.IS_PENDING, 0);
            resolver.update(uri, values, null, null);
        } catch (Exception error) {
            resolver.delete(uri, null, null);
            throw error;
        }
    }

    @SuppressWarnings("deprecation")
    private void saveLegacy(byte[] bytes, String fileName, String mimeType) throws Exception {
        File directory = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), "BabyLink");
        if (!directory.exists() && !directory.mkdirs()) throw new IllegalStateException("无法创建图片目录。");
        File imageFile = uniqueFile(directory, fileName);
        try (FileOutputStream output = new FileOutputStream(imageFile)) {
            output.write(bytes);
        }
        MediaScannerConnection.scanFile(getContext(), new String[] { imageFile.getAbsolutePath() }, new String[] { mimeType }, null);
    }

    private static File uniqueFile(File directory, String fileName) {
        File candidate = new File(directory, fileName);
        if (!candidate.exists()) return candidate;
        int dotIndex = fileName.lastIndexOf('.');
        String stem = dotIndex > 0 ? fileName.substring(0, dotIndex) : fileName;
        String extension = dotIndex > 0 ? fileName.substring(dotIndex) : "";
        for (int index = 2; index < 10_000; index += 1) {
            candidate = new File(directory, stem + "-" + index + extension);
            if (!candidate.exists()) return candidate;
        }
        return new File(directory, stem + "-" + System.currentTimeMillis() + extension);
    }

    private static String sanitizeFileName(String requestedName, String mimeType) {
        String fileName = requestedName == null ? "" : requestedName.trim().replaceAll("[\\\\/:*?\"<>|]+", "-");
        if (fileName.isEmpty()) fileName = "link-image";
        if (!fileName.matches("(?i).*\\.(?:png|jpe?g|webp|gif)$")) fileName += extensionForMimeType(mimeType);
        return fileName.length() > 120 ? fileName.substring(fileName.length() - 120) : fileName;
    }

    private static String extensionForMimeType(String mimeType) {
        if (mimeType.contains("png")) return ".png";
        if (mimeType.contains("webp")) return ".webp";
        if (mimeType.contains("gif")) return ".gif";
        return ".jpg";
    }
}