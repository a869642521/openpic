import { memo, useContext, useState, useRef, useMemo } from 'react';
import { useI18n } from '@/i18n';
import useCompressionStore, { defaultWatchFolderSettings } from '@/store/compression';
import useSelector from '@/hooks/useSelector';
import { AppContext } from '@/routes';
import { WatchContext } from './watch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { humanSize, parseSizeToKb } from '@/utils/fs';
import {
  Filter,
  Folder,
  Trash2,
  Settings2,
  Plus,
  AlertCircle,
  StopCircle,
  ChevronDown,
  ChevronRight,
  ImagePlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import useSettingsStore from '@/store/settings';
import { CompressionMode, CompressionOutputMode, SettingsKey } from '@/constants';
import message from '@/components/message';
import { openPath } from '@tauri-apps/plugin-opener';
import { open } from '@tauri-apps/plugin-dialog';
import { exists } from '@tauri-apps/plugin-fs';
import { isValidArray, preventDefault } from '@/utils';
import useAppStore from '@/store/app';
import { openSettingsWindow } from '@/utils/window';
import { detectFolderOverlap } from '@/utils/watch-utils';
import WatchAddModeDialog, { WatchAddMode } from './watch-add-mode-dialog';
import WatchFolderSettingsDialog from './watch-folder-settings-dialog';
import FileCard from './file-card';
import { ICompressor } from '@/utils/compressor';
import ToolbarPagination from './toolbar-pagination';

/** 嵌入在卡片内的文件网格 */
const FolderFileGrid = memo(function FolderFileGrid({ folderId }: { folderId: string }) {
  const t = useI18n();
  const { files } = useCompressionStore(useSelector(['files']));
  const [pageIndex, setPageIndex] = useState(1);
  const pageSize = 50;

  const folderFiles = useMemo(
    () =>
      files.filter(
        (f) => f.watchFolderId === folderId && f.status !== ICompressor.Status.Pending,
      ),
    [files, folderId],
  );

  const dataList = useMemo(
    () => folderFiles.slice((pageIndex - 1) * pageSize, pageIndex * pageSize),
    [folderFiles, pageIndex],
  );

  const hasPagination = folderFiles.length > pageSize;

  if (!isValidArray(folderFiles)) {
    return (
      <div className='flex min-h-[180px] flex-col items-center justify-center gap-3 px-6 py-8'>
        <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-700/50'>
          <ImagePlus className='h-6 w-6 text-neutral-300 dark:text-neutral-500' />
        </div>
        <p className='text-xs text-neutral-400 dark:text-neutral-500'>
          {t('page.compression.watch.list.empty_title')}
        </p>
      </div>
    );
  }

  return (
    <div className='relative px-4 pb-4 pt-3' onContextMenu={preventDefault}>
      <div
        className='grid gap-3 contain-layout'
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}
      >
        {dataList.map((file) => (
          <FileCard key={file.path} path={file.path} />
        ))}
      </div>
      {hasPagination && (
        <div className='mt-3 flex justify-center'>
          <ToolbarPagination
            total={folderFiles.length}
            current={pageIndex}
            pageSize={pageSize}
            onChange={(p, s) => {
              if (p) setPageIndex(p);
            }}
          />
        </div>
      )}
    </div>
  );
});

