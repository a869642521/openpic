import { open } from '@tauri-apps/plugin-dialog';
import useSelector from '@/hooks/useSelector';
import { FolderClock, Plus, X } from 'lucide-react';
import useCompressionStore from '../../store/compression';
import { useNavigate } from '@/hooks/useNavigate';
import { useI18n } from '@/i18n';
import { useEffect, useState, useContext, useRef } from 'react';
import { isValidArray, stopPropagation } from '@/utils';
import { exists, stat } from '@tauri-apps/plugin-fs';
import { basename } from '@tauri-apps/api/path';
import { Button } from '@/components/ui/button';
import useSettingsStore from '@/store/settings';
import { CompressionMode, CompressionOutputMode, SettingsKey } from '@/constants';
import { CompressionContext } from '.';
import useAppStore from '@/store/app';
import { AppContext } from '@/routes';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { UnlistenFn } from '@tauri-apps/api/event';
import Folder from '@/components/animated-icon/folder';
import { ScrollArea } from '@/components/ui/scroll-area';
import FormatsTips from './formats-tips';
import { useReport } from '@/hooks/useReport';
import { openSettingsWindow } from '@/utils/window';
import { message } from '@/components/message';

const WATCH_HISTORY_KEY = 'compression_watch_history';

export const updateWatchHistory = async (path: string) => {
  const name = await basename(path);
  const historyStr = localStorage.getItem(WATCH_HISTORY_KEY) || '[]';
  const history = JSON.parse(historyStr);
  const targetIndex = history.findIndex((item) => item.path === path);
  if (targetIndex !== -1) {
    history.splice(targetIndex, 1);
  }
  const newHistory = [{ name, path }, ...history];
  localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(newHistory));
  return newHistory;
};

