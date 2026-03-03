import { memo, useState, useMemo, useRef } from 'react';
import FileCard from './file-card';
import useCompressionStore from '@/store/compression';
import useSelector from '@/hooks/useSelector';
import Toolbar from './toolbar';
import ToolbarPagination from './toolbar-pagination';
import { isValidArray } from '@/utils';
import { useI18n } from '@/i18n';
import { useUpdateEffect } from 'ahooks';
import { preventDefault } from '@/utils';
import { cn } from '@/lib/utils';
import { ImagePlus } from 'lucide-react';
import { ICompressor } from '@/utils/compressor';

function WatchFileManager() {
  const { files, watchFolders } = useCompressionStore(useSelector(['files', 'watchFolders']));

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const t = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 只展示已处理/处理中，不展示 Pending
  const displayFiles = useMemo(() => {
    const active = files.filter((f) => f.status !== ICompressor.Status.Pending);
    if (selectedFolderId === 'all') return active;
    return active.filter((f) => f.watchFolderId === selectedFolderId);
  }, [files, selectedFolderId]);

  const processedCount = useMemo(
    () => displayFiles.filter((f) => f.status === ICompressor.Status.Completed).length,
    [displayFiles],
  );

  const dataList = useMemo(() => {
    return displayFiles.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);
  }, [displayFiles, pageIndex, pageSize]);

  useUpdateEffect(() => {
    if (dataList.length === 0 && pageIndex > 1) {
      setPageIndex(1);
    }
  }, [displayFiles.length]);

  useUpdateEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pageIndex]);

  const hasPagination = displayFiles.length > pageSize;
  // 多文件夹时才显示 Tab 筛选
  const showFolderFilter = watchFolders.length > 1;

  // 统计每个文件夹的已处理数量
  const folderCountMap = useMemo(() => {
    const allActive = files.filter((f) => f.status !== ICompressor.Status.Pending);
    const map = new Map<string, number>();
    allActive.forEach((f) => {
      const id = f.watchFolderId || '';
      map.set(id, (map.get(id) || 0) + 1);
    });
    return map;
  }, [files]);

  const getFolderName = (path: string) =>
    path.split(/[/\\]/).filter(Boolean).pop() || path;

  return (
    <div className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
      {/* 标题栏 + 文件夹筛选 */}
      {(isValidArray(displayFiles) || showFolderFilter) && (
        <div className='flex shrink-0 items-center justify-between border-b border-neutral-200/80 px-4 py-2.5 dark:border-neutral-600/80'>
          <div className='flex items-center gap-3 text-sm'>
            <h3 className='font-medium text-neutral-700 dark:text-neutral-300'>
              {t('page.compression.watch.list.title')} ({displayFiles.length})
            </h3>
            {processedCount > 0 && (
              <span className='rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'>
                {t('page.compression.watch.list.processed', { count: processedCount })}
              </span>
            )}
          </div>

          {/* 多文件夹 Tab 筛选 */}
          {showFolderFilter && (
            <div className='flex items-center gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-700/50'>
              <button
                onClick={() => {
                  setSelectedFolderId('all');
                  setPageIndex(1);
                }}
                className={cn(
                  'rounded px-2 py-0.5 text-xs transition-colors',
                  selectedFolderId === 'all'
                    ? 'bg-white text-neutral-800 shadow-sm dark:bg-neutral-600 dark:text-neutral-100'
                    : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
                )}
              >
                {t('page.compression.watch.folder.filter_all')}
                <span className='ml-1 text-neutral-400'>
                  ({files.filter((f) => f.status !== ICompressor.Status.Pending).length})
                </span>
              </button>
              {watchFolders.map((folder) => {
                const name = getFolderName(folder.path);
                const count = folderCountMap.get(folder.id) || 0;
                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      setSelectedFolderId(folder.id);
                      setPageIndex(1);
                    }}
                    className={cn(
                      'max-w-[120px] truncate rounded px-2 py-0.5 text-xs transition-colors',
                      selectedFolderId === folder.id
                        ? 'bg-white text-neutral-800 shadow-sm dark:bg-neutral-600 dark:text-neutral-100'
                        : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200',
                    )}
                    title={folder.path}
                  >
                    {name}
                    {count > 0 && (
                      <span className='ml-1 text-neutral-400'>({count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className='relative min-h-0 min-w-[350px] flex-1 overflow-y-auto overflow-x-hidden'
        onContextMenu={preventDefault}
      >
        {isValidArray(dataList) ? (
          <div className={cn('w-full px-4 pt-4', hasPagination ? 'pb-[110px]' : 'pb-[65px]')}>
            <div
              className='grid gap-3 contain-layout pb-[40px]'
              style={{
                contentVisibility: 'auto',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              }}
            >
              {dataList.map((file) => (
                <FileCard key={file.path} path={file.path} />
              ))}
            </div>
          </div>
        ) : (
          <div className='flex min-h-[280px] flex-col items-center justify-center gap-4 px-6 py-12'>
            <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-700/50'>
              <ImagePlus className='h-8 w-8 text-neutral-400 dark:text-neutral-500' />
            </div>
            <div className='text-center'>
              <p className='text-sm font-medium text-neutral-700 dark:text-neutral-300'>
                {t('page.compression.watch.list.empty_title')}
              </p>
              <p className='mt-1 max-w-[280px] text-xs text-neutral-500 dark:text-neutral-400'>
                {t('page.compression.watch.list.empty_description')}
              </p>
            </div>
          </div>
        )}
        <div className='absolute bottom-2 left-[50%] flex translate-x-[-50%] flex-col gap-1'>
          {hasPagination && (
            <ToolbarPagination
              total={displayFiles.length}
              current={pageIndex}
              pageSize={pageSize}
              onChange={(pageIndex, pageSize) => {
                if (pageIndex) setPageIndex(pageIndex);
                if (pageSize) setPageSize(pageSize);
              }}
            />
          )}
          <Toolbar mode='watch' />
        </div>
      </div>
    </div>
  );
}

export default memo(WatchFileManager);
