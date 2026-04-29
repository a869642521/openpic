import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import EventEmitter from 'eventemitter3';
import { isProd } from '@/utils/platform';
import { Command, Child } from '@tauri-apps/plugin-shell';
import { exists, remove, mkdir } from '@tauri-apps/plugin-fs';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { withStorageDOMEvents } from './withStorageDOMEvents';
import { isFunction } from 'radash';
import { appCacheDir, appDataDir, appLogDir, join, resourceDir } from '@tauri-apps/api/path';
import { toast } from '@/components/sidecar-error-toast';
import { captureError, report } from '@/utils/report';
import { SidecarError } from '@/extends/SidecarError';


interface AppState {
  eventEmitter: EventEmitter;
  sidecar: {
    spawning: boolean;
    process?: Child;
    origin: string;
  } | null;
  imageTempDir: string;
  cacheDir: string;
  logDir: string;
  dataDir: string;
}

interface AppAction {
  initSidecar: () => Promise<void>;
  pingSidecar: () => Promise<void>;
  reportSidecarStderr: () => void;
  destroySidecar: () => Promise<boolean>;
  initAppPath: () => Promise<void>;
  clearImageCache: () => Promise<boolean>;
}

type AppStore = AppState & AppAction;

const errorMessages: string[] = [];

const useAppStore = create(
  persist<AppStore>(
    (set, get) => ({
      eventEmitter: new EventEmitter(),
      sidecar: null,
      imageTempDir: '',
      cacheDir: '',
      logDir: '',
      dataDir: '',
      initSidecar: async () => {
        try {
          errorMessages.length = 0;
          await get().destroySidecar();
          if (getCurrentWebviewWindow().label === 'main') {
            if (isProd) {
              const resDir = await resourceDir();
              const sidecarJs = await join(resDir, 'resources', 'sidecar', 'index.js');
              const sidecarNodePath = await join(resDir, 'resources', 'node_modules');
              const command = Command.sidecar('binaries/verypic-sidecar', [sidecarJs], {
                env: {
                  VERYPIC_SIDECAR_ENABLE: 'true',
                  VERYPIC_SIDECAR_CLUSTER: 'false',
                  VERYPIC_SIDECAR_MODE: 'server',
                  VERYPIC_SIDECAR_STORE: '{}',
                  VERYPIC_SIDECAR_SENTRY_DSN: __VERYPIC_SIDECAR_SENTRY_DSN__,
                  NODE_ENV: 'production',
                  NODE_PATH: sidecarNodePath,
                },
              });
              let originResolved = false;
              command.stdout.on('data', (data) => {
                console.log(`[Start Sidecar Output]: ${data}`);
                if (originResolved) return;
                if (data.includes(`{"origin":"http://localhost:`)) {
                  originResolved = true;
                  try {
                    const jsonStart = data.indexOf('{');
                    const jsonEnd = data.lastIndexOf('}');
                    const response = JSON.parse(data.slice(jsonStart, jsonEnd + 1));
                    report('sidecar_start', { data });
                    set({
                      sidecar: {
                        ...(get().sidecar || ({} as AppState['sidecar'])),
                        origin: response.origin,
                        spawning: false,
                      },
                    });
                    console.log(`[Init Sidecar Success]: Server: ${response.origin}`);
                  } catch (e) {
                    console.error(`[Init Sidecar Parse Error]: ${e}`);
                  }
                }
              });
              command.stderr.on('data', (data) => {
                errorMessages.push(data);
                console.error(`[Start Sidecar Error]: ${data}`);
              });
              const process = await command.spawn();
              command.on('close', (payload) => {
                report('sidecar_close', { errorMessages: errorMessages.join('\n'), payload });
                if (errorMessages.length > 0) {
                  toast({
                    description: errorMessages.join('\n'),
                  });
                  get().reportSidecarStderr();
                }
                get().destroySidecar();
              });
              set({
                sidecar: {
                  ...(get().sidecar || ({} as AppState['sidecar'])),
                  process,
                  spawning: true,
                },
              });
              console.log(`[Init Sidecar Success]: PID ${process.pid}`);
            } else {
              set({ sidecar: { origin: 'http://localhost:3000', spawning: false } });
            }
          } else {
            console.log(`[Sub Window Init Sidecar Success]: Server: ${get().sidecar?.origin}`);
          }
        } catch (error) {
          report('sidecar_start_error', { error: error.message || error.toString() });
          captureError(error);
          console.error(`[Init Sidecar Error]: ${error.message || error.toString()}`);
        }
      },
      pingSidecar: async () => {
        if (get().sidecar?.origin) {
          try {
            const response = await fetch(`${get().sidecar?.origin}/ping`);
            if (response.status !== 200) {
              throw new Error('sidecarHeartbeat error');
            }
            const text = await response.text();
            console.log(`[Sidecar Heartbeat]: ${text}`);
          } catch (error) {
            report('sidecar_heartbeat_error', { error: error.message || error.toString() });
            const errorMessage = `[Sidecar Heartbeat Error]: ${error.message || error.toString()}`;
            console.error(errorMessage);
            get().initSidecar();
            captureError(new SidecarError(errorMessage));
          }
        }
      },
      reportSidecarStderr: () => {
        if (errorMessages.length > 0) {
          const payload = {
            errorMessage: errorMessages.join('\n'),
          };
          captureError(new SidecarError('Sidecar Stderr', payload), payload, 'sidecar_stderr');
          errorMessages.length = 0;
        }
      },
      destroySidecar: async () => {
        try {
          if (isFunction(get().sidecar?.process?.kill)) {
            await get().sidecar.process.kill();
          }
          set({ sidecar: null });
          return true;
        } catch (error) {
          captureError(new Error(`[Destroy Sidecar Error]: ${error.message || error.toString()}`));
          return false;
        }
      },
      initAppPath: async () => {
        const cacheDir = await appCacheDir();
        const imageTempDir = await join(cacheDir, 'verypic_temp');
        const logDir = await appLogDir();
        const dataDir = await appDataDir();
        set({ imageTempDir, cacheDir, logDir, dataDir });
      },
      clearImageCache: async () => {
        try {
          if (await exists(get().imageTempDir)) {
            await remove(get().imageTempDir, { recursive: true });
          }
          await mkdir(get().imageTempDir, { recursive: true });
          return true;
        } catch (error) {
          console.error(`[Clear Image Cache Error]: ${error.message || error.toString()}`);
          captureError(
            new Error(`[Clear Image Cache Error]: ${error.message || error.toString()}`),
            undefined,
            'clear_image_cache_error',
          );
          return false;
        }
      },
    }),
    {
      version: 1,
      name: 'store:app',
      storage: createJSONStorage(() => localStorage),
      // sidecar 状态不持久化：旧 origin 在重启后已失效，恢复后反而导致压缩请求发到无效地址
      partialize: (_state) => ({}) as AppStore,
    },
  ),
);

withStorageDOMEvents(useAppStore, (e) => {
  if (e.newValue) {
    useAppStore.persist.rehydrate();
  }
});

export default useAppStore;
