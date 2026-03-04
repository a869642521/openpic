import React, { memo, useState, useEffect } from 'react';
import { useI18n } from '@/i18n';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ConvertFormat,
  ResizeFit,
  ResizeMode,
  WatermarkType,
  WatermarkPosition,
} from '@/constants';
import { open } from '@tauri-apps/plugin-dialog';
import { cn } from '@/lib/utils';
import { parseSizeToKb } from '@/utils/fs';

// ─── Shared style constants ───────────────────────────────────────────────────

export const SECTION_CLASS =
  'rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-800/30';
export const ROW_CLASS = 'flex items-center justify-between gap-3';
export const LABEL_CLASS = 'shrink-0 text-xs text-neutral-600 dark:text-neutral-400';

// ─── YesNoTabs ────────────────────────────────────────────────────────────────

export function YesNoTabs({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const t = useI18n();
  return (
    <Tabs
      value={value ? 'yes' : 'no'}
      activationMode='manual'
      onValueChange={(v) => onChange(v === 'yes')}
    >
      <TabsList className='flex h-8 w-[100px] shrink-0 rounded-full p-0'>
        <TabsTrigger
          value='no'
          className='flex-1 h-full rounded-full text-xs shadow-none data-[state=active]:bg-[rgb(236,237,238)] data-[state=active]:text-neutral-700 data-[state=inactive]:bg-transparent'
        >
          {t('compression.options.yes_no.no')}
        </TabsTrigger>
        <TabsTrigger
          value='yes'
          className='flex-1 h-full rounded-full text-xs shadow-none data-[state=active]:bg-black data-[state=active]:text-white'
        >
          {t('compression.options.yes_no.yes')}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

// ─── WatermarkPositionPicker ──────────────────────────────────────────────────

export const POSITION_GRID = [
  [WatermarkPosition.TopLeft, WatermarkPosition.Top, WatermarkPosition.TopRight],
  [WatermarkPosition.Left, WatermarkPosition.Center, WatermarkPosition.Right],
  [WatermarkPosition.BottomLeft, WatermarkPosition.Bottom, WatermarkPosition.BottomRight],
];

export const POSITION_CN_LABELS: Record<string, string> = {
  [WatermarkPosition.TopLeft]: '左上',
  [WatermarkPosition.Top]: '上中',
  [WatermarkPosition.TopRight]: '右上',
  [WatermarkPosition.Left]: '左中',
  [WatermarkPosition.Center]: '居中',
  [WatermarkPosition.Right]: '右中',
  [WatermarkPosition.BottomLeft]: '左下',
  [WatermarkPosition.Bottom]: '下中',
  [WatermarkPosition.BottomRight]: '右下',
};

export function WatermarkPositionPicker({
  value,
  onChange,
  previewText,
  previewColor,
}: {
  value: string;
  onChange: (v: string) => void;
  previewText?: string;
  previewColor?: string;
}) {
  const posRow = POSITION_GRID.findIndex((row) => row.includes(value as WatermarkPosition));
  const posCol = posRow >= 0 ? POSITION_GRID[posRow].indexOf(value as WatermarkPosition) : -1;

  return (
    <div className='flex items-start gap-3'>
      {/* 3×3 位置宫格 */}
      <div className='grid grid-cols-3 gap-1'>
        {POSITION_GRID.map((row) =>
          row.map((pos) => {
            const active = value === pos;
            return (
              <button
                key={pos}
                type='button'
                title={POSITION_CN_LABELS[pos]}
                onClick={() => onChange(pos)}
                className={cn(
                  'h-8 w-10 rounded border text-[10px] font-medium transition-colors',
                  active
                    ? 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : 'border-neutral-200 bg-neutral-50 text-neutral-400 hover:border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500',
                )}
              >
                {POSITION_CN_LABELS[pos]}
              </button>
            );
          }),
        )}
      </div>

      {/* 可视化预览区 */}
      <div
        className='relative flex h-[108px] w-[160px] shrink-0 overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800'
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,0.03) 6px, rgba(0,0,0,0.03) 12px)',
        }}
      >
        <div className='absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none'>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className='border border-neutral-200/40 dark:border-neutral-600/30' />
          ))}
        </div>
        {posRow >= 0 && posCol >= 0 && (
          <div
            className='absolute z-10 flex items-center justify-center'
            style={{
              left: `${(posCol / 3) * 100 + 16.67}%`,
              top: `${(posRow / 3) * 100 + 16.67}%`,
              transform: 'translate(-50%, -50%)',
              maxWidth: '48px',
            }}
          >
            {previewText ? (
              <span
                className='whitespace-nowrap rounded px-1 text-[9px] font-medium opacity-90 shadow-sm'
                style={{
                  color: previewColor ?? '#ffffff',
                  background: 'rgba(0,0,0,0.35)',
                  fontSize: '9px',
                  lineHeight: '14px',
                  maxWidth: '48px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                }}
              >
                {previewText}
              </span>
            ) : (
              <div className='h-4 w-6 rounded bg-neutral-500/60 shadow' />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared feature types & helpers ──────────────────────────────────────────

export type WatchFeature = 'compression' | 'resize' | 'watermark' | 'convert';

export const ALL_FEATURES: WatchFeature[] = ['compression', 'resize', 'convert', 'watermark'];

export const FEATURE_ENABLE_KEYS: Record<WatchFeature, keyof WatchFolderSettings> = {
  compression: 'compressionEnable',
  resize: 'resizeEnable',
  watermark: 'watermarkEnable',
  convert: 'convertEnable',
};

export function isFeatureEnabled(feature: WatchFeature, settings: WatchFolderSettings): boolean {
  switch (feature) {
    case 'compression':
      return settings.compressionEnable !== false;
    case 'resize':
      return settings.resizeEnable;
    case 'watermark':
      return settings.watermarkEnable;
    case 'convert':
      return settings.convertEnable;
  }
}

// ─── Shared panel props ───────────────────────────────────────────────────────

interface FeaturePanelProps {
  settings: WatchFolderSettings;
  onChange: (patch: Partial<WatchFolderSettings>) => void;
}

// ─── CompressionPanel ─────────────────────────────────────────────────────────

export const CompressionPanel = memo(function CompressionPanel({
  settings: s,
  onChange,
}: FeaturePanelProps) {
  const t = useI18n();
  const [filterInput, setFilterInput] = useState(String(s.sizeFilterValue ?? 500));

  useEffect(() => {
    setFilterInput(String(s.sizeFilterValue ?? 500));
  }, [s.sizeFilterValue]);

  const handleFilterBlur = () => {
    const kb = parseSizeToKb(filterInput);
    const final = kb >= 1 ? kb : 500;
    onChange({ sizeFilterValue: final });
    setFilterInput(String(final));
  };

  return (
    <div className={SECTION_CLASS}>
      <div className={cn(ROW_CLASS, 'mb-0')}>
        <p className='text-sm font-semibold'>
          {t('page.compression.watch.folder.settings.compression')}
        </p>
        <Tabs
          value={s.sizeFilterEnable ? 'filter' : 'auto'}
          activationMode='manual'
          onValueChange={(v) => onChange({ sizeFilterEnable: v === 'filter' })}
        >
          <TabsList className='flex h-8 w-[120px] shrink-0 rounded-full p-0'>
            <TabsTrigger
              value='auto'
              className='flex-1 h-full rounded-full text-xs data-[state=active]:bg-black data-[state=active]:text-white'
            >
              {t('compression.options.mode.auto')}
            </TabsTrigger>
            <TabsTrigger
              value='filter'
              className='flex-1 h-full rounded-full text-xs data-[state=active]:bg-black data-[state=active]:text-white'
            >
              {t('compression.options.mode.filter')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {s.sizeFilterEnable && (
        <div className='mt-3'>
          <div className={ROW_CLASS}>
            <Label className={LABEL_CLASS}>
              {t('page.compression.watch.folder.settings.size_filter')}
            </Label>
            <div className='flex h-8 w-[350px] items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 dark:border-neutral-600 dark:bg-neutral-900'>
              <Input
                type='text'
                value={filterInput}
                placeholder='500'
                onChange={(e) => setFilterInput(e.target.value)}
                onBlur={handleFilterBlur}
                className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
              />
              <span className='shrink-0 text-xs text-neutral-400'>KB</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// ─── ConvertPanel ─────────────────────────────────────────────────────────────

export const ConvertPanel = memo(function ConvertPanel({
  settings: s,
  onChange,
}: FeaturePanelProps) {
  const t = useI18n();

  const currentFormat = s.convertTypes[0] ?? ConvertFormat.Webp;

  return (
    <div className={SECTION_CLASS}>
      <div className={cn(ROW_CLASS, 'mb-0')}>
        <p className='text-sm font-semibold'>
          {t('page.compression.watch.folder.settings.convert')}
        </p>
        <Select
          value={currentFormat}
          onValueChange={(v) => onChange({ convertTypes: [v as ConvertFormat] })}
        >
          <SelectTrigger className='h-8 w-[350px] shrink-0 text-xs'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ConvertFormat.Webp} className='text-xs'>WebP</SelectItem>
            <SelectItem value={ConvertFormat.Png} className='text-xs'>PNG</SelectItem>
            <SelectItem value={ConvertFormat.Jpg} className='text-xs'>JPG</SelectItem>
            <SelectItem value={ConvertFormat.Avif} className='text-xs'>AVIF</SelectItem>
            <SelectItem value={ConvertFormat.Gif} className='text-xs'>GIF</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {currentFormat === ConvertFormat.Png && (
        <div className={cn(ROW_CLASS, 'mt-3')}>
          <Label className={LABEL_CLASS}>
            {t('page.compression.watch.folder.settings.convert_alpha')}
          </Label>
          <div className='flex items-center gap-2'>
            <input
              type='color'
              value={s.convertAlpha}
              onChange={(e) => onChange({ convertAlpha: e.target.value })}
              className='h-7 w-10 cursor-pointer overflow-hidden rounded-md border-0 bg-transparent p-0'
            />
            <Input
              value={s.convertAlpha}
              onChange={(e) => onChange({ convertAlpha: e.target.value })}
              className='h-7 w-[90px] text-xs'
            />
          </div>
        </div>
      )}
    </div>
  );
});

// ─── ResizeFit visual options ─────────────────────────────────────────────────

const RESIZE_FIT_OPTIONS: {
  fit: ResizeFit;
  nameKey: string;
  descKey: string;
  icon: React.ReactNode;
}[] = [
  {
    fit: ResizeFit.Cover,
    nameKey: 'compression.options.resize.fit.name.cover',
    descKey: 'compression.options.resize.fit.desc.cover',
    icon: <img src='/icon-Sizecoverage.png' alt='cover' className='shrink-0 rounded object-contain' style={{ width: 90, height: 50 }} />,
  },
  {
    fit: ResizeFit.Fill,
    nameKey: 'compression.options.resize.fit.name.fill',
    descKey: 'compression.options.resize.fit.desc.fill',
    icon: (
      <img src='/icon-Sizepadding.png' alt='fill' className='shrink-0 rounded object-contain' style={{ width: 50, height: 50 }} />
    ),
  },
  {
    fit: ResizeFit.Contain,
    nameKey: 'compression.options.resize.fit.name.contain',
    descKey: 'compression.options.resize.fit.desc.contain',
    icon: (
      <img src='/icon-Dimensionsinclude.png' alt='contain' className='shrink-0 rounded object-contain' style={{ width: 50, height: 50 }} />
    ),
  },
];

// ─── ResizePanel ──────────────────────────────────────────────────────────────

export const ResizePanel = memo(function ResizePanel({
  settings: s,
  onChange,
}: FeaturePanelProps) {
  const t = useI18n();
  const resizeMode: ResizeMode = s.resizeMode ?? ResizeMode.Scale;

  const dimW = s.resizeDimensions[0];
  const dimH = s.resizeDimensions[1];
  const [widthInput, setWidthInput] = useState(String(dimW || ''));
  const [heightInput, setHeightInput] = useState(String(dimH || ''));
  const [scaleInput, setScaleInput] = useState(String(s.resizeScale ?? 50));

  useEffect(() => { setWidthInput(String(dimW || '')); }, [dimW]);
  useEffect(() => { setHeightInput(String(dimH || '')); }, [dimH]);
  useEffect(() => { setScaleInput(String(s.resizeScale ?? 50)); }, [s.resizeScale]);

  const handleResizeBlur = () => {
    const w = parseInt(widthInput) || 0;
    const h = parseInt(heightInput) || 0;
    onChange({ resizeDimensions: [w, h] });
  };

  return (
    <div className={SECTION_CLASS}>
      <div className={cn(ROW_CLASS, 'mb-0')}>
        <p className='text-sm font-semibold'>
          {t('page.compression.watch.folder.settings.resize')}
        </p>
        <Tabs
          value={resizeMode}
          activationMode='manual'
          onValueChange={(v) => onChange({ resizeMode: v as ResizeMode })}
        >
          <TabsList className='flex h-8 w-[150px] shrink-0 rounded-full p-0'>
            <TabsTrigger
              value={ResizeMode.Scale}
              className='flex-1 h-full rounded-full text-xs data-[state=active]:bg-black data-[state=active]:text-white'
            >
              {t('compression.options.resize.mode.scale')}
            </TabsTrigger>
            <TabsTrigger
              value={ResizeMode.Custom}
              className='flex-1 h-full rounded-full text-xs data-[state=active]:bg-black data-[state=active]:text-white'
            >
              {t('compression.options.resize.mode.custom')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className='mt-3 space-y-3'>
          {resizeMode === ResizeMode.Scale && (
            <div className={ROW_CLASS}>
              <Label className={LABEL_CLASS}>
                {t('compression.options.resize.scale_label')}
              </Label>
              <div
                className='flex h-8 w-[350px] items-center gap-1 rounded-md border px-2 text-xs'
                style={{ borderColor: 'rgb(219,219,220)' }}
              >
                <Input
                  type='number'
                  min={1}
                  max={99}
                  value={scaleInput}
                  onChange={(e) => setScaleInput(e.target.value)}
                  onBlur={() => {
                    const num = Number(scaleInput);
                    const valid = Number.isFinite(num) && num >= 1 && num <= 99;
                    const final = valid ? Math.floor(num) : 50;
                    onChange({ resizeScale: final });
                    setScaleInput(String(final));
                  }}
                  className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                />
                <span className='shrink-0 text-neutral-400'>%</span>
              </div>
            </div>
          )}

          {resizeMode === ResizeMode.Custom && (
            <>
              {/* 宽高同行 */}
              <div className={ROW_CLASS}>
                <Label className={LABEL_CLASS}>
                  {t('compression.options.resize.dimensions_label')}
                </Label>
                <div className='flex w-[350px] items-center gap-3'>
                  <div className='flex h-8 flex-1 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 dark:border-neutral-600 dark:bg-neutral-900'>
                    <Input
                      type='number'
                      min={0}
                      value={widthInput}
                      onChange={(e) => setWidthInput(e.target.value)}
                      onBlur={handleResizeBlur}
                      placeholder='0'
                      className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                    />
                    <span className='shrink-0 text-[10px] font-medium text-neutral-400'>W</span>
                  </div>
                  <span className='text-xs text-neutral-300 dark:text-neutral-600'>×</span>
                  <div className='flex h-8 flex-1 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 dark:border-neutral-600 dark:bg-neutral-900'>
                    <Input
                      type='number'
                      min={0}
                      value={heightInput}
                      onChange={(e) => setHeightInput(e.target.value)}
                      onBlur={handleResizeBlur}
                      placeholder='0'
                      className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                    />
                    <span className='shrink-0 text-[10px] font-medium text-neutral-400'>H</span>
                  </div>
                </div>
              </div>
              {/* 内容适应：标题在左，卡片在右 */}
              <div className={ROW_CLASS}>
                <Label className={LABEL_CLASS}>
                  {t('compression.options.resize.fit_label')}
                </Label>
                <div className='flex w-[350px] gap-2'>
                  {RESIZE_FIT_OPTIONS.map(({ fit, nameKey, descKey, icon }) => {
                    const active = s.resizeFit === fit;
                    return (
                      <button
                        key={fit}
                        type='button'
                        onClick={() => onChange({ resizeFit: fit })}
                        className={cn(
                          'flex h-[130px] flex-1 flex-col items-center justify-center gap-2 rounded-lg border px-2 py-2 transition-colors',
                          active
                            ? 'border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40'
                            : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/50',
                        )}
                      >
                        {icon}
                        <span
                          className={cn(
                            'text-xs font-medium leading-none',
                            active
                              ? 'text-blue-700 dark:text-blue-300'
                              : 'text-neutral-600 dark:text-neutral-400',
                          )}
                        >
                          {t(nameKey)}
                        </span>
                        <span
                          className={cn(
                            'text-center text-[9px] leading-tight',
                            active
                              ? 'text-blue-500 dark:text-blue-400'
                              : 'text-neutral-400 dark:text-neutral-500',
                          )}
                        >
                          {t(descKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
  );
});

// ─── WatermarkPanel ───────────────────────────────────────────────────────────

export const WatermarkPanel = memo(function WatermarkPanel({
  settings: s,
  onChange,
}: FeaturePanelProps) {
  const t = useI18n();
  // 若 watermarkType 为 None（初始/残留态），默认视为 Text
  const effectiveType = s.watermarkType === WatermarkType.None ? WatermarkType.Text : s.watermarkType;

  const handleChooseWatermarkImage = async () => {
    const file = await open({
      multiple: false,
      filters: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'] }],
    });
    if (file) onChange({ watermarkImagePath: file as string });
  };

  return (
    <div className={SECTION_CLASS}>
      <div className={cn(ROW_CLASS, 'mb-0')}>
        <p className='text-sm font-semibold'>
          {t('page.compression.watch.folder.settings.watermark')}
        </p>
        <Tabs
          value={effectiveType}
          activationMode='manual'
          onValueChange={(v) => onChange({ watermarkType: v as WatermarkType })}
        >
          <TabsList className='flex h-8 w-[120px] shrink-0 rounded-full p-0'>
            <TabsTrigger
              value={WatermarkType.Text}
              className='flex-1 h-full rounded-full text-xs data-[state=active]:bg-black data-[state=active]:text-white'
            >
              {t('page.compression.watch.folder.settings.watermark_type_text')}
            </TabsTrigger>
            <TabsTrigger
              value={WatermarkType.Image}
              className='flex-1 h-full rounded-full text-xs data-[state=active]:bg-black data-[state=active]:text-white'
            >
              {t('page.compression.watch.folder.settings.watermark_type_image')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className='mt-3 space-y-4'>
          {/* 文字水印 */}
          {effectiveType === WatermarkType.Text && (
            <div className='space-y-3'>
              <div className={ROW_CLASS}>
                <Label className={LABEL_CLASS}>
                  {t('page.compression.watch.folder.settings.watermark_text')}
                </Label>
                <Input
                  value={s.watermarkText}
                  onChange={(e) => onChange({ watermarkText: e.target.value })}
                  className='h-8 w-[350px] text-xs'
                  placeholder={t('page.compression.watch.folder.settings.watermark_text_placeholder')}
                />
              </div>
              {/* 字号 + 颜色同行 */}
              <div className={ROW_CLASS}>
                <Label className={LABEL_CLASS}>
                  {t('page.compression.watch.folder.settings.watermark_size')}
                </Label>
                <div className='flex h-8 w-[350px] items-center gap-2'>
                  <div className='flex h-8 flex-1 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 dark:border-neutral-600 dark:bg-neutral-900'>
                    <Input
                      type='number'
                      min={8}
                      max={200}
                      value={s.watermarkFontSize}
                      onChange={(e) => onChange({ watermarkFontSize: Number(e.target.value) })}
                      className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                    />
                    <span className='shrink-0 text-[10px] text-neutral-400'>px</span>
                  </div>
                  <Label className={cn(LABEL_CLASS, 'shrink-0')}>
                    {t('page.compression.watch.folder.settings.watermark_color')}
                  </Label>
                  <input
                    type='color'
                    value={s.watermarkTextColor}
                    onChange={(e) => onChange({ watermarkTextColor: e.target.value })}
                    className='h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-md border-0 bg-transparent p-0'
                  />
                  <Input
                    value={s.watermarkTextColor}
                    onChange={(e) => onChange({ watermarkTextColor: e.target.value })}
                    className='h-8 w-[90px] text-xs shadow-none'
                  />
                </div>
              </div>
            </div>
          )}

          {/* 图片水印 */}
          {effectiveType === WatermarkType.Image && (
            <div className='space-y-3'>
              <div className={ROW_CLASS}>
                <Label className={LABEL_CLASS}>
                  {t('page.compression.watch.folder.settings.watermark_image')}
                </Label>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8 w-[350px] truncate text-xs'
                  onClick={handleChooseWatermarkImage}
                  title={s.watermarkImagePath}
                >
                  {s.watermarkImagePath
                    ? s.watermarkImagePath.split(/[/\\]/).pop()
                    : t('common.choose_file')}
                </Button>
              </div>
              <div className={ROW_CLASS}>
                <Label className={LABEL_CLASS}>
                  {t('page.compression.watch.folder.settings.watermark_opacity')}
                </Label>
                <div className='flex w-[350px] items-center gap-3'>
                  <div className='flex h-8 flex-1 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 dark:border-neutral-600 dark:bg-neutral-900'>
                    <Input
                      type='number'
                      min={0}
                      max={100}
                      value={Math.round(s.watermarkImageOpacity * 100)}
                      onChange={(e) => onChange({ watermarkImageOpacity: Math.min(1, Math.max(0, Number(e.target.value) / 100)) })}
                      className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                    />
                    <span className='shrink-0 text-[10px] text-neutral-400'>%</span>
                  </div>
                  <span className='shrink-0 text-xs text-neutral-600 dark:text-neutral-400'>
                    {t('page.compression.watch.folder.settings.watermark_scale')}
                  </span>
                  <div className='flex h-8 flex-1 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 dark:border-neutral-600 dark:bg-neutral-900'>
                    <Input
                      type='number'
                      min={1}
                      max={100}
                      value={Math.round(s.watermarkImageScale * 100)}
                      onChange={(e) => onChange({ watermarkImageScale: Math.min(1, Math.max(0.01, Number(e.target.value) / 100)) })}
                      className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                    />
                    <span className='shrink-0 text-[10px] text-neutral-400'>%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 位置选择（可视化 3×3 宫格）*/}
          <div className='flex items-start justify-between gap-3'>
            <Label className={cn(LABEL_CLASS, 'shrink-0 pt-1')}>
              {t('page.compression.watch.folder.settings.watermark_position')}
            </Label>
            <WatermarkPositionPicker
              value={s.watermarkPosition}
              onChange={(v) => onChange({ watermarkPosition: v })}
              previewText={
                effectiveType !== WatermarkType.Image ? s.watermarkText || 'WM' : undefined
              }
              previewColor={
                effectiveType !== WatermarkType.Image ? s.watermarkTextColor : undefined
              }
            />
          </div>
        </div>
      </div>
  );
});