/** 单个可折叠的监听文件夹卡片 */
const FolderCard = memo(function FolderCard({ folder }: { folder: WatchFolder }) {
  const t = useI18n();
  const { removeWatchFolder, updateWatchFolderSettings, updateWatchFolderStatus } = useCompressionStore(
    useSelector(['removeWatchFolder', 'updateWatchFolderSettings', 'updateWatchFolderStatus']),
  );
  const { startWatching, stopWatching } = useContext(WatchContext);
  const [filterInput, setFilterInput] = useState(() => String(folder.settings.sizeFilterValue));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleToggleMonitor = () => {
    if (folder.status === 'monitoring') {
      stopWatching(folder.id);
      updateWatchFolderStatus(folder.id, 'paused');
    } else if (folder.status === 'paused') {
      startWatching(folder);
    }
  };

  const folderName = folder.path.split(/[/\\]/).filter(Boolean).pop() || folder.path;

  const isScanning = folder.stats === null;
  const isScanFailed = folder.stats !== null && 'failed' in folder.stats;
  const hasStats = folder.stats !== null && 'totalCount' in folder.stats;

  const handleFilterToggle = () => {
    updateWatchFolderSettings(folder.id, {
      sizeFilterEnable: !folder.settings.sizeFilterEnable,
    });
  };

  const handleFilterBlur = () => {
    const kb = parseSizeToKb(filterInput);
    const final = kb >= 1 ? kb : 500;
    updateWatchFolderSettings(folder.id, { sizeFilterValue: final });
    setFilterInput(String(final));
  };

  const handleRemove = async () => {
    const result = await message.confirm({
      title: t('page.compression.watch.folder.remove_confirm_title'),
      description: t('page.compression.watch.folder.remove_confirm_desc'),
      confirmText: t('compression.toolbar.watch_back'),
      cancelText: t('cancel'),
    });
    if (result) removeWatchFolder(folder.id);
  };

  const handleOpenFolder = () => openPath(folder.path);

  const isToggleable = folder.status === 'monitoring' || folder.status === 'paused';

  const StatusBadge = () => {
    const baseClass = 'inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-opacity';
    const clickableClass = isToggleable
      ? 'cursor-pointer hover:opacity-80 active:opacity-60'
      : 'cursor-default';

    if (folder.status === 'monitoring') {
      return (
        <Badge
          variant='processing'
          className={cn(baseClass, clickableClass)}
          onClick={handleToggleMonitor}
          title={t('page.compression.watch.card.click_to_pause')}
        >
          <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-current' />
          {t('page.compression.watch.card.monitoring')}
        </Badge>
      );
    }
    if (folder.status === 'paused') {
      return (
        <Badge
          className={cn(
            baseClass,
            clickableClass,
            'border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-700/50 dark:bg-orange-950/40 dark:text-orange-400',
          )}
          onClick={handleToggleMonitor}
          title={t('page.compression.watch.card.click_to_resume')}
        >
          <span className='h-1.5 w-1.5 rounded-full bg-current' />
          {t('page.compression.watch.card.paused')}
        </Badge>
      );
    }
    if (folder.status === 'error') {
      return (
        <Badge
          variant='destructive'
          className={cn(baseClass, 'cursor-default')}
        >
          <AlertCircle className='h-3 w-3' />
          {t('common.error')}
        </Badge>
      );
    }
    return (
      <Badge
        variant='secondary'
        className={cn(baseClass, 'cursor-default')}
      >
        <StopCircle className='h-3 w-3' />
        {t('common.stopped')}
      </Badge>
    );
  };

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-neutral-200/80 bg-white/90 transition-shadow',
        'dark:border-neutral-600/80 dark:bg-neutral-800/90',
      )}
    >
      {/* 卡片标题行（始终显示，可点击折叠/展开） */}
      <div
        className='flex h-[70px] flex-wrap items-center gap-[14px] px-4 cursor-pointer select-none hover:bg-neutral-50/60 dark:hover:bg-neutral-700/20 transition-colors'
        onClick={() => setExpanded((v) => !v)}
      >
        {/* 折叠 chevron */}
        <span className='shrink-0 text-neutral-400 dark:text-neutral-500'>
          {expanded ? (
            <ChevronDown className='h-4 w-4' />
          ) : (
            <ChevronRight className='h-4 w-4' />
          )}
        </span>

        {/* 监听状态 */}
        <span onClick={(e) => e.stopPropagation()}>
          <StatusBadge />
        </span>

        {/* 文件夹名 */}
        <div className='flex min-w-0 shrink-0 items-center gap-1.5'>
          <Folder className='h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400' />
          <span
            className='max-w-[120px] truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100'
            title={folderName}
          >
            {folderName}
          </span>
        </div>

        {/* 文件地址（可点击，阻止折叠事件冒泡） */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              onClick={(e) => {
                e.stopPropagation();
                handleOpenFolder();
              }}
              className='w-[200px] min-w-[200px] shrink-0 truncate text-left text-xs text-blue-500 underline-offset-2 hover:underline dark:text-blue-400'
              title={folder.path}
            >
              {folder.path}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className='max-w-[320px] break-all'>{folder.path}</p>
            <p className='mt-1 text-xs text-neutral-400'>
              {t('page.compression.watch.card.open_folder_tip')}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* 文件统计 */}
        <div
          className='flex shrink-0 items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500'
          onClick={(e) => e.stopPropagation()}
        >
          {isScanning && (
            <span className='flex items-center gap-1'>
              <span className='inline-block h-1.5 w-1.5 animate-spin rounded-full border border-current border-t-transparent' />
              {t('page.compression.watch.card.scanning')}
            </span>
          )}
          {isScanFailed && (
            <span className='text-red-400'>{t('page.compression.watch.card.scan_failed')}</span>
          )}
          {hasStats && (folder.stats as { totalCount: number; totalBytes: number }).totalCount > 0 && (
            <>
              <span>
                {t('page.compression.watch.card.file_count', {
                  count: (folder.stats as { totalCount: number }).totalCount,
                })}
              </span>
              <span className='text-neutral-300 dark:text-neutral-600'>·</span>
              <span>
                {t('page.compression.watch.card.file_size', {
                  size: humanSize((folder.stats as { totalBytes: number }).totalBytes),
                })}
              </span>
            </>
          )}
        </div>

        {/* 大小过滤（阻止折叠事件冒泡） */}
        <div
          className='flex shrink-0 items-center gap-1.5'
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type='button'
                onClick={handleFilterToggle}
                className={cn(
                  'inline-flex h-6 items-center gap-1 rounded border px-2 text-xs transition-colors',
                  folder.settings.sizeFilterEnable
                    ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-400 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-500',
                )}
              >
                <Filter className='h-2.5 w-2.5 shrink-0' />
                {t('page.compression.watch.card.enable_filter')}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {folder.settings.sizeFilterEnable
                ? t('page.compression.watch.card.filter_enabled_tip')
                : t('page.compression.watch.card.filter_disabled_tip')}
            </TooltipContent>
          </Tooltip>
          <div
            className={cn(
              'flex h-6 items-center gap-1 rounded border px-1.5',
              folder.settings.sizeFilterEnable
                ? 'border-blue-200 bg-white dark:border-blue-800 dark:bg-neutral-900/80'
                : 'cursor-not-allowed border-neutral-200 bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800',
            )}
          >
            <Input
              type='text'
              value={filterInput}
              placeholder='500'
              onChange={(e) => setFilterInput(e.target.value)}
              onBlur={handleFilterBlur}
              disabled={!folder.settings.sizeFilterEnable}
              className={cn(
                'h-4 min-w-0 max-w-[48px] border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0',
                !folder.settings.sizeFilterEnable &&
                  'cursor-not-allowed text-neutral-300 dark:text-neutral-600',
              )}
            />
            <span
              className={cn(
                'shrink-0 text-xs',
                folder.settings.sizeFilterEnable
                  ? 'text-neutral-400'
                  : 'text-neutral-300 dark:text-neutral-600',
              )}
            >
              KB
            </span>
          </div>
        </div>

        {/* 右侧操作按钮 (阻止折叠冒泡) */}
        <div
          className='ml-auto flex shrink-0 items-center gap-0.5'
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setSettingsOpen(true)}
                className='h-7 w-7 text-neutral-400 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-300'
              >
                <Settings2 className='h-3.5 w-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('page.compression.watch.folder.settings_btn')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={handleRemove}
                className='h-7 w-7 text-neutral-400 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400'
              >
                <Trash2 className='h-3.5 w-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('page.compression.watch.card.remove')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* 展开时显示文件网格 */}
      {expanded && (
        <>
          <div className='border-t border-dashed border-neutral-200 dark:border-neutral-600/60' />
          <FolderFileGrid folderId={folder.id} />
        </>
      )}

      {/* 独立压缩设置弹窗 */}
      <WatchFolderSettingsDialog
        open={settingsOpen}
        folder={folder}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
});

