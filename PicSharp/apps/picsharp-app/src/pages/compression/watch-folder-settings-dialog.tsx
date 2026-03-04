import { memo, useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import useCompressionStore from '@/store/compression';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConvertFormat, WatermarkType } from '@/constants';
import {
  CompressionPanel,
  ConvertPanel,
  ResizePanel,
  WatermarkPanel,
  ALL_FEATURES,
  isFeatureEnabled,
  type WatchFeature,
} from './watch-feature-panels';

export type SettingsSection = 'compression' | 'resize' | 'watermark' | 'convert';

interface Props {
  open: boolean;
  folder: WatchFolder;
  initialSection?: SettingsSection;
  onClose: () => void;
}

function WatchFolderSettingsDialog({ open: isOpen, folder, initialSection, onClose }: Props) {
  const t = useI18n();
  const { updateWatchFolderSettings } = useCompressionStore.getState();

  // 本地暂存：仅点确认后才写入 store
  const [localSettings, setLocalSettings] = useState<WatchFolderSettings>(() => ({
    ...folder.settings,
  }));

  // 对话框打开时同步最新 settings；若指定了 initialSection 且对应功能未启用则自动开启
  useEffect(() => {
    if (isOpen) {
      let s = { ...folder.settings };
      if (initialSection) {
        const featureEnableMap: Record<SettingsSection, keyof WatchFolderSettings> = {
          compression: 'compressionEnable',
          convert: 'convertEnable',
          resize: 'resizeEnable',
          watermark: 'watermarkEnable',
        };
        const key = featureEnableMap[initialSection];
        const isEnabled = key === 'compressionEnable' ? s[key] !== false : !!s[key];
        if (!isEnabled) {
          const patch: Partial<WatchFolderSettings> = { [key]: true };
          if (initialSection === 'convert' && (!s.convertTypes || s.convertTypes.length === 0)) {
            patch.convertTypes = [ConvertFormat.Webp];
          }
          if (initialSection === 'watermark' && s.watermarkType === WatermarkType.None) {
            patch.watermarkType = WatermarkType.Text;
          }
          s = { ...s, ...patch };
        }
      }
      setLocalSettings(s);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<WatchFolderSettings>) => {
    setLocalSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleFeatureToggle = (feature: WatchFeature) => {
    const enabled = isFeatureEnabled(feature, localSettings);
    setLocalSettings((prev) => {
      const patch: Partial<WatchFolderSettings> = {};
      switch (feature) {
        case 'compression':
          patch.compressionEnable = !enabled;
          break;
        case 'resize':
          patch.resizeEnable = !enabled;
          break;
        case 'convert':
          patch.convertEnable = !enabled;
          if (!enabled && (!prev.convertTypes || prev.convertTypes.length === 0)) {
            patch.convertTypes = [ConvertFormat.Webp];
          }
          break;
        case 'watermark':
          patch.watermarkEnable = !enabled;
          if (!enabled && prev.watermarkType === WatermarkType.None) {
            patch.watermarkType = WatermarkType.Text;
          }
          break;
      }
      return { ...prev, ...patch };
    });
  };

  const folderName = folder.path.split(/[/\\]/).filter(Boolean).pop() || folder.path;

  // 各区块 ref，用于 initialSection 滚动定位
  const compressionRef = useRef<HTMLDivElement>(null);
  const convertRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !initialSection) return;
    const refMap: Partial<Record<SettingsSection, React.RefObject<HTMLDivElement | null>>> = {
      compression: compressionRef,
      convert: convertRef,
      resize: resizeRef,
      watermark: watermarkRef,
    };
    const target = refMap[initialSection]?.current;
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  }, [isOpen, initialSection]);

  const handleConfirm = () => {
    updateWatchFolderSettings(folder.id, localSettings);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && handleCancel()}>
      <DialogContent className='flex max-h-[90vh] max-w-lg flex-col gap-0 p-0'>
        {/* 固定标题栏 */}
        <DialogHeader className='shrink-0 border-b border-neutral-200 px-6 py-4 pr-14 dark:border-neutral-800'>
          <DialogTitle className='flex items-center gap-2 text-sm'>
            <span className='font-semibold'>{t('page.compression.watch.folder.settings_title')}</span>
            <span
              className='max-w-[200px] truncate text-xs font-normal text-neutral-400'
              title={folder.path}
            >
              {folderName}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* 可滚动内容区 */}
        <div className='flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4'>
          {/* 功能开关 pills */}
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

          {/* 各功能面板（仅启用时渲染） */}
          {isFeatureEnabled('compression', localSettings) && (
            <div ref={compressionRef}>
              <CompressionPanel settings={localSettings} onChange={set} />
            </div>
          )}
          {isFeatureEnabled('convert', localSettings) && (
            <div ref={convertRef}>
              <ConvertPanel settings={localSettings} onChange={set} />
            </div>
          )}
          {isFeatureEnabled('resize', localSettings) && (
            <div ref={resizeRef}>
              <ResizePanel settings={localSettings} onChange={set} />
            </div>
          )}
          {isFeatureEnabled('watermark', localSettings) && (
            <div ref={watermarkRef}>
              <WatermarkPanel settings={localSettings} onChange={set} />
            </div>
          )}

          {/* 全部功能关闭时的空态提示 */}
          {ALL_FEATURES.every((f) => !isFeatureEnabled(f, localSettings)) && (
            <p className='py-6 text-center text-sm text-neutral-400 dark:text-neutral-500'>
              {t('page.compression.watch.folder.settings.no_feature_hint')}
            </p>
          )}
        </div>

        {/* 固定底部确认/取消按钮 */}
        <div className='flex shrink-0 justify-end gap-2 border-t border-neutral-200 px-6 py-4 dark:border-neutral-800'>
          <Button variant='outline' size='sm' onClick={handleCancel}>
            {t('cancel')}
          </Button>
          <Button size='sm' onClick={handleConfirm}>
            {t('confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(WatchFolderSettingsDialog);
