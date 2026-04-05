import * as React from 'react';
import { cn } from '@/lib/utils';

export function Switch({ checked, onCheckedChange, className }: { checked: boolean; onCheckedChange: (checked: boolean) => void; className?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-7 w-12 items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        checked ? 'bg-forest-700' : 'bg-slate-300 dark:bg-slate-700',
        className
      )}
    >
      <span
        className={cn(
          'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1'
        )}
      />
    </button>
  );
}
