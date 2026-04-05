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
import { buildMockInventoryRows, getDashboardMetrics, getTopRiskItems, getUrgencyAlerts } from '@/lib/mockData';
import { formatCurrency, formatNumber } from '@/lib/numberFormat';
import { UI_CONSTANTS } from '@/lib/constants';

function formatFreshness(lastImportedAt: string | null) {
  if (!lastImportedAt) return 'No import yet';
  const diffMinutes = Math.floor((Date.now() - new Date(lastImportedAt).getTime()) / 60000);
  if (diffMinutes < 1) return 'Updated just now';
  if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;
  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `Updated ${days}d ago`;
}

export default function DashboardPage() {
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
  const metrics = getDashboardMetrics();
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
        {!hasImportedData ? <Badge tone="warning">Using realistic mock data for La Furculiță</Badge> : <Badge tone="success">Live CSV data loaded</Badge>}
        <Badge tone={lastImportedAt ? 'neutral' : 'warning'}>{formatFreshness(lastImportedAt)}</Badge>
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
            <CardTitle>Sales trend - last 30 days</CardTitle>
            <CardDescription>Revenue pressure is trending up, especially on weekends.</CardDescription>
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
              <CardTitle>Urgency alerts</CardTitle>
              <CardDescription>Stop-buy and expiring items that need intervention now.</CardDescription>
            </div>
            <Badge tone="warning">{alerts.length} items</Badge>
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
              <Button size="sm" onClick={() => { toast.success('Quick action: inventory import opened'); router.push('/import'); }}>
                <Download className="h-4 w-4" /> Import CSV
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { toast.success('Forecast view opened'); router.push('/forecast'); }}>
                <LineChartIcon className="h-4 w-4" /> View Forecast
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Inventory vs consumption by category</CardTitle>
            <CardDescription>Produce and dairy are the tightest categories this week.</CardDescription>
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
                <CardTitle>Focus: produse vandute in urmatoarele 3 zile</CardTitle>
                <CardDescription>Prioritatea este ce se va vinde (ex: croasante), apoi materia prima necesara.</CardDescription>
              </div>
              <Badge tone="success">Sales-first</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {soldProductsPlan.map((day) => (
                <div key={day.date} className="rounded-2xl border border-border bg-surface-muted p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{day.dayLabel}</p>
                      <p className="text-xs text-text-muted">{day.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-muted">Total produse vandute (estimare)</p>
                      <p className="font-mono text-sm font-semibold">{formatNumber(day.totalPredictedQty, 1)} buc/kg</p>
                    </div>
                  </div>
                  {day.items.length === 0 ? (
                    <p className="mt-2 text-xs text-text-muted">Nu exista produse cu volum estimat semnificativ pentru aceasta zi.</p>
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
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-text-muted">Materie prima necesara (derivata din produsele vandute)</p>
                <div className="mt-2 space-y-2">
                  {ingredientNeeds.map((day) => (
                    <div key={`support-${day.date}`} className="rounded-xl bg-surface-muted px-3 py-2">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <p className="font-medium">{day.dayLabel}</p>
                        <p className="font-mono">buy {formatNumber(day.totalBuyQty, 1)} • {formatCurrency(day.totalCost)}</p>
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
                <CardTitle>Top 10 items with waste risk</CardTitle>
                <CardDescription>Prioritize actions for low days-of-cover and high burn velocity.</CardDescription>
              </div>
              <Badge tone="warning">{topRiskItems.length} tracked</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {topRiskItems.map((item) => (
                <div key={item.itemName} className="rounded-2xl border border-border bg-surface-muted p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium capitalize">{item.itemName}</p>
                    <Badge tone={item.riskScore >= 80 ? 'danger' : item.riskScore >= 60 ? 'warning' : 'neutral'}>Risk {item.riskScore}</Badge>
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
              <CardTitle>Operational summary</CardTitle>
              <CardDescription>What the kitchen team sees before the next order cycle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-forest-50 p-4 dark:bg-forest-900/20">
                  <p className="text-xs uppercase tracking-[0.18em] text-forest-800/70 dark:text-forest-100/70">Sales today</p>
                  <p className="mt-1 font-mono text-2xl font-semibold text-forest-900 dark:text-forest-100">{formatCurrency(salesTrend.at(-1)?.sales ?? 0)}</p>
                </div>
                <div className="rounded-2xl bg-surface-muted p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Active items</p>
                  <p className="mt-1 font-mono text-2xl font-semibold">{rows.length}</p>
                </div>
              </div>
              <div className="rounded-3xl border border-border bg-surface-muted p-4">
                <p className="text-sm font-medium">Smart actions</p>
                <p className="mt-1 text-sm text-text-muted">Import a fresh CSV and review forecast before placing the next order.</p>
              </div>
              <div className="rounded-3xl border border-border p-4">
                <p className="text-sm font-medium">Recent activity</p>
                {activityLog.length === 0 ? (
                  <p className="mt-1 text-sm text-text-muted">No activity yet.</p>
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
              title="No CSV imported yet"
              description="Upload sales and stock data to switch from mock intelligence to your real operational numbers."
              ctaLabel="Import CSV"
              ctaHref="/import"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
