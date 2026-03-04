import { memo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import { Eye, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { defaultWatchFolderSettings } from '@/store/compression';
import {
  CompressionPanel,
  ConvertPanel,
  ResizePanel,
  WatermarkPanel,
} from './watch-feature-panels';

export type WatchAddMode = 'monitor_only' | 'compress_then_monitor';
export type WatchFeature = 'compression' | 'resize' | 'watermark' | 'convert';

interface WatchAddModeDialogProps {
  open: boolean;
  onConfirm: (mode: WatchAddMode, features: WatchFeature[], settings: WatchFolderSettings) => void;
  onCancel?: () => void;
}

const ALL_FEATURES: WatchFeature[] = ['compression', 'resize', 'watermark', 'convert'];

const FEATURE_ENABLE_KEYS: Record<WatchFeature, keyof WatchFolderSettings> = {
  compression: 'compressionEnable',
  resize: 'resizeEnable',
  watermark: 'watermarkEnable',
  convert: 'convertEnable',
};

function isFeatureEnabled(feature: WatchFeature, settings: WatchFolderSettings): boolean {
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

function WatchAddModeDialog({ open, onConfirm, onCancel }: WatchAddModeDialogProps) {
  const t = useI18n();
  const [selectedMode, setSelectedMode] = useState<WatchAddMode | null>(null);
  const [localSettings, setLocalSettings] = useState<WatchFolderSettings>({
    ...defaultWatchFolderSettings,
  });

  const handlePatch = (patch: Partial<WatchFolderSettings>) => {
    setLocalSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleFeatureToggle = (feature: WatchFeature) => {
    const enabled = isFeatureEnabled(feature, localSettings);
    const key = FEATURE_ENABLE_KEYS[feature] as keyof WatchFolderSettings;
    setLocalSettings((prev) => ({ ...prev, [key]: !enabled }));
  };

  const resetState = () => {
    setSelectedMode(null);
    setLocalSettings({ ...defaultWatchFolderSettings });
  };

  const handleConfirm = () => {
    if (!selectedMode) return;
    const features = ALL_FEATURES.filter((f) => isFeatureEnabled(f, localSettings));
    onConfirm(selectedMode, features, localSettings);
    resetState();
  };

  const handleCancel = () => {
    resetState();
    onCancel?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleCancel()}>
      <DialogContent
        className='flex max-h-[85vh] max-w-lg flex-col gap-0 p-0'
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          handleCancel();
          e.preventDefault();
        }}
      >
        {/* 固定标题区 */}
        <DialogHeader className='shrink-0 border-b border-neutral-200 px-6 py-4 pr-14 dark:border-neutral-800'>
          <DialogTitle>{t('page.compression.watch.guide.add_mode_dialog_title')}</DialogTitle>
          <DialogDescription>
            {t('page.compression.watch.guide.add_mode_dialog_description')}
          </DialogDescription>
        </DialogHeader>

        {/* 可滚动主体 */}
        <div className='flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4'>
          {/* 监听方式 */}
          <div className='flex flex-col gap-2'>
            <p className='text-xs font-medium text-neutral-500'>
              {t('page.compression.watch.guide.add_mode_section_title')}
            </p>
            <div className='flex flex-col gap-2'>
              {(
                [
                  {
                    mode: 'monitor_only' as WatchAddMode,
                    icon: <Eye className='h-5 w-5 text-amber-600 dark:text-amber-400' />,
                    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
                    label: t('page.compression.watch.guide.add_mode_monitor_only'),
                    desc: t('page.compression.watch.guide.add_mode_monitor_only_desc'),
                  },
                  {
                    mode: 'compress_then_monitor' as WatchAddMode,
                    icon: <Zap className='h-5 w-5 text-blue-600 dark:text-blue-400' />,
                    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
                    label: t('page.compression.watch.guide.add_mode_compress_then_monitor'),
                    desc: t('page.compression.watch.guide.add_mode_compress_then_monitor_desc'),
                  },
                ] as const
              ).map(({ mode, icon, iconBg, label, desc }) => {
                const active = selectedMode === mode;
                return (
                  <button
                    key={mode}
                    type='button'
                    onClick={() => setSelectedMode(mode)}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                      active
                        ? 'border-blue-400 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40'
                        : 'border-neutral-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800/50',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        iconBg,
                      )}
                    >
                      {icon}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='text-sm font-medium text-neutral-900 dark:text-neutral-100'>
                        {label}
                      </p>
                      <p className='mt-0.5 text-xs text-neutral-500 dark:text-neutral-400'>
                        {desc}
                      </p>
                    </div>
                    <div
                      className={cn(
                        'mt-1 h-4 w-4 shrink-0 rounded-full border-2 transition-colors',
                        active
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-neutral-300 dark:border-neutral-600',
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 启用功能 */}
          <div className='flex flex-col gap-2'>
            <p className='text-xs font-medium text-neutral-500'>
              {t('page.compression.watch.guide.add_feature_section_title')}
            </p>
            <div className='flex gap-2'>
              {ALL_FEATURES.map((feature) => {
                const active = isFeatureEnabled(feature, localSettings);
                return (
                  <button
                    key={feature}
                    type='button'
                    onClick={() => handleFeatureToggle(feature)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-full border py-1.5 text-xs font-medium transition-colors',
                      active
                        ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'border-neutral-200 bg-neutral-100 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500',
                    )}
                  >
                    <span
                      className={cn(
                        'h-1.5 w-1.5 shrink-0 rounded-full',
                        active ? 'bg-blue-600 dark:bg-blue-400' : 'bg-neutral-300 dark:bg-neutral-600',
                      )}
                    />
                    {t(`page.compression.watch.guide.feature.${feature}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 已选功能的内联设置面板 */}
          {isFeatureEnabled('compression', localSettings) && (
            <CompressionPanel settings={localSettings} onChange={handlePatch} />
          )}
          {isFeatureEnabled('convert', localSettings) && (
            <ConvertPanel settings={localSettings} onChange={handlePatch} />
          )}
          {isFeatureEnabled('resize', localSettings) && (
            <ResizePanel settings={localSettings} onChange={handlePatch} />
          )}
          {isFeatureEnabled('watermark', localSettings) && (
            <WatermarkPanel settings={localSettings} onChange={handlePatch} />
          )}
        </div>

        {/* 固定底部操作栏 */}
        <div className='flex shrink-0 justify-end gap-2 border-t border-neutral-200 px-6 py-4 dark:border-neutral-800'>
          <Button variant='outline' onClick={handleCancel}>
            {t('cancel')}
          </Button>
          <Button disabled={!selectedMode} onClick={handleConfirm}>
            {t('page.compression.watch.guide.add_confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(WatchAddModeDialog);
