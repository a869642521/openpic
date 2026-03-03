import { memo, useState } from 'react';
import { useI18n } from '@/i18n';
import useCompressionStore from '@/store/compression';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckboxGroup } from '@/components/checkbox-group';
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
import { ConvertFormat, ResizeFit, WatermarkType, WatermarkPosition, TinypngMetadata } from '@/constants';
import { open } from '@tauri-apps/plugin-dialog';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  folder: WatchFolder;
  onClose: () => void;
}

const SECTION_CLASS = 'rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-800/30';
const ROW_CLASS = 'flex items-center justify-between gap-3';
const LABEL_CLASS = 'shrink-0 text-xs text-neutral-600 dark:text-neutral-400';

function WatchFolderSettingsDialog({ open: isOpen, folder, onClose }: Props) {
  const t = useI18n();
  const { updateWatchFolderSettings } = useCompressionStore.getState();

  const s = folder.settings;

  // 迁移：旧版 keepMetadata (boolean) 转为 preserveMetadata (TinypngMetadata[])
  const preserveMetadata: TinypngMetadata[] =
    s.preserveMetadata ??
    ('keepMetadata' in s && (s as any).keepMetadata
      ? [TinypngMetadata.Copyright, TinypngMetadata.Creator, TinypngMetadata.Location]
      : []);

  const set = (patch: Partial<WatchFolderSettings>) => {
    updateWatchFolderSettings(folder.id, patch);
  };

  // 本地状态用于宽高输入框
  const [widthInput, setWidthInput] = useState(() => String(s.resizeDimensions[0] || ''));
  const [heightInput, setHeightInput] = useState(() => String(s.resizeDimensions[1] || ''));

  const handleResizeBlur = () => {
    const w = parseInt(widthInput) || 0;
    const h = parseInt(heightInput) || 0;
    set({ resizeDimensions: [w, h] });
  };

  const handleChooseWatermarkImage = async () => {
    const file = await open({
      multiple: false,
      filters: [{ name: 'Image', extensions: ['png', 'jpg', 'jpeg', 'webp', 'svg'] }],
    });
    if (file) set({ watermarkImagePath: file as string });
  };

  const folderName = folder.path.split(/[/\\]/).filter(Boolean).pop() || folder.path;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='max-h-[90vh] max-w-lg overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-sm'>
            <span className='font-semibold'>{t('page.compression.watch.folder.settings_title')}</span>
            <span className='max-w-[200px] truncate text-xs text-neutral-400' title={folder.path}>
              {folderName}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className='flex flex-col gap-4 pt-2'>
          {/* ── 1. 保留元数据 ── */}
          <div className={SECTION_CLASS}>
            <div className={cn(ROW_CLASS, 'mb-0')}>
              <div>
                <p className='text-sm font-medium'>
                  {t('page.compression.watch.folder.settings.metadata')}
                </p>
                <p className='mt-0.5 text-xs text-neutral-500'>
                  {t('page.compression.watch.folder.settings.metadata_desc')}
                </p>
              </div>
              <Tabs
                value={preserveMetadata.length > 0 ? 'yes' : 'no'}
                activationMode='manual'
                onValueChange={(v) => {
                  const enabled = v === 'yes';
                  set({
                    preserveMetadata: enabled
                      ? [TinypngMetadata.Copyright, TinypngMetadata.Creator, TinypngMetadata.Location]
                      : [],
                  });
                }}
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
            </div>
            {preserveMetadata.length > 0 && (
              <div className='mt-3'>
                <CheckboxGroup
                  options={[
                    { value: TinypngMetadata.Copyright, label: t('settings.tinypng.metadata.copyright') },
                    { value: TinypngMetadata.Creator, label: t('settings.tinypng.metadata.creator') },
                    { value: TinypngMetadata.Location, label: t('settings.tinypng.metadata.location') },
                  ]}
                  value={preserveMetadata}
                  onChange={(v) => set({ preserveMetadata: v as TinypngMetadata[] })}
                />
              </div>
            )}
          </div>

          {/* ── 2. 格式转换 ── */}
          <div className={SECTION_CLASS}>
            <div className={cn(ROW_CLASS, 'mb-0')}>
              <p className='text-sm font-medium'>
                {t('page.compression.watch.folder.settings.convert')}
              </p>
              <Tabs
                value={s.convertEnable ? 'yes' : 'no'}
                activationMode='manual'
                onValueChange={(v) => {
                  const enabled = v === 'yes';
                  set({
                    convertEnable: enabled,
                    convertTypes: !enabled ? [] : s.convertTypes.length > 0 ? s.convertTypes : [ConvertFormat.Webp],
                  });
                }}
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
            </div>
            {s.convertEnable && (
              <div className='mt-3 space-y-3'>
                <div className={ROW_CLASS}>
                  <Label className={LABEL_CLASS}>
                    {t('compression.options.convert.format_label')}
                  </Label>
                  <div className='flex gap-1'>
                    {([ConvertFormat.Webp, ConvertFormat.Png, ConvertFormat.Jpg, ConvertFormat.Avif] as ConvertFormat[]).map((fmt) => {
                      const active = s.convertTypes.includes(fmt);
                      return (
                        <button
                          key={fmt}
                          onClick={() => set({ convertTypes: [fmt] })}
                          className={[
                            'rounded px-2 py-1 text-xs font-medium transition-colors',
                            active
                              ? 'bg-neutral-900 text-white'
                              : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600',
                          ].join(' ')}
                        >
                          {fmt === ConvertFormat.Jpg ? 'JPG' : fmt === ConvertFormat.Png ? 'PNG' : fmt === ConvertFormat.Avif ? 'AVIF' : 'WebP'}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className={ROW_CLASS}>
                  <Label className={LABEL_CLASS}>
                    {t('page.compression.watch.folder.settings.convert_alpha')}
                  </Label>
                  <div className='flex items-center gap-2'>
                    <input
                      type='color'
                      value={s.convertAlpha}
                      onChange={(e) => set({ convertAlpha: e.target.value })}
                      className='h-7 w-10 cursor-pointer rounded border border-neutral-200 p-0.5'
                    />
                    <Input
                      value={s.convertAlpha}
                      onChange={(e) => set({ convertAlpha: e.target.value })}
                      className='h-7 w-[90px] text-xs'
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── 3. 尺寸调节 ── */}
          <div className={SECTION_CLASS}>
            <div className={cn(ROW_CLASS, 'mb-0')}>
              <p className='text-sm font-medium'>
                {t('page.compression.watch.folder.settings.resize')}
              </p>
              <Tabs
                value={s.resizeEnable ? 'yes' : 'no'}
                activationMode='manual'
                onValueChange={(v) => set({ resizeEnable: v === 'yes' })}
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
            </div>
            {s.resizeEnable && (
              <div className='mt-3 space-y-3'>
                <div className={ROW_CLASS}>
                  <Label className={LABEL_CLASS}>
                    {t('page.compression.watch.folder.settings.width')}
                  </Label>
                  <Input
                    type='number'
                    min={0}
                    value={widthInput}
                    onChange={(e) => setWidthInput(e.target.value)}
                    onBlur={handleResizeBlur}
                    placeholder='0'
                    className='h-8 w-[120px] text-xs'
                  />
                </div>
                <div className={ROW_CLASS}>
                  <Label className={LABEL_CLASS}>
                    {t('page.compression.watch.folder.settings.height')}
                  </Label>
                  <Input
                    type='number'
                    min={0}
                    value={heightInput}
                    onChange={(e) => setHeightInput(e.target.value)}
                    onBlur={handleResizeBlur}
                    placeholder='0'
                    className='h-8 w-[120px] text-xs'
                  />
                </div>
                <div className={ROW_CLASS}>
                  <Label className={LABEL_CLASS}>
                    {t('page.compression.watch.folder.settings.fit')}
                  </Label>
                  <Select
                    value={s.resizeFit}
                    onValueChange={(v) => set({ resizeFit: v as ResizeFit })}
                  >
                    <SelectTrigger className='h-8 w-[120px] text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ResizeFit).map((fit) => (
                        <SelectItem key={fit} value={fit} className='text-xs'>
                          {fit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* ── 4. 水印 ── */}
          <div className={SECTION_CLASS}>
            <div className={cn(ROW_CLASS, 'mb-0')}>
              <p className='text-sm font-medium'>
                {t('page.compression.watch.folder.settings.watermark')}
              </p>
              <Select
                value={s.watermarkType}
                onValueChange={(v) => set({ watermarkType: v as WatermarkType })}
              >
                <SelectTrigger className='h-8 w-[100px] text-xs'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={WatermarkType.None} className='text-xs'>
                    {t('compression.options.yes_no.no')}
                  </SelectItem>
                  <SelectItem value={WatermarkType.Text} className='text-xs'>
                    {t('settings.compression.watermark.type.text')}
                  </SelectItem>
                  <SelectItem value={WatermarkType.Image} className='text-xs'>
                    {t('settings.compression.watermark.type.image')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {s.watermarkType === WatermarkType.Text && (
              <div className='mt-3 space-y-3'>
                <div className={ROW_CLASS}>
                  <Label className={LABEL_CLASS}>
                    {t('page.compression.watch.folder.settings.watermark_text')}
                  </Label>
                  <Input
                    value={s.watermarkText}
                    onChange={(e) => set({ watermarkText: e.target.value })}
                    className='h-8 w-[180px] text-xs'
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
                      onChange={(e) => set({ watermarkTextColor: e.target.value })}
                      className='h-7 w-10 cursor-pointer rounded border border-neutral-200 p-0.5'
                    />
                    <Input
                      value={s.watermarkTextColor}
                      onChange={(e) => set({ watermarkTextColor: e.target.value })}
                      className='h-7 w-[90px] text-xs'
                    />
                  </div>
                </div>
                <div className={ROW_CLASS}>
                  <Label className={LABEL_CLASS}>
                    {t('page.compression.watch.folder.settings.watermark_size')}
                  </Label>
                  <Input
                    type='number'
                    min={8}
                    max={200}
                    value={s.watermarkFontSize}
                    onChange={(e) => set({ watermarkFontSize: Number(e.target.value) })}
                    className='h-8 w-[120px] text-xs'
                  />
                </div>
                <div className={ROW_CLASS}>
                  <Label className={LABEL_CLASS}>
                    {t('page.compression.watch.folder.settings.watermark_position')}
                  </Label>
                  <Select
                    value={s.watermarkPosition}
                    onValueChange={(v) => set({ watermarkPosition: v })}
                  >
                    <SelectTrigger className='h-8 w-[120px] text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(WatermarkPosition).map(([label, val]) => (
                        <SelectItem key={val} value={val} className='text-xs'>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {s.watermarkType === WatermarkType.Image && (
              <div className='mt-3 space-y-3'>
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
                      onChange={(e) => set({ watermarkImageOpacity: Number(e.target.value) })}
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
                      onChange={(e) => set({ watermarkImageScale: Number(e.target.value) })}
                      className='w-[100px]'
                    />
                    <span className='w-8 text-right text-xs text-neutral-500'>
                      {Math.round(s.watermarkImageScale * 100)}%
                    </span>
                  </div>
                </div>
                <div className={ROW_CLASS}>
                  <Label className={LABEL_CLASS}>
                    {t('page.compression.watch.folder.settings.watermark_position')}
                  </Label>
                  <Select
                    value={s.watermarkPosition}
                    onValueChange={(v) => set({ watermarkPosition: v })}
                  >
                    <SelectTrigger className='h-8 w-[120px] text-xs'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(WatermarkPosition).map(([label, val]) => (
                        <SelectItem key={val} value={val} className='text-xs'>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(WatchFolderSettingsDialog);
