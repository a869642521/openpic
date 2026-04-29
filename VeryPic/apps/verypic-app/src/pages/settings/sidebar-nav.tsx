import { useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from '@/components/link';
interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string;
    title: string;
    icon?: React.ReactNode;
  }[];
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const location = useLocation();
  const isActive = (item: { href: string }) => location.pathname.startsWith(item.href);

  return (
    <nav
      className={cn('flex gap-1.5 space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1', className)}
      {...props}
    >
      {items.map((item) => (
        <Link key={item.href} to={item.href} viewTransition>
          <Button
            variant={isActive(item) ? 'secondary' : 'ghost'}
            size='sm'
            className={cn(
              'h-12 w-full justify-start gap-2.5 px-3 text-sm',
              !isActive(item) && 'dark:hover:bg-neutral-800',
              className,
            )}
            style={isActive(item) ? { backgroundColor: 'rgb(252, 252, 252)' } : undefined}
          >
            {item.icon}
            {item.title}
          </Button>
        </Link>
      ))}
    </nav>
  );
}
