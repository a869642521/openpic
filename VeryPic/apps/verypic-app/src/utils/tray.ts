import { Menu } from '@tauri-apps/api/menu';
import { TrayIcon, TrayIconOptions } from '@tauri-apps/api/tray';
import { defaultWindowIcon } from '@tauri-apps/api/app';
import { Image } from '@tauri-apps/api/image';
import { t } from '@/i18n';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { isMac } from './platform';
import logoPngUrl from '@/assets/LOGO.png';
import { openSettingsWindow } from './window';
import checkForUpdate from './updater';
import { message } from '@tauri-apps/plugin-dialog';
import { isFunction } from 'radash';

declare global {
  interface Window {
    __TRAY_INSTANCE?: TrayIcon;
  }
}

/** 避免 React StrictMode 双次 effect 或并发调用创建两个托盘 */
let trayInitLock = false;

async function resolveTrayIcon(): Promise<Image> {
  const fromApp = await defaultWindowIcon();
  if (fromApp) return fromApp;
  const res = await fetch(logoPngUrl);
  if (!res.ok) throw new Error(`Tray fallback icon fetch failed: ${res.status}`);
  return Image.fromBytes(await res.arrayBuffer());
}

export async function createTrayMenu() {
  if (getCurrentWebviewWindow().label !== 'main') return;
  const menu = await Menu.new({
    items: [
      {
        id: 'open',
        text: t('tray.open'),
        action: async () => {
          await getCurrentWindow().show();
          await getCurrentWindow().setFocus();
        },
        accelerator: 'CmdOrCtrl+O',
      },
      {
        id: 'settings',
        text: t('tray.settings'),
        action: () => {
          openSettingsWindow();
        },
        accelerator: 'CmdOrCtrl+,',
      },
      {
        id: 'check_update',
        text: t('tray.check_update'),
        action: async () => {
          const updater = await checkForUpdate();
          if (!updater) {
            message(t('settings.about.version.no_update_available'), {
              title: t('tray.check_update'),
            });
          }
        },
        accelerator: 'CmdOrCtrl+U',
      },
      {
        id: 'quit',
        text: t('tray.quit'),
        action: () => {
          getCurrentWindow().destroy();
        },
        accelerator: 'CmdOrCtrl+Q',
      },
    ],
  });
  return menu;
}

export async function initTray() {
  if (getCurrentWebviewWindow().label !== 'main' || window.__TRAY_INSTANCE) return;
  if (trayInitLock) return;
  trayInitLock = true;

  const menu = await createTrayMenu();
  const icon = await resolveTrayIcon();
  const options: TrayIconOptions = {
    tooltip: 'VeryPic',
    icon,
    // 仅 macOS 使用模板图；Windows 上误用可能导致托盘区显示异常
    ...(isMac ? { iconAsTemplate: true } : {}),
    menu,
    showMenuOnLeftClick: false,
    action: async (event) => {
      switch (event.type) {
        case 'Click':
          if (event.button === 'Right') return;
          await getCurrentWindow().show();
          await getCurrentWindow().setFocus();
          break;
      }
    },
  };

  try {
    window.__TRAY_INSTANCE = await TrayIcon.new(options);
  } catch (e) {
    trayInitLock = false;
    throw e;
  }
}

export async function destroyTray() {
  if (isFunction(window.__TRAY_INSTANCE?.close)) {
    await window.__TRAY_INSTANCE.close();
    window.__TRAY_INSTANCE = null;
  }
  trayInitLock = false;
}

