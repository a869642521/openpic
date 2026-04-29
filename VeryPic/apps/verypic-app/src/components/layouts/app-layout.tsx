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
import i18next from 'i18next';
import { parsePaths, humanSize } from '@/utils/fs';
import { VALID_IMAGE_EXTS, SettingsKey, CompressionMode, CompressionOutputMode, WatermarkType } from '@/constants';
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
import Compressor from '@/utils/compressor';
import { defaultWatchFolderSettings } from '@/store/compression';

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
    let unlistenNsSettings: UnlistenFn | null = null;
    let unlistenDeepLink: UnlistenFn | null = null;

    async function process(mode: string, paths: string[]) {
      if (isValidArray(paths)) {
        progressRef.current?.show(true);
        const {
          setWorking,
          setClassicFiles,
          setWatchFiles,
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
          i18next.changeLanguage(useSettingsStore.getState()[SettingsKey.Language] || undefined);
          const fileInfos = await parsePaths(paths, VALID_IMAGE_EXTS);
          if (fileInfos.length > 0) {
            setMode('classic');
            setWorking(true);
            setClassicFiles(fileInfos);
            sendTextNotification('VeryPic', t('bg_compress.started', { count: fileInfos.length }));
            navigate('/compression/classic/workspace');
          } else {
            sendTextNotification('VeryPic', t('bg_compress.no_images'));
            reset();
          }
        } else if (mode === 'ns_watch_and_compress') {
          await updateWatchHistory(paths[0]);
          setMode('watch');
          setWatchFiles([]);
          setPendingWatchPath(paths[0]);
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
      await currentWindow.minimize();

      const s = useSettingsStore.getState();
      const appState = useAppStore.getState();

      try {
        const fileInfos = await parsePaths(paths, VALID_IMAGE_EXTS);
        if (fileInfos.length === 0) {
          sendTextNotification('VeryPic', t('bg_compress.no_images'));
          return;
        }

        const total = fileInfos.length;
        let fulfilled = 0;
        let rejected = 0;
        let totalSaved = 0;

        await new Compressor({
          concurrency: s[SettingsKey.Concurrency] ?? 6,
          compressionMode: s[SettingsKey.CompressionMode] ?? CompressionMode.Local,
          compressionLevel: s[SettingsKey.CompressionLevel] ?? 3,
          compressionType: s[SettingsKey.CompressionType],
          limitCompressRate: undefined,
          tinifyApiKeys: (s[SettingsKey.TinypngApiKeys] ?? []).map((k) => k.api_key),
          save: {
            mode: CompressionOutputMode.Overwrite,
            newFileSuffix: '_min',
            newFolderPath: '',
          },
          tempDir: appState.imageTempDir,
          sidecarDomain: appState.sidecar?.origin,
          convertEnable: false,
          convertTypes: [],
          convertAlpha: '#FFFFFF',
          resizeEnable: false,
          resizeDimensions: [0, 0],
          resizeScale: 0,
          resizeFit: s[SettingsKey.CompressionResizeFit],
          watermarkType: WatermarkType.None,
          watermarkPosition: s[SettingsKey.CompressionWatermarkPosition],
          watermarkText: '',
          watermarkTextColor: '#FFFFFF',
          watermarkFontSize: 72,
          watermarkImagePath: '',
          watermarkImageOpacity: 1,
          watermarkImageScale: 0.15,
          preserveMetadata: [],
        }).compress(
          fileInfos,
          (res) => {
            fulfilled++;
            totalSaved += Math.max(0, (res.input_size ?? 0) - (res.output_size ?? 0));
          },
          () => {
            rejected++;
          },
        );

        sendTextNotification(
          'VeryPic',
          t('bg_compress.completed_desc', { fulfilled, rejected, total, saved: humanSize(totalSaved) }),
        );
      } catch (e) {
        console.error('[silent compress]', e);
        sendTextNotification('VeryPic', t('bg_compress.failed'));
      }
    }

    async function handleSilentWatch(path: string) {
      const currentWindow = WebviewWindow.getCurrent();
      await currentWindow.minimize();

      const { addWatchFolder } = useCompressionStore.getState();
      const folderSettings = { ...defaultWatchFolderSettings };

      addWatchFolder({
        id: path,
        path,
        addMode: 'compress_then_monitor',
        status: 'monitoring',
        settings: folderSettings,
        stats: null,
      });

      const folderName = path.split(/[\/\\]/).pop() || path;
      sendTextNotification('VeryPic', t('bg_watch.started_desc', { folder: folderName }));
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
          case 'ns_compress':
            await WebviewWindow.getCurrent().show();
            await WebviewWindow.getCurrent().setFocus();
            process('ns_compress', payload.paths);
            break;
          case 'watch-silent':
            if (payload.paths[0]) handleSilentWatch(payload.paths[0]);
            break;
          case 'settings':
            await WebviewWindow.getCurrent().show();
            await WebviewWindow.getCurrent().setFocus();
            navigate('/settings/context-menu');
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
        await currentWindow.show();
        await currentWindow.setFocus();
        process('ns_compress', paths);
      });
      unlistenNsWatchSilent = await currentWindow.listen('ns_watch_silent', async (event) => {
        if (currentWindow.label !== 'main') return;
        const path = event.payload as string;
        handleSilentWatch(path);
      });
      unlistenNsSettings = await currentWindow.listen('ns_settings', async () => {
        if (currentWindow.label !== 'main') return;
        await currentWindow.show();
        await currentWindow.setFocus();
        navigate('/settings/context-menu');
      });
      emit('ready', currentWindow.label);
    }

    const handleDeepLink = async () => {
      unlistenDeepLink = await onOpenUrl(async (urls) => {
        if (isValidArray(urls)) {
          const urlObj = new URL(urls[0]);
          if (urlObj.protocol === 'verypic:') {
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
      isFunction(unlistenNsSettings) && unlistenNsSettings();
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
      <div
        className='relative flex h-screen w-screen'
        style={{ backgroundColor: 'rgb(243, 243, 243)' }}
      >
        {WebviewWindow.getCurrent().label === 'main' && <SidebarNav />}
        <div className='flex min-w-0 flex-1 flex-col overflow-hidden bg-background'>
          <Header />
          <div
            className={cn(
              'min-h-0 flex-1 overflow-hidden',
              location.pathname.startsWith('/settings') ? 'p-0' : 'p-3 pl-0',
            )}
            style={{ backgroundColor: 'rgb(243, 243, 243)' }}
          >
            <main
              className='relative h-full overflow-hidden rounded-xl'
              style={{ backgroundColor: 'rgb(252, 252, 252)' }}
            >
              <Outlet />
              <PageProgress ref={progressRef} description={t('tips.import_files')} />
            </main>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
