import { RotateCcw, RotateCw, GitBranch, Play, Save, Trash2 } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function WorkflowToolbar() {
  const { undo, redo, resetCanvas, history, future, workflowName, setWorkflowName } = useWorkflowStore();

  return (
    <div className='flex items-center justify-between border-b border-neutral-200/60 bg-white/75 px-5 py-2.5 backdrop-blur-md dark:border-neutral-800/60 dark:bg-[#111112]/80'>
      <div className='flex items-center gap-2.5'>
        <GitBranch className='size-4 text-neutral-400' />
        <input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          placeholder='未命名工作流'
          className='min-w-0 border-none bg-transparent text-sm font-medium text-neutral-800 outline-none placeholder:text-neutral-400 dark:text-neutral-100 dark:placeholder:text-neutral-600'
        />
        <Badge variant='blue'>预览版</Badge>
      </div>

      <div className='flex items-center gap-1'>
        <button
          type='button'
          onClick={undo}
          disabled={!history.length}
          title='撤销 (Ctrl+Z)'
          className={cn(
            'flex size-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800',
            !history.length && 'cursor-not-allowed opacity-30',
          )}
        >
          <RotateCcw className='size-3.5' />
        </button>
        <button
          type='button'
          onClick={redo}
          disabled={!future.length}
          title='重做 (Ctrl+Y)'
          className={cn(
            'flex size-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800',
            !future.length && 'cursor-not-allowed opacity-30',
          )}
        >
          <RotateCw className='size-3.5' />
        </button>
        <button
          type='button'
          onClick={resetCanvas}
          title='重置画布'
          className='flex size-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-800'
        >
          <Trash2 className='size-3.5' />
        </button>

        <div className='mx-2 h-4 w-px bg-neutral-200 dark:bg-neutral-700' />

        <Button variant='secondary' size='sm' className='h-7 gap-1.5 px-3 text-xs shadow-none'>
          <Save className='size-3' />
          保存
        </Button>
        <Button size='sm' className='h-7 gap-1.5 px-3 text-xs shadow-none'>
          <Play className='size-3' />
          运行
        </Button>
      </div>
    </div>
  );
}
