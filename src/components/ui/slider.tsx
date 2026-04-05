import * as React from 'react';
import { cn } from '@/lib/utils';

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  className
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number) => void;
  className?: string;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onValueChange(Number(event.target.value))}
      className={cn('h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-forest-700 dark:bg-slate-700', className)}
    />
  );
}
