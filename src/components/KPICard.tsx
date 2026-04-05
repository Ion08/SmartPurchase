'use client';

import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function AnimatedNumber({ value }: { value: string }) {
  const numericValue = Number(value.replace(/[^0-9.-]/g, ''));
  const suffix = value.replace(/[0-9.,-]/g, '').trim();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(numericValue)) return;
    const duration = 900;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCurrent(numericValue * (0.15 + progress * 0.85));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCurrent(numericValue);
      }
    };
    requestAnimationFrame(step);
  }, [numericValue]);

  if (!Number.isFinite(numericValue)) {
    return <span>{value}</span>;
  }

  return (
    <span className="font-mono text-3xl font-semibold tracking-tight">
      {Number.isInteger(numericValue) ? Math.round(current).toLocaleString('en-GB') : current.toFixed(1)}
      {suffix ? <span className="ml-1 text-base font-medium text-text-muted">{suffix}</span> : null}
    </span>
  );
}

export function KPICard({
  label,
  value,
  delta,
  tone,
  sparkline
}: {
  label: string;
  value: string;
  delta: string;
  tone: 'positive' | 'warning' | 'neutral';
  sparkline: Array<{ value: number }>;
}) {
  const toneClasses = {
    positive: 'text-emerald-700 dark:text-emerald-300',
    warning: 'text-amber-700 dark:text-amber-300',
    neutral: 'text-text-muted'
  } as const;

  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <Card className="overflow-hidden border-border/80 bg-white/95">
        <CardContent className="p-0">
        <div className="flex items-start justify-between gap-3 p-4">
          <div>
            <p className="text-sm text-text-muted">{label}</p>
            <div className="mt-1.5">
              <AnimatedNumber value={value} />
            </div>
            <div className={cn('mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold', toneClasses[tone], tone === 'positive' ? 'bg-emerald-50' : tone === 'warning' ? 'bg-amber-50' : 'bg-slate-100')}>
              {delta.startsWith('+') ? <ArrowUpRight className="h-3.5 w-3.5" /> : delta.startsWith('-') ? <ArrowDownRight className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
              <span>{delta}</span>
            </div>
          </div>
          <div className="h-12 w-24 rounded-xl bg-surface-muted p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkline}>
                <Tooltip content={() => null} />
                <Line type="monotone" dataKey="value" stroke="#1B4332" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
