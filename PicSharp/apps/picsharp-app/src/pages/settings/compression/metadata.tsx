import { memo } from 'react';
import { useI18n } from '@/i18n';
import useSettingsStore from '@/store/settings';
import useSelector from '@/hooks/useSelector';
import { SettingsKey, TinypngMetadata } from '@/constants';
import SettingItem from '../setting-item';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CheckboxGroup } from '@/components/checkbox-group';

function SettingsCompressionMetadata() {
  const t = useI18n();
  const { compression_keep_metadata: preserveMetadata = [], set } = useSettingsStore(
    useSelector([SettingsKey.CompressionKeepMetadata, 'set']),
  );

  const enabled = (preserveMetadata?.length ?? 0) > 0;
  const options = [
    { value: TinypngMetadata.Copyright, label: t('settings.tinypng.metadata.copyright') },
    { value: TinypngMetadata.Creator, label: t('settings.tinypng.metadata.creator') },
    { value: TinypngMetadata.Location, label: t('settings.tinypng.metadata.location') },
  ];

  const handleSwitchChange = (checked: boolean) => {
    set(
      SettingsKey.CompressionKeepMetadata,
      checked ? [TinypngMetadata.Copyright, TinypngMetadata.Creator, TinypngMetadata.Location] : [],
    );
  };

  const handleValueChange = (value: string[]) => {
    set(SettingsKey.CompressionKeepMetadata, value);
  };

  return (
    <SettingItem
      title={
        <>
          <span>{t('settings.compression.metadata.title')}</span>
          <Badge variant='third'>{t(`settings.compression.mode.option.local`)}</Badge>
        </>
      }
      titleClassName='flex flex-row items-center gap-x-2'
      description={t('settings.compression.metadata.description')}
    >
      <div className='flex flex-col gap-3'>
        <Switch checked={enabled} onCheckedChange={handleSwitchChange} />
        {enabled && (
          <CheckboxGroup options={options} value={preserveMetadata} onChange={handleValueChange} />
        )}
      </div>
    </SettingItem>
  );
}

export default memo(SettingsCompressionMetadata);