/** 监听文件夹列表（卡片集合 + 添加按钮） */
function WatchFolderList() {
  const t = useI18n();
  const { watchFolders, setWorking, addWatchFolder } = useCompressionStore(
    useSelector(['watchFolders', 'setWorking', 'addWatchFolder']),
  );
  const { messageApi } = useContext(AppContext);

  const [addModeDialogOpen, setAddModeDialogOpen] = useState(false);
  const pendingPathRef = useRef<string | null>(null);

  const handleAddFolder = async (path?: string) => {
    const { sidecar } = useAppStore.getState();
    if (!sidecar?.origin) {
      messageApi?.error(t('tips.file_watch_not_running'));
      return;
    }
    if (!path) {
      const selected = await open({ directory: true, multiple: false });
      if (!selected) return;
      path = selected as string;
    }
    if (!(await exists(path))) {
      messageApi?.error(t('tips.path_not_exists'));
      return;
    }

    const existingPaths = watchFolders.map((f) => f.path);
    const conflict = detectFolderOverlap(path, existingPaths);
    if (conflict) {
      messageApi?.error(
        t('page.compression.watch.folder.overlap_warning', { path: conflict }),
      );
      return;
    }

    const {
      [SettingsKey.CompressionMode]: compressionMode,
      [SettingsKey.TinypngApiKeys]: tinypngApiKeys,
      [SettingsKey.CompressionOutput]: compressionOutput,
      [SettingsKey.CompressionOutputSaveToFolder]: compressionOutputSaveToFolder,
    } = useSettingsStore.getState();

    if (compressionMode !== CompressionMode.Local && !isValidArray(tinypngApiKeys)) {
      const result = await message.confirm({
        title: t('tips.tinypng_api_keys_not_configured'),
        confirmText: t('goToSettings'),
        cancelText: t('cancel'),
      });
      if (result) openSettingsWindow({ subpath: 'tinypng', hash: 'tinypng-api-keys' });
      return;
    }
    if (
      compressionOutput === CompressionOutputMode.SaveToNewFolder &&
      compressionOutputSaveToFolder === path
    ) {
      const result = await message.confirm({
        title: t('tips.watch_and_save_same_folder'),
        confirmText: t('goToSettings'),
        cancelText: t('cancel'),
      });
      if (result) openSettingsWindow({ subpath: 'compression', hash: 'output' });
      return;
    }

    pendingPathRef.current = path;
    setAddModeDialogOpen(true);
  };

  const handleAddModeSelect = (mode: WatchAddMode) => {
    const path = pendingPathRef.current;
    if (!path) return;
    setAddModeDialogOpen(false);
    pendingPathRef.current = null;

    const newFolder: WatchFolder = {
      id: `watch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      path,
      addMode: mode,
      status: 'monitoring',
      settings: { ...defaultWatchFolderSettings },
      stats: null,
    };

    setWorking(true);
    addWatchFolder(newFolder);
  };

  return (
    <div className='flex h-full flex-col gap-3 overflow-y-auto p-4'>
      {watchFolders.map((folder) => (
        <FolderCard key={folder.id} folder={folder} />
      ))}

      {/* 添加更多文件夹按钮 */}
      <button
        type='button'
        onClick={() => handleAddFolder()}
        className={cn(
          'flex items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm',
          'border-neutral-200 text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-600',
          'dark:border-neutral-600 dark:text-neutral-500 dark:hover:border-neutral-500 dark:hover:text-neutral-300',
        )}
        style={{ backgroundColor: 'rgb(236, 237, 238)' }}
      >
        <Plus className='h-4 w-4' />
        {t('page.compression.watch.folder.add')}
      </button>

      <WatchAddModeDialog
        open={addModeDialogOpen}
        onSelect={handleAddModeSelect}
        onCancel={() => {
          setAddModeDialogOpen(false);
          pendingPathRef.current = null;
        }}
      />
    </div>
  );
}

export default memo(WatchFolderList);
