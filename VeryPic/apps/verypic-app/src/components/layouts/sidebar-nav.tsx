import Logo from '@/assets/LOGO.png';
import { useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { Settings, FolderArchive, FolderSearch, Droplets, Maximize2, FileImage, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { useI18n } from '@/i18n';
import Link from '@/components/link';
import { isMac } from '@/utils';
export interface NavLink {
  title: string;
  href: string;
  icon?: React.ReactNode;
}

export interface NavigationSection {
  title: string;
  buttons: NavLink[];
}

export interface NavigationProps {
  primary: NavLink[];
  secondary?: NavLink[];
}

export default function SidebarNav() {
  const t = useI18n();
  const location = useLocation();

  const navigation: NavigationProps = {
    primary: [
      {
        icon: <FolderArchive className='size-4' />,
        title: t('nav.compression'),
        href: '/compression/classic',
      },
      {
        icon: <FolderSearch className='size-4' />,
        title: t('nav.watch'),
        href: '/compression/watch',
      },
      {
        icon: <Droplets className='size-4' />,
        title: t('nav.watermark'),
        href: '/watermark',
      },
      {
        icon: <Maximize2 className='size-4' />,
        title: t('nav.resize'),
        href: '/resize',
      },
      {
        icon: <FileImage className='size-4' />,
        title: t('nav.convert'),
        href: '/convert',
      },
      {
        icon: <GitBranch className='size-4' />,
        title: t('nav.workflow' as any),
        href: '/workflow',
      },
    ],
    secondary: [],
  };

  return (
    <TooltipProvider delayDuration={500}>
      <div
        className='flex h-screen w-[180px] flex-shrink-0 select-none flex-col justify-between bg-neutral-50 px-4 pb-4 dark:bg-neutral-800'
        style={{ backgroundColor: 'rgb(243, 243, 243)' }}
        data-tauri-drag-region={isMac}
      >
        <div className='flex flex-col items-stretch'>
          <div className={cn('flex h-[48px] flex-shrink-0 items-center', isMac && 'pl-[57px]')}>
            <img
              className='h-[30px] w-[342px] bg-transparent object-contain object-left mt-[8px]'
              aria-hidden='true'
              src={Logo}
              alt=''
            />
          </div>
          <div className='flex flex-col items-stretch gap-1 pt-3'>
            {navigation?.primary?.map((item) => <NavItem item={item} key={item.href} />)}
          </div>
        </div>
        <div className='flex flex-col items-stretch gap-1'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to='/settings' title={t('nav.settings')} viewTransition>
                <Button
                  variant={location.pathname.startsWith('/settings') ? 'secondary' : 'ghost'}
                  className={cn(
                    'h-[50px] w-full justify-start gap-2 px-3 shadow-none',
                    location.pathname.startsWith('/settings')
                      ? 'hover:opacity-90'
                      : 'hover:bg-[rgba(252,252,252,0.5)]',
                  )}
                  style={
                    location.pathname.startsWith('/settings')
                      ? { backgroundColor: 'rgb(252, 252, 252)', boxShadow: 'none', color: '#222222' }
                      : { color: '#666666' }
                  }
                >
                  <Settings className='size-4 shrink-0' />
                  <span className='truncate'>{t('nav.settings')}</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side='right'>{t('nav.settings')}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

const NavItem = function NavItem({
  item,
  className,
  ...props
}: {
  item: NavLink;
  className?: string;
  onClick?: () => void;
}) {
  const location = useLocation();
  const isActive = location.pathname.startsWith(item.href);
  return (
    <Link to={item.href} viewTransition {...props}>
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        className={cn(
          'h-[50px] w-full justify-start gap-2 rounded-xl px-3 text-sm shadow-none',
          !isActive && 'hover:bg-[rgba(252,252,252,0.5)]',
          className,
        )}
        style={
          isActive
            ? { backgroundColor: 'rgb(252, 252, 252)', boxShadow: 'none', color: '#222222' }
            : { color: '#666666' }
        }
      >
        {item.icon}
        <span className='truncate'>{item.title}</span>
      </Button>
    </Link>
  );
};
