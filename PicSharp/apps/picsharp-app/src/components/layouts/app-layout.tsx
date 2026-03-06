import ErrorBoundary from '../error-boundary';
import { Outlet, useLocation } from 'react-router';
import { useEffect, useRef, useLayoutEffect, useContext } from 'react';
import { emit, UnlistenFn } from '@tauri-apps/api/event';
import { PageProgress, PageProgressRef } from '../fullscreen-progress';
import { isFunction } from 'radash';
import { parseOpenWithFiles } from '@/utils/launch';
import useAppStore from '@/store/app';
import useCompressionStore from '@/store/compression';
import useSettingsStore from '@/store/settings';
import { isValidArray, isProd, isLinux, isMac } from '@/utils';
import { parsePaths } from '@/utils/fs';
import { VALID_IMAGE_EXTS, SettingsKey } from '@/constants';
import { useNavigate } from '@/hooks/useNavigate';
import { spawnWindow } from '@/utils/window';
import { useI18n } from '@/i18n';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { updateWatchHistory } from '@/pages/compression/watch-guide';
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import checkForUpdate from '@/utils/updater';
import { sendTextNotification } from '@/utils/notification';
import { useAsyncEffect } from 'ahooks';
import { AppContext } from '@/routes';
import Header from './header';
import SidebarNav from './sidebar-nav';
import { cn } from '@/lib/utils';
import message from '@/components/message';
import { PathTagsInput } from '../path-tags-input';
import { TooltipProvider } from '../ui/tooltip';
import { useTrafficLightStore } from '@/store/trafficLight';
import { useReport } from '@/hooks/useReport';

if (isProd) {
  window.oncontextmenu = (e) => {
    e.preventDefault();
  };
}

