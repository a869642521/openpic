import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkflowStore } from '@/store/workflow';
import type {
  CompressConfig,
  ResizeConfig,
  ConvertConfig,
  FilterConfig,
  WatermarkConfig,
  OutputConfig,
  InputConfig,
} from '@/store/workflow';
import { cn } from '@/lib/utils';
import { NODE_META } from '../nodes/node-meta';

// ── Shared primitives ────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex items-center justify-between gap-3 py-2.5'>
      <span className='shrink-0 text-xs text-neutral-500 dark:text-neutral-400'>{label}</span>
      <div className='min-w-0 flex-1 text-right'>{children}</div>
    </div>
  );
}

function InspectorSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className='rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function NumberInput({ value, onChange, min, max }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <input
      type='number'
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className='w-20 rounded-md border border-neutral-200 bg-white px-2 py-1 text-right text-xs text-neutral-700 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
    />
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type='button'
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-5 w-9 rounded-full transition-colors',
        checked ? 'bg-blue-500' : 'bg-neutral-300 dark:bg-neutral-600',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

// ── Per-kind config panels ───────────────────────────────────────────────────

function InputPanel({ nodeId, config }: { nodeId: string; config: InputConfig }) {
  const { updateNodeConfig } = useWorkflowStore();
  return (
    <Row label='来源'>
      <InspectorSelect
        value={config.source}
        onChange={(v) => updateNodeConfig(nodeId, { source: v as InputConfig['source'] })}
        options={[
          { value: 'files', label: '文件' },
          { value: 'folder', label: '文件夹' },
          { value: 'watch', label: '监听目录' },
        ]}
      />
    </Row>
  );
}

function FilterPanel({ nodeId, config }: { nodeId: string; config: FilterConfig }) {
  const { updateNodeConfig } = useWorkflowStore();
  return (
    <>
      <Row label='启用过滤'>
        <Toggle checked={config.enabled} onChange={(v) => updateNodeConfig(nodeId, { enabled: v })} />
      </Row>
      <Row label='最小大小 (KB)'>
        <NumberInput value={config.minSizeKb} onChange={(v) => updateNodeConfig(nodeId, { minSizeKb: v })} min={0} />
      </Row>
    </>
  );
}

function ResizePanel({ nodeId, config }: { nodeId: string; config: ResizeConfig }) {
  const { updateNodeConfig } = useWorkflowStore();
  return (
    <>
      <Row label='调整模式'>
        <InspectorSelect
          value={config.mode}
          onChange={(v) => updateNodeConfig(nodeId, { mode: v as ResizeConfig['mode'] })}
          options={[
            { value: 'scale', label: '比例缩放' },
            { value: 'custom', label: '自定义尺寸' },
            { value: 'fit', label: '内容适应' },
          ]}
        />
      </Row>
      {config.mode === 'scale' && (
        <Row label='缩放比例 (%)'>
          <NumberInput value={config.scale} onChange={(v) => updateNodeConfig(nodeId, { scale: v })} min={1} max={200} />
        </Row>
      )}
      {config.mode === 'custom' && (
        <>
          <Row label='宽度 (px)'>
            <NumberInput value={config.width} onChange={(v) => updateNodeConfig(nodeId, { width: v })} min={1} />
          </Row>
          <Row label='高度 (px)'>
            <NumberInput value={config.height} onChange={(v) => updateNodeConfig(nodeId, { height: v })} min={1} />
          </Row>
        </>
      )}
      {config.mode === 'fit' && (
        <Row label='适应方式'>
          <InspectorSelect
            value={config.fit}
            onChange={(v) => updateNodeConfig(nodeId, { fit: v as ResizeConfig['fit'] })}
            options={[
              { value: 'contain', label: 'Contain' },
              { value: 'cover', label: 'Cover' },
              { value: 'fill', label: 'Fill' },
            ]}
          />
        </Row>
      )}
    </>
  );
}

function ConvertPanel({ nodeId, config }: { nodeId: string; config: ConvertConfig }) {
  const { updateNodeConfig } = useWorkflowStore();
  return (
    <Row label='目标格式'>
      <InspectorSelect
        value={config.format}
        onChange={(v) => updateNodeConfig(nodeId, { format: v as ConvertConfig['format'] })}
        options={[
          { value: 'keep', label: '保持原格式' },
          { value: 'jpg', label: 'JPG' },
          { value: 'png', label: 'PNG' },
          { value: 'webp', label: 'WebP' },
          { value: 'avif', label: 'AVIF' },
        ]}
      />
    </Row>
  );
}

function CompressPanel({ nodeId, config }: { nodeId: string; config: CompressConfig }) {
  const { updateNodeConfig } = useWorkflowStore();
  return (
    <>
      <Row label='压缩类型'>
        <InspectorSelect
          value={config.type}
          onChange={(v) => updateNodeConfig(nodeId, { type: v as CompressConfig['type'] })}
          options={[
            { value: 'lossless', label: '无损' },
            { value: 'lossy', label: '有损' },
          ]}
        />
      </Row>
      {config.type === 'lossy' && (
        <Row label='质量 (0-100)'>
          <NumberInput value={config.quality} onChange={(v) => updateNodeConfig(nodeId, { quality: v })} min={0} max={100} />
        </Row>
      )}
      <Row label='目标大小'>
        <Toggle checked={config.targetSizeEnable} onChange={(v) => updateNodeConfig(nodeId, { targetSizeEnable: v })} />
      </Row>
      {config.targetSizeEnable && (
        <Row label='目标大小 (KB)'>
          <NumberInput value={config.targetSizeKb} onChange={(v) => updateNodeConfig(nodeId, { targetSizeKb: v })} min={1} />
        </Row>
      )}
    </>
  );
}

