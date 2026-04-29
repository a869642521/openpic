import { memo, useState, useEffect } from 'react';
import { useI18n } from '@/i18n';
import useWatermarkStore from '@/store/watermark';
import { CompressionOutputMode, WatermarkType, WatermarkPosition, VALID_IMAGE_EXTS } from '@/constants';
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
import { ColorPicker } from 'antd';
import { open } from '@tauri-apps/plugin-dialog';
import { exists } from '@tauri-apps/plugin-fs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAsyncEffect } from 'ahooks';
import { downloadDir } from '@tauri-apps/api/path';
import { AlertCircle, Trash2, Plus, ChevronDown } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import message from '@/components/message';
import { normsForWatermarkPosition } from './watermark-position-map';

const cardClassName = 'w-[280px] flex-shrink-0 border-0 shadow-none rounded-xl';
const cardStyle = { backgroundColor: 'rgb(252, 252, 252)' };

function WatermarkOptionsCard() {
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
    watermarkImageFileExists,
    setWatermarkImageFileExists,
    presets,
    savePreset,
    loadPreset,
    deletePreset,
  } = useWatermarkStore();

  const [presetInputVisible, setPresetInputVisible] = useState(false);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    if (options.watermarkImagePath) {
      exists(options.watermarkImagePath).then(setWatermarkImageFileExists);
    } else {
      setWatermarkImageFileExists(false);
    }
  }, [options.watermarkImagePath, setWatermarkImageFileExists]);

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
    const file = await open({
      multiple: false,
      directory: true,
    });
    if (file) {
      setOutputSaveToFolder(file as string);
    }
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;
    savePreset(presetName.trim());
    setPresetName('');
    setPresetInputVisible(false);
    message.success(t('watermark.preset.saved'));
  };

  const isTile = options.watermarkType === WatermarkType.Tile;

  const positionOptions = [
    { value: WatermarkPosition.Top, label: t('settings.compression.watermark.option.position.top') },
    { value: WatermarkPosition.TopLeft, label: t('settings.compression.watermark.option.position.top_left') },
    { value: WatermarkPosition.TopRight, label: t('settings.compression.watermark.option.position.top_right') },
    { value: WatermarkPosition.Center, label: t('settings.compression.watermark.option.position.center') },
    { value: WatermarkPosition.Bottom, label: t('settings.compression.watermark.option.position.bottom') },
    { value: WatermarkPosition.BottomLeft, label: t('settings.compression.watermark.option.position.bottom_left') },
    { value: WatermarkPosition.BottomRight, label: t('settings.compression.watermark.option.position.bottom_right') },
    { value: WatermarkPosition.Left, label: t('settings.compression.watermark.option.position.left') },
    { value: WatermarkPosition.Right, label: t('settings.compression.watermark.option.position.right') },
    { value: WatermarkPosition.Custom, label: t('watermark.position.custom') },
  ];

  return (
    <div className='flex flex-col gap-3'>
      {/* 预设卡片 */}
      {presets.length > 0 && (
        <Card className={cardClassName} style={cardStyle}>
          <CardHeader className='pb-2 pt-4' style={{ borderBottom: '1px solid rgb(219, 219, 220)' }}>
            <h3 className='text-sm font-semibold'>{t('watermark.preset.title')}</h3>
          </CardHeader>
          <CardContent className='space-y-2 pb-3 pt-3'>
            <div className='flex flex-col gap-1.5'>
              {presets.map((p) => (
                <div key={p.name} className='flex items-center justify-between gap-1 rounded-lg border px-2 py-1.5' style={{ borderColor: 'rgb(219, 219, 220)' }}>
                  <button
                    className='flex-1 truncate text-left text-xs hover:text-neutral-900'
                    onClick={() => loadPreset(p.name)}
                  >
                    {p.name}
                  </button>
                  <button
                    className='shrink-0 text-neutral-400 hover:text-red-500'
                    onClick={() => deletePreset(p.name)}
                  >
                    <Trash2 className='h-3 w-3' />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className={cardClassName} style={cardStyle}>
        <CardHeader className='pb-2 pt-4' style={{ borderBottom: '1px solid rgb(219, 219, 220)' }}>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-semibold'>{t('watermark.options.title')}</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className='text-neutral-400 hover:text-neutral-700'
                  onClick={() => setPresetInputVisible((v) => !v)}
                >
                  <ChevronDown className='h-4 w-4' />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('watermark.preset.save_current')}</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className='space-y-3 pb-4 pt-3'>
          {presetInputVisible && (
            <div className='flex gap-1'>
              <Input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder={t('watermark.preset.name_placeholder')}
                className='h-8 flex-1 text-xs'
                onKeyDown={(e) => e.key === 'Enter' && handleSavePreset()}
              />
              <Button size='sm' className='h-8 px-2' onClick={handleSavePreset}>
                <Plus className='h-3.5 w-3.5' />
              </Button>
            </div>
          )}

          <div className='space-y-2'>
            <Label className='text-xs'>{t('settings.compression.watermark.option.type')}</Label>
            <Select
              value={options.watermarkType}
              onValueChange={(v) => setOptions({ watermarkType: v as WatermarkType })}
            >
              <SelectTrigger className='h-10 border shadow-none text-xs' style={{ borderColor: 'rgb(219, 219, 220)' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={WatermarkType.Text} className='text-xs'>
                    {t('settings.compression.watermark.option.type.text')}
                  </SelectItem>
                  <SelectItem value={WatermarkType.Image} className='text-xs'>
                    {t('settings.compression.watermark.option.type.image')}
                  </SelectItem>
                  <SelectItem value={WatermarkType.Tile} className='text-xs'>
                    {t('watermark.type.tile')}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* 文字水印参数 */}
          {(options.watermarkType === WatermarkType.Text || isTile) && (
            <>
              <div className='space-y-2'>
                <Label className='text-xs'>{t('settings.compression.watermark.text.title')}</Label>
                <Input
                  value={options.watermarkText}
                  onChange={(e) => setOptions({ watermarkText: e.target.value })}
                  className='h-10 text-xs'
                  placeholder={t('watermark.text_placeholder')}
                />
              </div>
              <div className='space-y-2'>
                <Label className='text-xs'>{t('settings.compression.watermark.text.font_size.title')}</Label>
                <Input
                  type='number'
                  min={1}
                  value={options.watermarkFontSize}
                  onChange={(e) => setOptions({ watermarkFontSize: Number(e.target.value) || 16 })}
                  className='h-10 text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label className='text-xs'>{t('settings.compression.watermark.text.color.title')}</Label>
                <ColorPicker
                  value={options.watermarkTextColor}
                  showText
                  disabledAlpha
                  arrow={false}
                  onChange={(color) => setOptions({ watermarkTextColor: color.toHexString() })}
                />
              </div>
            </>
          )}

          {/* 图片水印参数 */}
          {options.watermarkType === WatermarkType.Image && (
            <>
              <div className='space-y-2'>
                <Label className='text-xs'>{t('settings.compression.watermark.image.title')}</Label>
                <div className='flex gap-1'>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={async () => {
                      const selected = await open({
                        multiple: false,
                        filters: [{ name: 'Image', extensions: VALID_IMAGE_EXTS }],
                      });
                      if (selected) setOptions({ watermarkImagePath: selected as string });
                    }}
                  >
                    {t('settings.compression.watermark.image.select_image')}
                  </Button>
                  {options.watermarkImagePath && (
                    <Button size='icon' variant='ghost' onClick={() => setOptions({ watermarkImagePath: '' })}>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  )}
                </div>
                {options.watermarkImagePath && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className='flex items-center gap-1 text-xs'>
                        {!watermarkImageFileExists && <AlertCircle className='h-4 w-4 text-destructive' />}
                        <span className='truncate'>{options.watermarkImagePath.split(/[/\\]/).pop()}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {!watermarkImageFileExists
                        ? t('settings.compression.watermark.image.file_not_exists')
                        : options.watermarkImagePath}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <div className='space-y-2'>
                <Label className='text-xs'>{t('settings.compression.watermark.image.opacity.title')}</Label>
                <Input
                  type='number'
                  step={0.1}
                  min={0}
                  max={1}
                  value={options.watermarkImageOpacity}
                  onChange={(e) => setOptions({ watermarkImageOpacity: Number(e.target.value) || 1 })}
                  className='h-10 text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label className='text-xs'>{t('settings.compression.watermark.image.scale.title')}</Label>
                <Input
                  type='number'
                  step={0.05}
                  min={0.05}
                  max={1}
                  value={options.watermarkImageScale}
                  onChange={(e) => setOptions({ watermarkImageScale: Number(e.target.value) || 0.15 })}
                  className='h-10 text-xs'
                />
              </div>
            </>
          )}

          {/* 平铺专属参数 */}
          {isTile && (
            <div className='space-y-2 rounded-lg border p-2' style={{ borderColor: 'rgb(219, 219, 220)' }}>
              <div className='space-y-2'>
                <Label className='text-xs'>{t('watermark.tile.gap_x')}</Label>
                <Input
                  type='number'
                  min={0}
                  value={options.tileGapX}
                  onChange={(e) => setOptions({ tileGapX: Number(e.target.value) || 0 })}
                  className='h-10 text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label className='text-xs'>{t('watermark.tile.gap_y')}</Label>
                <Input
                  type='number'
                  min={0}
                  value={options.tileGapY}
                  onChange={(e) => setOptions({ tileGapY: Number(e.target.value) || 0 })}
                  className='h-10 text-xs'
                />
              </div>
              <div className='space-y-2'>
                <Label className='text-xs'>{t('watermark.tile.rotation')}</Label>
                <Input
                  type='number'
                  min={-360}
                  max={360}
                  value={options.tileRotation}
                  onChange={(e) => setOptions({ tileRotation: Number(e.target.value) || 0 })}
                  className='h-10 text-xs'
                />
              </div>
            </div>
          )}

          {/* 位置（平铺模式隐藏） */}
          {!isTile && (
            <div className='space-y-2'>
              <Label className='text-xs'>{t('settings.compression.watermark.position.title')}</Label>
              <Select
                value={options.watermarkPosition}
                onValueChange={(v) => {
                  const pos = v as WatermarkPosition;
                  if (pos === WatermarkPosition.Custom) {
                    setOptions({ watermarkPosition: pos });
                    return;
                  }
                  const norms = normsForWatermarkPosition(pos);
                  if (norms) {
                    setOptions({
                      watermarkPosition: pos,
                      positionNormX: norms.x,
                      positionNormY: norms.y,
                    });
                  }
                }}
              >
                <SelectTrigger className='h-10 border shadow-none text-xs' style={{ borderColor: 'rgb(219, 219, 220)' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {positionOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value} className='text-xs'>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}
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
                placeholder='_watermark'
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

export default memo(WatermarkOptionsCard);
