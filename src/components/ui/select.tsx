import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ label: string; value: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, options, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-text shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-slate-950',
        className
      )}
      {...props}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
});
Select.displayName = 'Select';
