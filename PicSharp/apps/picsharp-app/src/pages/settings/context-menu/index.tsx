import { memo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';
import { useI18n } from '@/i18n';
import useSettingsStore from '@/store/settings';
import useSelector from '@/hooks/useSelector';
import { SettingsKey, CompressionType } from '@/constants';
import { isWindows } from '@/utils';
import Section from '../section';
import SettingItem from '../setting-item';
import {
  ImageDown,
  FolderSearch,
  MonitorCog,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Type from '../compression/type';
import Level from '../compression/level';

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className='flex items-start gap-3 rounded-lg border border-neutral-200/80 bg-neutral-50/50 p-4 dark:border-neutral-700/40 dark:bg-neutral-800/30'>
      <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400'>
        {icon}
      </div>
      <div className='min-w-0 flex-1'>
        <p className='text-sm font-medium text-neutral-800 dark:text-neutral-200'>
          {title}
        </p>
        <p className='mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400'>
          {description}
        </p>
      </div>
    </div>
  );
}

function CompressFeatureCard({ t }: { t: ReturnType<typeof useI18n> }) {
  const [expanded, setExpanded] = useState(false);
  const compressionType = useSettingsStore((s) => s[SettingsKey.CompressionType]);
  const isLossy = compressionType === CompressionType.Lossy;
  return (
    <div className='rounded-lg border border-neutral-200/80 bg-neutral-50/50 dark:border-neutral-700/40 dark:bg-neutral-800/30'>
      <button
        type='button'
        onClick={() => setExpanded((v) => !v)}
        className='flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-neutral-100/50 dark:hover:bg-neutral-700/20'
      >
        <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400'>
          <ImageDown className='h-4 w-4' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-medium text-neutral-800 dark:text-neutral-200'>
            {t('settings.context_menu.feature_compress_title')}
          </p>
          <p className='mt-1 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400'>
            {t('settings.context_menu.feature_compress_desc')}
          </p>
        </div>
        <span className='shrink-0 text-neutral-400 dark:text-neutral-500'>
          {expanded ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
        </span>
      </button>
      {expanded && (
        <div className='border-t border-neutral-200/80 px-4 pb-4 pt-3 dark:border-neutral-700/40'>
          <div className='space-y-4'>
            <Type />
            {isLossy && <Level />}
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsContextMenu() {
  const t = useI18n();

  const { context_menu_integration, set } = useSettingsStore(
    useSelector([SettingsKey.ContextMenuIntegration, 'set']),
  );

  if (!isWindows) {
    return (
      <Section>
        <Card>
          <SettingItem
            title={t('settings.context_menu.title')}
            description={t('settings.context_menu.not_supported')}
          />
        </Card>
      </Section>
    );
  }

  const handleToggle = async (value: boolean) => {
    try {
      await invoke('ipc_register_context_menu', { enable: value });
      set(SettingsKey.ContextMenuIntegration, value);
    } catch (error) {
      console.error('Failed to register context menu', error);
      toast.error(String(error));
    }
  };

  return (
    <Section>
      <Card>
        <SettingItem
          title={t('settings.context_menu.title')}
          description={t('settings.context_menu.description')}
        >
          <Switch
            checked={context_menu_integration}
            onCheckedChange={handleToggle}
          />
        </SettingItem>
      </Card>

      <Card className='overflow-hidden'>
        <div className='px-6 py-4'>
          <div className='mb-2 flex items-center gap-2'>
            <MonitorCog className='h-4 w-4 shrink-0 text-neutral-500' />
            <h3 className='text-sm font-semibold text-neutral-800 dark:text-neutral-200'>
              {t('settings.context_menu.features_title')}
            </h3>
          </div>
          <p className='mb-4 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400'>
            {t('settings.context_menu.features_desc')}
          </p>
          <div className='space-y-3'>
            <CompressFeatureCard t={t} />
            <FeatureCard
              icon={<FolderSearch className='h-4 w-4' />}
              title={t('settings.context_menu.feature_watch_title')}
              description={t('settings.context_menu.feature_watch_desc')}
            />
          </div>
        </div>
      </Card>
    </Section>
  );
}

export default memo(SettingsContextMenu);