function WatermarkPanel({ nodeId, config }: { nodeId: string; config: WatermarkConfig }) {
  const { updateNodeConfig } = useWorkflowStore();
  return (
    <>
      <Row label='类型'>
        <InspectorSelect
          value={config.type}
          onChange={(v) => updateNodeConfig(nodeId, { type: v as WatermarkConfig['type'] })}
          options={[{ value: 'text', label: '文字' }, { value: 'image', label: '图片' }]}
        />
      </Row>
      {config.type === 'text' && (
        <Row label='文字内容'>
          <input
            value={config.text}
            onChange={(e) => updateNodeConfig(nodeId, { text: e.target.value })}
            placeholder='水印文字'
            className='w-28 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
          />
        </Row>
      )}
      <Row label='位置'>
        <InspectorSelect
          value={config.position}
          onChange={(v) => updateNodeConfig(nodeId, { position: v as WatermarkConfig['position'] })}
          options={[
            { value: 'top-left', label: '左上' },
            { value: 'top-right', label: '右上' },
            { value: 'center', label: '居中' },
            { value: 'bottom-left', label: '左下' },
            { value: 'bottom-right', label: '右下' },
          ]}
        />
      </Row>
      <Row label='透明度 (%)'>
        <NumberInput value={config.opacity} onChange={(v) => updateNodeConfig(nodeId, { opacity: v })} min={0} max={100} />
      </Row>
    </>
  );
}

function OutputPanel({ nodeId, config }: { nodeId: string; config: OutputConfig }) {
  const { updateNodeConfig } = useWorkflowStore();
  return (
    <>
      <Row label='输出模式'>
        <InspectorSelect
          value={config.mode}
          onChange={(v) => updateNodeConfig(nodeId, { mode: v as OutputConfig['mode'] })}
          options={[
            { value: 'overwrite', label: '覆盖原文件' },
            { value: 'new-file', label: '新文件' },
            { value: 'folder', label: '指定目录' },
          ]}
        />
      </Row>
      {config.mode === 'new-file' && (
        <Row label='后缀'>
          <input
            value={config.suffix}
            onChange={(e) => updateNodeConfig(nodeId, { suffix: e.target.value })}
            className='w-28 rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700 outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200'
          />
        </Row>
      )}
    </>
  );
}

// ── Main InspectorPanel ──────────────────────────────────────────────────────

const KIND_LABELS: Record<string, string> = {
  input: '输入',
  filter: '过滤',
  resize: '尺寸调整',
  convert: '格式转换',
  compress: '压缩',
  watermark: '水印',
  output: '输出',
};

export default function InspectorPanel() {
  const { nodes, selectedNodeId, setSelectedNodeId, toggleNodeEnabled } = useWorkflowStore();
  const node = nodes.find((n) => n.id === selectedNodeId);

  return (
    <AnimatePresence>
      {node && (
        <motion.aside
          key={node.id}
          initial={{ x: 16, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 16, opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className='absolute right-3 top-3 bottom-3 z-20 flex w-[240px] flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/95 shadow-xl backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-900/95'
        >
          {/* header */}
          <div className={cn('flex items-center justify-between px-4 py-3', NODE_META[node.data.kind].accentBg)}>
            <div>
              <div className={cn('text-sm font-semibold', NODE_META[node.data.kind].accentText)}>
                {KIND_LABELS[node.data.kind]}
              </div>
              <div className='text-[11px] text-neutral-400'>节点配置</div>
            </div>
            <button
              type='button'
              onClick={() => setSelectedNodeId(null)}
              className='flex size-6 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            >
              <X className='size-3.5' />
            </button>
          </div>

          {/* enable toggle */}
          <div className='flex items-center justify-between border-b border-neutral-100 px-4 py-2.5 dark:border-neutral-800'>
            <span className='text-xs text-neutral-500'>启用此节点</span>
            <Toggle checked={node.data.enabled} onChange={() => toggleNodeEnabled(node.id)} />
          </div>

          {/* config rows */}
          <div className='flex-1 overflow-y-auto px-4 divide-y divide-neutral-100 dark:divide-neutral-800'>
            {node.data.kind === 'input' && <InputPanel nodeId={node.id} config={node.data.config as InputConfig} />}
            {node.data.kind === 'filter' && <FilterPanel nodeId={node.id} config={node.data.config as FilterConfig} />}
            {node.data.kind === 'resize' && <ResizePanel nodeId={node.id} config={node.data.config as ResizeConfig} />}
            {node.data.kind === 'convert' && <ConvertPanel nodeId={node.id} config={node.data.config as ConvertConfig} />}
            {node.data.kind === 'compress' && <CompressPanel nodeId={node.id} config={node.data.config as CompressConfig} />}
            {node.data.kind === 'watermark' && <WatermarkPanel nodeId={node.id} config={node.data.config as WatermarkConfig} />}
            {node.data.kind === 'output' && <OutputPanel nodeId={node.id} config={node.data.config as OutputConfig} />}
          </div>

          <div className='border-t border-neutral-100 px-4 py-2.5 dark:border-neutral-800'>
            <p className='text-[10px] leading-relaxed text-neutral-400'>点击画布空白处关闭面板</p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
