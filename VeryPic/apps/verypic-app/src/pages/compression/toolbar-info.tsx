import { memo } from 'react';
import useCompressionStore from '@/store/compression';
import useSelector from '@/hooks/useSelector';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Info } from 'lucide-react';
import { useI18n } from '@/i18n';
import { humanSize } from '@/utils/fs';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { formatCompressPercent } from '@/utils';

export const ToolbarInfoDisplay = () => {
  const { files } = useCompressionStore(useSelector(['files']));
  const t = useI18n();

  const originalSize = files.reduce((acc, file) => {
    return acc + (file.bytesSize || 0);
  }, 0);

  const compressedSize = files.reduce((acc, file) => {
    if (file.compressedBytesSize) {
      return acc + (file.compressedBytesSize || 0);
    }
    return acc;
  }, 0);

  const reducedSize = files.reduce((acc, file) => {
    if (file.compressedBytesSize) {
      return acc + ((file.bytesSize || 0) - (file.compressedBytesSize || 0));
    }
    return acc;
  }, 0);

  const compressRate =
    reducedSize > 0 && originalSize > 0
      ? formatCompressPercent((reducedSize / originalSize) * 100)
      : '0';

  return (
    <div className='flex items-center justify-center gap-4'>
      <div className='flex flex-col items-center'>
        <div className='text-xs text-neutral-500'>{t('compression.toolbar.info.total_files')}</div>
        <div className='text-sm font-bold'>{files.length}</div>
      </div>
      <Separator orientation='vertical' className='h-8' />
      <div className='flex flex-col items-center'>
        <div className='text-xs text-neutral-500'>{t('compression.toolbar.info.total_original_size')}</div>
        <div className='text-sm font-bold'>{humanSize(originalSize)}</div>
      </div>
      <Separator orientation='vertical' className='h-8' />
      <div className='flex flex-col items-center'>
        <div className='text-xs text-neutral-500'>{t('compression.toolbar.info.total_saved_volume')}</div>
        <div className='text-sm font-bold'>{humanSize(compressedSize)}</div>
      </div>
      <Separator orientation='vertical' className='h-8' />
      <div className='flex flex-col items-center'>
        <div className='text-xs text-neutral-500'>{t('compression.toolbar.info.saved_volume_rate')}</div>
        <div className='text-sm font-bold'>{compressRate}%</div>
      </div>
    </div>
  );
};

export default memo(function ToolbarInfo() {
  return (
    <HoverCard openDelay={300}>
      <HoverCardTrigger asChild>
        <Button variant='ghost' size='icon' className='dark:hover:bg-neutral-700/50'>
          <Info className='h-4 w-4' />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className='w-[max-content] dark:bg-neutral-900'>
        <ToolbarInfoDisplay />
      </HoverCardContent>
    </HoverCard>
  );
});
