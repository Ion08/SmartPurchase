'use client';

import { MoonStar, SunMedium, UserCircle2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { useI18n } from '@/lib/i18n';

export function TopBar() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const profile = useAppStore((state) => state.profile);
  const restaurantId = useAppStore((state) => state.restaurantId);

  // Generate initials from restaurant name
  const initials = useMemo(() => {
    if (!profile.name) return '??';
    const words = profile.name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }, [profile.name]);

  // Display name - use restaurant name or fallback
  const displayName = profile.name || 'Unknown Restaurant';

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-white/75 backdrop-blur-xl dark:bg-slate-950/75">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 lg:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{t('topbar.location')}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-text sm:text-lg">{profile.locationName}</h1>
            <Badge tone="neutral">{profile.plan}</Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="secondary"
            size="icon"
            aria-label={t('topbar.toggleTheme')}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {mounted && theme === 'dark' ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-elevated px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-700 text-sm font-semibold text-white">
              {initials}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-text">{displayName}</p>
            </div>
            <UserCircle2 className="h-4 w-4 text-text-muted sm:hidden" />
          </div>
        </div>
      </div>
    </header>
  );
}
