import * as React from 'react';
import { cn } from '@/lib/utils';

export function Badge({ className, tone = 'neutral', ...props }: React.HTMLAttributes<HTMLSpanElement> & { tone?: 'success' | 'warning' | 'danger' | 'neutral' }) {
  const tones = {
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300'
  } as const;

  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide', tones[tone], className)} {...props} />;
}
