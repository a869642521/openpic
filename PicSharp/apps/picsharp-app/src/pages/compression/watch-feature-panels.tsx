import { memo, useState, useEffect } from 'react';
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
        <div>
          <p className='text-sm font-medium'>
            {t('page.compression.watch.folder.settings.compression')}
          </p>
          <p className='mt-0.5 text-xs text-neutral-500'>
            {t('page.compression.watch.folder.settings.compression_desc')}
          </p>
        </div>
        <YesNoTabs
          value={s.compressionEnable !== false}
          onChange={(enabled) => onChange({ compressionEnable: enabled })}
        />
      </div>
      {s.compressionEnable !== false && (
        <div className='mt-3'>
          <div className={ROW_CLASS}>
            <Label className={LABEL_CLASS}>
              {t('page.compression.watch.folder.settings.size_filter')}
            </Label>
            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={() => onChange({ sizeFilterEnable: !s.sizeFilterEnable })}
                className={cn(
                  'inline-flex h-7 items-center rounded-md border px-2 text-xs transition-colors',
                  s.sizeFilterEnable
                    ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'border-neutral-200 bg-neutral-100 text-neutral-400 hover:bg-neutral-200 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-500',
                )}
              >
                {s.sizeFilterEnable
                  ? t('page.compression.watch.folder.settings.size_filter_on')
                  : t('page.compression.watch.folder.settings.size_filter_off')}
              </button>
              {s.sizeFilterEnable && (
                <div className='flex h-7 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 dark:border-neutral-600 dark:bg-neutral-900'>
                  <Input
                    type='text'
                    value={filterInput}
                    placeholder='500'
                    onChange={(e) => setFilterInput(e.target.value)}
                    onBlur={handleFilterBlur}
                    className='h-auto min-w-0 w-[48px] border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                  />
                  <span className='shrink-0 text-xs text-neutral-400'>KB</span>
                </div>
              )}
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

  return (
    <div className={SECTION_CLASS}>
      <div className={cn(ROW_CLASS, 'mb-0')}>
        <p className='text-sm font-medium'>
          {t('page.compression.watch.folder.settings.convert')}
        </p>
        <YesNoTabs
          value={s.convertEnable}
          onChange={(enabled) =>
            onChange({
              convertEnable: enabled,
              convertTypes: !enabled
                ? []
                : s.convertTypes.length > 0
                  ? s.convertTypes
                  : [ConvertFormat.Webp],
            })
          }
        />
      </div>
      {s.convertEnable && (
        <div className='mt-3 space-y-3'>
          <div className={ROW_CLASS}>
            <Label className={LABEL_CLASS}>
              {t('compression.options.convert.format_label')}
            </Label>
            <Select
              value={s.convertTypes[0] ?? ConvertFormat.Webp}
              onValueChange={(v) => onChange({ convertTypes: [v as ConvertFormat] })}
            >
              <SelectTrigger className='h-8 w-[120px] text-xs'>
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
          {(s.convertTypes[0] ?? ConvertFormat.Webp) === ConvertFormat.Jpg && (
            <div className={ROW_CLASS}>
              <Label className={LABEL_CLASS}>
                {t('page.compression.watch.folder.settings.convert_alpha')}
              </Label>
              <div className='flex items-center gap-2'>
                <input
                  type='color'
                  value={s.convertAlpha}
                  onChange={(e) => onChange({ convertAlpha: e.target.value })}
                  className='h-7 w-10 cursor-pointer rounded border border-neutral-200 p-0.5'
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
      )}
    </div>
  );
});

// ─── ResizePanel ──────────────────────────────────────────────────────────────

export const ResizePanel = memo(function ResizePanel({
  settings: s,
  onChange,
}: FeaturePanelProps) {
  const t = useI18n();
  const resizeMode: ResizeMode = s.resizeMode ?? ResizeMode.Scale;

  const [widthInput, setWidthInput] = useState(String(s.resizeDimensions[0] || ''));
  const [heightInput, setHeightInput] = useState(String(s.resizeDimensions[1] || ''));
  const [scaleInput, setScaleInput] = useState(String(s.resizeScale ?? 50));

  useEffect(() => {
    setWidthInput(String(s.resizeDimensions[0] || ''));
    setHeightInput(String(s.resizeDimensions[1] || ''));
    setScaleInput(String(s.resizeScale ?? 50));
  }, [s.resizeDimensions, s.resizeScale]);

  const handleResizeBlur = () => {
    const w = parseInt(widthInput) || 0;
    const h = parseInt(heightInput) || 0;
    onChange({ resizeDimensions: [w, h] });
  };

  return (
    <div className={SECTION_CLASS}>
      <div className={cn(ROW_CLASS, 'mb-0')}>
        <p className='text-sm font-medium'>
          {t('page.compression.watch.folder.settings.resize')}
        </p>
        <YesNoTabs
          value={s.resizeEnable}
          onChange={(enabled) => onChange({ resizeEnable: enabled })}
        />
      </div>
      {s.resizeEnable && (
        <div className='mt-3 space-y-3'>
          {/* 模式切换 */}
          <div className='flex gap-1.5'>
            {([ResizeMode.Scale, ResizeMode.Custom] as ResizeMode[]).map((mode) => {
              const active = resizeMode === mode;
              return (
                <button
                  key={mode}
                  type='button'
                  onClick={() => onChange({ resizeMode: mode })}
                  className={cn(
                    'flex-1 rounded-full border py-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'border-neutral-200 bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500',
                  )}
                >
                  {mode === ResizeMode.Scale
                    ? t('compression.options.resize.mode.scale')
                    : t('compression.options.resize.mode.custom')}
                </button>
              );
            })}
          </div>

          {resizeMode === ResizeMode.Scale && (
            <div className={ROW_CLASS}>
              <Label className={LABEL_CLASS}>
                {t('compression.options.resize.scale_label')}
              </Label>
              <div
                className='flex h-8 w-[120px] items-center gap-1 rounded-md border px-2 text-xs'
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
              <div className={ROW_CLASS}>
                <Label className={LABEL_CLASS}>
                  {t('compression.options.resize.width_label')}
                </Label>
                <div
                  className='flex h-8 w-[120px] items-center gap-1 rounded-md border px-2'
                  style={{ borderColor: 'rgb(219,219,220)' }}
                >
                  <Input
                    type='number'
                    min={0}
                    value={widthInput}
                    onChange={(e) => setWidthInput(e.target.value)}
                    onBlur={handleResizeBlur}
                    placeholder='0'
                    className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                  />
                  <span className='shrink-0 text-xs text-neutral-400'>
                    {t('compression.options.resize.px')}
                  </span>
                </div>
              </div>
              <div className={ROW_CLASS}>
                <Label className={LABEL_CLASS}>
                  {t('compression.options.resize.height_label')}
                </Label>
                <div
                  className='flex h-8 w-[120px] items-center gap-1 rounded-md border px-2'
                  style={{ borderColor: 'rgb(219,219,220)' }}
                >
                  <Input
                    type='number'
                    min={0}
                    value={heightInput}
                    onChange={(e) => setHeightInput(e.target.value)}
                    onBlur={handleResizeBlur}
                    placeholder='0'
                    className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                  />
                  <span className='shrink-0 text-xs text-neutral-400'>
                    {t('compression.options.resize.px')}
                  </span>
                </div>
              </div>
              <div className={ROW_CLASS}>
                <Label className={LABEL_CLASS}>
                  {t('compression.options.resize.fit_label')}
                </Label>
                <Select
                  value={s.resizeFit}
                  onValueChange={(v) => onChange({ resizeFit: v as ResizeFit })}
                >
                  <SelectTrigger className='h-8 w-[120px] text-xs'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ResizeFit).map((fit) => (
                      <SelectItem key={fit} value={fit} className='text-xs'>
                        {t(`settings.compression.resize.fit.option.${fit}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
});

// ─── WatermarkPanel ───────────────────────────────────────────────────────────

export const WatermarkPanel = memo(function WatermarkPanel({
  settings: s,
  onChange,
}: FeaturePanelProps) {
  const t = useI18n();
  const watermarkEnable: boolean = s.watermarkEnable;

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
        <p className='text-sm font-medium'>
          {t('page.compression.watch.folder.settings.watermark')}
        </p>
        <YesNoTabs
          value={watermarkEnable}
          onChange={(enabled) =>
            onChange({
              watermarkEnable: enabled,
              watermarkType: enabled
                ? s.watermarkType !== WatermarkType.None
                  ? s.watermarkType
                  : WatermarkType.Text
                : WatermarkType.None,
            })
          }
        />
      </div>

      {watermarkEnable && (
        <div className='mt-3 space-y-4'>
          {/* 水印类型选择 */}
          <div className='flex gap-1.5'>
            {([WatermarkType.Text, WatermarkType.Image] as WatermarkType[]).map((type) => {
              const active =
                (s.watermarkType === WatermarkType.None ? WatermarkType.Text : s.watermarkType) ===
                type;
              return (
                <button
                  key={type}
                  type='button'
                  onClick={() => onChange({ watermarkType: type })}
                  className={cn(
                    'flex-1 rounded-full border py-1 text-xs font-medium transition-colors',
                    active
                      ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                      : 'border-neutral-200 bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500',
                  )}
                >
                  {type === WatermarkType.Text
                    ? t('page.compression.watch.folder.settings.watermark_type_text')
                    : t('page.compression.watch.folder.settings.watermark_type_image')}
                </button>
              );
            })}
          </div>

          {/* 文字水印 */}
          {(s.watermarkType === WatermarkType.Text || s.watermarkType === WatermarkType.None) && (
            <div className='space-y-3'>
              <div className={ROW_CLASS}>
                <Label className={LABEL_CLASS}>
                  {t('page.compression.watch.folder.settings.watermark_text')}
                </Label>
                <Input
                  value={s.watermarkText}
                  onChange={(e) => onChange({ watermarkText: e.target.value })}
                  className='h-8 w-[180px] text-xs'
                  placeholder={t('page.compression.watch.folder.settings.watermark_text_placeholder')}
                />
              </div>
              <div className={ROW_CLASS}>
                <Label className={LABEL_CLASS}>
                  {t('page.compression.watch.folder.settings.watermark_color')}
                </Label>
                <div className='flex items-center gap-2'>
                  <input
                    type='color'
                    value={s.watermarkTextColor}
                    onChange={(e) => onChange({ watermarkTextColor: e.target.value })}
                    className='h-7 w-10 cursor-pointer rounded border border-neutral-200 p-0.5'
                  />
                  <Input
                    value={s.watermarkTextColor}
                    onChange={(e) => onChange({ watermarkTextColor: e.target.value })}
                    className='h-7 w-[90px] text-xs'
                  />
                </div>
              </div>
              <div className={ROW_CLASS}>
                <Label className={LABEL_CLASS}>
                  {t('page.compression.watch.folder.settings.watermark_size')}
                </Label>
                <div
                  className='flex h-8 w-[120px] items-center gap-1 rounded-md border px-2'
                  style={{ borderColor: 'rgb(219,219,220)' }}
                >
                  <Input
                    type='number'
                    min={8}
                    max={200}
                    value={s.watermarkFontSize}
                    onChange={(e) => onChange({ watermarkFontSize: Number(e.target.value) })}
                    className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                  />
                  <span className='shrink-0 text-xs text-neutral-400'>px</span>
                </div>
              </div>
            </div>
          )}

          {/* 图片水印 */}
          {s.watermarkType === WatermarkType.Image && (
            <div className='space-y-3'>
              <div className={ROW_CLASS}>
                <Label className={LABEL_CLASS}>
                  {t('page.compression.watch.folder.settings.watermark_image')}
                </Label>
                <Button
                  variant='outline'
                  size='sm'
                  className='h-8 max-w-[180px] truncate text-xs'
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
                <div className='flex items-center gap-2'>
                  <input
                    type='range'
                    min={0}
                    max={1}
                    step={0.01}
                    value={s.watermarkImageOpacity}
                    onChange={(e) => onChange({ watermarkImageOpacity: Number(e.target.value) })}
                    className='w-[100px]'
                  />
                  <span className='w-8 text-right text-xs text-neutral-500'>
                    {Math.round(s.watermarkImageOpacity * 100)}%
                  </span>
                </div>
              </div>
              <div className={ROW_CLASS}>
                <Label className={LABEL_CLASS}>
                  {t('page.compression.watch.folder.settings.watermark_scale')}
                </Label>
                <div className='flex items-center gap-2'>
                  <input
                    type='range'
                    min={0.01}
                    max={1}
                    step={0.01}
                    value={s.watermarkImageScale}
                    onChange={(e) => onChange({ watermarkImageScale: Number(e.target.value) })}
                    className='w-[100px]'
                  />
                  <span className='w-8 text-right text-xs text-neutral-500'>
                    {Math.round(s.watermarkImageScale * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 位置选择（可视化 3×3 宫格）*/}
          <div className='space-y-2'>
            <Label className={LABEL_CLASS}>
              {t('page.compression.watch.folder.settings.watermark_position')}
            </Label>
            <WatermarkPositionPicker
              value={s.watermarkPosition}
              onChange={(v) => onChange({ watermarkPosition: v })}
              previewText={
                s.watermarkType !== WatermarkType.Image ? s.watermarkText || 'WM' : undefined
              }
              previewColor={
                s.watermarkType !== WatermarkType.Image ? s.watermarkTextColor : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  );
});
