import { useEffect, useRef } from 'react';
import { ImagePlus, Filter, Maximize2, FileImage, SlidersHorizontal, Sparkles, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowNodeKind } from '@/store/workflow';

interface NodePickerItem {
  kind: WorkflowNodeKind;
  label: string;
  desc: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
}

const ITEMS: NodePickerItem[] = [
  { kind: 'input',     label: '输入',     desc: '文件 / 文件夹',         icon: <ImagePlus className='size-3.5' />,        bg: 'bg-blue-50 dark:bg-blue-950/40',    text: 'text-blue-500' },
  { kind: 'filter',    label: '过滤',     desc: '格式 / 大小筛选',        icon: <Filter className='size-3.5' />,           bg: 'bg-cyan-50 dark:bg-cyan-950/40',    text: 'text-cyan-500' },
  { kind: 'resize',    label: '尺寸调整', desc: '缩放 / 裁剪',            icon: <Maximize2 className='size-3.5' />,        bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-500' },
  { kind: 'convert',   label: '格式转换', desc: 'JPG / PNG / WebP / AVIF', icon: <FileImage className='size-3.5' />,       bg: 'bg-amber-50 dark:bg-amber-950/40',  text: 'text-amber-500' },
  { kind: 'compress',  label: '压缩',     desc: '无损 / 有损 / 目标大小',  icon: <SlidersHorizontal className='size-3.5' />, bg: 'bg-green-50 dark:bg-green-950/40', text: 'text-green-500' },
  { kind: 'watermark', label: '水印',     desc: '文字 / 图片水印',         icon: <Sparkles className='size-3.5' />,         bg: 'bg-pink-50 dark:bg-pink-950/40',   text: 'text-pink-500' },
  { kind: 'output',    label: '输出',     desc: '覆盖 / 新文件 / 目录',    icon: <Download className='size-3.5' />,         bg: 'bg-neutral-100 dark:bg-neutral-800', text: 'text-neutral-500' },
];

interface NodePickerProps {
  position: { x: number; y: number };
  onSelect: (kind: WorkflowNodeKind) => void;
  onClose: () => void;
}

export default function NodePicker({ position, onSelect, onClose }: NodePickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onMouse);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onMouse); document.removeEventListener('keydown', onKey); };
  }, [onClose]);

  // Keep picker inside viewport
  const style: React.CSSProperties = {
    left: Math.min(position.x, window.innerWidth - 220),
    top: Math.min(position.y, window.innerHeight - 340),
  };

  return (
    <div
      ref={ref}
      className='pointer-events-auto absolute z-50 w-52 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/95 shadow-2xl backdrop-blur-md dark:border-neutral-700/60 dark:bg-neutral-900/95'
      style={style}
    >
      {/* title */}
      <div className='px-3.5 pt-3 pb-2'>
        <p className='text-[11px] font-semibold uppercase tracking-widest text-neutral-400'>添加节点</p>
        <p className='text-[10px] text-neutral-400 mt-0.5'>双击画布空白处创建</p>
      </div>

      <div className='px-2 pb-2 space-y-0.5'>
        {ITEMS.map((item) => (
          <button
            key={item.kind}
            type='button'
            className='flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/70'
            onClick={() => onSelect(item.kind)}
          >
            <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg', item.bg, item.text)}>
              {item.icon}
            </span>
            <div className='min-w-0'>
              <div className='text-[12px] font-medium text-neutral-700 dark:text-neutral-200'>{item.label}</div>
              <div className='text-[10px] text-neutral-400 truncate'>{item.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
