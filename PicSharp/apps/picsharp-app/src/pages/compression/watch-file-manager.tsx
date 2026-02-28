import { memo, useState, useMemo, useRef, Fragment } from 'react';
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
  const { files } = useCompressionStore(useSelector(['files']));

  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const t = useI18n();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { processedFiles, existingFiles } = useMemo(() => {
    const processed = files.filter((f) => f.status !== ICompressor.Status.Pending);
    const existing = files.filter((f) => f.status === ICompressor.Status.Pending);
    return { processedFiles: processed, existingFiles: existing };
  }, [files]);

  const sortedFiles = useMemo(
    () => [...processedFiles, ...existingFiles],
    [processedFiles, existingFiles],
  );

  const dataList = useMemo(() => {
    return sortedFiles.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);
  }, [sortedFiles, pageIndex, pageSize]);

  useUpdateEffect(() => {
    if (dataList.length === 0 && pageIndex > 1) {
      setPageIndex(1);
    }
  }, [sortedFiles.length]);

  useUpdateEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pageIndex]);

  const hasPagination = sortedFiles.length > pageSize;

  return (
    <div className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
      {/* 列表标题 */}
      {isValidArray(sortedFiles) && (
        <div className='flex shrink-0 items-center justify-between border-b border-neutral-200/80 px-4 py-2.5 dark:border-neutral-600/80'>
          <div className='flex items-center gap-3 text-sm'>
            <h3 className='font-medium text-neutral-700 dark:text-neutral-300'>
              {t('page.compression.watch.list.title')} ({sortedFiles.length})
            </h3>
            {processedFiles.length > 0 && (
              <span className='rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'>
                {t('page.compression.watch.list.processed', { count: processedFiles.length })}
              </span>
            )}
            {existingFiles.length > 0 && (
              <span className='rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'>
                {t('page.compression.watch.list.existing', { count: existingFiles.length })}
              </span>
            )}
          </div>
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
              {dataList.map((file, idx) => {
                const isFirstExistingOnPage =
                  file.status === ICompressor.Status.Pending &&
                  !dataList
                    .slice(0, idx)
                    .some((f) => f.status === ICompressor.Status.Pending);
                return (
                  <Fragment key={file.path}>
                    {isFirstExistingOnPage && existingFiles.length > 0 && processedFiles.length > 0 && (
                      <div className='col-span-full mt-2 flex items-center gap-2 border-t border-dashed border-neutral-200 pt-4 dark:border-neutral-600'>
                        <span className='text-xs font-medium text-neutral-500 dark:text-neutral-400'>
                          {t('page.compression.watch.list.section_existing')}
                        </span>
                      </div>
                    )}
                    <FileCard path={file.path} />
                  </Fragment>
                );
              })}
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
              total={files.length}
              current={pageIndex}
              pageSize={pageSize}
              onChange={(pageIndex, pageSize) => {
                if (pageIndex) {
                  setPageIndex(pageIndex);
                }
                if (pageSize) {
                  setPageSize(pageSize);
                }
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
