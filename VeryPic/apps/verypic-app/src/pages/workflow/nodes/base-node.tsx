import { memo, type ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MoreHorizontal, Trash2, Copy, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkflowStore, type WorkflowNodeData } from '@/store/workflow';
import { NODE_META } from './node-meta';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/i18n';

export interface BaseNodeProps {
  id: string;
  data: WorkflowNodeData;
  selected?: boolean;
  /** 节点主体内容：当前配置的核心一行摘要 */
  summary?: ReactNode;
  icon: ReactNode;
}

function BaseNodeImpl({ id, data, selected, summary, icon }: BaseNodeProps) {
  const { removeNode, toggleNodeEnabled, duplicateNode, setSelectedNodeId } = useWorkflowStore();
  const t = useI18n();
  const meta = NODE_META[data.kind];

  return (
    <div
      className={cn(
        // --- base ---
        'group/node relative w-[220px] cursor-pointer select-none rounded-xl',
        'border bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)]',
        'transition-all duration-150 dark:bg-[#1c1c1e]',
        // --- default border ---
        'border-neutral-200/80 dark:border-neutral-700/60',
        // --- selected ring ---
        selected && 'border-blue-400 shadow-[0_0_0_3px_rgba(59,130,246,0.15),0_4px_16px_rgba(59,130,246,0.12)] dark:border-blue-500',
        // --- hover lift (only when not selected) ---
        !selected && 'hover:border-neutral-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] dark:hover:border-neutral-600',
        // --- disabled ---
        !data.enabled && 'opacity-40',
      )}
      onClick={() => setSelectedNodeId(id)}
    >

      {/* ── Header ── */}
      <div className='flex items-center gap-2 px-3 pt-3 pb-0'>
        {/* colored dot instead of a big bordered box */}
        <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-md', meta.accentBg, meta.accentText)}>
          {icon}
        </span>
        <span className='min-w-0 flex-1 truncate text-[12px] font-semibold tracking-tight text-neutral-700 dark:text-neutral-200'>
          {t(data.label as any)}
        </span>

        {/* more menu — only on hover */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              className='flex size-5 shrink-0 items-center justify-center rounded text-neutral-300 opacity-0 transition-opacity group-hover/node:opacity-100 hover:bg-neutral-100 hover:text-neutral-500 dark:hover:bg-neutral-800'
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className='size-3' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-36'>
            <DropdownMenuItem onClick={() => toggleNodeEnabled(id)}>
              <EyeOff className='size-3' />
              {data.enabled ? '禁用节点' : '启用节点'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => duplicateNode(id)}>
              <Copy className='size-3' />
              复制节点
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='text-red-500 focus:text-red-500'
              onClick={(e) => { e.stopPropagation(); removeNode(id); }}
            >
              <Trash2 className='size-3' />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Preview / Content area ── */}
      <div className={cn(
        'mx-3 mt-2.5 mb-3 flex h-[72px] items-center justify-center rounded-lg',
        meta.accentBg,
        'border border-dashed',
        meta.accentBorder,
        'overflow-hidden',
      )}>
        {summary ?? (
          <span className={cn('text-[11px] font-medium opacity-50', meta.accentText)}>未配置</span>
        )}
      </div>

      {/* ── Handles ── */}
      {meta.hasInput && (
        <Handle
          type='target'
          position={Position.Left}
          className={cn(
            '!size-3 !rounded-full !border-2 !border-white !bg-neutral-300',
            'dark:!border-[#1c1c1e] dark:!bg-neutral-500',
            'opacity-0 transition-opacity group-hover/node:opacity-100',
            selected && '!opacity-100',
          )}
          style={{ left: -6 }}
        />
      )}
      {meta.hasOutput && (
        <Handle
          type='source'
          position={Position.Right}
          className={cn(
            '!size-3 !rounded-full !border-2 !border-white !bg-neutral-300',
            'dark:!border-[#1c1c1e] dark:!bg-neutral-500',
            'opacity-0 transition-opacity group-hover/node:opacity-100',
            selected && '!opacity-100',
          )}
          style={{ right: -6 }}
        />
      )}
    </div>
  );
}

export const BaseNode = memo(BaseNodeImpl);
