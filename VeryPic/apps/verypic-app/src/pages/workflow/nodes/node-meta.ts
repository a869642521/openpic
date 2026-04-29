import type { WorkflowNodeKind } from '@/store/workflow';

export interface NodeMeta {
  accentBg: string;
  accentBorder: string;
  accentText: string;
  accentStrip: string;
  hasInput: boolean;
  hasOutput: boolean;
}

export const NODE_META: Record<WorkflowNodeKind, NodeMeta> = {
  input: {
    accentBg: 'bg-blue-50 dark:bg-blue-950/30',
    accentBorder: 'border-blue-200 dark:border-blue-800',
    accentText: 'text-blue-600 dark:text-blue-400',
    accentStrip: 'bg-blue-500',
    hasInput: false,
    hasOutput: true,
  },
  filter: {
    accentBg: 'bg-cyan-50 dark:bg-cyan-950/30',
    accentBorder: 'border-cyan-200 dark:border-cyan-800',
    accentText: 'text-cyan-600 dark:text-cyan-400',
    accentStrip: 'bg-cyan-500',
    hasInput: true,
    hasOutput: true,
  },
  resize: {
    accentBg: 'bg-purple-50 dark:bg-purple-950/30',
    accentBorder: 'border-purple-200 dark:border-purple-800',
    accentText: 'text-purple-600 dark:text-purple-400',
    accentStrip: 'bg-purple-500',
    hasInput: true,
    hasOutput: true,
  },
  convert: {
    accentBg: 'bg-amber-50 dark:bg-amber-950/30',
    accentBorder: 'border-amber-200 dark:border-amber-800',
    accentText: 'text-amber-600 dark:text-amber-400',
    accentStrip: 'bg-amber-500',
    hasInput: true,
    hasOutput: true,
  },
  compress: {
    accentBg: 'bg-green-50 dark:bg-green-950/30',
    accentBorder: 'border-green-200 dark:border-green-800',
    accentText: 'text-green-600 dark:text-green-400',
    accentStrip: 'bg-green-500',
    hasInput: true,
    hasOutput: true,
  },
  watermark: {
    accentBg: 'bg-pink-50 dark:bg-pink-950/30',
    accentBorder: 'border-pink-200 dark:border-pink-800',
    accentText: 'text-pink-600 dark:text-pink-400',
    accentStrip: 'bg-pink-500',
    hasInput: true,
    hasOutput: true,
  },
  output: {
    accentBg: 'bg-neutral-50 dark:bg-neutral-800/40',
    accentBorder: 'border-neutral-200 dark:border-neutral-700',
    accentText: 'text-neutral-600 dark:text-neutral-400',
    accentStrip: 'bg-neutral-400',
    hasInput: true,
    hasOutput: false,
  },
};
