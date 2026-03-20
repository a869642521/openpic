import { Hammer } from 'lucide-react';

export const WatermarkContext = { progressRef: null } as any;

export default function Watermark() {
  return (
    <div className='flex h-full flex-col items-center justify-center gap-3 text-neutral-400 dark:text-neutral-500'>
      <Hammer className='h-8 w-8' />
      <p className='text-sm'>功能正在开发中...</p>
    </div>
  );
}
