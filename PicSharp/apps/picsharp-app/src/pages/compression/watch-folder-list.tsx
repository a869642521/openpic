import { memo, useContext, useState, useRef, useMemo, useEffect } from 'react';
import { useI18n } from '@/i18n';
import useCompressionStore from '@/store/compression';
import useSelector from '@/hooks/useSelector';
import { AppContext } from '@/routes';
import { WatchContext } from './watch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { humanSize } from '@/utils/fs';
import {
  Folder,
  Trash2,
  Settings2,
  Plus,
  AlertCircle,
  StopCircle,
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
import { exists, stat } from '@tauri-apps/plugin-fs';
import { isValidArray, preventDefault } from '@/utils';
import useAppStore from '@/store/app';
import { openSettingsWindow } from '@/utils/window';
import { detectFolderOverlap } from '@/utils/watch-utils';
import WatchAddModeDialog, { WatchAddMode, WatchFeature } from './watch-add-mode-dialog';
import WatchFolderSettingsDialog from './watch-folder-settings-dialog';
import FileCard from './file-card';
import { ICompressor } from '@/utils/compressor';
import ToolbarPagination from './toolbar-pagination';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { UnlistenFn } from '@tauri-apps/api/event';
import FolderIcon from '@/components/animated-icon/folder';

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

type FeatureSection = 'compression' | 'resize' | 'watermark' | 'convert';

/** 功能标签行：始终显示全部 4 个功能，点击定向到设置区块 */
const FeatureTagRow = memo(function FeatureTagRow({
  folder,
  onTagClick,
}: {
  folder: WatchFolder;
  onTagClick: (section: FeatureSection) => void;
}) {
  const t = useI18n();
  const s = folder.settings;

  const compressionActive = s.compressionEnable !== false;
  const compressionSummary = compressionActive && s.sizeFilterEnable
    ? `>${s.sizeFilterValue ?? 500}KB`
    : undefined;

  const resizeActive = s.resizeEnable;
  const resizeSummary = resizeActive
    ? s.resizeMode === 'scale'
      ? `${s.resizeScale ?? 50}%`
      : s.resizeDimensions?.[0] || s.resizeDimensions?.[1]
        ? `${s.resizeDimensions[0] || 'auto'}×${s.resizeDimensions[1] || 'auto'}`
        : undefined
    : undefined;

  const watermarkActive = s.watermarkEnable;
  const watermarkSummary = watermarkActive
    ? s.watermarkType === 'text'
      ? t('page.compression.watch.folder.settings.watermark_type_text')
      : s.watermarkType === 'image'
        ? t('page.compression.watch.folder.settings.watermark_type_image')
        : undefined
    : undefined;

  const convertActive = s.convertEnable;
  const convertSummary = convertActive && s.convertTypes?.length > 0
    ? s.convertTypes[0]?.toUpperCase()
    : undefined;

  const tags: { section: FeatureSection; label: string; summary?: string; active: boolean }[] = [
    {
      section: 'compression',
      label: t('page.compression.watch.guide.feature.compression'),
      summary: compressionSummary,
      active: compressionActive,
    },
    {
      section: 'resize',
      label: t('page.compression.watch.folder.settings.resize'),
      summary: resizeSummary,
      active: resizeActive,
    },
    {
      section: 'watermark',
      label: t('page.compression.watch.folder.settings.watermark'),
      summary: watermarkSummary,
      active: watermarkActive,
    },
    {
      section: 'convert',
      label: t('page.compression.watch.folder.settings.convert'),
      summary: convertSummary,
      active: convertActive,
    },
  ];

  return (
    <div className='flex flex-wrap gap-1.5'>
      {tags.map(({ section, label, summary, active }) => (
        <button
          key={section}
          type='button'
          onClick={() => onTagClick(section)}
          className={cn(
            'inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-xs transition-colors',
            active
              ? 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300 dark:hover:border-blue-700'
              : 'border-neutral-200 bg-neutral-50 text-neutral-300 hover:border-neutral-300 hover:bg-neutral-100 hover:text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800/50 dark:text-neutral-600 dark:hover:text-neutral-500',
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 shrink-0 rounded-full',
              active
                ? 'bg-blue-500 dark:bg-blue-400'
                : 'bg-neutral-300 dark:bg-neutral-600',
            )}
          />
          {label}
          {summary && (
            <span
              className={cn(
                'rounded px-1 text-[10px]',
                active
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300'
                  : 'bg-neutral-200/70 dark:bg-neutral-700',
              )}
            >
              {summary}
            </span>
          )}
        </button>
      ))}
    </div>
  );
});

/** 单个可折叠的监听文件夹卡片 */
const BADGE_BASE = 'inline-flex h-[30px] shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-opacity';

const FolderStatusBadge = memo(function FolderStatusBadge({
  status,
  isToggleable,
  onToggle,
}: {
  status: WatchFolder['status'];
  isToggleable: boolean;
  onToggle: () => void;
}) {
  const t = useI18n();
  const clickableClass = isToggleable ? 'cursor-pointer hover:opacity-80 active:opacity-60' : 'cursor-default';

  if (status === 'monitoring') {
    return (
      <Badge
        variant='processing'
        className={cn(BADGE_BASE, clickableClass)}
        onClick={onToggle}
        title={t('page.compression.watch.card.click_to_pause')}
      >
        <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-current' />
        {t('page.compression.watch.card.monitoring')}
      </Badge>
    );
  }
  if (status === 'paused') {
    return (
      <Badge
        className={cn(
          BADGE_BASE,
          clickableClass,
          'border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-700/50 dark:bg-orange-950/40 dark:text-orange-400',
        )}
        onClick={onToggle}
        title={t('page.compression.watch.card.click_to_resume')}
      >
        <span className='h-1.5 w-1.5 rounded-full bg-current' />
        {t('page.compression.watch.card.paused')}
      </Badge>
    );
  }
  if (status === 'error') {
    return (
      <Badge variant='destructive' className={cn(BADGE_BASE, 'cursor-default')}>
        <AlertCircle className='h-3 w-3' />
        {t('common.error')}
      </Badge>
    );
  }
  return (
    <Badge variant='secondary' className={cn(BADGE_BASE, 'cursor-default')}>
      <StopCircle className='h-3 w-3' />
      {t('common.stopped')}
    </Badge>
  );
});

const FolderCard = memo(function FolderCard({ folder }: { folder: WatchFolder }) {
  const t = useI18n();
  const { removeWatchFolder, updateWatchFolderStatus } = useCompressionStore(
    useSelector(['removeWatchFolder', 'updateWatchFolderStatus']),
  );
  const { startWatching, stopWatching } = useContext(WatchContext);
  const { messageApi } = useContext(AppContext);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<FeatureSection | undefined>(undefined);
  const [expanded, setExpanded] = useState(false);

  const handleToggleMonitor = () => {
    if (folder.status === 'monitoring') {
      stopWatching(folder.id);
      updateWatchFolderStatus(folder.id, 'paused');
    } else if (folder.status === 'paused') {
      const { sidecar } = useAppStore.getState();
      if (!sidecar?.origin) {
        messageApi?.error(t('tips.file_watch_not_running'));
        return;
      }
      updateWatchFolderStatus(folder.id, 'monitoring');
      startWatching(folder);
    }
  };

  const folderName = folder.path.split(/[/\\]/).filter(Boolean).pop() || folder.path;

  const isScanning = folder.stats === null;
  const isScanFailed = folder.stats !== null && 'failed' in folder.stats;
  const hasStats = folder.stats !== null && 'totalCount' in folder.stats;

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

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-neutral-200/80 bg-white/90 transition-shadow',
        'dark:border-neutral-600/80 dark:bg-neutral-800/90',
      )}
    >
      {/* 卡片标题行 */}
      <div
        className='flex h-[64px] items-center gap-3 px-4 cursor-pointer select-none transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-700/30'
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Chevron - 旋转动画 */}
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-neutral-300 transition-transform duration-200 dark:text-neutral-600',
            expanded && 'rotate-90',
          )}
        />

        {/* 文件夹名 + 状态 badge */}
        <div className='flex shrink-0 items-center gap-2'>
          <Folder className='h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400' />
          <span
            className='max-w-[140px] truncate text-sm font-semibold text-neutral-800 dark:text-neutral-100'
            title={folderName}
          >
            {folderName}
          </span>
          <span onClick={(e) => e.stopPropagation()}>
            <FolderStatusBadge
              status={folder.status}
              isToggleable={isToggleable}
              onToggle={handleToggleMonitor}
            />
          </span>
        </div>

        {/* 路径 + 文件统计（flex-1，垂直） */}
        <div
          className='flex min-w-0 flex-1 flex-col gap-0.5'
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type='button'
                onClick={(e) => { e.stopPropagation(); handleOpenFolder(); }}
                className='truncate text-left text-xs text-neutral-400 transition-colors hover:text-blue-500 dark:text-neutral-500 dark:hover:text-blue-400'
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
          <div className='flex items-center gap-1 text-[11px] text-neutral-300 dark:text-neutral-600'>
            {isScanning && (
              <span className='flex items-center gap-1 text-neutral-400'>
                <span className='inline-block h-1.5 w-1.5 animate-spin rounded-full border border-current border-t-transparent' />
                {t('page.compression.watch.card.scanning')}
              </span>
            )}
            {isScanFailed && (
              <span className='text-red-400'>{t('page.compression.watch.card.scan_failed')}</span>
            )}
            {hasStats && (folder.stats as { totalCount: number; totalBytes: number }).totalCount > 0 && (
              <>
                <span className='text-neutral-400 dark:text-neutral-500'>
                  {t('page.compression.watch.card.file_count', {
                    count: (folder.stats as { totalCount: number }).totalCount,
                  })}
                </span>
                <span>·</span>
                <span className='text-neutral-400 dark:text-neutral-500'>
                  {t('page.compression.watch.card.file_size', {
                    size: humanSize((folder.stats as { totalBytes: number }).totalBytes),
                  })}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 功能标签 */}
        <div className='flex shrink-0 flex-wrap justify-end gap-1.5' onClick={(e) => e.stopPropagation()}>
          <FeatureTagRow
            folder={folder}
            onTagClick={(section) => {
              setSettingsSection(section);
              setSettingsOpen(true);
            }}
          />
        </div>

        {/* 竖线分隔 */}
        <div className='h-5 w-px shrink-0 bg-neutral-100 dark:bg-neutral-700' />

        {/* 操作按钮 */}
        <div className='flex shrink-0 items-center gap-0.5' onClick={(e) => e.stopPropagation()}>
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
        initialSection={settingsSection}
        onClose={() => {
          setSettingsOpen(false);
          setSettingsSection(undefined);
        }}
      />
    </div>
  );
});