export default function AppLayout() {
  const location = useLocation();
  const progressRef = useRef<PageProgressRef>(null);
  const navigate = useNavigate();
  const t = useI18n();
  const { messageApi } = useContext(AppContext);
  const r = useReport();

  useEffect(() => {
    let unlistenNsCompress: UnlistenFn | null = null;
    let unlistenNsWatchAndCompress: UnlistenFn | null = null;
    let unlistenNsWatch: UnlistenFn | null = null;
    let unlistenNsCompressSilent: UnlistenFn | null = null;
    let unlistenNsWatchSilent: UnlistenFn | null = null;
    let unlistenNsSettingsCompress: UnlistenFn | null = null;
    let unlistenNsSettingsWatch: UnlistenFn | null = null;
    let unlistenDeepLink: UnlistenFn | null = null;

    async function process(mode: string, paths: string[]) {
      if (isValidArray(paths)) {
        progressRef.current?.show(true);
        const {
          setWorking,
          setClassicFiles,
          setWatchFiles,
          setWatchingFolder,
          setMode,
          reset,
          setPendingWatchPath,
        } = useCompressionStore.getState();
        if (mode === 'ns_watch') {
          setPendingWatchPath(paths[0]);
          navigate('/compression/watch/workspace');
          setTimeout(() => { progressRef.current?.done(); }, 100);
          return;
        }
        reset();
        if (mode === 'ns_compress') {
          const fileInfos = await parsePaths(paths, VALID_IMAGE_EXTS);
          setMode('classic');
          setWorking(true);
          setClassicFiles(fileInfos);
          navigate('/compression/classic/workspace');
        } else if (mode === 'ns_watch_and_compress') {
          await updateWatchHistory(paths[0]);
          setMode('watch');
          setWatchFiles([]);
          setWatchingFolder(paths[0]);
          setWorking(true);
          navigate('/compression/watch/workspace');
        }
        setTimeout(() => {
          progressRef.current?.done();
        }, 100);
      }
    }

    async function handleSilentCompress(paths: string[]) {
      const currentWindow = WebviewWindow.getCurrent();
      await currentWindow.hide();
      const settingsState = useSettingsStore.getState();
      let defaultsJson = settingsState['context_menu_compress_defaults' as any] as string;
      let defaults: any = {};
      if (defaultsJson) {
        try { defaults = JSON.parse(defaultsJson); } catch {}
      }
      try {
        const fileInfos = await parsePaths(paths, ['png','jpg','jpeg','webp','gif','svg','tiff','tif','avif']);
        if (fileInfos.length === 0) {
          sendTextNotification('PicSharp', '\u672a\u627e\u5230\u53ef\u538b\u7f29\u7684\u56fe\u7247\u6587\u4ef6');
          return;
        }
        const appState = useAppStore.getState();
        const CompressorClass = await import('@/utils/compressor').then(m => m.default);
        const { CompressionMode, CompressionOutputMode } = await import('@/constants');
        const compressor = new CompressorClass({
          concurrency: settingsState['concurrency'] ?? 6,
          compressionMode: defaults.compressionMode ?? settingsState['compression_mode'] ?? CompressionMode.Local,
          compressionLevel: defaults.compressionLevel ?? settingsState['compression_level'] ?? 3,
          compressionType: defaults.compressionType ?? settingsState['compression_type'],
          save: {
            mode: defaults.outputMode ?? settingsState['compression_output'] ?? CompressionOutputMode.Overwrite,
            newFileSuffix: settingsState['compression_output_save_as_file_suffix'] ?? '_min',
            newFolderPath: settingsState['compression_output_save_to_folder'] ?? '',
          },
          tempDir: appState.imageTempDir,
          sidecarDomain: appState.sidecar?.origin,
          tinifyApiKeys: (settingsState['tinypng_api_keys'] as any[])?.map((k: any) => k.api_key) ?? [],
        });
        let succeeded = 0;
        let totalSaved = 0;
        const results = await compressor.compress(
          fileInfos,
          (res: any) => {
            succeeded++;
            totalSaved += Math.max(0, (res.input_size ?? 0) - (res.output_size ?? 0));
          },
        );
        const savedKB = (totalSaved / 1024).toFixed(1);
        sendTextNotification('PicSharp', '\u5df2\u538b\u7f29 ' + succeeded + ' \u5f20\u56fe\u7247\uff0c\u8282\u7701 ' + savedKB + ' KB');
      } catch(e) {
        console.error('[silent compress]', e);
        sendTextNotification('PicSharp', '\u538b\u7f29\u5931\u8d25\uff0c\u8bf7\u67e5\u770b\u65e5\u5fd7');
      }
    }

    async function handleSilentWatch(path: string) {
      const currentWindow = WebviewWindow.getCurrent();
      const { addWatchFolder } = useCompressionStore.getState();
      const settingsState = useSettingsStore.getState();
      let defaultsJson = settingsState['context_menu_watch_defaults' as any] as string;
      let defaults: any = {};
      if (defaultsJson) {
        try { defaults = JSON.parse(defaultsJson); } catch {}
      }
      const { defaultWatchFolderSettings } = await import('@/store/compression');
      const folderSettings = { ...defaultWatchFolderSettings, ...defaults };
      addWatchFolder({
        id: path,
        path,
        addMode: 'compress_then_monitor',
        status: 'monitoring',
        settings: folderSettings,
        stats: null,
      });
      const folderName = path.split(/[\/\\]/).pop() || path;
      sendTextNotification('PicSharp', '\u5df2\u5f00\u59cb\u76d1\u542c ' + folderName);
      await currentWindow.hide();
    }

    async function handleOpenWithFiles() {
      const payload = parseOpenWithFiles();
      if (payload) {
        r('open_with_files', {
          mode: payload.mode,
          paths: payload.paths,
        });
        switch (payload.mode) {
          case 'compress:compare':
            // navigate('/image-compare');
            break;
          case 'ns_watch':
            process('ns_watch', payload.paths);
            break;
          case 'compress-silent':
            handleSilentCompress(payload.paths);
            break;
          case 'watch-silent':
            if (payload.paths[0]) handleSilentWatch(payload.paths[0]);
            break;
          case 'settings-compress':
            await WebviewWindow.getCurrent().show();
            await WebviewWindow.getCurrent().setFocus();
            useSettingsStore.getState().setContextMenuSettingsOpen('compress');
            navigate('/settings/general');
            break;
          case 'settings-watch':
            await WebviewWindow.getCurrent().show();
            await WebviewWindow.getCurrent().setFocus();
            useSettingsStore.getState().setContextMenuSettingsOpen('watch');
            navigate('/settings/general');
            break;
          default:
            process(payload.mode, payload.paths);
            break;
        }
      }
    }

    async function spawnNewWindow(mode: string, paths: string[]) {
      const titles: Record<string, string> = {
        ns_compress: t('ns_compress'),
        ns_watch: t('ns_watch_and_compress'),
        ns_watch_and_compress: t('ns_watch_and_compress'),
      };
      const { working } = useCompressionStore.getState();
      if (working) {
        const result = await message.confirm({
          title: titles[mode],
          description: (
            <TooltipProvider>
              <PathTagsInput
                value={paths}
                disabled
                className='h-[150px] border-neutral-200 dark:border-neutral-700/70'
              />
            </TooltipProvider>
          ),
          confirmText: t('new_window'),
          cancelText: t('current_window'),
        });
        if (result) {
          spawnWindow(
            {
              mode,
              paths,
            },
            {
              width: 917,
              height: 600,
            },
          );
        }
        return result;
      }
      return false;
    }

    async function handleNsInspect() {
      const currentWindow = WebviewWindow.getCurrent();
      unlistenNsCompress = await currentWindow.listen('ns_compress', async (event) => {
        r('ns_compress');
        if (currentWindow.label !== 'main') return;
        const paths = event.payload as string[];
        const hasSpawned = await spawnNewWindow('ns_compress', paths);
        if (!hasSpawned) {
          currentWindow.show();
          currentWindow.setFocus();
          process('ns_compress', paths);
        }
      });
      unlistenNsWatchAndCompress = await currentWindow.listen(
        'ns_watch_and_compress',
        async (event) => {
          r('ns_watch_and_compress');
          if (currentWindow.label !== 'main') return;
          const paths = event.payload as string[];
          const hasSpawned = await spawnNewWindow('ns_watch_and_compress', paths);
          if (!hasSpawned) {
            currentWindow.show();
            currentWindow.setFocus();
            process('ns_watch_and_compress', paths);
          }
        },
      );
      unlistenNsWatch = await currentWindow.listen('ns_watch', async (event) => {
        r('ns_watch');
        if (currentWindow.label !== 'main') return;
        const path = event.payload as string;
        const hasSpawned = await spawnNewWindow('ns_watch', [path]);
        if (!hasSpawned) {
          currentWindow.show();
          currentWindow.setFocus();
          process('ns_watch', [path]);
        }
      });
      unlistenNsCompressSilent = await currentWindow.listen('ns_compress_silent', async (event) => {
        if (currentWindow.label !== 'main') return;
        const paths = event.payload as string[];
        handleSilentCompress(paths);
      });
      unlistenNsWatchSilent = await currentWindow.listen('ns_watch_silent', async (event) => {
        if (currentWindow.label !== 'main') return;
        const path = event.payload as string;
        handleSilentWatch(path);
      });
      unlistenNsSettingsCompress = await currentWindow.listen('ns_settings_compress', async () => {
        if (currentWindow.label !== 'main') return;
        await currentWindow.show();
        await currentWindow.setFocus();
        useSettingsStore.getState().setContextMenuSettingsOpen('compress');
        navigate('/settings/general');
      });
      unlistenNsSettingsWatch = await currentWindow.listen('ns_settings_watch', async () => {
        if (currentWindow.label !== 'main') return;
        await currentWindow.show();
        await currentWindow.setFocus();
        useSettingsStore.getState().setContextMenuSettingsOpen('watch');
        navigate('/settings/general');
      });
      emit('ready', currentWindow.label);
    }

    const handleDeepLink = async () => {
      unlistenDeepLink = await onOpenUrl(async (urls) => {
        if (isValidArray(urls)) {
          const urlObj = new URL(urls[0]);
          if (urlObj.protocol === 'picsharp:') {
            const files = urlObj.searchParams.get('files')?.split(',') || [];
            if (!isValidArray(files)) return;
            switch (urlObj.hostname) {
              case 'compress':
                {
                  const hasSpawned = await spawnNewWindow('ns_compress', files);
                  if (!hasSpawned) {
                    process('ns_compress', files);
                  }
                }
                break;
              case 'watch':
                {
                  const hasSpawned = await spawnNewWindow('ns_watch_and_compress', files);
                  if (!hasSpawned) {
                    process('ns_watch_and_compress', files);
                  }
                }
                break;
              default:
                break;
            }
          } else if (urlObj.protocol === 'file:') {
            const files = urls.map((url) => decodeURIComponent(url.replace('file://', '')));
            if (isValidArray(files)) {
              const hasSpawned = await spawnNewWindow('ns_compress', files);
              if (!hasSpawned) {
                process('ns_compress', files);
              }
            }
          }
        }
      });
    };

    let timer;
    useAppStore.getState().initAppPath();
    if (WebviewWindow.getCurrent().label === 'main') {
      useAppStore.getState().initSidecar();
      if (isProd) {
        timer = setInterval(() => {
          useAppStore.getState().reportSidecarStderr();
          useAppStore.getState().pingSidecar();
        }, 10000);
      }
      if (isProd && useSettingsStore.getState()?.[SettingsKey.AutoCheckUpdate]) {
        checkForUpdate();
      }
      handleNsInspect();
    }
    handleOpenWithFiles();
    handleDeepLink();

    return () => {
      clearInterval(timer);
      isFunction(unlistenNsCompress) && unlistenNsCompress();
      isFunction(unlistenNsWatchAndCompress) && unlistenNsWatchAndCompress();
      isFunction(unlistenNsWatch) && unlistenNsWatch();
      isFunction(unlistenNsCompressSilent) && unlistenNsCompressSilent();
      isFunction(unlistenNsWatchSilent) && unlistenNsWatchSilent();
      isFunction(unlistenNsSettingsCompress) && unlistenNsSettingsCompress();
      isFunction(unlistenNsSettingsWatch) && unlistenNsSettingsWatch();
      isFunction(unlistenDeepLink) && unlistenDeepLink();
    };
  }, []);

  useAsyncEffect(async () => {
    const version = window.localStorage.getItem('updated_relaunch');
    if (version) {
      await WebviewWindow.getCurrent().show();
      await WebviewWindow.getCurrent().setFocus();
      window.localStorage.removeItem('updated_relaunch');
      messageApi?.success(t('update.successful', { version }));
    }
  }, []);

  useEffect(() => {
    if (!isMac) return;
    const {
      initializeTrafficLightListeners,
      setTrafficLightVisibility,
      cleanupTrafficLightListeners,
    } = useTrafficLightStore.getState();

    initializeTrafficLightListeners();
    setTrafficLightVisibility(true);
    return () => {
      cleanupTrafficLightListeners();
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className='relative flex h-screen w-screen bg-background'>
        <PageProgress ref={progressRef} description={t('tips.import_files')} />
        {WebviewWindow.getCurrent().label === 'main' && <SidebarNav />}
        <div className='flex min-w-0 flex-1 flex-col overflow-hidden bg-background'>
          <Header />
          <div
            className='min-h-0 flex-1 overflow-hidden p-3 pl-0'
            style={{ backgroundColor: 'rgb(236, 237, 238)' }}
          >
            <main
              className='relative h-full overflow-hidden rounded-xl'
              style={{ backgroundColor: 'rgb(252, 252, 252)' }}
            >
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
