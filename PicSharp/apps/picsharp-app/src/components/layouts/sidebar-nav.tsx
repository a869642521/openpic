import Logo from '@/assets/logo.png';
import { useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { Settings, FolderArchive, FolderSearch } from 'lucide-react';
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
    ],
    secondary: [],
  };

  return (
    <TooltipProvider delayDuration={500}>
      <div
        className={cn(
          'flex h-screen w-[180px] flex-shrink-0 select-none flex-col justify-between bg-neutral-50 px-4 pb-4 dark:bg-neutral-800',
          isMac ? 'pt-8' : 'pt-4',
        )}
        style={{ backgroundColor: 'rgb(236, 237, 238)' }}
        data-tauri-drag-region={isMac}
      >
        <div className='flex flex-col items-stretch gap-1'>
          <img
            className='h-10 w-10 cursor-pointer bg-transparent duration-700 [transform-style:preserve-3d] hover:[transform:rotateY(-180deg)]'
            aria-hidden='true'
            src={Logo}
          />
          {navigation?.primary?.map((item) => <NavItem item={item} key={item.href} />)}
        </div>
        <div className='flex flex-col items-stretch gap-1'>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link to='/settings' title={t('nav.settings')} viewTransition>
                <Button
                  variant={location.pathname.startsWith('/settings') ? 'secondary' : 'ghost'}
                  className={cn(
                    'h-[60px] w-full justify-start gap-2 px-3 text-foreground shadow-none',
                    location.pathname.startsWith('/settings')
                      ? 'hover:opacity-90'
                      : 'hover:bg-[rgba(252,252,252,0.5)]',
                  )}
                  style={
                    location.pathname.startsWith('/settings')
                      ? { backgroundColor: 'rgb(252, 252, 252)', boxShadow: 'none' }
                      : undefined
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
          'h-[60px] w-full justify-start gap-2 rounded-xl px-3 text-sm text-foreground shadow-none',
          !isActive && 'hover:bg-[rgba(252,252,252,0.5)]',
          className,
        )}
        style={isActive ? { backgroundColor: 'rgb(252, 252, 252)', boxShadow: 'none' } : undefined}
      >
        {item.icon}
        <span className='truncate'>{item.title}</span>
      </Button>
    </Link>
  );
};
