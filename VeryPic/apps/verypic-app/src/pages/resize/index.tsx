import { createContext } from 'react';
import { Hammer } from 'lucide-react';
import type { PageProgressRef } from '@/components/fullscreen-progress';

export const ResizeContext = createContext<{
  progressRef: React.RefObject<PageProgressRef>;
}>({
  progressRef: null,
});

export default function Resize() {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-3 text-neutral-400 dark:text-neutral-500'>
      <Hammer className='h-8 w-8' />
      <p className='text-sm'>功能正在开发中...</p>
    </div>
  );
}
