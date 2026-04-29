import { memo, useEffect } from 'react';
import { useUpdate } from 'ahooks';
import { convertFileSrc } from '@tauri-apps/api/core';
import useConvertStore from '@/store/convert';
import { ConvertStatus } from '@/store/convert';
import { Check, Loader2, XCircle } from 'lucide-react';
import ImageViewer from '@/components/image-viewer';
import { cn } from '@/lib/utils';

interface ConvertFileCardProps {
  path: string;
}

function ConvertFileCard({ path }: ConvertFileCardProps) {
  const update = useUpdate();
  const { fileMap, eventEmitter } = useConvertStore();
  const file = fileMap.get(path);

  useEffect(() => {
    const handler = () => update();
    eventEmitter.on('update_file_item', handler);
    return () => { eventEmitter.off('update_file_item', handler); };
  }, [eventEmitter, update]);

  if (!file) return null;

  const src =
    file.status === ConvertStatus.Completed && file.outputPath
      ? convertFileSrc(file.outputPath)
      : file.assetPath;

  return (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-neutral-800',
        file.status === ConvertStatus.Failed && 'border-destructive/50',
      )}
    >
      <div className='relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-700'>
        <ImageViewer
          src={src}
          size={file.bytesSize}
          path={file.status === ConvertStatus.Completed && file.outputPath ? file.outputPath : file.path}
          ext={file.ext}
          imgClassName='aspect-[4/3] rounded-lg object-contain'
        />
        <div className='absolute right-1 top-1 flex items-center gap-0.5 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white'>
          {file.status === ConvertStatus.Processing && <Loader2 className='h-3 w-3 animate-spin' />}
          {file.status === ConvertStatus.Completed && <Check className='h-3 w-3 text-green-400' />}
          {file.status === ConvertStatus.Failed && <XCircle className='h-3 w-3 text-red-400' />}
        </div>
      </div>
      <div className='flex flex-col gap-0.5 p-2'>
        <p className='truncate text-xs font-medium' title={file.name}>
          {file.name}
        </p>
        <p className='text-[10px] text-neutral-500'>{file.formattedBytesSize}</p>
        {file.status === ConvertStatus.Failed && file.errorMessage && (
          <p className='truncate text-[10px] text-destructive' title={file.errorMessage}>
            {file.errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(ConvertFileCard);
