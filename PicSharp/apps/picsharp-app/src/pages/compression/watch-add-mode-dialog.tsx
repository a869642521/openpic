import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { Eye, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export type WatchAddMode = 'monitor_only' | 'compress_then_monitor';

interface WatchAddModeDialogProps {
  open: boolean;
  onSelect: (mode: WatchAddMode) => void;
  onCancel?: () => void;
}

function WatchAddModeDialog({ open, onSelect, onCancel }: WatchAddModeDialogProps) {
  const t = useI18n();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel?.()}>
      <DialogContent
        className='sm:max-w-md'
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          onCancel?.();
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{t('page.compression.watch.guide.add_mode_dialog_title')}</DialogTitle>
          <DialogDescription>
            {t('page.compression.watch.guide.add_mode_dialog_description')}
          </DialogDescription>
        </DialogHeader>
        <div className='flex flex-col gap-3 pt-2'>
          <button
            type='button'
            onClick={() => onSelect('monitor_only')}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
              'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
              'border-neutral-200 dark:border-neutral-700',
            )}
          >
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40'>
              <Eye className='h-5 w-5 text-amber-600 dark:text-amber-400' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='font-medium text-neutral-900 dark:text-neutral-100'>
                {t('page.compression.watch.guide.add_mode_monitor_only')}
              </p>
              <p className='mt-0.5 text-sm text-neutral-500 dark:text-neutral-400'>
                {t('page.compression.watch.guide.add_mode_monitor_only_desc')}
              </p>
            </div>
          </button>
          <button
            type='button'
            onClick={() => onSelect('compress_then_monitor')}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
              'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
              'border-neutral-200 dark:border-neutral-700',
            )}
          >
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40'>
              <Zap className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            </div>
            <div className='min-w-0 flex-1'>
              <p className='font-medium text-neutral-900 dark:text-neutral-100'>
                {t('page.compression.watch.guide.add_mode_compress_then_monitor')}
              </p>
              <p className='mt-0.5 text-sm text-neutral-500 dark:text-neutral-400'>
                {t('page.compression.watch.guide.add_mode_compress_then_monitor_desc')}
              </p>
            </div>
          </button>
        </div>
        <div className='flex justify-end pt-2'>
          <Button variant='outline' onClick={() => onCancel?.()}>
            {t('cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(WatchAddModeDialog);
