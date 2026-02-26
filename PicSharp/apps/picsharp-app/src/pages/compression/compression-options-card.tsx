import { memo } from 'react';
import { useI18n } from '@/i18n';
import useSettingsStore from '@/store/settings';
import useSelector from '@/hooks/useSelector';
import { SettingsKey, CompressionOutputMode, CompressionType } from '@/constants';
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
import { HelpCircle } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { exists } from '@tauri-apps/plugin-fs';
import { openPath } from '@tauri-apps/plugin-opener';
import { downloadDir } from '@tauri-apps/api/path';
import { useAsyncEffect } from 'ahooks';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const cardClassName = 'w-[280px] flex-shrink-0 border-0 shadow-none rounded-xl';
const cardStyle = { backgroundColor: 'rgb(252, 252, 252)' };

function CompressionOptionsCard() {
  const t = useI18n();
  const {
    [SettingsKey.CompressionSizeFilterEnable]: sizeFilterEnable,
    [SettingsKey.CompressionSizeFilterValue]: sizeFilterValue,
    [SettingsKey.CompressionType]: compressionType,
    [SettingsKey.CompressionLevel]: compressionLevel,
    [SettingsKey.CompressionOutput]: outputMode,
    [SettingsKey.CompressionOutputSaveToFolder]: saveToFolder,
    set,
  } = useSettingsStore(
    useSelector([
      SettingsKey.CompressionSizeFilterEnable,
      SettingsKey.CompressionSizeFilterValue,
      SettingsKey.CompressionType,
      SettingsKey.CompressionLevel,
      SettingsKey.CompressionOutput,
      SettingsKey.CompressionOutputSaveToFolder,
      'set',
    ]),
  );

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
          value={sizeFilterEnable ? 'filter' : 'auto'}
          onValueChange={(v) => {
            const isFilter = v === 'filter';
            set(SettingsKey.CompressionSizeFilterEnable, isFilter);
            if (!isFilter) {
              set(SettingsKey.CompressionType, CompressionType.Lossless);
            }
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
                    value={sizeFilterValue}
                    onChange={(e) =>
                      set(SettingsKey.CompressionSizeFilterValue, Number(e.target.value) || 500)
                    }
                    className='h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0'
                  />
                  <span className='shrink-0 text-xs text-neutral-500'>KB</span>
                </div>
              </div>
            </TabsContent>
        </CardContent>
          </Tabs>
      </Card>

      <Card className={cardClassName} style={cardStyle}>
        <Tabs
          value={outputMode === CompressionOutputMode.Overwrite ? 'overwrite' : 'specify'}
          onValueChange={(v) =>
            set(
              SettingsKey.CompressionOutput,
              v === 'overwrite' ? CompressionOutputMode.Overwrite : CompressionOutputMode.SaveToNewFolder,
            )
          }
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
    </div>
  );
}

export default memo(CompressionOptionsCard);
