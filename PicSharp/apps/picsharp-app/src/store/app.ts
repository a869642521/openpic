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

function sendDebugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
) {
  fetch('http://127.0.0.1:7318/ingest/75a54541-45a0-44fe-af7e-5197dacb917b', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'fe4f29',
    },
    body: JSON.stringify({
      sessionId: 'fe4f29',
      runId: 'pre-fix',
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {});
}

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
          await get().destroySidecar();
          if (getCurrentWebviewWindow().label === 'main') {
            if (isProd) {
              const sidecarNodePath = await join(await resourceDir(), 'node_modules');
              // #region agent log
              sendDebugLog('H4', 'src/store/app.ts:initSidecar:54', 'init-sidecar-entry', {
                isProd,
                label: getCurrentWebviewWindow().label,
                existingOrigin: get().sidecar?.origin || '',
                sidecarNodePath,
              });
              // #endregion
              const command = Command.sidecar('binaries/picsharp-sidecar', '', {
                env: {
                  PICSHARP_SIDECAR_ENABLE: 'true',
                  PICSHARP_SIDECAR_CLUSTER: 'false',
                  PICSHARP_SIDECAR_MODE: 'server',
                  PICSHARP_SIDECAR_STORE: '{}',
                  PICSHARP_SIDECAR_SENTRY_DSN: __PICSHARP_SIDECAR_SENTRY_DSN__,
                  NODE_ENV: 'production',
                  NODE_PATH: sidecarNodePath,
                },
              });
              command.stdout.once('data', (data) => {
                // #region agent log
                sendDebugLog('H4', 'src/store/app.ts:initSidecar:65', 'sidecar-stdout-first', {
                  data: String(data).slice(0, 400),
                });
                // #endregion
                report('sidecar_start', { data });
                console.log(`[Start Sidecar Output]: ${data}`);
                if (data.includes(`{"origin":"http://localhost:`)) {
                  const response = JSON.parse(data);
                  set({
                    sidecar: {
                      ...(get().sidecar || ({} as AppState['sidecar'])),
                      origin: response.origin,
                    },
                  });
                  console.log(`[Init Sidecar Success]: Server: ${response.origin}`);
                } else {
                  captureError(
                    new SidecarError('Sidecar Error', { errorMessage: data }),
                    {
                      errorMessage: data,
                    },
                    'sidecar_error',
                  );
                }
              });
              command.stderr.on('data', (data) => {
                // #region agent log
                sendDebugLog('H1', 'src/store/app.ts:initSidecar:87', 'sidecar-stderr', {
                  chunk: String(data).slice(0, 500),
                });
                // #endregion
                errorMessages.push(data);
                console.error(`[Start Sidecar Error]: ${data}`);
              });
              const process = await command.spawn();
              // #region agent log
              sendDebugLog('H4', 'src/store/app.ts:initSidecar:91', 'sidecar-spawned', {
                pid: process.pid,
              });
              // #endregion
              command.on('close', (payload) => {
                // #region agent log
                sendDebugLog('H1', 'src/store/app.ts:initSidecar:92', 'sidecar-close', {
                  payload,
                  errorCount: errorMessages.length,
                  lastError: errorMessages.at(-1)?.slice?.(0, 500) || '',
                });
                // #endregion
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
        const imageTempDir = await join(cacheDir, 'picsharp_temp');
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
      partialize: (state) =>
        ({
          sidecar: state.sidecar,
        }) as AppStore,
    },
  ),
);

withStorageDOMEvents(useAppStore, (e) => {
  if (e.newValue) {
    useAppStore.persist.rehydrate();
  }
});

export default useAppStore;
