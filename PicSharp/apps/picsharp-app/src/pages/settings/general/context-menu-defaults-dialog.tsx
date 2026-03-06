import { memo, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n';
import useSettingsStore from '@/store/settings';
import useSelector from '@/hooks/useSelector';
import { SettingsKey, CompressionMode, CompressionOutputMode } from '@/constants';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { defaultWatchFolderSettings } from '@/store/compression';
import {
  CompressionPanel,
  ConvertPanel,
  ResizePanel,
  WatermarkPanel,
} from '@/pages/compression/watch-feature-panels';

interface CompressDefaults {
  compressionMode?: CompressionMode;
  outputMode?: CompressionOutputMode;
}

function parseJSON<T>(str: string, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

export default memo(function ContextMenuDefaultsDialog() {
  const t = useI18n();
  const {
    contextMenuSettingsOpen,
    context_menu_compress_defaults,
    context_menu_watch_defaults,
    set,
    setContextMenuSettingsOpen,
  } = useSettingsStore(
    useSelector([
      'contextMenuSettingsOpen',
      SettingsKey.ContextMenuCompressDefaults,
      SettingsKey.ContextMenuWatchDefaults,
      'set',
      'setContextMenuSettingsOpen',
    ] as any),
  );

  const isOpen = contextMenuSettingsOpen !== null;
  const activeTab = (contextMenuSettingsOpen as string) ?? 'compress';

  const [compressDefaults, setCompressDefaults] = useState<CompressDefaults>({});
  const [watchSettings, setWatchSettings] = useState<WatchFolderSettings>({ ...defaultWatchFolderSettings });

  useEffect(() => {
    if (isOpen) {
      setCompressDefaults(parseJSON<CompressDefaults>((context_menu_compress_defaults as string) ?? '', {}));
      setWatchSettings({
        ...defaultWatchFolderSettings,
        ...parseJSON<Partial<WatchFolderSettings>>((context_menu_watch_defaults as string) ?? '', {}),
      });
    }
  }, [isOpen, context_menu_compress_defaults, context_menu_watch_defaults]);

  const handleClose = () => {
    setContextMenuSettingsOpen(null);
  };

  const handleSaveCompress = async () => {
    await set(SettingsKey.ContextMenuCompressDefaults, JSON.stringify(compressDefaults));
    setContextMenuSettingsOpen(null);
  };

  const handleSaveWatch = async () => {
    await set(SettingsKey.ContextMenuWatchDefaults, JSON.stringify(watchSettings));
    setContextMenuSettingsOpen(null);
  };

  const compressionModeOptions = [
    { value: CompressionMode.Auto, label: t('settings.compression.mode.option.auto' as any) },
    { value: CompressionMode.Local, label: t('settings.compression.mode.option.local' as any) },
    { value: CompressionMode.Remote, label: t('settings.compression.mode.option.remote' as any) },
  ];

  const outputModeOptions = [
    { value: CompressionOutputMode.Overwrite, label: t('settings.compression.output.option.overwrite' as any) },
    { value: CompressionOutputMode.SaveAsNewFile, label: t('settings.compression.output.option.save_as_new_file' as any) },
    { value: CompressionOutputMode.SaveToNewFolder, label: t('settings.compression.output.option.save_to_new_folder' as any) },
  ];

  const SECTION_CLASS = 'rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-700/40 dark:bg-neutral-800/20';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className='max-w-[640px] p-0 gap-0 overflow-hidden' hideClose>
        <DialogHeader className='px-6 pt-5 pb-4 border-b border-neutral-100 dark:border-neutral-800'>
          <DialogTitle className='text-sm font-semibold'>
            {t('settings.general.context_menu.defaults_dialog.title' as any)}
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => useSettingsStore.getState().setContextMenuSettingsOpen(v as 'compress' | 'watch')}
          className='flex flex-col'
        >
          <TabsList className='mx-6 mt-4 mb-2 self-start bg-neutral-100 dark:bg-neutral-800'>
            <TabsTrigger value='compress' className='text-xs'>
              {t('settings.general.context_menu.defaults_dialog.tab_compress' as any)}
            </TabsTrigger>
            <TabsTrigger value='watch' className='text-xs'>
              {t('settings.general.context_menu.defaults_dialog.tab_watch' as any)}
            </TabsTrigger>
          </TabsList>

          <TabsContent value='compress' className='mt-0'>
            <div className='px-6 py-4 space-y-4 max-h-[480px] overflow-y-auto'>
              <div className={SECTION_CLASS}>
                <p className='text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-3'>
                  {t('settings.general.context_menu.defaults_dialog.compress_section' as any)}
                </p>
                <div className='flex items-center justify-between gap-3'>
                  <span className='text-xs text-neutral-500'>{t('settings.compression.mode.title' as any)}</span>
                  <Select
                    value={compressDefaults.compressionMode ?? CompressionMode.Local}
                    onValueChange={(v) => setCompressDefaults((prev) => ({ ...prev, compressionMode: v as CompressionMode }))}
                  >
                    <SelectTrigger className='h-8 w-[200px] text-xs shadow-none'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {compressionModeOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value} className='text-xs'>{o.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className={SECTION_CLASS}>
                <p className='text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-3'>
                  {t('settings.general.context_menu.defaults_dialog.output_section' as any)}
                </p>
                <div className='flex items-center justify-between gap-3'>
                  <span className='text-xs text-neutral-500'>{t('settings.compression.output.title' as any)}</span>
                  <Select
                    value={compressDefaults.outputMode ?? CompressionOutputMode.Overwrite}
                    onValueChange={(v) => setCompressDefaults((prev) => ({ ...prev, outputMode: v as CompressionOutputMode }))}
                  >
                    <SelectTrigger className='h-8 w-[200px] text-xs shadow-none'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {outputModeOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value} className='text-xs'>{o.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className='flex justify-end gap-2 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800'>
              <Button variant='ghost' size='sm' className='text-xs h-8' onClick={handleClose}>
                {t('cancel')}
              </Button>
              <Button size='sm' className='text-xs h-8 bg-blue-500 hover:bg-blue-600 text-white' onClick={handleSaveCompress}>
                {t('confirm')}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value='watch' className='mt-0'>
            <div className='px-6 py-4 space-y-3 max-h-[480px] overflow-y-auto'>
              <CompressionPanel
                settings={watchSettings}
                onChange={(patch) => setWatchSettings((prev) => ({ ...prev, ...patch }))}
              />
              <ConvertPanel
                settings={watchSettings}
                onChange={(patch) => setWatchSettings((prev) => ({ ...prev, ...patch }))}
              />
              <ResizePanel
                settings={watchSettings}
                onChange={(patch) => setWatchSettings((prev) => ({ ...prev, ...patch }))}
              />
              <WatermarkPanel
                settings={watchSettings}
                onChange={(patch) => setWatchSettings((prev) => ({ ...prev, ...patch }))}
              />
            </div>
            <div className='flex justify-end gap-2 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800'>
              <Button variant='ghost' size='sm' className='text-xs h-8' onClick={handleClose}>
                {t('cancel')}
              </Button>
              <Button size='sm' className='text-xs h-8 bg-blue-500 hover:bg-blue-600 text-white' onClick={handleSaveWatch}>
                {t('confirm')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
});
