import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-10 w-full rounded-2xl border border-border bg-white px-3 py-2 text-sm text-text shadow-sm transition-colors placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-slate-950',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
