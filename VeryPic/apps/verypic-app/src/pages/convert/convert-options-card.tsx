import { memo } from 'react';
import { useI18n } from '@/i18n';
import useConvertStore from '@/store/convert';
import { CompressionOutputMode, ConvertFormat } from '@/constants';
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

function ConvertOptionsCard() {
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
  } = useConvertStore();

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

  const formatOptions = [
    { value: ConvertFormat.Png, label: 'PNG' },
    { value: ConvertFormat.Jpg, label: 'JPG' },
    { value: ConvertFormat.Webp, label: 'WebP' },
    { value: ConvertFormat.Avif, label: 'AVIF' },
  ];

  return (
    <div className='flex flex-col gap-3'>
      <Card className={cardClassName} style={cardStyle}>
        <CardHeader className='pb-2 pt-4' style={{ borderBottom: '1px solid rgb(219, 219, 220)' }}>
          <h3 className='text-sm font-semibold'>{t('convert.options.title')}</h3>
        </CardHeader>
        <CardContent className='space-y-3 pb-4 pt-3'>
          <div className='space-y-2'>
            <Label className='text-xs'>{t('convert.options.target_format')}</Label>
            <Select
              value={options.targetFormat}
              onValueChange={(v) => setOptions({ targetFormat: v as ConvertFormat })}
            >
              <SelectTrigger className='h-10 border shadow-none text-xs' style={{ borderColor: 'rgb(219, 219, 220)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {formatOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className='text-xs'>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label className='text-xs'>{t('settings.compression.convert_alpha.title')}</Label>
            <Input
              value={options.alpha}
              onChange={(e) => setOptions({ alpha: e.target.value })}
              className='h-10 text-xs'
              placeholder='#FFFFFF'
            />
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
                placeholder='_converted'
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

export default memo(ConvertOptionsCard);
