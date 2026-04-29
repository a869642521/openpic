import { PropsWithChildren, ReactNode } from 'react';
import { CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type SettingItemProps = PropsWithChildren<{
  id?: string;
  className?: string;
  icon?: ReactNode;
  title: ReactNode;
  titleClassName?: string;
  description?: ReactNode;
  descriptionClassName?: string;
}>;

function SettingItem({
  id,
  icon,
  title,
  description,
  children,
  className,
  titleClassName,
  descriptionClassName,
}: SettingItemProps) {
  return (
    <CardHeader
      id={id}
      className={cn('flex flex-row items-center justify-between gap-x-8 py-4', className)}
    >
      <div className='grid min-w-0 flex-1 gap-1'>
        <div className='flex items-center gap-2'>
          {icon && (
            <span className='flex h-[14px] w-[14px] shrink-0 items-center justify-center [&>svg]:h-[14px] [&>svg]:w-[14px]'>
              {icon}
            </span>
          )}
          <span className={cn('text-sm font-semibold text-neutral-800 dark:text-neutral-200', titleClassName)}>
            {title}
          </span>
        </div>
        {description && (
          <p
            className={cn(
              'text-xs leading-relaxed text-neutral-500 dark:text-neutral-400',
              icon && 'pl-[22px]',
              descriptionClassName,
            )}
          >
            {description}
          </p>
        )}
      </div>
      <div className='flex shrink-0 items-center justify-end'>
        <div className='flex min-w-[160px] justify-end'>{children}</div>
      </div>
    </CardHeader>
  );
}

export default SettingItem;
