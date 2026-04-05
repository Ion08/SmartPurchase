'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, LineChart as LineChartIcon, WandSparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AlertBanner } from '@/components/AlertBanner';
import { EmptyState } from '@/components/EmptyState';
import { KPICard } from '@/components/KPICard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/store/useAppStore';
import { useImportMemoryStore } from '@/store/useImportMemoryStore';
import { buildCategoryComparison, buildSalesTrend, buildSparkline, buildThreeDayIngredientNeedsFromSales, buildThreeDaySoldProductsPlan } from '@/lib/dashboardData';
import { buildMockInventoryRows, getTopRiskItems, getUrgencyAlerts } from '@/lib/mockData';
import { formatCurrency, formatNumber } from '@/lib/numberFormat';
import { UI_CONSTANTS } from '@/lib/constants';
import { useI18n } from '@/lib/i18n';

function formatFreshness(lastImportedAt: string | null, t: (key: string) => string) {
  if (!lastImportedAt) return t('common.noImportYet');
  const diffMinutes = Math.floor((Date.now() - new Date(lastImportedAt).getTime()) / 60000);
  if (diffMinutes < 1) return t('common.updatedJustNow');
  if (diffMinutes < 60) return t('common.updatedMinutesAgo').replace('{value}', String(diffMinutes));
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return t('common.updatedHoursAgo').replace('{value}', String(hours));
  const days = Math.floor(hours / 24);
  return t('common.updatedDaysAgo').replace('{value}', String(days));
}

