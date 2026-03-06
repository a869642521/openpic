import { HTMLAttributes, PropsWithChildren, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export type SettingsSectionProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

const SettingsSection = forwardRef<HTMLDivElement, SettingsSectionProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <section
        className={cn('h-full space-y-[10px] overflow-auto', className)}
        ref={ref}
        {...props}
      >
        {children}
      </section>
    );
  },
);

export default SettingsSection;
