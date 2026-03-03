import { memo, useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useI18n } from '@/i18n';
import useSettingsStore from '@/store/settings';
import useSelector from '@/hooks/useSelector';
import { SettingsKey, CompressionOutputMode, CompressionType, ConvertFormat, TinypngMetadata, ResizeMode, ResizeFit } from '@/constants';
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
import { Textarea } from '@/components/ui/textarea';

const cardClassName = 'w-[280px] flex-shrink-0 border-0 shadow-none rounded-xl';
const cardStyle = { backgroundColor: 'rgb(252, 252, 252)' };

function CompressionOptionsCard() {
  const t = useI18n();
  const [hintsExpanded, setHintsExpanded] = useState(false);
  const [commonHints, setCommonHints] = useState(
    '亚马逊平台：<500KB\n邮件：首图<300kb、其他<150kb',
  );
  const hintsRef = useRef<HTMLTextAreaElement>(null);

  const resizeHints = () => {
    const el = hintsRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  useLayoutEffect(() => {
    if (hintsExpanded) resizeHints();
  }, [hintsExpanded, commonHints]);
  const {
    [SettingsKey.CompressionSizeFilterEnable]: sizeFilterEnable,
    [SettingsKey.CompressionSizeFilterValue]: sizeFilterValue,
    [SettingsKey.CompressionType]: compressionType,
    [SettingsKey.CompressionLevel]: compressionLevel,
    [SettingsKey.CompressionOutput]: outputMode,
    [SettingsKey.CompressionOutputSaveToFolder]: saveToFolder,
    [SettingsKey.CompressionKeepMetadata]: preserveMetadata,
    [SettingsKey.CompressionConvertEnable]: convertEnable,
    [SettingsKey.CompressionConvert]: convertTypes,
    [SettingsKey.CompressionResizeEnable]: resizeEnable,
    [SettingsKey.CompressionResizeMode]: resizeMode,
    [SettingsKey.CompressionResizeScale]: resizeScale,
    [SettingsKey.CompressionResizeDimensions]: resizeDimensions,
    [SettingsKey.CompressionResizeFit]: resizeFit,
    set,
  } = useSettingsStore(
    useSelector([
      SettingsKey.CompressionSizeFilterEnable,
      SettingsKey.CompressionSizeFilterValue,
      SettingsKey.CompressionType,
      SettingsKey.CompressionLevel,
      SettingsKey.CompressionOutput,
      SettingsKey.CompressionOutputSaveToFolder,
      SettingsKey.CompressionKeepMetadata,
      SettingsKey.CompressionConvertEnable,
      SettingsKey.CompressionConvert,
      SettingsKey.CompressionResizeEnable,
      SettingsKey.CompressionResizeMode,
      SettingsKey.CompressionResizeScale,
      SettingsKey.CompressionResizeDimensions,
      SettingsKey.CompressionResizeFit,
      'set',
    ]),
  );

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
      set(SettingsKey.CompressionOutputSaveToFolder, downloadDirPath);
    }
  }, [outputMode, saveToFolder]);

  const handleChooseFolder = async () => {
    const file = await open({
      multiple: false,
      directory: true,
    });
    if (file) {
      set(SettingsKey.CompressionOutputSaveToFolder, file);
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
            set(SettingsKey.CompressionSizeFilterEnable, isFilter);
          }}
        >
          <CardHeader
            className='flex flex-row items-center justify-between pb-4 pt-4'
            style={{ borderBottom: '1px solid rgb(219, 219, 220)' }}
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
        <CardContent className='space-y-3 pb-4 pt-1.5'>
            <TabsContent value='auto' className='mt-3 space-y-3'>
              <div className='flex items-center justify-between gap-2'>
                <Label className='shrink-0 text-xs'>{t('compression.options.compression_type')}</Label>
                <Select
                  value={compressionType}
                  onValueChange={(v) => set(SettingsKey.CompressionType, v as CompressionType)}
                >
                  <SelectTrigger
                    className='h-10 w-[140px] shrink-0 border shadow-none text-xs'
                    style={{ borderColor: 'rgb(219, 219, 220)' }}
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
                <div className='flex items-center justify-between gap-2'>
                  <Label className='shrink-0 text-xs'>{t('settings.compression.level.title')}</Label>
                  <Select
                    value={String(compressionLevel)}
                    onValueChange={(v) => set(SettingsKey.CompressionLevel, Number(v))}
                  >
                    <SelectTrigger
                      className='h-10 w-[140px] shrink-0 border shadow-none text-xs'
                      style={{ borderColor: 'rgb(219, 219, 220)' }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)} className='text-xs'>
                          {t(`settings.compression.level.option.${n}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>
            <TabsContent value='filter' className='mt-3 space-y-3'>
              <div className='flex items-center justify-between gap-2'>
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
                  className='flex h-10 w-[140px] shrink-0 items-center gap-1 rounded-md border px-3 shadow-none'
                  style={{ borderColor: 'rgb(219, 219, 220)' }}
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
                      set(SettingsKey.CompressionSizeFilterValue, final);
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
        <div className='px-6 pb-4 pt-0'>
          <div
            className='flex w-full flex-col overflow-hidden rounded-md'
            style={{ backgroundColor: 'rgb(243, 244, 248)' }}
          >
            <button
              type='button'
              className='flex h-[30px] shrink-0 items-center justify-between pl-3 pr-3 text-left'
              onClick={() => setHintsExpanded(!hintsExpanded)}
            >
              <span className='text-xs font-normal'>{t('compression.options.common_hints.title')}</span>
              {hintsExpanded ? (
                <ChevronUp className='h-4 w-4 shrink-0' />
              ) : (
                <ChevronDown className='h-4 w-4 shrink-0' />
              )}
            </button>
            {hintsExpanded && (
              <div
                className='p-0'
                style={{ borderTop: '1px dashed rgb(219, 219, 220)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <Textarea
                  ref={hintsRef}
                  value={commonHints}
                  onChange={(e) => setCommonHints(e.target.value)}
                  placeholder={t('compression.options.common_hints.placeholder')}
                  className='min-h-[60px] w-full overflow-hidden border-0 bg-transparent shadow-none focus-visible:ring-0'
                  style={{ resize: 'none', fontSize: 12, lineHeight: '200%' }}
                />
              </div>
            )}
          </div>
        </div>
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
            set(
              SettingsKey.CompressionOutput,
              next === 'overwrite' ? CompressionOutputMode.Overwrite : CompressionOutputMode.SaveToNewFolder,
            );
          }}
        >
          <CardHeader
            className='flex flex-row items-center justify-between pb-4 pt-4'
            style={{ borderBottom: '1px solid rgb(219, 219, 220)' }}
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
          <CardContent className='space-y-3 pb-4 pt-1.5'>
            <TabsContent value='overwrite' className='mt-3 space-y-2'>
              <p className='text-xs text-neutral-500'>
                {t('compression.options.save_mode.overwrite_hint')}
              </p>
            </TabsContent>
            <TabsContent value='specify' className='mt-3 space-y-2'>
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
                  className='h-10 w-full border shadow-none text-xs'
                  style={{ borderColor: 'rgb(219, 219, 220)' }}
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
        <Tabs
          value={metadataTab}
          activationMode='manual'
          onValueChange={(v) => {
            const next = v as 'no' | 'yes';
            if (next === metadataTab) return;
            skipMetadataSyncRef.current = true;
            setMetadataTab(next);
            set(
              SettingsKey.CompressionKeepMetadata,
              next === 'yes'
                ? [TinypngMetadata.Copyright, TinypngMetadata.Creator, TinypngMetadata.Location]
                : [],
            );
          }}
        >
          <CardHeader
            className='flex flex-row items-center justify-between pb-4 pt-4'
            style={metadataTab === 'yes' ? { borderBottom: '1px solid rgb(219, 219, 220)' } : undefined}
          >
            <div className='flex items-center gap-1.5'>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className='inline-flex cursor-help text-neutral-400 hover:text-neutral-600'>
                    <HelpCircle className='h-3.5 w-3.5' />
                  </span>
                </TooltipTrigger>
                <TooltipContent side='top' className='max-w-[300px] whitespace-pre-line text-xs leading-relaxed'>
                  {t('compression.options.keep_metadata.help')}
                </TooltipContent>
              </Tooltip>
              <h3 className='text-sm font-semibold'>{t('compression.options.keep_metadata.title')}</h3>
            </div>
            <TabsList className='flex h-8 w-[120px] shrink-0 rounded-full p-0'>
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
          </CardHeader>
          {metadataTab === 'yes' && (
            <CardContent className='space-y-3 pb-4 pt-4'>
              <CheckboxGroup
                options={[
                  { value: TinypngMetadata.Copyright, label: t('settings.tinypng.metadata.copyright') },
                  { value: TinypngMetadata.Creator, label: t('settings.tinypng.metadata.creator') },
                  { value: TinypngMetadata.Location, label: t('settings.tinypng.metadata.location') },
                ]}
                value={preserveMetadata}
                onChange={(v) => set(SettingsKey.CompressionKeepMetadata, v)}
              />
            </CardContent>
          )}
        </Tabs>
      </Card>

      <Card className={cardClassName} style={cardStyle}>
        <Tabs
          value={resizeTab}
          activationMode='manual'
          onValueChange={(v) => {
            const next = v as 'no' | 'yes';
            if (next === resizeTab) return;
            skipResizeSyncRef.current = true;
            setResizeTab(next);
            set(SettingsKey.CompressionResizeEnable, next === 'yes');
          }}
        >
          <CardHeader
            className='flex flex-row items-center justify-between pb-4 pt-4'
            style={resizeTab === 'yes' ? { borderBottom: '1px solid rgb(219, 219, 220)' } : undefined}
          >
            <h3 className='text-sm font-semibold'>{t('compression.options.resize.title')}</h3>
            <TabsList className='flex h-8 w-[120px] shrink-0 rounded-full p-0'>
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
          </CardHeader>
          {resizeTab === 'yes' && (
            <CardContent className='space-y-3 pb-4 pt-4'>
              {/* 模式切换：比例缩放 / 自定义 */}
              <div className='flex gap-1'>
                {([ResizeMode.Scale, ResizeMode.Custom] as ResizeMode[]).map((mode) => {
                  const active = resizeModeTab === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => {
                        setResizeModeTab(mode);
                        set(SettingsKey.CompressionResizeMode, mode);
                      }}
                      className={[
                        'flex-1 rounded-full border py-1.5 text-xs font-medium transition-colors',
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
                <div className='flex items-center justify-between gap-2'>
                  <Label className='shrink-0 text-xs'>{t('compression.options.resize.scale_label')}</Label>
                  <div
                    className='flex h-10 w-[140px] shrink-0 items-center gap-1 rounded-md border px-3 shadow-none'
                    style={{ borderColor: 'rgb(219, 219, 220)' }}
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
                        set(SettingsKey.CompressionResizeScale, final);
                        setScaleInput(String(final));
                      }}
                      className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                    />
                    <span className='shrink-0 text-xs text-neutral-500'>%</span>
                  </div>
                </div>
              )}

              {resizeModeTab === ResizeMode.Custom && (
                <div className='space-y-2'>
                  <div className='flex items-center justify-between gap-2'>
                    <Label className='shrink-0 text-xs'>{t('compression.options.resize.width_label')}</Label>
                    <div
                      className='flex h-10 w-[140px] shrink-0 items-center gap-1 rounded-md border px-3 shadow-none'
                      style={{ borderColor: 'rgb(219, 219, 220)' }}
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
                          set(SettingsKey.CompressionResizeDimensions, [final, resizeDimensions?.[1] ?? 0]);
                          setWidthInput(String(final));
                        }}
                        className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                      />
                      <span className='shrink-0 text-xs text-neutral-500'>{t('compression.options.resize.px')}</span>
                    </div>
                  </div>
                  <div className='flex items-center justify-between gap-2'>
                    <Label className='shrink-0 text-xs'>{t('compression.options.resize.height_label')}</Label>
                    <div
                      className='flex h-10 w-[140px] shrink-0 items-center gap-1 rounded-md border px-3 shadow-none'
                      style={{ borderColor: 'rgb(219, 219, 220)' }}
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
                          set(SettingsKey.CompressionResizeDimensions, [resizeDimensions?.[0] ?? 0, final]);
                          setHeightInput(String(final));
                        }}
                        className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                      />
                      <span className='shrink-0 text-xs text-neutral-500'>{t('compression.options.resize.px')}</span>
                    </div>
                  </div>
                  <div className='flex items-center justify-between gap-2'>
                    <Label className='shrink-0 text-xs'>{t('compression.options.resize.fit_label')}</Label>
                    <Select
                      value={resizeFit}
                      onValueChange={(v) => set(SettingsKey.CompressionResizeFit, v as ResizeFit)}
                    >
                      <SelectTrigger
                        className='h-10 w-[140px] shrink-0 border shadow-none text-xs'
                        style={{ borderColor: 'rgb(219, 219, 220)' }}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {([ResizeFit.Cover, ResizeFit.Contain, ResizeFit.Fill, ResizeFit.Inside, ResizeFit.Outside] as ResizeFit[]).map((fit) => (
                          <SelectItem key={fit} value={fit} className='text-xs'>
                            {t(`settings.compression.resize.fit.option.${fit}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Tabs>
      </Card>

      <Card className={cardClassName} style={cardStyle}>
        <Tabs
          value={convertTab}
          activationMode='manual'
          onValueChange={(v) => {
            const next = v as 'no' | 'yes';
            if (next === convertTab) return;
            skipConvertSyncRef.current = true;
            setConvertTab(next);
            set(SettingsKey.CompressionConvertEnable, next === 'yes');
            if (next === 'no') {
              set(SettingsKey.CompressionConvert, []);
            } else if (convertTypes.length === 0) {
              set(SettingsKey.CompressionConvert, [ConvertFormat.Webp]);
            }
          }}
        >
          <CardHeader
            className='flex flex-row items-center justify-between pb-4 pt-4'
            style={convertTab === 'yes' ? { borderBottom: '1px solid rgb(219, 219, 220)' } : undefined}
          >
            <h3 className='text-sm font-semibold'>{t('compression.options.convert.title')}</h3>
            <TabsList className='flex h-8 w-[120px] shrink-0 rounded-full p-0'>
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
          </CardHeader>
          {convertTab === 'yes' && (
            <CardContent className='space-y-3 pb-4 pt-1.5'>
              <div className='mt-3 flex items-center justify-between gap-2'>
                <Label className='shrink-0 text-xs'>{t('compression.options.convert.format_label')}</Label>
                <Select
                  value={convertTypes[0] ?? ConvertFormat.Webp}
                  onValueChange={(v) => set(SettingsKey.CompressionConvert, [v as ConvertFormat])}
                >
                  <SelectTrigger
                    className='h-10 w-[140px] shrink-0 border shadow-none text-xs'
                    style={{ borderColor: 'rgb(219, 219, 220)' }}
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
            </CardContent>
          )}
        </Tabs>
      </Card>
    </div>
  );
}

export default memo(CompressionOptionsCard);
