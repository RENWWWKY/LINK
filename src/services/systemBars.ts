import { Capacitor, SystemBarType, SystemBars, SystemBarsStyle } from '@capacitor/core';

let listenersInstalled = false;

async function hideNativeStatusBar() {
  try {
    await SystemBars.setStyle({ style: SystemBarsStyle.Light });
    await SystemBars.hide({ bar: SystemBarType.StatusBar });
  } catch {
    return;
  }
}

export function installNativeSystemBars() {
  if (!Capacitor.isNativePlatform()) return;
  document.documentElement.classList.add('is-native-app');
  void hideNativeStatusBar();
  if (listenersInstalled) return;
  listenersInstalled = true;
  const restore = () => void hideNativeStatusBar();
  window.addEventListener('pageshow', restore, { passive: true });
  window.addEventListener('focus', restore, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') restore();
  });
}