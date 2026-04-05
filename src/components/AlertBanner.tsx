'use client';

import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import type { AlertItem } from '@/types';

export function AlertBanner({ alerts }: { alerts: AlertItem[] }) {
  const dismissed = useAppStore((state) => state.dismissAlert);
  const setDismissed = useAppStore((state) => state.setDismissAlert);

  if (dismissed || alerts.length === 0) {
    return null;
  }

  const criticalCount = alerts.filter((alert) => alert.tone === 'danger').length;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-950 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">Urgency alerts</p>
              <Badge tone="warning">{criticalCount} urgent</Badge>
            </div>
            <p className="mt-0.5 text-sm text-amber-900/80 dark:text-amber-100/80">
              Stop-buy items and expiring inventory need attention before the next purchase run.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button variant="secondary" size="sm" asChild>
            <a href="/order">Review order list</a>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Dismiss alert banner" onClick={() => setDismissed(true)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="mt-2 text-xs text-amber-900/75 dark:text-amber-100/70">
        {alerts.slice(0, 2).map((alert) => alert.title).join(' • ')}
      </div>
    </div>
  );
}
