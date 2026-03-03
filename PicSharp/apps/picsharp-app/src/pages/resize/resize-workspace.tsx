import { useEffect, useState, useMemo, useRef } from 'react';
import ResizeFileCard from './resize-file-card';
import useResizeStore from '@/store/resize';
import ResizeOptionsCard from './resize-options-card';
import { isValidArray, preventDefault } from '@/utils';
import { useNavigate } from '@/hooks/useNavigate';
import { useI18n } from '@/i18n';
import { ScrollArea, ScrollAreaRef } from '@/components/ui/scroll-area';
import { Empty } from 'antd';
import { open } from '@tauri-apps/plugin-dialog';
import { Plus, Maximize2, LoaderPinwheel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VALID_IMAGE_EXTS } from '@/constants';
import { parsePaths } from '@/utils/fs';
import { getCurrentWebview } from '@tauri-apps/api/webview';
import { UnlistenFn } from '@tauri-apps/api/event';
import { ResizeStatus } from '@/store/resize';
import { resizeImages } from '@/utils/resize';
import useAppStore from '@/store/app';
import useSelector from '@/hooks/useSelector';
import { CompressionOutputMode } from '@/constants';
import message from '@/components/message';
import { exists } from '@tauri-apps/plugin-fs';

function ResizeWorkspace() {
  const {
    files,
    fileMap,
    options,
    outputMode,
    outputSaveAsFileSuffix,
    outputSaveToFolder,
    inCompressing,
    setInCompressing,
    updateFileItem,
    eventEmitter,
  } = useResizeStore();
  const { sidecar } = useAppStore(useSelector(['sidecar']));
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [isDragOver, setIsDragOver] = useState(false);
  const navigate = useNavigate();
  const t = useI18n();
  const scrollAreaRef = useRef<ScrollAreaRef>(null);
  const dragDropController = useRef<UnlistenFn | null>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  const dataList = useMemo(() => {
    let list = files.slice((pageIndex - 1) * pageSize, pageIndex * pageSize);
    if (list.length === 0 && pageIndex !== 1) {
      list = files.slice((pageIndex - 2) * pageSize, (pageIndex - 1) * pageSize);
      setPageIndex(pageIndex - 1);
    }
    return list;
  }, [files, pageIndex, pageSize]);

  useEffect(() => {
    if (!isValidArray(files)) {
      navigate('/resize/guide');
    }
  }, [files, navigate]);

  const handleAppendFiles = async (paths: string[] | null) => {
    if (!isValidArray(paths)) return;
    const newFiles = await parsePaths(paths!, VALID_IMAGE_EXTS);
    if (!isValidArray(newFiles)) return;
    const batchId = useResizeStore.getState().currentBatchTimestamp;
    const tagged = newFiles.map((f) => ({
      ...f,
      batchId,
      status: ResizeStatus.Pending,
    }));
    useResizeStore.getState().appendFiles(tagged);
  };

  const handleAddMoreClick = async () => {
    const selected = await open({
      multiple: true,
      directory: false,
      filters: [{ name: 'Image Files', extensions: VALID_IMAGE_EXTS }],
    });
    if (selected) handleAppendFiles(Array.isArray(selected) ? selected : [selected]);
  };

  useEffect(() => {
    const setupDragDrop = async () => {
      dragDropController.current = await getCurrentWebview().onDragDropEvent(async (event) => {
        if (event.payload.type === 'enter') setIsDragOver(true);
        else if (event.payload.type === 'leave') setIsDragOver(false);
        else if (event.payload.type === 'drop') {
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

  const pendingFiles = files.filter(
    (f) => f.status === ResizeStatus.Pending || f.status === ResizeStatus.Failed,
  );
  const pendingCount = pendingFiles.length;
  const hasCompleted = files.some((f) => f.status === ResizeStatus.Completed);
  const disabledResize =
    !files.length ||
    inCompressing ||
    pendingCount === 0 ||
    (options.dimensions[0] <= 0 && options.dimensions[1] <= 0);

  const handleResize = async () => {
    if (!sidecar?.origin) {
      message.error(t('tips.sidecar_not_ready'));
      return;
    }
    if (
      outputMode === CompressionOutputMode.SaveToNewFolder &&
      (!outputSaveToFolder || !(await exists(outputSaveToFolder)))
    ) {
      message.error(t('tips.save_to_folder_not_exists', { path: outputSaveToFolder || '' }));
      return;
    }

    setInCompressing(true);
    const filesToProcess = pendingFiles
      .map((f) => fileMap.get(f.path))
      .filter(Boolean) as typeof files;

    filesToProcess.forEach((f) => {
      updateFileItem(f.path, { status: ResizeStatus.Processing });
    });
    eventEmitter.emit('update_file_item', 'all');

    let fulfilled = 0;
    let rejected = 0;

    await resizeImages(
      filesToProcess,
      {
        sidecarDomain: sidecar?.origin || '',
        outputMode,
        newFileSuffix: outputSaveAsFileSuffix,
        newFolderPath: outputSaveToFolder,
        dimensions: options.dimensions,
        fit: options.fit,
        concurrency: 6,
      },
      (res) => {
        fulfilled++;
        const targetFile = fileMap.get(res.input_path);
        if (targetFile) {
          updateFileItem(res.input_path, {
            status: ResizeStatus.Completed,
            outputPath: res.output_path,
          });
        }
        eventEmitter.emit('update_file_item', res.input_path);
        if (indicatorRef.current) {
          indicatorRef.current.textContent = `${Math.round(((fulfilled + rejected) / filesToProcess.length) * 100)}%`;
        }
      },
      (res) => {
        rejected++;
        const targetFile = fileMap.get(res.input_path);
        if (targetFile) {
          updateFileItem(res.input_path, {
            status: ResizeStatus.Failed,
            errorMessage: res.error,
          });
        }
        eventEmitter.emit('update_file_item', res.input_path);
        if (indicatorRef.current) {
          indicatorRef.current.textContent = `${Math.round(((fulfilled + rejected) / filesToProcess.length) * 100)}%`;
        }
      },
    );

    setInCompressing(false);
    if (indicatorRef.current) indicatorRef.current.textContent = '0%';
    message.success(
      t('resize.completed', {
        fulfilled,
        rejected,
        total: filesToProcess.length,
      }),
    );
  };

  return (
    <div className='relative flex h-full gap-3' style={{ backgroundColor: 'rgb(236, 237, 238)' }}>
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
          <div className='w-full px-3 pb-[65px]' style={{ paddingTop: '0.75rem' }}>
            <div
              className='grid gap-3 contain-layout'
              style={{
                contentVisibility: 'auto',
                gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
              }}
            >
              {dataList.map((file) => (
                <ResizeFileCard key={file.path} path={file.path} />
              ))}
            </div>
          </div>
        ) : (
          <div className='flex h-full items-center justify-center'>
            <Empty description={t('no_data')} />
          </div>
        )}
      </ScrollArea>
      {isValidArray(files) && (
        <div className='flex min-w-0 flex-shrink-0 flex-col pb-0'>
          <ScrollArea className='min-h-0 flex-1'>
            <div className='flex flex-col gap-3 pb-2'>
              <ResizeOptionsCard />
            </div>
          </ScrollArea>
          <div className='shrink-0 flex flex-col gap-2 pt-2'>
            <div
              className='rounded-xl border px-3 py-2 shadow-none dark:border-neutral-600 dark:bg-neutral-800'
              style={{ backgroundColor: 'rgb(245, 245, 245)' }}
            >
              <p className='text-xs text-neutral-600'>{t('resize.file_count', { count: files.length })}</p>
            </div>
            <Button
              size='sm'
              disabled={disabledResize}
              onClick={handleResize}
              className='relative h-10 w-full gap-2 rounded-xl border-0 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
            >
              <div
                className={`absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-300 ${inCompressing ? 'opacity-100' : ''}`}
              >
                <LoaderPinwheel className='h-4 w-4 animate-spin' />
                <span ref={indicatorRef}>0%</span>
              </div>
              <div
                className={`flex items-center justify-center gap-2 transition-opacity duration-300 ${inCompressing ? 'opacity-0' : ''}`}
              >
                <Maximize2 className='h-4 w-4' />
                <span>
                  {hasCompleted ? t('resize.resize_again', { count: pendingCount }) : t('resize.resize')}
                </span>
              </div>
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleAddMoreClick}
              className='w-full gap-1.5 rounded-xl border-dashed text-neutral-500 hover:border-blue-400 hover:text-blue-500'
            >
              <Plus className='h-3.5 w-3.5' />
              <span className='text-xs'>{t('page.compression.classic.add_more_files')}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResizeWorkspace;
