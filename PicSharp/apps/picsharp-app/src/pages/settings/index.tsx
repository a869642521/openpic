import { Outlet } from 'react-router';
import { Separator } from '@/components/ui/separator';
import { SidebarNav } from './sidebar-nav';
import { Settings2, Panda, Info, MousePointerClick } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/button';
import useSettingsStore from '@/store/settings';
import useSelector from '@/hooks/useSelector';
import { sleep } from '@/utils';
import { showAlertDialog } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AppContext } from '@/routes';
import { useContext } from 'react';
import WindowControl from '@/components/window-control';
import { isMac } from '@/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useReport } from '@/hooks/useReport';
import { revealItemInDir } from '@tauri-apps/plugin-opener';

let clickCount = 0;

export default function SettingsLayout() {
  const t = useI18n();
  const { reset, init } = useSettingsStore(useSelector(['reset', 'init']));
  const { messageApi } = useContext(AppContext);
  const r = useReport();
  const sidebarNavItems = [
    {
      title: t('settings.general.title'),
      href: '/settings/general',
      icon: <Settings2 />,
    },
    {
      title: t('settings.context_menu.nav_title'),
      href: '/settings/context-menu',
      icon: <MousePointerClick />,
    },
    {
      title: t('settings.tinypng.title'),
      href: '/settings/tinypng',
      icon: <Panda />,
    },
    {
      title: t('settings.about.title'),
      href: '/settings/about',
      icon: <Info />,
    },
  ];

  const handleReload = async () => {
    r('settings_reload_click');
    await init(true);
    messageApi?.success(t('tips.settings_reload_success'));
  };

  const handleReset = () => {
    r('settings_reset_click');
    showAlertDialog({
      title: t('settings.reset_all_confirm'),
      cancelText: t('cancel'),
      okText: t('confirm'),
      onConfirm: async () => {
        await sleep(1000);
        await reset();
        messageApi?.success(t('tips.settings_reset_success'));
        r('settings_reset_success');
      },
    });
  };

  const handleOpenSettingDir = () => {
    clickCount++;
    if (clickCount === 5) {
      revealItemInDir(useSettingsStore.getState().appDataDirPath);
      clickCount = 0;
    }
  };

  return (
    <div
      className='settings-page flex h-full flex-col'
      style={{ backgroundColor: 'rgb(245, 246, 247)' }}
    >
      <div
        className={'flex h-[48px] items-center justify-end gap-1 px-2'}
        data-tauri-drag-region='true'
        onClick={handleOpenSettingDir}
      >
        <WindowControl showControls={!isMac} showFullscreen={false} showAlwaysOnTop={false} />
      </div>
      <div className='flex flex-1 flex-col gap-3 overflow-auto lg:flex-row'>
        <aside className='shrink-0 lg:w-52' style={{ padding: '0 20px' }}>
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <ScrollArea className='min-w-0 flex-1'>
          <div className='px-5 pb-8 pt-1'>
            <Outlet />
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
