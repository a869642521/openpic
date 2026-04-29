import { memo } from 'react';
import { cn } from '@/lib/utils';
import ToolbarCompress from './toolbar-compress';
import ToolbarClear from './toolbar-exit';
import ToolbarInfo from './toolbar-info';
import { Separator } from '@/components/ui/separator';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { TooltipProvider } from '@/components/ui/tooltip';

export interface ToolbarProps {
  mode: 'classic' | 'watch';
}

function Toolbar(props: ToolbarProps) {
  const { mode } = props;
  const isMain = getCurrentWebviewWindow().label === 'main';

  return (
    <TooltipProvider delayDuration={100}>
      <div
        className={cn(
          'flex h-[56px] w-full items-stretch overflow-hidden rounded-xl',
          'border border-neutral-200/80 bg-white',
          'dark:border-neutral-600/80 dark:bg-neutral-800',
        )}
      >
        {mode === 'watch' && (
          <div className='flex min-w-0 flex-1 items-center justify-center gap-2 px-3'>
            <ToolbarInfo />
            {isMain && (
              <>
                <Separator orientation='vertical' className='h-6' />
                <ToolbarClear mode={mode} />
              </>
            )}
          </div>
        )}
        {mode === 'classic' && (
          <>
            {isMain && (
              <div className='flex min-w-0 flex-[0.3] border-r border-neutral-200/60 dark:border-neutral-600/60 [&>button]:flex-1'>
                <ToolbarClear mode={mode} variant='button' />
              </div>
            )}
            <div className={cn('flex min-w-0', isMain ? 'flex-[0.7]' : 'flex-1', '[&>button]:flex-1')}>
              <ToolbarCompress />
            </div>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

export default memo(Toolbar);
