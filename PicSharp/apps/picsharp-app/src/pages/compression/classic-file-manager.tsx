import { useEffect, useState, useMemo, useRef } from 'react';
import FileCard from './file-card';
import useCompressionStore from '@/store/compression';
import useSelector from '@/hooks/useSelector';
import Toolbar from './toolbar';
import { ToolbarInfoDisplay } from './toolbar-info';
import ToolbarPagination from './toolbar-pagination';
import { Empty } from 'antd';
import { isValidArray, preventDefault } from '@/utils';
import CompressionOptionsCard from './compression-options-card';
import { useNavigate } from '@/hooks/useNavigate';
import { useI18n } from '@/i18n';
import { ScrollArea, ScrollAreaRef } from '@/components/ui/scroll-area';
import { useUpdateEffect } from 'ahooks';
import { cn } from '@/lib/utils';
import { useReport } from '@/hooks/useReport';

function FileManager() {
  const { files } = useCompressionStore(useSelector(['files']));
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const navigate = useNavigate();
  const t = useI18n();
  const scrollAreaRef = useRef<ScrollAreaRef>(null);
  const r = useReport();

  const dataList = useMemo(() => {
    let list = files.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);
    if (list.length === 0 && pageIndex !== 1) {
      list = files.slice((pageIndex - 2) * pageSize, (pageIndex - 1) * pageSize);
      setPageIndex(pageIndex - 1);
    }
    return list;
  }, [files, pageIndex, pageSize]);

  useEffect(() => {
    const state = useCompressionStore.getState();
    if (!isValidArray(state.classicFiles)) {
      state.resetClassic();
      navigate('/compression/classic/guide');
    }
  }, []);

  useUpdateEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollToTop();
    }
  }, [pageIndex]);

  useEffect(() => {
    const state = useCompressionStore.getState();
    r('classic_workspace_imp', {
      files_num: state.classicFiles.length,
    });
  }, []);

  const hasPagination = files.length > pageSize;

  return (
    <div className='flex h-full gap-3' style={{ backgroundColor: 'rgb(236, 237, 238)' }}>
      <ScrollArea
        className='relative min-h-0 min-w-[350px] flex-1 overflow-hidden rounded-xl'
        style={{ backgroundColor: 'rgb(252, 252, 252)' }}
        onContextMenu={preventDefault}
        ref={scrollAreaRef}
      >
        {isValidArray(dataList) ? (
        <div
          className={cn('w-full px-3', hasPagination ? 'pb-[110px]' : 'pb-[65px]')}
          style={{ paddingTop: '0.75rem' }}
        >
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
        <div className='flex h-full items-center justify-center'>
          <Empty description={t('no_data')} />
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
      </div>
    </ScrollArea>
      {isValidArray(files) && (
        <div className='flex min-w-0 flex-shrink-0 flex-col pb-0'>
          <ScrollArea className='min-h-0 flex-1'>
            <div className='flex flex-col gap-3 pb-2'>
              <CompressionOptionsCard />
            </div>
          </ScrollArea>
          <div className='shrink-0 flex flex-col gap-2 pt-2'>
            <div
              className='rounded-xl border px-3 py-2 shadow-none dark:border-neutral-600 dark:bg-neutral-800'
              style={{ backgroundColor: 'rgb(245, 245, 245)' }}
            >
              <ToolbarInfoDisplay />
            </div>
            <Toolbar mode='classic' />
          </div>
        </div>
      )}
    </div>
  );
}

export default FileManager;
