import { memo, useContext } from 'react';
import { useI18n } from '@/i18n';
import useCompressionStore from '@/store/compression';
import useSelector from '@/hooks/useSelector';
import { useNavigate } from '@/hooks/useNavigate';
import { CompressionContext } from '.';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { humanSize } from '@/utils/fs';
import { Folder, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { openSettingsWindow } from '@/utils/window';
import useSettingsStore from '@/store/settings';
import { SettingsKey } from '@/constants';
import { isValidArray } from '@/utils';
import message from '@/components/message';

function WatchFolderCard() {
  const t = useI18n();
  const navigate = useNavigate();
  const { progressRef } = useContext(CompressionContext);
  const { watchingFolder, watchFolderStats, working, resetWatchOnly } = useCompressionStore(
    useSelector(['watchingFolder', 'watchFolderStats', 'working', 'resetWatchOnly']),
  );
  const { compression_watch_file_ignore: ignores = [] } = useSettingsStore(
    useSelector([SettingsKey.CompressionWatchFileIgnore]),
  );

  const folderName = watchingFolder ? watchingFolder.split(/[/\\]/).filter(Boolean).pop() || watchingFolder : '';
  const filteredCount = 0; // 侧边栏过滤统计，当前未上报

  const isScanning = watchFolderStats === null && working;
  const isScanFailed = watchFolderStats !== null && 'failed' in watchFolderStats;
  const hasStats = watchFolderStats !== null && 'totalCount' in watchFolderStats;

  const hasFilter = isValidArray(ignores);

  const handleFilter = () => {
    openSettingsWindow({
      subpath: 'compression',
    });
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

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-4',
        'dark:border-neutral-600/80 dark:bg-neutral-800/50',
      )}
    >
      <div className='flex flex-wrap items-center gap-3'>
        {/* 正在监听中 状态徽章 */}
        <Badge
          variant='processing'
          className='inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium'
        >
          <span className='h-1.5 w-1.5 rounded-full bg-current' />
          {t('page.compression.watch.card.monitoring')}
        </Badge>

        {/* 文件夹图标与标题 */}
        <div className='flex items-center gap-2'>
          <Folder className='h-5 w-5 shrink-0 text-amber-500 dark:text-amber-400' />
          <span className='truncate font-medium text-neutral-800 dark:text-neutral-200' title={folderName}>
            {folderName || t('page.compression.watch.guide.folder')}
          </span>
        </div>

        {/* 分隔线 */}
        <div className='h-4 w-px shrink-0 bg-neutral-200 dark:bg-neutral-600' />

        {/* 统计信息 */}
        <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400'>
          {isScanning && <span>{t('page.compression.watch.card.scanning')}</span>}
          {isScanFailed && <span>{t('page.compression.watch.card.scan_failed')}</span>}
          {hasStats && (
            <>
              <span>{t('page.compression.watch.card.file_count', { count: watchFolderStats.totalCount })}</span>
              <span>{t('page.compression.watch.card.file_size', { size: humanSize(watchFolderStats.totalBytes) })}</span>
            </>
          )}
          <span>{t('page.compression.watch.card.filtered', { count: filteredCount })}</span>
        </div>

        {/* 分隔线 */}
        <div className='h-4 w-px shrink-0 bg-neutral-200 dark:bg-neutral-600' />

        {/* 启用过滤 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='secondary'
              size='sm'
              onClick={handleFilter}
              className={cn(
                'h-8 rounded-full px-3 text-xs',
                hasFilter && 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
              )}
            >
              <span className={cn('mr-1.5 h-1.5 w-1.5 rounded-full', hasFilter ? 'bg-blue-500' : 'bg-neutral-400')} />
              {t('page.compression.watch.card.enable_filter')}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasFilter
              ? t('page.compression.watch.card.filter_enabled_tip')
              : t('page.compression.watch.card.filter_disabled_tip')}
          </TooltipContent>
        </Tooltip>

        {/* 删除 */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='icon' onClick={handleRemove} className='ml-auto h-8 w-8 shrink-0'>
              <Trash2 className='h-4 w-4 text-neutral-500 dark:text-neutral-400' />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('page.compression.watch.card.remove')}</TooltipContent>
        </Tooltip>
      </div>

      {/* 路径 */}
      <p
        className='truncate text-xs text-neutral-500 dark:text-neutral-400'
        title={watchingFolder}
      >
        {watchingFolder}
      </p>
    </div>
  );
}

export default memo(WatchFolderCard);
