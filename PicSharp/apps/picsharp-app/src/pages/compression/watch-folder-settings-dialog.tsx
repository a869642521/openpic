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
import {
  CompressionPanel,
  ConvertPanel,
  ResizePanel,
  WatermarkPanel,
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

  // 对话框打开时同步最新 settings
  useEffect(() => {
    if (isOpen) {
      setLocalSettings({ ...folder.settings });
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch: Partial<WatchFolderSettings>) => {
    setLocalSettings((prev) => ({ ...prev, ...patch }));
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
          <div ref={compressionRef}>
            <CompressionPanel settings={localSettings} onChange={set} />
          </div>
          <div ref={convertRef}>
            <ConvertPanel settings={localSettings} onChange={set} />
          </div>
          <div ref={resizeRef}>
            <ResizePanel settings={localSettings} onChange={set} />
          </div>
          <div ref={watermarkRef}>
            <WatermarkPanel settings={localSettings} onChange={set} />
          </div>
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
