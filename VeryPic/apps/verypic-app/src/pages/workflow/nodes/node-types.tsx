import type { NodeProps, NodeTypes } from '@xyflow/react';
import { ImagePlus, Filter, Maximize2, FileImage, SlidersHorizontal, Sparkles, Download } from 'lucide-react';
import { BaseNode } from './base-node';
import type { WorkflowNode } from '@/store/workflow';
import { cn } from '@/lib/utils';
import { NODE_META } from './node-meta';

// ── shared summary pill ──────────────────────────────────────────────────────

function SummaryPill({ kind, children }: { kind: WorkflowNode['data']['kind']; children: React.ReactNode }) {
  const meta = NODE_META[kind];
  return (
    <div className={cn('flex flex-col items-center gap-1 px-3')}>
      <span className={cn('text-[22px] font-bold leading-none tracking-tight', meta.accentText)}>
        {children}
      </span>
    </div>
  );
}

// ── Node components ──────────────────────────────────────────────────────────

function InputNode({ id, data, selected }: NodeProps<WorkflowNode>) {
  const cfg = data.config as any;
  const label = cfg.source === 'folder' ? '文件夹' : cfg.source === 'watch' ? '监听目录' : '文件';
  return (
    <BaseNode id={id} data={data} selected={selected} icon={<ImagePlus className='size-3.5' />}
      summary={<SummaryPill kind='input'>{label}</SummaryPill>}
    />
  );
}

function FilterNode({ id, data, selected }: NodeProps<WorkflowNode>) {
  const cfg = data.config as any;
  const label = cfg.formats?.length ? cfg.formats.join('/') : '全部格式';
  return (
    <BaseNode id={id} data={data} selected={selected} icon={<Filter className='size-3.5' />}
      summary={<SummaryPill kind='filter'>{label}</SummaryPill>}
    />
  );
}

function ResizeNode({ id, data, selected }: NodeProps<WorkflowNode>) {
  const cfg = data.config as any;
  const label = cfg.mode === 'scale' ? `${cfg.scale}%` : cfg.mode === 'fit' ? '适应' : `${cfg.width}×${cfg.height}`;
  return (
    <BaseNode id={id} data={data} selected={selected} icon={<Maximize2 className='size-3.5' />}
      summary={<SummaryPill kind='resize'>{label}</SummaryPill>}
    />
  );
}

function ConvertNode({ id, data, selected }: NodeProps<WorkflowNode>) {
  const cfg = data.config as any;
  const label = cfg.format === 'keep' ? '原格式' : cfg.format.toUpperCase();
  return (
    <BaseNode id={id} data={data} selected={selected} icon={<FileImage className='size-3.5' />}
      summary={<SummaryPill kind='convert'>→ {label}</SummaryPill>}
    />
  );
}

function CompressNode({ id, data, selected }: NodeProps<WorkflowNode>) {
  const cfg = data.config as any;
  const label = cfg.targetSizeEnable ? `≤${cfg.targetSizeKb}KB` : cfg.type === 'lossless' ? '无损' : `Q${cfg.quality}`;
  return (
    <BaseNode id={id} data={data} selected={selected} icon={<SlidersHorizontal className='size-3.5' />}
      summary={<SummaryPill kind='compress'>{label}</SummaryPill>}
    />
  );
}

function WatermarkNode({ id, data, selected }: NodeProps<WorkflowNode>) {
  const cfg = data.config as any;
  const label = cfg.type === 'text' ? (cfg.text || '文字') : '图片';
  return (
    <BaseNode id={id} data={data} selected={selected} icon={<Sparkles className='size-3.5' />}
      summary={<SummaryPill kind='watermark'>{label}</SummaryPill>}
    />
  );
}

function OutputNode({ id, data, selected }: NodeProps<WorkflowNode>) {
  const cfg = data.config as any;
  const label = cfg.mode === 'overwrite' ? '覆盖' : cfg.mode === 'folder' ? '目录' : '新文件';
  return (
    <BaseNode id={id} data={data} selected={selected} icon={<Download className='size-3.5' />}
      summary={<SummaryPill kind='output'>{label}</SummaryPill>}
    />
  );
}

// ── nodeTypes map ─────────────────────────────────────────────────────────────

export const nodeTypes: NodeTypes = {
  'wf-input': InputNode,
  'wf-filter': FilterNode,
  'wf-resize': ResizeNode,
  'wf-convert': ConvertNode,
  'wf-compress': CompressNode,
  'wf-watermark': WatermarkNode,
  'wf-output': OutputNode,
};
