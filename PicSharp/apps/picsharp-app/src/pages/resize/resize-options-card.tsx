import { memo } from 'react';
import { useI18n } from '@/i18n';
import useResizeStore from '@/store/resize';
import { CompressionOutputMode, ResizeFit } from '@/constants';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAsyncEffect } from 'ahooks';
import { downloadDir } from '@tauri-apps/api/path';
import { open } from '@tauri-apps/plugin-dialog';

const cardClassName = 'w-[280px] flex-shrink-0 border-0 shadow-none rounded-xl';
const cardStyle = { backgroundColor: 'rgb(252, 252, 252)' };
const MAX_DIMENSION = 32767;

function ResizeOptionsCard() {
  const t = useI18n();
  const {
    options,
    setOptions,
    outputMode,
    setOutputMode,
    outputSaveAsFileSuffix,
    setOutputSaveAsFileSuffix,
    outputSaveToFolder,
    setOutputSaveToFolder,
  } = useResizeStore();

  useAsyncEffect(async () => {
    if (
      outputMode === CompressionOutputMode.SaveToNewFolder &&
      (!outputSaveToFolder || outputSaveToFolder.trim() === '')
    ) {
      const downloadDirPath = await downloadDir();
      setOutputSaveToFolder(downloadDirPath);
    }
  }, [outputMode, outputSaveToFolder]);

  const handleChooseFolder = async () => {
    const file = await open({ multiple: false, directory: true });
    if (file) setOutputSaveToFolder(file as string);
  };

  const fitOptions = [
    { value: ResizeFit.Contain, label: t('settings.compression.resize.fit.option.contain') },
    { value: ResizeFit.Cover, label: t('settings.compression.resize.fit.option.cover') },
    { value: ResizeFit.Fill, label: t('settings.compression.resize.fit.option.fill') },
    { value: ResizeFit.Inside, label: t('settings.compression.resize.fit.option.inside') },
    { value: ResizeFit.Outside, label: t('settings.compression.resize.fit.option.outside') },
  ];

  return (
    <div className='flex flex-col gap-3'>
      <Card className={cardClassName} style={cardStyle}>
        <CardHeader className='pb-2 pt-4' style={{ borderBottom: '1px solid rgb(219, 219, 220)' }}>
          <h3 className='text-sm font-semibold'>{t('resize.options.title')}</h3>
        </CardHeader>
        <CardContent className='space-y-3 pb-4 pt-3'>
          <div className='space-y-2'>
            <Label className='text-xs'>{t('settings.compression.resize.dimensions.width')}</Label>
            <Input
              type='number'
              min={0}
              max={MAX_DIMENSION}
              placeholder='0'
              value={options.dimensions[0] || ''}
              onChange={(e) => {
                const v = Math.max(0, Math.min(MAX_DIMENSION, Number(e.target.value) || 0));
                setOptions({ dimensions: [v, options.dimensions[1] || 0] });
              }}
              className='h-10 text-xs'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-xs'>{t('settings.compression.resize.dimensions.height')}</Label>
            <Input
              type='number'
              min={0}
              max={MAX_DIMENSION}
              placeholder='0'
              value={options.dimensions[1] || ''}
              onChange={(e) => {
                const v = Math.max(0, Math.min(MAX_DIMENSION, Number(e.target.value) || 0));
                setOptions({ dimensions: [options.dimensions[0] || 0, v] });
              }}
              className='h-10 text-xs'
            />
          </div>
          <div className='space-y-2'>
            <Label className='text-xs'>{t('settings.compression.resize.fit.title')}</Label>
            <Select value={options.fit} onValueChange={(v) => setOptions({ fit: v as ResizeFit })}>
              <SelectTrigger className='h-10 border shadow-none text-xs' style={{ borderColor: 'rgb(219, 219, 220)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {fitOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className='text-xs'>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className={cardClassName} style={cardStyle}>
        <CardHeader className='pb-2 pt-4' style={{ borderBottom: '1px solid rgb(219, 219, 220)' }}>
          <h3 className='text-sm font-semibold'>{t('compression.options.save_mode.title')}</h3>
        </CardHeader>
        <CardContent className='space-y-3 pb-4 pt-3'>
          <div className='space-y-2'>
            <Label className='text-xs'>{t('settings.compression.output.description')}</Label>
            <Select value={outputMode} onValueChange={(v) => setOutputMode(v as CompressionOutputMode)}>
              <SelectTrigger className='h-10 border shadow-none text-xs' style={{ borderColor: 'rgb(219, 219, 220)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={CompressionOutputMode.Overwrite} className='text-xs'>
                    {t('settings.compression.output.option.overwrite')}
                  </SelectItem>
                  <SelectItem value={CompressionOutputMode.SaveAsNewFile} className='text-xs'>
                    {t('settings.compression.output.option.save_as_new_file')}
                  </SelectItem>
                  <SelectItem value={CompressionOutputMode.SaveToNewFolder} className='text-xs'>
                    {t('settings.compression.output.option.save_to_new_folder')}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          {outputMode === CompressionOutputMode.SaveAsNewFile && (
            <div className='space-y-2'>
              <Label className='text-xs'>{t('settings.compression.output.option.save_as_new_file.title')}</Label>
              <Input
                value={outputSaveAsFileSuffix}
                onChange={(e) => setOutputSaveAsFileSuffix(e.target.value)}
                className='h-10 text-xs'
                placeholder='_resized'
              />
            </div>
          )}
          {outputMode === CompressionOutputMode.SaveToNewFolder && (
            <div className='space-y-2'>
              <Label className='text-xs'>{t('settings.compression.output.option.save_to_new_folder.title')}</Label>
              <div className='flex gap-1'>
                <Input
                  value={outputSaveToFolder}
                  onChange={(e) => setOutputSaveToFolder(e.target.value)}
                  className='h-10 text-xs flex-1'
                  readOnly
                />
                <Button size='sm' variant='outline' style={{ backgroundColor: 'rgb(245, 246, 247)' }} onClick={handleChooseFolder}>
                  {t('settings.compression.output.option.save_to_new_folder.choose')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default memo(ResizeOptionsCard);
