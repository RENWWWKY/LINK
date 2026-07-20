package top.babylink.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.widget.Toast;

public class LinkUpdateInstallReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        int status = intent.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
        if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            Intent confirmationIntent = intent.getParcelableExtra(Intent.EXTRA_INTENT);
            if (confirmationIntent != null) {
                confirmationIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(confirmationIntent);
            }
            return;
        }
        if (status == PackageInstaller.STATUS_SUCCESS) {
            Toast.makeText(context, "BabyLink 更新安装成功", Toast.LENGTH_LONG).show();
            return;
        }
        String detail = intent.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
        String message = detail == null || detail.trim().isEmpty() ? "BabyLink 更新安装失败" : "BabyLink 更新安装失败：" + detail;
        Toast.makeText(context, message, Toast.LENGTH_LONG).show();
    }
}