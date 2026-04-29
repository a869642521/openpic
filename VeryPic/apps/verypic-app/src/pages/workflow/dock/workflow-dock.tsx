import { useState } from 'react';
import { ImagePlus, Filter, Maximize2, FileImage, SlidersHorizontal, Sparkles, Download, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowNodeKind } from '@/store/workflow';
import { NODE_META } from '../nodes/node-meta';

interface DockItem {
  kind: WorkflowNodeKind;
  label: string;
  icon: React.ReactNode;
}

const DOCK_ITEMS: DockItem[] = [
  { kind: 'input',     label: '输入',   icon: <ImagePlus className='size-4' /> },
  { kind: 'filter',    label: '过滤',   icon: <Filter className='size-4' /> },
  { kind: 'resize',    label: '尺寸',   icon: <Maximize2 className='size-4' /> },
  { kind: 'convert',   label: '转换',   icon: <FileImage className='size-4' /> },
  { kind: 'compress',  label: '压缩',   icon: <SlidersHorizontal className='size-4' /> },
  { kind: 'watermark', label: '水印',   icon: <Sparkles className='size-4' /> },
  { kind: 'output',    label: '输出',   icon: <Download className='size-4' /> },
];

interface WorkflowDockProps {
  onAddNode: (kind: WorkflowNodeKind) => void;
}

export default function WorkflowDock({ onAddNode }: WorkflowDockProps) {
  const [open, setOpen] = useState(false);

  const handleDragStart = (e: React.DragEvent, kind: WorkflowNodeKind) => {
    e.dataTransfer.setData('application/workflow-node-kind', kind);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className='absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2'>

      {/* expanded node tray */}
      {open && (
        <div className='flex items-end gap-2 rounded-2xl border border-neutral-200/70 bg-white/90 px-4 py-3 shadow-2xl backdrop-blur-xl dark:border-neutral-700/50 dark:bg-neutral-900/90'>
          {DOCK_ITEMS.map((item) => {
            const meta = NODE_META[item.kind];
            return (
              <div
                key={item.kind}
                draggable
                onDragStart={(e) => handleDragStart(e, item.kind)}
                onClick={() => { onAddNode(item.kind); setOpen(false); }}
                title={item.label}
                className='group flex cursor-pointer flex-col items-center gap-1.5'
              >
                <div className={cn(
                  'flex size-10 items-center justify-center rounded-xl border transition-all',
                  'group-hover:-translate-y-1 group-hover:shadow-md',
                  meta.accentBg,
                  meta.accentBorder,
                  meta.accentText,
                )}>
                  {item.icon}
                </div>
                <span className='text-[10px] text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300'>
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* toggle pill */}
      <button
        type='button'
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-medium shadow-xl backdrop-blur-md transition-all',
          open
            ? 'bg-neutral-800 text-white dark:bg-neutral-100 dark:text-neutral-900'
            : 'border border-neutral-200/80 bg-white/90 text-neutral-600 dark:border-neutral-700/50 dark:bg-neutral-900/90 dark:text-neutral-300',
        )}
      >
        {open ? <X className='size-3.5' /> : <Plus className='size-3.5' />}
        {open ? '收起' : '添加节点'}
      </button>
    </div>
  );
}
