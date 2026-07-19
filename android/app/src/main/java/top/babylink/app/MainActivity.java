package top.babylink.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
	private static final String APP_HOME_URL = "https://babylink.top/home";

	@Override
	public void onCreate(Bundle savedInstanceState) {
		registerPlugin(LinkUpdaterPlugin.class);
		registerPlugin(LinkKeepAlivePlugin.class);
		registerPlugin(LinkMediaPlugin.class);
		registerPlugin(LinkDisplayPlugin.class);
		super.onCreate(savedInstanceState);
		LinkDisplayPlugin.applyStoredFullscreen(this);
		getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
			@Override
			public void handleOnBackPressed() {
				WebView webView = getBridge() == null ? null : getBridge().getWebView();
				if (webView == null) return;
				String currentUrl = webView.getUrl();
				String path = currentUrl == null ? null : Uri.parse(currentUrl).getPath();
				if (isRootPath(path)) return;
				if (webView.canGoBack()) webView.goBack();
				else webView.loadUrl(APP_HOME_URL);
			}
		});
		openNotificationRoute(getIntent());
	}

	@Override
	protected void onNewIntent(Intent intent) {
		super.onNewIntent(intent);
		setIntent(intent);
		openNotificationRoute(intent);
	}

	@Override
	public void onResume() {
		super.onResume();
		LinkDisplayPlugin.applyStoredFullscreen(this);
	}

	@Override
	public void onWindowFocusChanged(boolean hasFocus) {
		super.onWindowFocusChanged(hasFocus);
		if (hasFocus) LinkDisplayPlugin.applyStoredFullscreen(this);
	}

	private void openNotificationRoute(Intent intent) {
		Uri uri = intent == null ? null : intent.getData();
		String host = uri == null ? null : uri.getHost();
		String path = uri == null ? null : uri.getPath();
		if (host == null || !(host.equals("babylink.top") || host.endsWith(".babylink.top"))) return;
		if (path == null || !(path.startsWith("/chats/") || path.equals("/voom") || path.equals("/voom/"))) return;
		WebView webView = getBridge() == null ? null : getBridge().getWebView();
		if (webView != null) webView.post(() -> webView.loadUrl(uri.toString()));
	}

	static boolean isRootPath(String path) {
		return path == null
			|| path.isEmpty()
			|| "/".equals(path)
			|| "/home".equals(path)
			|| "/home/".equals(path)
			|| "/access".equals(path)
			|| "/access/".equals(path);
	}
}