export default function DashboardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const importedRows = useImportMemoryStore((state) => state.importedRows);
  const hasImportedData = useImportMemoryStore((state) => state.hasImportedData);
  const lastImportedAt = useImportMemoryStore((state) => state.lastImportedAt);
  const activityLog = useAppStore((state) => state.activityLog);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setReady(true), UI_CONSTANTS.loadingDelay);
    return () => window.clearTimeout(timeout);
  }, []);

  const rows = hasImportedData && importedRows.length > 0 ? importedRows : buildMockInventoryRows();
  const metrics = useMemo(
    () => [
      { label: t('kpi.wasteReduced'), value: '28 kg', delta: '-12%', tone: 'positive' as const },
      { label: t('kpi.grossMarginImprovement'), value: '1,840 €', delta: '+8.7%', tone: 'positive' as const },
      { label: t('kpi.forecastAccuracy'), value: '91%', delta: '+4 pts', tone: 'positive' as const },
      { label: t('kpi.activeStopBuy'), value: '3', delta: `- 2 ${t('kpi.urgent')}`, tone: 'warning' as const }
    ],
    [t]
  );
  const alerts = getUrgencyAlerts();
  const salesTrend = useMemo(() => buildSalesTrend(rows, 30), [rows]);
  const comparison = useMemo(() => buildCategoryComparison(rows), [rows]);
  const soldProductsPlan = useMemo(() => buildThreeDaySoldProductsPlan(rows), [rows]);
  const ingredientNeeds = useMemo(() => buildThreeDayIngredientNeedsFromSales(rows, soldProductsPlan), [rows, soldProductsPlan]);
  const topRiskItems = useMemo(() => getTopRiskItems(rows, 10), [rows]);
  const sparkline = buildSparkline(salesTrend.map((entry) => entry.sales));

  if (!ready) {
    return (
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-3xl" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Skeleton className="h-[460px] rounded-3xl" />
          <Skeleton className="h-[460px] rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AlertBanner alerts={alerts} />
      <div className="flex flex-wrap items-center gap-3">
        {!hasImportedData ? <Badge tone="warning">{t('dashboard.mockData')}</Badge> : <Badge tone="success">{t('dashboard.liveData')}</Badge>}
        <Badge tone={lastImportedAt ? 'neutral' : 'warning'}>{formatFreshness(lastImportedAt, t)}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <KPICard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            delta={metric.delta}
            tone={metric.tone}
            sparkline={Array.from({ length: 8 }).map((_, sparkIndex) => ({ value: sparkline[(sparkIndex + index) % sparkline.length] ?? 0 }))}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.salesTrend')}</CardTitle>
            <CardDescription>{t('dashboard.salesTrendDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrend} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.22)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} interval={4} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => formatNumber(value / 1000, 0) + 'k'} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="sales" stroke="#1B4332" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>{t('dashboard.urgency')}</CardTitle>
              <CardDescription>{t('dashboard.urgencyDesc')}</CardDescription>
            </div>
            <Badge tone="warning">{alerts.length} {t('dashboard.items')}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-border bg-surface-muted p-4 transition hover:-translate-y-0.5 hover:shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{alert.title}</p>
                  <Badge tone={alert.tone}>{alert.category}</Badge>
                </div>
                <p className="mt-1 text-sm text-text-muted">{alert.message}</p>
              </div>
            ))}
            <div className="flex flex-wrap gap-3 pt-1">
              <Button size="sm" onClick={() => { toast.success(t('dashboard.quickImportOpened')); router.push('/import'); }}>
                <Download className="h-4 w-4" /> {t('dashboard.importCsv')}
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { toast.success(t('dashboard.forecastOpened')); router.push('/forecast'); }}>
                <LineChartIcon className="h-4 w-4" /> {t('dashboard.viewForecast')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.inventoryVsConsumption')}</CardTitle>
            <CardDescription>{t('dashboard.inventoryVsConsumptionDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparison} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="rgba(148,163,184,0.22)" />
                  <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="inventory" fill="#1B4332" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="consumption" fill="#F59E0B" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>{t('dashboard.salesFocus')}</CardTitle>
                <CardDescription>{t('dashboard.salesFocusDesc')}</CardDescription>
              </div>
              <Badge tone="success">{t('dashboard.salesFirst')}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {soldProductsPlan.map((day) => (
                <div key={day.date} className="rounded-2xl border border-border bg-surface-muted p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{t(`day.${day.dayLabel}`)}</p>
                      <p className="text-xs text-text-muted">{day.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-muted">{t('dashboard.totalSoldEstimate')}</p>
                      <p className="font-mono text-sm font-semibold">{formatNumber(day.totalPredictedQty, 1)} buc/kg</p>
                    </div>
                  </div>
                  {day.items.length === 0 ? (
                    <p className="mt-2 text-xs text-text-muted">{t('dashboard.noSignificantVolume')}</p>
                  ) : (
                    <div className="mt-2 space-y-1.5">
                      {day.items.map((item) => (
                        <div key={`${day.date}-${item.itemName}`} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-xs dark:bg-slate-950">
                          <div>
                            <p className="font-medium capitalize">{item.itemName}</p>
                            <p className="text-[11px] text-text-muted">{item.category}</p>
                          </div>
                          <p className="font-mono">~{formatNumber(item.predictedQty, 1)} {item.unit}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="rounded-2xl border border-dashed border-border p-3">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-text-muted">{t('dashboard.ingredientsDerived')}</p>
                <div className="mt-2 space-y-2">
                  {ingredientNeeds.map((day) => (
                    <div key={`support-${day.date}`} className="rounded-xl bg-surface-muted px-3 py-2">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <p className="font-medium">{t(`day.${day.dayLabel}`)}</p>
                        <p className="font-mono">{t('dashboard.buy')} {formatNumber(day.totalBuyQty, 1)} • {formatCurrency(day.totalCost)}</p>
                      </div>
                      {day.items.length > 0 ? (
                        <p className="mt-1 text-[11px] text-text-muted">
                          {day.items.slice(0, 3).map((item) => `${item.ingredient} ${formatNumber(item.buyQty, 1)} ${item.unit}`).join(' • ')}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>{t('dashboard.topRisk')}</CardTitle>
                <CardDescription>{t('dashboard.topRiskDesc')}</CardDescription>
              </div>
              <Badge tone="warning">{topRiskItems.length} {t('dashboard.tracked')}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {topRiskItems.map((item) => (
                <div key={item.itemName} className="rounded-2xl border border-border bg-surface-muted p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium capitalize">{item.itemName}</p>
                    <Badge tone={item.riskScore >= 80 ? 'danger' : item.riskScore >= 60 ? 'warning' : 'neutral'}>{t('dashboard.risk')} {item.riskScore}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {item.category} • stock {item.stock} • burn/day {item.dailyBurn} • cover {item.daysOfCover} days
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.operationalSummary')}</CardTitle>
              <CardDescription>{t('dashboard.operationalSummaryDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-forest-50 p-4 dark:bg-forest-900/20">
                  <p className="text-xs uppercase tracking-[0.18em] text-forest-800/70 dark:text-forest-100/70">{t('dashboard.salesToday')}</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-forest-900 dark:text-forest-100">{formatCurrency(salesTrend.at(-1)?.sales ?? 0)}</p>
                </div>
                <div className="rounded-2xl bg-surface-muted p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">{t('dashboard.activeItems')}</p>
                  <p className="mt-1 font-mono text-2xl font-semibold">{rows.length}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-border bg-surface-muted p-4">
                <p className="text-sm font-medium">{t('dashboard.smartActions')}</p>
                <p className="mt-1 text-sm text-text-muted">{t('dashboard.smartActionsDesc')}</p>
              </div>
              <div className="rounded-3xl border border-border p-4">
                <p className="text-sm font-medium">{t('dashboard.recentActivity')}</p>
                {activityLog.length === 0 ? (
                  <p className="mt-1 text-sm text-text-muted">{t('dashboard.noActivity')}</p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {activityLog.slice(0, 4).map((event) => (
                      <div key={event.id} className="rounded-xl bg-surface-muted px-3 py-2">
                        <p className="text-xs font-medium text-text">{event.title}</p>
                        <p className="text-xs text-text-muted">{event.details}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {!hasImportedData ? (
            <EmptyState
              title={t('dashboard.noCsv')}
              description={t('dashboard.noCsvDesc')}
              ctaLabel={t('dashboard.importCsv')}
              ctaHref="/import"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
