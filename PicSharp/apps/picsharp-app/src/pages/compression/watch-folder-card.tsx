import { memo, useContext, useState, useEffect } from 'react';
import { useI18n } from '@/i18n';
import useCompressionStore from '@/store/compression';
import useSelector from '@/hooks/useSelector';
import { useNavigate } from '@/hooks/useNavigate';
import { CompressionContext } from '.';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { humanSize, parseSizeToKb } from '@/utils/fs';
import { Filter, Folder, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import useSettingsStore from '@/store/settings';
import { SettingsKey } from '@/constants';
import message from '@/components/message';
import { openPath } from '@tauri-apps/plugin-opener';

function WatchFolderCard() {
  const t = useI18n();
  const navigate = useNavigate();
  const { progressRef } = useContext(CompressionContext);
  const { watchFolders, working, resetWatchOnly } = useCompressionStore(
    useSelector(['watchFolders', 'working', 'resetWatchOnly']),
  );
  const {
    [SettingsKey.CompressionWatchSizeFilterEnable]: sizeFilterEnable,
    [SettingsKey.CompressionWatchSizeFilterValue]: sizeFilterValue,
    set,
  } = useSettingsStore(
    useSelector([
      SettingsKey.CompressionWatchSizeFilterEnable,
      SettingsKey.CompressionWatchSizeFilterValue,
      'set',
    ]),
  );

  // 兼容旧版单文件夹视图：取第一个监听文件夹
  const activeFolder = watchFolders[0] ?? null;
  const watchingFolder = activeFolder?.path ?? null;
  const watchFolderStats = (activeFolder?.stats as any) ?? null;

  const [filterInput, setFilterInput] = useState(() => String(sizeFilterValue));

  useEffect(() => {
    setFilterInput(String(sizeFilterValue));
  }, [sizeFilterValue]);

  const folderName = watchingFolder ? watchingFolder.split(/[/\\]/).filter(Boolean).pop() || watchingFolder : '';
  const filteredCount = 0; // 侧边栏过滤统计，当前未上报

  const isScanning = watchFolderStats === null && working;
  const isScanFailed = watchFolderStats !== null && 'failed' in watchFolderStats;
  const hasStats = watchFolderStats !== null && 'totalCount' in watchFolderStats;

  const handleFilterToggle = () => {
    set(SettingsKey.CompressionWatchSizeFilterEnable, !sizeFilterEnable);
  };

  const handleFilterBlur = () => {
    const kb = parseSizeToKb(filterInput);
    const final = kb >= 1 ? kb : 500;
    set(SettingsKey.CompressionWatchSizeFilterValue, final);
    setFilterInput(String(final));
  };

  const handleRemove = async () => {
    const result = await message.confirm({
      title: t('compression.toolbar.watch_back_confirm_title'),
      description: t('compression.toolbar.watch_back_confirm_description'),
      confirmText: t('compression.toolbar.watch_back'),
      cancelText: t('cancel'),
    });
    if (result) {
      resetWatchOnly();
      progressRef?.current?.done();
      navigate('/compression/watch/guide');
    }
  };

  if (!watchingFolder) return null;

  const showFilteredCount = sizeFilterEnable && filteredCount > 0;

  const handleOpenFolder = () => {
    openPath(watchingFolder);
  };

  const Divider = () => (
    <div className='h-4 w-px shrink-0 bg-neutral-200 dark:bg-neutral-600' aria-hidden />
  );

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-[19px] shrink-0 p-4',
      )}
    >
      {/* 1. 监听状态 */}
      <Badge
        variant='processing'
        className='inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium'
      >
        <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-current' />
        {t('page.compression.watch.card.monitoring')}
      </Badge>

      <Divider />

      {/* 2. icon + 文件夹名称 */}
      <div className='flex min-w-0 shrink-0 items-center gap-2'>
        <Folder className='h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400' />
        <span
          className='max-w-[120px] truncate text-sm font-medium text-neutral-800 dark:text-neutral-200'
          title={folderName}
        >
          {folderName || t('page.compression.watch.guide.folder')}
        </span>
      </div>

      <Divider />

      {/* 3. 文件地址 - 可点击打开文件夹 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type='button'
            onClick={handleOpenFolder}
            className='w-[300px] min-w-[300px] shrink-0 truncate text-left text-xs text-blue-600 underline-offset-2 hover:underline dark:text-blue-400'
            title={watchingFolder}
          >
            {watchingFolder}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className='max-w-[320px] break-all'>{watchingFolder}</p>
          <p className='mt-1 text-xs text-neutral-400'>{t('page.compression.watch.card.open_folder_tip')}</p>
        </TooltipContent>
      </Tooltip>

      <Divider />

      {/* 4. 文件数跟文件大小 */}
      <div className='flex shrink-0 items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400'>
        {isScanning && (
          <span className='flex items-center gap-1.5'>
            <span className='inline-block h-1.5 w-1.5 animate-spin rounded-full border border-current border-t-transparent' />
            {t('page.compression.watch.card.scanning')}
          </span>
        )}
        {isScanFailed && (
          <span className='text-red-600 dark:text-red-400'>{t('page.compression.watch.card.scan_failed')}</span>
        )}
        {hasStats && (
          <>
            <span>{t('page.compression.watch.card.file_count', { count: watchFolderStats.totalCount })}</span>
            <span>{t('page.compression.watch.card.file_size', { size: humanSize(watchFolderStats.totalBytes) })}</span>
            {showFilteredCount && (
              <span className='text-amber-600 dark:text-amber-400'>
                {t('page.compression.watch.card.filtered', { count: filteredCount })}
              </span>
            )}
          </>
        )}
      </div>

      <Divider />

      {/* 5. 启用过滤 - 输入框始终显示，未开启时置灰不可输入 */}
      <div className='flex shrink-0 items-center gap-2'>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type='button'
              onClick={handleFilterToggle}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-all duration-200',
                sizeFilterEnable
                  ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700',
              )}
            >
              <Filter className='h-3 w-3 shrink-0' />
              {t('page.compression.watch.card.enable_filter')}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            {sizeFilterEnable
              ? t('page.compression.watch.card.filter_enabled_tip')
              : t('page.compression.watch.card.filter_disabled_tip')}
          </TooltipContent>
        </Tooltip>
        <div
          className={cn(
            'flex h-7 items-center gap-1.5 rounded-md border px-2',
            sizeFilterEnable
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
            disabled={!sizeFilterEnable}
            className={cn(
              'h-5 min-w-0 max-w-[64px] border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0',
              !sizeFilterEnable && 'cursor-not-allowed text-neutral-400 dark:text-neutral-500',
            )}
          />
          <span
            className={cn(
              'shrink-0 text-xs font-medium',
              sizeFilterEnable ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-400 dark:text-neutral-500',
            )}
          >
            KB
          </span>
        </div>
      </div>

      <Divider />

      {/* 6. 删除 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            onClick={handleRemove}
            className='ml-auto h-8 w-8 shrink-0 text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('page.compression.watch.card.remove')}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export default memo(WatchFolderCard);
