import { memo } from 'react';
import { useI18n } from '@/i18n';
import useSettingsStore from '@/store/settings';
import useSelector from '@/hooks/useSelector';
import { SettingsKey } from '@/constants';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';
import { isWindows } from '@/utils';
import SettingItem from '../setting-item';

export default memo(function SettingsGeneralContextMenu() {
  const t = useI18n();
  const { context_menu_integration, set } = useSettingsStore(
    useSelector([SettingsKey.ContextMenuIntegration, 'set']),
  );

  if (!isWindows) return null;

  const handleChange = async (value: boolean) => {
    try {
      await invoke('ipc_register_context_menu', { enable: value });
      set(SettingsKey.ContextMenuIntegration, value);
    } catch (error) {
      console.error('Failed to register context menu', error);
      toast.error(String(error));
    }
  };

  return (
    <SettingItem
      title={t('settings.general.context_menu.title')}
      description={t('settings.general.context_menu.description')}
    >
      <Switch checked={context_menu_integration} onCheckedChange={handleChange} />
    </SettingItem>
  );
});