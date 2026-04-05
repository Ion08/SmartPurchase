'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, LayoutDashboard, LineChart, PackageSearch, Settings, UploadCloud } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { useI18n } from '@/lib/i18n';

const navigation = [
  { href: '/dashboard', labelKey: 'app.dashboard', icon: LayoutDashboard },
  { href: '/import', labelKey: 'app.import', icon: UploadCloud },
  { href: '/forecast', labelKey: 'app.forecast', icon: LineChart },
  { href: '/order', labelKey: 'app.order', icon: PackageSearch },
  { href: '/analytics', labelKey: 'app.analytics', icon: BarChart3 },
  { href: '/settings', labelKey: 'app.settings', icon: Settings }
] as const;

export function Sidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const locationName = useAppStore((state) => state.profile.locationName);

  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', collapsed ? '5rem' : '18rem');
  }, [collapsed]);

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-white/95 dark:bg-slate-950/95 lg:flex lg:flex-col',
          collapsed ? 'w-20' : 'w-72'
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <Link href="/dashboard" className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest-700 text-sm font-semibold text-white shadow-soft">
              P
            </div>
            {!collapsed ? (
              <div>
                <p className="text-sm font-semibold text-text">Plateful</p>
                <p className="text-xs text-text-muted">{locationName}</p>
              </div>
            ) : null}
          </Link>
          <Button variant="ghost" size="icon" aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')} onClick={() => setCollapsed((value) => !value)}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-1.5 p-3">
          {navigation.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-forest-700 text-white'
                    : 'text-text-muted hover:bg-forest-50 hover:text-forest-800 dark:hover:bg-white/5',
                  collapsed && 'justify-center px-0'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed ? <span>{t(item.labelKey)}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className={cn('rounded-xl border border-border bg-surface-muted p-3 text-text dark:text-forest-100', collapsed && 'p-2 text-center')}>
            {!collapsed ? (
              <>
                <p className="text-sm font-semibold">{t('sidebar.getStarted')}</p>
                <p className="mt-1 text-xs text-text-muted">{t('sidebar.getStartedDesc')}</p>
                <Button className="mt-2 w-full" size="sm" variant="secondary" asChild>
                  <Link href="/import">{t('sidebar.importCsv')}</Link>
                </Button>
              </>
            ) : (
              <UploadCloud className="mx-auto h-5 w-5" />
            )}
          </div>
        </div>
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 px-2 py-2 backdrop-blur-xl dark:bg-slate-950/95 lg:hidden">
        <div className="grid grid-cols-6 gap-1">
          {navigation.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={t(item.labelKey)}
                className={cn(
                  'flex items-center justify-center rounded-2xl px-1 py-2 transition-colors',
                  active ? 'bg-forest-700 text-white' : 'text-text-muted hover:bg-forest-50 dark:hover:bg-white/5'
                )}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