function WatchCompressionGuide() {
  const { progressRef } = useContext(CompressionContext);
  const [history, setHistory] = useState<Array<{ name: string; path: string }>>([]);
  const navigate = useNavigate();
  const { setWorking, setWatchingFolder } = useCompressionStore(
    useSelector(['setWorking', 'setWatchingFolder']),
  );
  const t = useI18n();
  const { messageApi } = useContext(AppContext);
  const dragDropController = useRef<UnlistenFn | null>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const r = useReport();

  const handleWatch = async (path?: string) => {
    const { sidecar } = useAppStore.getState();
    if (!sidecar?.origin) {
      messageApi?.error(t('tips.file_watch_not_running'));
      return;
    }
    if (!path) {
      path = await open({
        directory: true,
        multiple: false,
      });
    }
    if (path) {
      if (!(await exists(path))) {
        messageApi?.error(t('tips.path_not_exists'));
        return;
      }
      const {
        [SettingsKey.CompressionMode]: compressionMode,
        [SettingsKey.TinypngApiKeys]: tinypngApiKeys,
        [SettingsKey.CompressionOutput]: compressionOutput,
        [SettingsKey.CompressionOutputSaveToFolder]: compressionOutputSaveToFolder,
      } = useSettingsStore.getState();
      if (compressionMode !== CompressionMode.Local && !isValidArray(tinypngApiKeys)) {
        r('tinypng_api_keys_not_configured');
        const result = await message.confirm({
          title: t('tips.tinypng_api_keys_not_configured'),
          confirmText: t('goToSettings'),
          cancelText: t('cancel'),
        });
        if (result) {
          openSettingsWindow({
            subpath: 'tinypng',
            hash: 'tinypng-api-keys',
          });
        }
        return;
      }
      if (
        compressionOutput === CompressionOutputMode.SaveToNewFolder &&
        compressionOutputSaveToFolder === path
      ) {
        r('save_to_folder_not_configured');
        const result = await message.confirm({
          title: t('tips.watch_and_save_same_folder'),
          confirmText: t('goToSettings'),
          cancelText: t('cancel'),
        });
        if (result) {
          openSettingsWindow({
            subpath: 'compression',
            hash: 'output',
          });
        }
        return;
      }

      if (
        compressionOutput === CompressionOutputMode.SaveToNewFolder &&
        compressionOutputSaveToFolder &&
        !(await exists(compressionOutputSaveToFolder))
      ) {
        r('save_to_folder_not_exists');
        const result = await message.confirm({
          title: t('tips.save_to_folder_not_exists', {
            path: compressionOutputSaveToFolder,
          }),
          confirmText: t('goToSettings'),
          cancelText: t('cancel'),
        });
        if (result) {
          openSettingsWindow({
            subpath: 'compression',
            hash: 'output',
          });
        }
        return;
      }

      const newHistory = await updateWatchHistory(path);
      setHistory(newHistory);
      progressRef.current?.show(true);
      useCompressionStore.getState().setWatchFiles([]);
      setWorking(true);
      setWatchingFolder(path);
      navigate(`/compression/watch/workspace`);
    }
  };

  const handleHistorySelect = async (path: string) => {
    const isExists = await exists(path);
    const targetIndex = history.findIndex((item) => item.path === path);
    if (isExists) {
      if (targetIndex !== -1) {
        const name = history[targetIndex].name;
        history.splice(targetIndex, 1);
        const newHistory = [{ name, path }, ...history];
        localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(newHistory));
        setHistory(newHistory);
      }
      handleWatch(path);
    } else {
      history.splice(targetIndex, 1);
      localStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(history));
      setHistory([...history]);
      messageApi?.error(t('tips.file_not_exists'));
    }
  };

  useEffect(() => {
    const setupDragDrop = async () => {
      dragDropController.current = await getCurrentWebview().onDragDropEvent(async (event) => {
        if (!dropzoneRef.current) return;

        if (event.payload.type === 'enter') {
          dropzoneRef.current.classList.add('drag-active');
        } else if (event.payload.type === 'leave') {
          dropzoneRef.current.classList.remove('drag-active');
        } else if (event.payload.type === 'drop') {
          dropzoneRef.current.classList.remove('drag-active');
          const path = event.payload.paths[0];
          if (path) {
            const isDir = (await stat(path)).isDirectory;
            if (isDir) {
              handleWatch(path);
            } else {
              messageApi?.error(t('tips.path_not_dir', { path }));
            }
          }
        }
      });
    };
    const history = localStorage.getItem(WATCH_HISTORY_KEY);
    const arr = (() => {
      try {
        return JSON.parse(history || '[]');
      } catch (error) {
        return [];
      }
    })();
    if (isValidArray(arr)) {
      setHistory(arr);
    }
    setupDragDrop();
  }, []);

  useEffect(() => {
    r('watch_guide_imp');
  }, []);

  return (
    <div
      ref={dropzoneRef}
      className='group relative flex h-full flex-col items-center justify-center p-6'
    >
      <div className='relative z-10 flex w-full max-w-2xl flex-col items-center'>
        {isValidArray(history) ? (
          <>
            <div className='mb-4 flex w-full items-center justify-between'>
              <p className='text-base font-medium text-neutral-700 dark:text-neutral-300'>
                {t('page.compression.watch.guide.history')} ({history.length})
              </p>
              <Button
                variant='default'
                size='sm'
                className='cursor-pointer'
                onClick={() => handleWatch()}
              >
                <Plus size={18} />
                {t('page.compression.watch.guide.add_folder')}
              </Button>
            </div>
            <ScrollArea className='h-[220px] w-full rounded-xl border border-neutral-200 dark:border-neutral-800'>
              <ul className='divide-y divide-neutral-200 dark:divide-neutral-800'>
                {history.map((item) => (
                  <li
                    key={item.path}
                    className='flex cursor-pointer items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    data-path={item.path}
                    title={item.path}
                    onClick={() => handleHistorySelect(item.path)}
                  >
                    <div className='flex items-center gap-2'>
                      <FolderClock size={18} className='shrink-0 text-amber-500 dark:text-amber-400' />
                      <span className='max-w-[40%] truncate font-medium'>{item.name}</span>
                    </div>
                    <span className='max-w-[55%] truncate text-neutral-400'>{item.path}</span>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </>
        ) : (
          <>
            <div onClick={() => handleWatch()} className='cursor-pointer'>
              <Folder />
            </div>
            <p className='mt-5 text-center text-lg font-medium text-neutral-800 dark:text-neutral-200'>
              {t('page.compression.watch.guide.empty_title')}
            </p>
            <p className='mt-2 max-w-md text-center text-sm text-neutral-500 dark:text-neutral-400'>
              {t('page.compression.watch.guide.empty_description')}
            </p>
            <Button
              variant='default'
              size='lg'
              className='mt-6 cursor-pointer'
              onClick={() => handleWatch()}
            >
              <Plus size={20} />
              {t('page.compression.watch.guide.add_folder')}
            </Button>
          </>
        )}
      </div>
      <div className='absolute bottom-2 right-2' onClick={stopPropagation}>
        <FormatsTips />
      </div>
    </div>
  );
}

export default WatchCompressionGuide;
