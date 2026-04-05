'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-cream text-text dark:bg-[#0D1612]">
      <Sidebar />
      <div className="lg:pl-[var(--sidebar-width)]">
        <TopBar />
        <main className="px-4 pb-24 pt-3 sm:px-5 lg:px-6 lg:pb-8">{children}</main>
      </div>
    </div>
  );
}
