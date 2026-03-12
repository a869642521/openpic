import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PageProgressRef {
  show: (ease?: boolean) => void;
  done: () => void;
  reset: () => void;
  setValue: (value: number) => void;
  setDescription: (desc: string) => void;
}

function easeOutCirc(x: number): number {
  return Math.sqrt(1 - Math.pow(x - 1, 2));
}

const PageProgress = forwardRef<
  PageProgressRef,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    description?: string;
  }
>(({ className, value, description: initialDescription = 'Loading...', ...props }, ref) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number>(null);
  const isDoneRef = useRef<boolean>(false);
  const [description, setDescriptionState] = useState(initialDescription);

  const reset = () => {
    cancelAnimationFrame(timerRef.current);
    isDoneRef.current = false;
    if (indicatorRef.current) {
      indicatorRef.current.style.transform = `translateX(-100%)`;
    }
    rootRef.current?.classList.add('hidden');
  };

  useImperativeHandle(ref, () => {
    return {
      show: (ease: boolean = false) => {
        if (!rootRef.current) return;
        rootRef.current?.classList.remove('hidden');
        if (ease) {
          let progress = 0;
          const startTime = performance.now();
          const increment = (currentTime: number) => {
            if (indicatorRef.current) {
              const elapsedTime = (currentTime - startTime) / 1000; // 转换为秒
              const maxTime = 60; // 最大时间100秒
              const t = Math.min(elapsedTime / maxTime, 1); // 计算进度时间比例
              progress = easeOutCirc(t) * 100; // 使用easeOutCirc函数计算进度
              if (progress < 100 && !isDoneRef.current) {
                indicatorRef.current.style.transform = `translateX(-${100 - progress}%)`;
                timerRef.current = requestAnimationFrame(increment);
              }
            }
          };
          timerRef.current = requestAnimationFrame(increment);
        }
      },
      done: () => {
        isDoneRef.current = true;
        if (indicatorRef.current) {
          indicatorRef.current.style.transform = `translateX(0%)`;
        }
        setTimeout(reset, 500);
      },
      reset,
      setValue: (value: number) => {
        if (indicatorRef.current) {
          indicatorRef.current.style.transform = `translateX(-${100 - value}%)`;
        }
      },
      setDescription: (desc: string) => {
        setDescriptionState(desc);
      },
    };
  });

  return (
    <div
      className='absolute inset-0 z-10 flex hidden h-full w-full flex-col items-center justify-center bg-white/90 backdrop-blur-sm dark:bg-neutral-950/90'
      ref={rootRef}
    >
      <div className='flex flex-col items-center gap-4'>
        <Loader2 className='h-8 w-8 animate-spin text-foreground/70' />
        {description && (
          <span className='text-sm text-foreground/80'>{description}</span>
        )}
        <div
          className={cn(
            'relative h-1.5 w-48 overflow-hidden rounded-full bg-neutral-900/20 dark:bg-neutral-50/20',
            className,
          )}
          {...props}
        >
          <div
            ref={indicatorRef}
            className='h-full w-full bg-neutral-900 transition-transform duration-300 ease-out dark:bg-neutral-50'
            style={{ transform: `translateX(-100%)` }}
          />
        </div>
      </div>
    </div>
  );
});

PageProgress.displayName = 'PageProgress';

export { PageProgress };