/** 监听文件夹列表（卡片集合 + 添加按钮 + 空状态 + 拖拽） */
function WatchFolderList() {
  const t = useI18n();
  const { watchFolders, setWorking, addWatchFolder, pendingWatchPath, setPendingWatchPath } = useCompressionStore(
    useSelector(['watchFolders', 'setWorking', 'addWatchFolder', 'pendingWatchPath', 'setPendingWatchPath']),
  );
  const { messageApi } = useContext(AppContext);

  const [addModeDialogOpen, setAddModeDialogOpen] = useState(false);
  const pendingPathRef = useRef<string | null>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const dragDropController = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    if (pendingWatchPath) {
      handleAddFolder(pendingWatchPath);
      setPendingWatchPath(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingWatchPath]);

  // 拖拽支持
  useEffect(() => {
    const setup = async () => {
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
              handleAddFolder(path);
            } else {
              messageApi?.error(t('tips.path_not_dir', { path }));
            }
          }
        }
      });
    };
    setup();
    return () => {
      dragDropController.current?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleAddModeConfirm = (mode: WatchAddMode, _features: WatchFeature[], settings: WatchFolderSettings) => {
    const path = pendingPathRef.current;
    if (!path) return;
    setAddModeDialogOpen(false);
    pendingPathRef.current = null;

    const newFolder: WatchFolder = {
      id: `watch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      path,
      addMode: mode,
      status: 'monitoring',
      settings,
      stats: null,
    };

    setWorking(true);
    addWatchFolder(newFolder);
  };

  return (
    <div ref={dropzoneRef} className='flex h-full flex-col overflow-y-auto' style={{ backgroundColor: 'rgb(250, 250, 250)' }}>
      {watchFolders.length === 0 ? (
        /* 空状态 */
        <div className='flex flex-1 flex-col items-center justify-center gap-4 p-8'>
          <div className='cursor-pointer' onClick={() => handleAddFolder()}>
            <FolderIcon />
          </div>
          <p className='text-base font-medium text-neutral-700 dark:text-neutral-300'>
            {t('page.compression.watch.guide.empty_title')}
          </p>
          <p className='max-w-sm text-center text-sm text-neutral-400 dark:text-neutral-500'>
            {t('page.compression.watch.guide.empty_description')}
          </p>
          <Button variant='default' size='lg' className='cursor-pointer mt-2' onClick={() => handleAddFolder()}>
            <Plus size={18} />
            {t('page.compression.watch.guide.add_folder')}
          </Button>
        </div>
      ) : (
        /* 文件夹列表 */
        <div className='flex flex-col gap-3 p-4'>
          {watchFolders.map((folder) => (
            <FolderCard key={folder.id} folder={folder} />
          ))}

          {/* 添加更多文件夹按钮 */}
          <button
            type='button'
            onClick={() => handleAddFolder()}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl border border-dashed py-3 text-sm',
              'border-neutral-200 bg-neutral-100 text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-600',
              'dark:border-neutral-600 dark:bg-neutral-800/60 dark:text-neutral-500 dark:hover:border-neutral-500 dark:hover:text-neutral-300',
            )}
          >
            <Plus className='h-4 w-4' />
            {t('page.compression.watch.folder.add')}
          </button>
        </div>
      )}

      <WatchAddModeDialog
        open={addModeDialogOpen}
        onConfirm={handleAddModeConfirm}
        onCancel={() => {
          setAddModeDialogOpen(false);
          pendingPathRef.current = null;
        }}
      />
    </div>
  );
}

export default memo(WatchFolderList);
