import { memo, useState, useEffect, useRef } from 'react';
import { useI18n } from '@/i18n';
import useCompressionStore from '@/store/compression';
import { CompressionMode, CompressionOutputMode, CompressionType, ConvertFormat, TinypngMetadata, ResizeMode, ResizeFit } from '@/constants';
import { correctFloat } from '@/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RESIZE_FIT_OPTIONS } from './watch-feature-panels';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { exists } from '@tauri-apps/plugin-fs';
import { openPath } from '@tauri-apps/plugin-opener';
import { downloadDir } from '@tauri-apps/api/path';
import { useAsyncEffect } from 'ahooks';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CheckboxGroup } from '@/components/checkbox-group';
import { Switch } from '@/components/ui/switch';
import CommonHintsSection from './common-hints-section';

const cardClassName = 'w-[280px] flex-shrink-0 border-0 shadow-none rounded-xl';
const cardStyle = { backgroundColor: 'rgb(252, 252, 252)' };

function CompressionOptionsCard() {
  const t = useI18n();
  const [extraOptionsExpanded, setExtraOptionsExpanded] = useState(false);
  const {
    compressionMode,
    sizeFilterEnable,
    sizeFilterValue,
    compressionType,
    compressionLevel,
    outputMode,
    saveToFolder,
    preserveMetadata,
    convertEnable,
    convertTypes,
    resizeEnable,
    resizeMode,
    resizeScale,
    resizeDimensions,
    resizeFit,
  } = useCompressionStore((s) => s.classicSettings);
  const { updateClassicSettings } = useCompressionStore.getState();

  const [filterInput, setFilterInput] = useState(() => String(sizeFilterValue));
  const [modeTab, setModeTab] = useState<'auto' | 'filter'>(() =>
    sizeFilterEnable ? 'filter' : 'auto',
  );
  const [saveTab, setSaveTab] = useState<'overwrite' | 'specify'>(() =>
    outputMode === CompressionOutputMode.Overwrite ? 'overwrite' : 'specify',
  );
  const [metadataTab, setMetadataTab] = useState<'no' | 'yes'>(() =>
    (preserveMetadata?.length ?? 0) > 0 ? 'yes' : 'no',
  );
  const [convertTab, setConvertTab] = useState<'no' | 'yes'>(() => (convertEnable ? 'yes' : 'no'));
  const [resizeTab, setResizeTab] = useState<'no' | 'yes'>(() => (resizeEnable ? 'yes' : 'no'));
  const [resizeModeTab, setResizeModeTab] = useState<ResizeMode>(() => resizeMode ?? ResizeMode.Scale);
  const [scaleInput, setScaleInput] = useState(() => String(resizeScale ?? 50));
  const [widthInput, setWidthInput] = useState(() => String(resizeDimensions?.[0] ?? 0));
  const [heightInput, setHeightInput] = useState(() => String(resizeDimensions?.[1] ?? 0));
  const skipModeSyncRef = useRef(false);
  const skipSaveSyncRef = useRef(false);
  const skipMetadataSyncRef = useRef(false);
  const skipConvertSyncRef = useRef(false);
  const skipResizeSyncRef = useRef(false);

  useEffect(() => {
    if (skipModeSyncRef.current) {
      skipModeSyncRef.current = false;
      return;
    }
    setModeTab(sizeFilterEnable ? 'filter' : 'auto');
  }, [sizeFilterEnable]);

  useEffect(() => {
    setFilterInput(String(sizeFilterValue));
  }, [sizeFilterValue]);

  useEffect(() => {
    if (skipSaveSyncRef.current) {
      skipSaveSyncRef.current = false;
      return;
    }
    setSaveTab(outputMode === CompressionOutputMode.Overwrite ? 'overwrite' : 'specify');
  }, [outputMode]);

  useEffect(() => {
    if (skipMetadataSyncRef.current) {
      skipMetadataSyncRef.current = false;
      return;
    }
    setMetadataTab((preserveMetadata?.length ?? 0) > 0 ? 'yes' : 'no');
  }, [preserveMetadata]);

  useEffect(() => {
    if (skipConvertSyncRef.current) {
      skipConvertSyncRef.current = false;
      return;
    }
    setConvertTab(convertEnable ? 'yes' : 'no');
  }, [convertEnable]);

  useEffect(() => {
    if (skipResizeSyncRef.current) {
      skipResizeSyncRef.current = false;
      return;
    }
    setResizeTab(resizeEnable ? 'yes' : 'no');
  }, [resizeEnable]);

  useEffect(() => {
    setResizeModeTab(resizeMode ?? ResizeMode.Scale);
  }, [resizeMode]);

  useEffect(() => {
    setScaleInput(String(resizeScale ?? 50));
  }, [resizeScale]);

  useEffect(() => {
    setWidthInput(String(resizeDimensions?.[0] ?? 0));
    setHeightInput(String(resizeDimensions?.[1] ?? 0));
  }, [resizeDimensions]);

  useAsyncEffect(async () => {
    if (
      outputMode === CompressionOutputMode.SaveToNewFolder &&
      (!saveToFolder || saveToFolder.trim() === '')
    ) {
      const downloadDirPath = await downloadDir();
      updateClassicSettings({ saveToFolder: downloadDirPath });
    }
  }, [outputMode, saveToFolder]);

  const handleChooseFolder = async () => {
    const file = await open({
      multiple: false,
      directory: true,
    });
    if (file) {
      updateClassicSettings({ saveToFolder: file });
    }
  };

  return (
    <div className='flex flex-col gap-3'>
      <Card className={cardClassName} style={cardStyle}>
        <Tabs
          value={modeTab}
          activationMode='manual'
          onValueChange={(v) => {
            const next = v as 'auto' | 'filter';
            if (next === modeTab) return;
            skipModeSyncRef.current = true;
            setModeTab(next);
            const isFilter = next === 'filter';
            updateClassicSettings({ sizeFilterEnable: isFilter });
          }}
        >
          <CardHeader
            className='flex flex-row items-center justify-between border-b border-neutral-200 pb-4 pt-4'
          >
          <h3 className='text-sm font-semibold'>{t('compression.options.title')}</h3>
          <TabsList className='flex h-8 w-[120px] shrink-0 rounded-full p-0'>
            <TabsTrigger value='auto' className='flex-1 h-full rounded-full text-xs data-[state=active]:bg-black data-[state=active]:text-white'>
              {t('compression.options.mode.auto')}
            </TabsTrigger>
            <TabsTrigger value='filter' className='flex-1 h-full rounded-full text-xs data-[state=active]:bg-black data-[state=active]:text-white'>
              {t('compression.options.mode.filter')}
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className='space-y-4 pb-5 pt-4'>
            <TabsContent value='auto' className='m-0 space-y-4'>
              <div className='flex items-center justify-between gap-3'>
                <div className='flex items-center gap-1.5 shrink-0'>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className='inline-flex cursor-help text-neutral-400 hover:text-neutral-600'>
                        <HelpCircle className='h-3.5 w-3.5' />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side='top' className='max-w-[280px] whitespace-pre-line text-xs leading-relaxed'>
                      {t('compression.options.compression_mode.help')}
                    </TooltipContent>
                  </Tooltip>
                  <Label className='text-xs'>{t('compression.options.compression_mode')}</Label>
                </div>
                <Select
                  value={compressionMode}
                  onValueChange={(v) => updateClassicSettings({ compressionMode: v as CompressionMode })}
                >
                  <SelectTrigger
                    className='h-9 w-[140px] shrink-0 border border-neutral-200 shadow-none text-xs'
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CompressionMode.Auto} className='text-xs'>
                      {t('settings.compression.mode.option.auto')}
                    </SelectItem>
                    <SelectItem value={CompressionMode.Remote} className='text-xs'>
                      {t('settings.compression.mode.option.remote')}
                    </SelectItem>
                    <SelectItem value={CompressionMode.Local} className='text-xs'>
                      {t('settings.compression.mode.option.local')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex items-center justify-between gap-3'>
                <Label className='shrink-0 text-xs'>{t('compression.options.compression_type')}</Label>
                <Select
                  value={compressionType}
                  onValueChange={(v) => updateClassicSettings({ compressionType: v as CompressionType })}
                >
                  <SelectTrigger
                    className='h-9 w-[140px] shrink-0 border border-neutral-200 shadow-none text-xs'
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CompressionType.Lossless} className='text-xs'>
                      {t('settings.compression.type.option.lossless')}
                    </SelectItem>
                    <SelectItem value={CompressionType.Lossy} className='text-xs'>
                      {t('settings.compression.type.option.lossy')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {compressionType === CompressionType.Lossy && (
                <div className='flex items-center justify-between gap-3'>
                  <Label className='shrink-0 text-xs'>{t('settings.compression.level.title')}</Label>
                  <Select
                    value={String(compressionLevel)}
                    onValueChange={(v) => updateClassicSettings({ compressionLevel: Number(v) })}
                  >
                  <SelectTrigger
                    className='h-9 w-[140px] shrink-0 border border-neutral-200 shadow-none text-xs'
                  >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)} className='text-xs'>
                          {t(`settings.compression.level.option.${n}` as any)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>
            <TabsContent value='filter' className='m-0 space-y-4'>
              <div className='flex items-center justify-between gap-3'>
                <Label className='flex shrink-0 items-center gap-1 text-xs'>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className='h-3.5 w-3.5 cursor-help text-neutral-500' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='max-w-[200px]'>{t('compression.options.size_filter.description')}</p>
                    </TooltipContent>
                  </Tooltip>
                  {t('compression.options.size_filter.label')}
                </Label>
                <div
                  className='flex h-9 w-[140px] shrink-0 items-center gap-1 rounded-md border border-neutral-200 px-3 shadow-none'
                >
                  <Input
                    type='number'
                    min={1}
                    value={filterInput}
                    placeholder='500'
                    onChange={(e) => setFilterInput(e.target.value)}
                    onBlur={() => {
                      const num = Number(filterInput);
                      const valid = Number.isFinite(num) && num >= 1;
                      const final = valid ? Math.floor(num) : 500;
                      updateClassicSettings({ sizeFilterValue: final });
                      setFilterInput(String(final));
                    }}
                    className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                  />
                  <span className='shrink-0 text-xs text-neutral-500'>KB</span>
                </div>
              </div>
            </TabsContent>
        </CardContent>
          </Tabs>
        <CommonHintsSection />
      </Card>

      <Card className={cardClassName} style={cardStyle}>
        <Tabs
          value={saveTab}
          activationMode='manual'
          onValueChange={(v) => {
            const next = v as 'overwrite' | 'specify';
            if (next === saveTab) return;
            skipSaveSyncRef.current = true;
            setSaveTab(next);
            updateClassicSettings({
              outputMode: next === 'overwrite' ? CompressionOutputMode.Overwrite : CompressionOutputMode.SaveToNewFolder,
            });
          }}
        >
          <CardHeader
            className='flex flex-row items-center justify-between border-b border-neutral-200 pb-4 pt-4'
          >
            <h3 className='text-sm font-semibold'>{t('compression.options.save_mode.title')}</h3>
            <TabsList className='flex h-8 w-[120px] shrink-0 rounded-full p-0'>
              <TabsTrigger
                value='specify'
                className='flex-1 h-full rounded-full text-xs data-[state=active]:bg-black data-[state=active]:text-white'
              >
                {t('compression.options.save_mode.specify')}
              </TabsTrigger>
              <TabsTrigger
                value='overwrite'
                className='flex-1 h-full rounded-full text-xs data-[state=active]:bg-black data-[state=active]:text-white'
              >
                {t('compression.options.save_mode.overwrite')}
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className='space-y-4 pb-5 pt-4'>
            <TabsContent value='overwrite' className='m-0'>
              <p className='text-xs leading-relaxed text-neutral-500'>
                {t('compression.options.save_mode.overwrite_hint')}
              </p>
            </TabsContent>
            <TabsContent value='specify' className='m-0 space-y-3'>
              <div className='flex flex-col gap-[12px]'>
                {saveToFolder && (
                  <p
                    className='cursor-pointer truncate text-xs text-neutral-500 underline'
                    onClick={async () => {
                      if (await exists(saveToFolder)) {
                        openPath(saveToFolder);
                      }
                    }}
                    title={saveToFolder}
                  >
                    {saveToFolder}
                  </p>
                )}
                <Button
                  variant='outline'
                  size='sm'
                  className='h-9 w-full border border-neutral-200 bg-neutral-50 shadow-none text-xs hover:bg-neutral-100'
                  onClick={handleChooseFolder}
                >
                  {t('settings.compression.output.option.save_to_new_folder.choose')}
                </Button>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <Card className={cardClassName} style={cardStyle}>
        <button
          type='button'
          className={cn(
            'flex h-[64.67px] w-full items-center justify-between px-6 text-left',
            extraOptionsExpanded && 'border-b border-neutral-200',
          )}
          onClick={() => setExtraOptionsExpanded(!extraOptionsExpanded)}
        >
          <h3 className='text-sm font-semibold'>{t('compression.options.extra_options.title')}</h3>
          {extraOptionsExpanded ? (
            <ChevronUp className='h-4 w-4 shrink-0 text-neutral-500' />
          ) : (
            <ChevronDown className='h-4 w-4 shrink-0 text-neutral-500' />
          )}
        </button>
        {extraOptionsExpanded && (
        <CardContent className='space-y-2 py-5'>
          {/* 保留原数据 */}
          <div className='rounded-lg transition-colors hover:bg-neutral-50/50'>
          <div className='flex min-h-9 items-center justify-between gap-3 px-1 py-1'>
            <div className='flex min-w-0 items-center gap-2'>
              <span className='truncate text-sm font-medium text-neutral-800'>{t('compression.options.keep_metadata.title')}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className='inline-flex shrink-0 cursor-help text-neutral-400 hover:text-neutral-600'>
                    <HelpCircle className='h-3.5 w-3.5' />
                  </span>
                </TooltipTrigger>
                <TooltipContent side='top' className='max-w-[300px] whitespace-pre-line text-xs leading-relaxed'>
                  {t('compression.options.keep_metadata.help')}
                </TooltipContent>
              </Tooltip>
            </div>
            <Switch
              checked={metadataTab === 'yes'}
              onCheckedChange={(checked) => {
                skipMetadataSyncRef.current = true;
                setMetadataTab(checked ? 'yes' : 'no');
                updateClassicSettings({
                  preserveMetadata: checked
                    ? [TinypngMetadata.Copyright, TinypngMetadata.Creator, TinypngMetadata.Location]
                    : [],
                });
              }}
              className='data-[state=checked]:bg-neutral-800 data-[state=unchecked]:bg-neutral-200'
            />
          </div>
          {metadataTab === 'yes' && (
              <div className='mt-2 rounded-xl border border-dashed border-neutral-200 bg-neutral-50/80 px-3 py-3'>
                <CheckboxGroup
                  options={[
                    { value: TinypngMetadata.Copyright, label: t('settings.tinypng.metadata.copyright') },
                    { value: TinypngMetadata.Creator, label: t('settings.tinypng.metadata.creator') },
                    { value: TinypngMetadata.Location, label: t('settings.tinypng.metadata.location') },
                  ]}
                  value={preserveMetadata}
                  onChange={(v) => updateClassicSettings({ preserveMetadata: v as TinypngMetadata[] })}
                />
              </div>
            )}
          </div>

          {/* 尺寸调整 */}
          <div className='rounded-lg transition-colors hover:bg-neutral-50/50'>
          <div className='flex min-h-9 items-center justify-between gap-3 px-1 py-1'>
            <span className='text-sm font-medium text-neutral-800'>{t('compression.options.resize.title')}</span>
            <Switch
              checked={resizeTab === 'yes'}
              onCheckedChange={(checked) => {
                skipResizeSyncRef.current = true;
                setResizeTab(checked ? 'yes' : 'no');
                updateClassicSettings({ resizeEnable: checked });
              }}
              className='data-[state=checked]:bg-neutral-800 data-[state=unchecked]:bg-neutral-200'
            />
          </div>
          {resizeTab === 'yes' && (
              <div className='mt-2 space-y-4 rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3 py-3'>
                <div className='flex gap-2'>
                  {([ResizeMode.Scale, ResizeMode.Custom] as ResizeMode[]).map((mode) => {
                    const active = resizeModeTab === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => {
                          setResizeModeTab(mode);
                          updateClassicSettings({ resizeMode: mode });
                        }}
                        className={[
                          'flex-1 rounded-full border py-2 text-xs font-medium transition-colors',
                          active
                            ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'border-neutral-200 bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500',
                        ].join(' ')}
                      >
                        {mode === ResizeMode.Scale
                          ? t('compression.options.resize.mode.scale')
                          : t('compression.options.resize.mode.custom')}
                      </button>
                    );
                  })}
                </div>
                {resizeModeTab === ResizeMode.Scale && (
                  <div className='flex items-center justify-between gap-3'>
                    <Label className='shrink-0 text-xs'>{t('compression.options.resize.scale_label')}</Label>
                    <div
                      className='flex h-9 w-[140px] shrink-0 items-center gap-1 rounded-md border border-neutral-200 px-3 shadow-none'
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
                          updateClassicSettings({ resizeScale: final });
                          setScaleInput(String(final));
                        }}
                        className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                      />
                      <span className='shrink-0 text-xs text-neutral-500'>%</span>
                    </div>
                  </div>
                )}
                {resizeModeTab === ResizeMode.Custom && (
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between gap-3'>
                      <Label className='shrink-0 text-xs'>{t('compression.options.resize.width_label')}</Label>
                      <div
                        className='flex h-9 w-[140px] shrink-0 items-center gap-1 rounded-md border border-neutral-200 px-3 shadow-none'
                      >
                        <Input
                          type='number'
                          min={0}
                          value={widthInput}
                          placeholder='0'
                          onChange={(e) => setWidthInput(e.target.value)}
                          onBlur={() => {
                            const num = Number(widthInput);
                            const valid = Number.isFinite(num) && num >= 0;
                            const final = valid ? Math.floor(num) : 0;
                            updateClassicSettings({ resizeDimensions: [final, resizeDimensions?.[1] ?? 0] });
                            setWidthInput(String(final));
                          }}
                          className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                        />
                        <span className='shrink-0 text-xs text-neutral-500'>{t('compression.options.resize.px')}</span>
                      </div>
                    </div>
                    <div className='flex items-center justify-between gap-3'>
                      <Label className='shrink-0 text-xs'>{t('compression.options.resize.height_label')}</Label>
                      <div
                        className='flex h-9 w-[140px] shrink-0 items-center gap-1 rounded-md border border-neutral-200 px-3 shadow-none'
                      >
                        <Input
                          type='number'
                          min={0}
                          value={heightInput}
                          placeholder='0'
                          onChange={(e) => setHeightInput(e.target.value)}
                          onBlur={() => {
                            const num = Number(heightInput);
                            const valid = Number.isFinite(num) && num >= 0;
                            const final = valid ? Math.floor(num) : 0;
                            updateClassicSettings({ resizeDimensions: [resizeDimensions?.[0] ?? 0, final] });
                            setHeightInput(String(final));
                          }}
                          className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                        />
                        <span className='shrink-0 text-xs text-neutral-500'>{t('compression.options.resize.px')}</span>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                        {RESIZE_FIT_OPTIONS.map(({ fit, nameKey, descKey, icon }) => {
                          const effectiveFit = [ResizeFit.Cover, ResizeFit.Fill, ResizeFit.Contain].includes(resizeFit as ResizeFit)
                            ? resizeFit
                            : ResizeFit.Contain;
                          const active = effectiveFit === fit;
                          return (
                            <button
                              key={fit}
                              type='button'
                              onClick={() => updateClassicSettings({ resizeFit: fit })}
                              className={cn(
                                'flex flex-1 flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 transition-colors',
                                active
                                  ? 'border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40'
                                  : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800/50',
                              )}
                            >
                              {icon}
                              <span className={cn('text-xs font-medium leading-none', active ? 'text-blue-700 dark:text-blue-300' : 'text-neutral-600 dark:text-neutral-400')}>
                                {t(nameKey as any)}
                              </span>
                              <span className={cn('text-center text-[9px] leading-tight', active ? 'text-blue-500 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500')}>
                                {t(descKey as any)}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 格式转换 */}
          <div className='rounded-lg transition-colors hover:bg-neutral-50/50'>
          <div className='flex min-h-9 items-center justify-between gap-3 px-1 py-1'>
            <span className='text-sm font-medium text-neutral-800'>{t('compression.options.convert.title')}</span>
            <Switch
              checked={convertTab === 'yes'}
              onCheckedChange={(checked) => {
                skipConvertSyncRef.current = true;
                setConvertTab(checked ? 'yes' : 'no');
                if (!checked) {
                  updateClassicSettings({ convertEnable: false, convertTypes: [] });
                } else {
                  updateClassicSettings({ convertEnable: true, convertTypes: convertTypes.length === 0 ? [ConvertFormat.Webp] : convertTypes });
                }
              }}
              className='data-[state=checked]:bg-neutral-800 data-[state=unchecked]:bg-neutral-200'
            />
          </div>
          {convertTab === 'yes' && (
              <div className='mt-2 flex items-center justify-between gap-3 rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3 py-3'>
                <Label className='shrink-0 text-xs'>{t('compression.options.convert.format_label')}</Label>
                <Select
                  value={convertTypes[0] ?? ConvertFormat.Webp}
                  onValueChange={(v) => updateClassicSettings({ convertTypes: [v as ConvertFormat] })}
                >
                  <SelectTrigger
                    className='h-9 w-[140px] shrink-0 border border-neutral-200 shadow-none text-xs'
                  >
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
            )}
          </div>
        </CardContent>
        )}
      </Card>
    </div>
  );
}

export default memo(CompressionOptionsCard);
