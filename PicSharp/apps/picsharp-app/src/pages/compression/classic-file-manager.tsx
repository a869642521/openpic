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
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { parsePaths } from '@/utils/fs';
import { VALID_IMAGE_EXTS } from '@/constants';
import { open } from '@tauri-apps/plugin-dialog';
import { Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UnlistenFn } from '@tauri-apps/api/event';

function FileManager() {
  const { files } = useCompressionStore(useSelector(['files']));
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isDragOver, setIsDragOver] = useState(false);
  const navigate = useNavigate();
  const t = useI18n();
  const scrollAreaRef = useRef<ScrollAreaRef>(null);
  const dragDropController = useRef<UnlistenFn | null>(null);
  const r = useReport();

  const dataList = useMemo(
    () => files.slice((pageIndex - 1) * pageSize, pageIndex * pageSize),
    [files, pageIndex, pageSize],
  );

  useEffect(() => {
    if (dataList.length === 0 && pageIndex > 1 && files.length > 0) {
      const lastValidPage = Math.max(1, Math.ceil(files.length / pageSize));
      setPageIndex(lastValidPage);
    }
  }, [dataList.length, files.length, pageIndex, pageSize]);

  useEffect(() => {
    const state = useCompressionStore.getState();
    if (!isValidArray(state.classicFiles)) {
      state.resetClassic();
      navigate('/compression/classic/guide');
    }
  }, []);

  const handleAppendFiles = async (paths: string[] | null) => {
    if (!isValidArray(paths)) return;
    const newFiles = await parsePaths(paths!, VALID_IMAGE_EXTS);
    if (!isValidArray(newFiles)) return;
    const batchId = useCompressionStore.getState().currentBatchTimestamp;
    const tagged = newFiles.map((f) => ({ ...f, batchId }));
    useCompressionStore.getState().appendClassicFiles(tagged);
  };

  const handleAddMoreClick = async () => {
    const selected = await open({
      multiple: true,
      directory: false,
      filters: [{ name: 'Image Files', extensions: VALID_IMAGE_EXTS }],
    });
    if (selected) {
      handleAppendFiles(Array.isArray(selected) ? selected : [selected]);
    }
  };

  useEffect(() => {
    const setupDragDrop = async () => {
      dragDropController.current = await getCurrentWebview().onDragDropEvent(async (event) => {
        if (event.payload.type === 'enter') {
          setIsDragOver(true);
        } else if (event.payload.type === 'leave') {
          setIsDragOver(false);
        } else if (event.payload.type === 'drop') {
          setIsDragOver(false);
          handleAppendFiles(event.payload.paths);
        }
      });
    };
    setupDragDrop();
    return () => {
      dragDropController.current?.();
      dragDropController.current = null;
    };
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

  // 按 batchId 分组，每个批次内再按 parentDir 子分组
  const batchSegments = useMemo(() => {
    // 按 batchId 聚合，保留插入顺序
    const batchMap = new Map<number, FileInfo[]>();
    for (const file of dataList) {
      const id = file.batchId ?? 0;
      if (!batchMap.has(id)) batchMap.set(id, []);
      batchMap.get(id)!.push(file);
    }
    return Array.from(batchMap.entries()).map(([batchId, batchFiles]) => {
      // 按 parentDir 聚合，保留插入顺序
      const folderMap = new Map<string, FileInfo[]>();
      for (const file of batchFiles) {
        const dir = file.parentDir || '';
        if (!folderMap.has(dir)) folderMap.set(dir, []);
        folderMap.get(dir)!.push(file);
      }
      const folderGroups = Array.from(folderMap.entries()).map(([folderPath, files]) => ({
        folderPath,
        folderName: folderPath.split(/[/\\]/).filter(Boolean).pop() || folderPath,
        files,
      }));
      return { batchId, folderGroups, multiFolder: folderGroups.length > 1 };
    });
  }, [dataList]);

  const formatBatchTime = (ts: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}  ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className='relative flex h-full gap-3' style={{ backgroundColor: 'rgb(243, 243, 243)' }}>
      {isDragOver && (
        <div className='pointer-events-none absolute inset-0 z-50 flex items-center justify-center rounded-xl bg-blue-500/10 backdrop-blur-[2px]'>
          <div className='rounded-xl border-2 border-dashed border-blue-400 bg-white/80 px-8 py-6 text-center shadow-lg'>
            <Plus className='mx-auto mb-2 h-8 w-8 text-blue-500' />
            <p className='text-sm font-medium text-blue-600'>{t('page.compression.classic.drop_to_add')}</p>
          </div>
        </div>
      )}
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
          {batchSegments.map((segment, segIdx) => (
            <div key={segment.batchId}>
              {segIdx > 0 && batchSegments[segIdx - 1].batchId > 0 && (
                <div className='my-4 flex items-center gap-2'>
                  <span className='shrink-0 text-[11px] leading-none text-neutral-400'>
                    {formatBatchTime(batchSegments[segIdx - 1].batchId)}
                  </span>
                  <div className='h-px flex-1 bg-neutral-200' />
                </div>
              )}
              {segment.folderGroups.map((group, groupIdx) => (
                <div key={group.folderPath} className={groupIdx > 0 ? 'mt-5' : ''}>
                  {segment.multiFolder && (
                    <div className='mb-2 flex items-center gap-1.5 min-w-0'>
                      <FolderOpen className='h-3.5 w-3.5 shrink-0 text-neutral-400' />
                      <span className='shrink-0 text-xs font-medium text-neutral-500'>
                        {group.folderName}
                      </span>
                      <span className='truncate text-[11px] text-neutral-300' title={group.folderPath}>
                        {group.folderPath}
                      </span>
                    </div>
                  )}
                  <div
                    className='grid gap-3 contain-layout'
                    style={{
                      contentVisibility: 'auto',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    }}
                  >
                    {group.files.map((file) => (
                      <FileCard key={file.path} path={file.path} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <div className='pb-[40px]' />
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
            <Button
              variant='outline'
              size='sm'
              onClick={handleAddMoreClick}
              className='w-full gap-1.5 rounded-xl border-dashed text-neutral-500 hover:border-blue-400 hover:text-blue-500'
            >
              <Plus className='h-3.5 w-3.5' />
              <span className='text-xs'>{t('page.compression.classic.add_more_files')}</span>
            </Button>
            <Toolbar mode='classic' />
          </div>
        </div>
      )}
    </div>
  );
}

export default FileManager;
