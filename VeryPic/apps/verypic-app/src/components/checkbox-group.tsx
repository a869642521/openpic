import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxGroupOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

interface CheckboxGroupProps {
  options: CheckboxGroupOption[];
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  name?: string;
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
}

export function CheckboxGroup({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  name,
  disabled = false,
  className,
  itemClassName,
}: CheckboxGroupProps) {
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue || []);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleToggle = (optionValue: string) => {
    const isChecked = currentValue.includes(optionValue);
    const newValue = isChecked
      ? currentValue.filter((v) => v !== optionValue)
      : [...currentValue, optionValue];

    if (!isControlled) {
      setInternalValue(newValue);
    }
    onChange?.(newValue);
  };

  return (
    <div role='group' className={cn('flex gap-2 w-full', className)}>
      {options.map((option) => {
        const isChecked = currentValue.includes(option.value);
        const isDisabled = disabled || option.disabled;
        const id = name ? `${name}-${option.value}` : option.value;

        return (
          <button
            key={option.value}
            type='button'
            id={id}
            name={name ? `${name}[]` : undefined}
            value={option.value}
            disabled={isDisabled}
            onClick={() => handleToggle(option.value)}
            aria-pressed={isChecked}
            aria-labelledby={`${id}-label`}
            className={cn(
              'flex-1 min-w-0 flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border cursor-pointer',
              isChecked
                ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                : 'border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-500',
              isDisabled && 'cursor-not-allowed opacity-50',
              itemClassName,
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0',
                isChecked ? 'bg-blue-600 dark:bg-blue-400' : 'bg-neutral-300 dark:bg-neutral-600',
              )}
              aria-hidden
            />
            <span id={`${id}-label`} className='truncate'>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
