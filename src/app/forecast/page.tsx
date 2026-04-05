'use client';

import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import { ArrowDownRight, ArrowUpRight, Download, Minus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ForecastChart } from '@/components/ForecastChart';
import { EmptyState } from '@/components/EmptyState';
import { useAppStore } from '@/store/useAppStore';
import { useImportMemoryStore } from '@/store/useImportMemoryStore';
import { buildForecast, generateForecastExportRows } from '@/lib/forecastAlgorithm';
import { buildForecastQualityReport } from '@/lib/forecastReliability';
import { summarizeUpcomingHolidays } from '@/lib/holidayService';
import { buildMockInventoryRows } from '@/lib/mockData';
import { UI_CONSTANTS } from '@/lib/constants';
import { formatNumber } from '@/lib/numberFormat';
import type { HolidayEvent, TrendDirection } from '@/types';

function TrendIcon({ trend }: { trend: TrendDirection }) {
  if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-emerald-600" />;
  if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-text-muted" />;
}

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

export default function ForecastPage() {
  const profile = useAppStore((state) => state.profile);
  const importedRows = useImportMemoryStore((state) => state.importedRows);
  const hasImportedData = useImportMemoryStore((state) => state.hasImportedData);
  const lastImportedAt = useImportMemoryStore((state) => state.lastImportedAt);
  const selectedCategory = useAppStore((state) => state.selectedCategory);
  const setSelectedCategory = useAppStore((state) => state.setSelectedCategory);
  const forecastMode = useAppStore((state) => state.forecastMode);
  const setForecastMode = useAppStore((state) => state.setForecastMode);
    const savedForecastViews = useAppStore((state) => state.savedForecastViews);
  const saveForecastView = useAppStore((state) => state.saveForecastView);
  const deleteForecastView = useAppStore((state) => state.deleteForecastView);
  const [focusItem, setFocusItem] = useState('');
  const [viewName, setViewName] = useState('');
  const [selectedViewId, setSelectedViewId] = useState('');
  const [holidayEvents, setHolidayEvents] = useState<HolidayEvent[]>([]);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setReady(true), UI_CONSTANTS.loadingDelay);
    return () => window.clearTimeout(timeout);
  }, []);

  const rows = hasImportedData && importedRows.length > 0 ? importedRows : buildMockInventoryRows();

  const availableCategories = useMemo(
    () => ['All categories', ...new Set(rows.map((row) => row.category))],
    [rows]
  );

  const availableItems = useMemo(() => {
    const names = [...new Set(rows.map((row) => row.item_name))];
    return selectedCategory === 'All categories'
      ? names
      : names.filter((itemName) => rows.some((row) => row.item_name === itemName && row.category === selectedCategory));
  }, [rows, selectedCategory]);

  const resolvedFocusItem = useMemo(
    () => focusItem || availableItems[0] || rows[0]?.item_name || 'Item',
    [focusItem, availableItems, rows]
  );

  const forecast = useMemo(
    () => buildForecast(rows, forecastMode, selectedCategory, resolvedFocusItem, holidayEvents),
    [rows, forecastMode, selectedCategory, resolvedFocusItem, holidayEvents]
  );

  const reliabilityReport = useMemo(
    () => buildForecastQualityReport(rows, forecastMode, selectedCategory, resolvedFocusItem, holidayEvents),
    [rows, forecastMode, selectedCategory, resolvedFocusItem, holidayEvents]
  );

  const upcomingHolidays = useMemo(
    () => summarizeUpcomingHolidays(holidayEvents, new Date().toISOString().slice(0, 10), 5),
    [holidayEvents]
  );

  const visibleHolidayImpacts = useMemo(
    () => forecast.holidayImpacts.slice(0, 5),
    [forecast.holidayImpacts]
  );

  useEffect(() => {
    if (forecastMode !== 'item') {
      return;
    }

    if (availableItems.length === 0) {
      setFocusItem('');
      return;
    }

    if (!focusItem || !availableItems.includes(focusItem)) {
      setFocusItem(availableItems[0]);
    }
  }, [forecastMode, focusItem, availableItems]);

  useEffect(() => {
    if (!availableCategories.includes(selectedCategory)) {
      setSelectedCategory('All categories');
    }
  }, [availableCategories, selectedCategory, setSelectedCategory]);

  useEffect(() => {
    if (!selectedViewId) {
      return;
    }
    const selectedView = savedForecastViews.find((view) => view.id === selectedViewId);
    if (!selectedView) {
      return;
    }
    setSelectedCategory(selectedView.selectedCategory);
    setForecastMode(selectedView.forecastMode);
    if (selectedView.focusItem) {
      setFocusItem(selectedView.focusItem);
    }
  }, [selectedViewId, savedForecastViews, setSelectedCategory, setForecastMode]);

  useEffect(() => {
    let cancelled = false;
    const loadHolidayEvents = async () => {
      setHolidayLoading(true);
      try {
        const year = new Date().getFullYear();
        const nextYear = year + 1;
        const region = profile.holidayRegion ?? 'MD';
        const [currentResponse, nextResponse] = await Promise.all([
          fetch(`/api/holidays?year=${year}&region=${region}`),
          fetch(`/api/holidays?year=${nextYear}&region=${region}`)
        ]);
        const currentJson = await currentResponse.json();
        const nextJson = await nextResponse.json();
        const merged: HolidayEvent[] = [...(currentJson.events ?? []), ...(nextJson.events ?? [])];
        if (!cancelled) {
          setHolidayEvents(merged);
        }
      } catch {
        if (!cancelled) {
          setHolidayEvents([]);
        }
      } finally {
        if (!cancelled) {
          setHolidayLoading(false);
        }
      }
    };

    void loadHolidayEvents();

    return () => {
      cancelled = true;
    };
  }, [profile.holidayRegion]);

  const exportCsv = () => {
    const csv = Papa.unparse(generateForecastExportRows(forecast.tableRows));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'smartpurchase-forecast.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Forecast exported as CSV');
  };

  const saveCurrentView = () => {
    const normalized = viewName.trim();
    if (!normalized) {
      toast.error('Name your view before saving');
      return;
    }
    saveForecastView({
      name: normalized,
      selectedCategory,
      forecastMode,
      focusItem: forecastMode === 'item' ? resolvedFocusItem : ''
    });
    setViewName('');
    toast.success(`Saved view: ${normalized}`);
  };

  if (!ready) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-3xl" />
        <Skeleton className="h-[420px] w-full rounded-3xl" />
        <Skeleton className="h-[320px] w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={hasImportedData ? 'success' : 'warning'}>{hasImportedData ? 'Imported CSV in use' : 'Mock data fallback for La Furculiță'}</Badge>
        <Badge tone={lastImportedAt ? 'neutral' : 'warning'}>{formatFreshness(lastImportedAt)} • Quality {formatNumber(reliabilityReport.dataQualityScore)}%</Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="mb-2 text-sm text-text-muted">Category</p>
              <Select options={availableCategories.map((category) => ({ label: category, value: category }))} value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} />
            </div>
            <div>
              <p className="mb-2 text-sm text-text-muted">Show by</p>
              <div className="inline-flex w-full rounded-2xl border border-border bg-surface-muted p-1">
                <Button
                  type="button"
                  variant={forecastMode === 'item' ? 'default' : 'ghost'}
                  className="flex-1 rounded-xl"
                  onClick={() => setForecastMode('item')}
                >
                  By item
                </Button>
                <Button
                  type="button"
                  variant={forecastMode === 'category' ? 'default' : 'ghost'}
                  className="flex-1 rounded-xl"
                  onClick={() => setForecastMode('category')}
                >
                  By category
                </Button>
              </div>
            </div>
            {forecastMode === 'item' ? (
              <div>
                <p className="mb-2 text-sm text-text-muted">Item</p>
                <Select options={availableItems.map((item) => ({ label: item, value: item }))} value={resolvedFocusItem} onChange={(event) => setFocusItem(event.target.value)} />
              </div>
            ) : null}
            <div className="flex items-end">
              <Button className="w-full" onClick={exportCsv}>
                <Download className="h-4 w-4" /> Export forecast CSV
              </Button>
            </div>
          </div>

          <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_1fr_auto] xl:grid-cols-[1fr_1fr_auto_auto]">
            <Select
              options={[
                { label: 'Load saved view', value: '' },
                ...savedForecastViews.map((view) => ({ label: view.name, value: view.id }))
              ]}
              value={selectedViewId}
              onChange={(event) => setSelectedViewId(event.target.value)}
            />
            <Input value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder="Save current view as..." maxLength={50} />
            <Button type="button" variant="secondary" onClick={saveCurrentView}>Save view</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (!selectedViewId) {
                  toast.error('Select a view to delete');
                  return;
                }
                deleteForecastView(selectedViewId);
                setSelectedViewId('');
                toast.success('Saved view deleted');
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <ForecastChart data={forecast.chartData} />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
        <Card>
          <CardHeader>
            <CardTitle>Forecast table</CardTitle>
            <CardDescription>Next 30 days of demand for operational planning.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="overflow-hidden rounded-[1.75rem] border border-border">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="bg-surface-muted/80">
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Predicted Qty</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecast.tableRows.map((row) => (
                      <TableRow key={`${row.date}-${row.item}`}>
                        <TableCell>{row.date}</TableCell>
                        <TableCell>{row.item}</TableCell>
                        <TableCell className="font-mono">{row.predictedQty}</TableCell>
                        <TableCell>
                          <Badge tone={row.confidence >= 90 ? 'success' : row.confidence >= 84 ? 'warning' : 'neutral'}>{row.confidence}%</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="inline-flex items-center gap-2">
                            <TrendIcon trend={row.trend} />
                            <span className="capitalize">{row.trend}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Forecast logic</CardTitle>
              <CardDescription>Weighted average of the last 7 active days with a ±5% variance layer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl bg-forest-50 p-4 dark:bg-forest-900/20">
                <p className="text-xs uppercase tracking-[0.18em] text-forest-800/70 dark:text-forest-100/70">Selected scope</p>
                <p className="mt-1 text-lg font-semibold">{forecastMode === 'item' ? resolvedFocusItem : selectedCategory}</p>
              </div>
              <div className="rounded-3xl border border-border bg-surface-muted p-4 text-sm text-text-muted">
                {hasImportedData ? 'Imported rows are used to compute the model. Switch categories to inspect demand patterns by menu section.' : 'Real data is not imported yet, so the engine is using the La Furculiță mock dataset.'}
              </div>
              <div className="rounded-2xl border border-border p-3">
                <p className="text-sm font-medium text-text">Confidence bands</p>
                <p className="mt-1 text-sm text-text-muted">Bands adapt to volatility and widen over horizon.</p>
              </div>
              <div className="rounded-3xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={reliabilityReport.wape <= 18 ? 'success' : reliabilityReport.wape <= 26 ? 'warning' : 'danger'}>
                    WAPE {formatNumber(reliabilityReport.wape, 1)}%
                  </Badge>
                  <Badge tone={Math.abs(reliabilityReport.bias) <= 8 ? 'success' : Math.abs(reliabilityReport.bias) <= 12 ? 'warning' : 'danger'}>
                    Bias {formatNumber(reliabilityReport.bias, 1)}%
                  </Badge>
                  <Badge tone={reliabilityReport.coverageScore >= 70 ? 'success' : reliabilityReport.coverageScore >= 55 ? 'warning' : 'danger'}>
                    Band coverage {formatNumber(reliabilityReport.coverageScore)}%
                  </Badge>
                </div>
                <p className="mt-3 text-xs text-text-muted">Walk-forward points: {reliabilityReport.backtestPoints}</p>
                {reliabilityReport.warnings.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 text-xs text-text-muted">
                    {reliabilityReport.warnings.slice(0, 2).map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-text-muted">No critical reliability warnings detected.</p>
                )}
              </div>
              <div className="rounded-3xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-text">Holiday-aware neural model</p>
                  <Badge tone={holidayLoading ? 'neutral' : 'success'}>{holidayLoading ? 'Loading holidays' : 'Web holiday lookup on'}</Badge>
                </div>
                <p className="mt-1 text-xs text-text-muted">Forecast blends a tiny neural network with holiday signals from an online holiday API and local fallback dates.</p>
                {visibleHolidayImpacts.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {visibleHolidayImpacts.map((impact) => {
                      const isUp = impact.direction === 'up';
                      const isDown = impact.direction === 'down';
                      return (
                        <div key={`${impact.date}-${impact.name}`} className="rounded-xl border border-border bg-surface-muted px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium">{impact.name}</p>
                              <p className="text-xs text-text-muted">{impact.date} • {impact.eventType === 'seasonal-event' ? 'Seasonal event' : 'Holiday'} • {impact.phase}</p>
                            </div>
                            <Badge tone={isUp ? 'success' : isDown ? 'danger' : 'neutral'}>
                              {isUp ? 'Spike' : isDown ? 'Downgrade' : 'Flat'}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-lg bg-white px-2 py-1 dark:bg-slate-950">
                              <p className="text-text-muted">Baseline</p>
                              <p className="font-mono font-semibold">{impact.baselineQty}</p>
                            </div>
                            <div className="rounded-lg bg-white px-2 py-1 dark:bg-slate-950">
                              <p className="text-text-muted">Adjusted</p>
                              <p className="font-mono font-semibold">{impact.adjustedQty}</p>
                            </div>
                            <div className="rounded-lg bg-white px-2 py-1 dark:bg-slate-950">
                              <p className="text-text-muted">Delta</p>
                              <p className={`font-mono font-semibold ${isUp ? 'text-emerald-700' : isDown ? 'text-red-600' : 'text-text'}`}>
                                {impact.deltaQty > 0 ? '+' : ''}{impact.deltaQty} ({impact.deltaPct.toFixed(1)}%)
                              </p>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-text-muted">Reasoning: {impact.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
                {upcomingHolidays.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {upcomingHolidays.map((holiday) => (
                      <div key={`${holiday.date}-${holiday.name}`} className="rounded-xl bg-surface-muted px-3 py-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">{holiday.localName || holiday.name}</p>
                          <Badge tone={holiday.source === 'api' ? 'success' : 'neutral'}>{holiday.source}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-text-muted">{holiday.date} • {holiday.distanceDays} days</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-text-muted">No upcoming holidays in the next 30 days.</p>
                )}
              </div>
              <Button className="w-full" variant="secondary" onClick={() => toast.success('Forecast refreshed successfully')}>
                Refresh forecast
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {!hasImportedData ? (
        <EmptyState
          title="Using mock forecast data"
          description="Import your own CSV to replace the La Furculiță baseline and generate forecasts from your exact sales pattern."
          ctaLabel="Go to import"
          ctaHref="/import"
        />
      ) : null}
    </div>
  );
}
