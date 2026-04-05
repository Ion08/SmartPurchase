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
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/db';
import type { HolidayEvent, TrendDirection } from '@/types';

const SHIFT_LABELS = ['Morning', 'Noon', 'Afternoon'] as const;

type ShiftLabel = (typeof SHIFT_LABELS)[number];
type ShiftConfidence = 'High' | 'Medium' | 'Low';

type ShiftHistoryPoint = {
  quantitySold: number;
  totalTransactions: number;
};

type ShiftEstimate =
  | {
    status: 'insufficient_data';
    missingCount: number;
    count: number;
  }
  | {
    status: 'ready';
    prediction: number;
    cv: number;
    confidence: ShiftConfidence;
    avgTransactions: number;
  };

type ShiftEstimatesByLabel = Record<ShiftLabel, ShiftEstimate>;

type DatabaseItemOption = {
  id: string;
  label: string;
};

const EMPTY_SHIFT_ESTIMATE: ShiftEstimate = {
  status: 'insufficient_data',
  missingCount: 7,
  count: 0
};

const INITIAL_SHIFT_ESTIMATES: ShiftEstimatesByLabel = {
  Morning: EMPTY_SHIFT_ESTIMATE,
  Noon: EMPTY_SHIFT_ESTIMATE,
  Afternoon: EMPTY_SHIFT_ESTIMATE
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[], mean: number) {
  if (values.length === 0) return 0;
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  return Math.sqrt(variance);
}

function confidenceFromCv(cv: number): ShiftConfidence {
  if (cv < 0.15) return 'High';
  if (cv <= 0.30) return 'Medium';
  return 'Low';
}

function estimateFromShiftHistory(points: ShiftHistoryPoint[]): ShiftEstimate {
  if (points.length < 7) {
    return {
      status: 'insufficient_data',
      missingCount: 7 - points.length,
      count: points.length
    };
  }

  const orderedPoints = points.slice().reverse();
  const weightedNumerator = orderedPoints.reduce((sum, point, index) => sum + (point.quantitySold * (index + 1)), 0);
  const prediction = Math.round(weightedNumerator / 28);
  const quantities = orderedPoints.map((point) => point.quantitySold);
  const quantitiesMean = average(quantities);
  const sigma = standardDeviation(quantities, quantitiesMean);
  const cv = quantitiesMean > 0 ? sigma / quantitiesMean : 1;
  const avgTransactions = Math.round(average(orderedPoints.map((point) => point.totalTransactions)));

  return {
    status: 'ready',
    prediction,
    cv,
    confidence: confidenceFromCv(cv),
    avgTransactions
  };
}

function badgeToneFromConfidence(confidence: ShiftConfidence): 'success' | 'warning' | 'danger' {
  if (confidence === 'High') return 'success';
  if (confidence === 'Medium') return 'warning';
  return 'danger';
}

function TrendIcon({ trend }: { trend: TrendDirection }) {
  if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-emerald-600" />;
  if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-text-muted" />;
}

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

export default function ForecastPage() {
  const { t } = useI18n();
  const profile = useAppStore((state) => state.profile);
  const restaurantId = useAppStore((state) => state.restaurantId);
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
  const [dbItemsLoading, setDbItemsLoading] = useState(false);
  const [dbItemOptions, setDbItemOptions] = useState<DatabaseItemOption[]>([]);
  const [selectedDbItemId, setSelectedDbItemId] = useState('');
  const [shiftEstimatesLoading, setShiftEstimatesLoading] = useState(false);
  const [shiftEstimatesError, setShiftEstimatesError] = useState<string | null>(null);
  const [shiftEstimates, setShiftEstimates] = useState<ShiftEstimatesByLabel>(INITIAL_SHIFT_ESTIMATES);
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

  useEffect(() => {
    let cancelled = false;

    const loadDbItems = async () => {
      if (!restaurantId) {
        setDbItemOptions([]);
        setSelectedDbItemId('');
        return;
      }

      setDbItemsLoading(true);
      try {
        const response = await fetch(`/api/items?restaurantId=${restaurantId}`);
        const items = await response.json();
        if (!response.ok) {
          throw new Error('Unable to load items from database.');
        }

        const options: DatabaseItemOption[] = (items ?? [])
          .filter((item: { id?: string; itemName?: string }) => item.id && item.itemName)
          .map((item: { id: string; itemName: string }) => ({
            id: item.id,
            label: item.itemName
          }));

        if (!cancelled) {
          setDbItemOptions(options);
          setSelectedDbItemId((current) => {
            if (options.length === 0) return '';
            if (options.some((option) => option.id === current)) return current;
            return options[0].id;
          });
        }
      } catch {
        if (!cancelled) {
          setDbItemOptions([]);
          setSelectedDbItemId('');
        }
      } finally {
        if (!cancelled) {
          setDbItemsLoading(false);
        }
      }
    };

    void loadDbItems();

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  useEffect(() => {
    let cancelled = false;

    const loadShiftEstimates = async () => {
      if (!selectedDbItemId) {
        setShiftEstimates(INITIAL_SHIFT_ESTIMATES);
        setShiftEstimatesError(null);
        return;
      }

      setShiftEstimatesLoading(true);
      setShiftEstimatesError(null);

      try {
        const shiftResults = await Promise.all(
          SHIFT_LABELS.map(async (shiftLabel) => {
            const { data, error } = await supabase
              .from('shift_item_sales')
              .select(`
                quantity_sold,
                shift_summaries!inner (
                  date,
                  time_block,
                  total_transactions
                )
              `)
              .eq('item_id', selectedDbItemId)
              .eq('shift_summaries.time_block', shiftLabel)
              .order('date', { ascending: false, referencedTable: 'shift_summaries' })
              .limit(7);

            if (error) {
              throw new Error(error.message);
            }

            const historyPoints: ShiftHistoryPoint[] = (data ?? []).map((row) => {
              const summary = Array.isArray(row.shift_summaries) ? row.shift_summaries[0] : row.shift_summaries;
              return {
                quantitySold: Number(row.quantity_sold ?? 0),
                totalTransactions: Number(summary?.total_transactions ?? 0)
              };
            });

            return [shiftLabel, estimateFromShiftHistory(historyPoints)] as const;
          })
        );

        if (!cancelled) {
          const nextEstimates = shiftResults.reduce<ShiftEstimatesByLabel>(
            (acc, [shiftLabel, estimate]) => ({
              ...acc,
              [shiftLabel]: estimate
            }),
            INITIAL_SHIFT_ESTIMATES
          );
          setShiftEstimates(nextEstimates);
        }
      } catch {
        if (!cancelled) {
          setShiftEstimatesError('Unable to load shift estimates right now.');
          setShiftEstimates(INITIAL_SHIFT_ESTIMATES);
        }
      } finally {
        if (!cancelled) {
          setShiftEstimatesLoading(false);
        }
      }
    };

    void loadShiftEstimates();

    return () => {
      cancelled = true;
    };
  }, [selectedDbItemId]);

  const exportCsv = () => {
    const csv = Papa.unparse(generateForecastExportRows(forecast.tableRows));
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'smartpurchase-forecast.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success(t('forecast.exportedCsv'));
  };

  const saveCurrentView = () => {
    const normalized = viewName.trim();
    if (!normalized) {
      toast.error(t('forecast.nameViewBeforeSave'));
      return;
    }
    saveForecastView({
      name: normalized,
      selectedCategory,
      forecastMode,
      focusItem: forecastMode === 'item' ? resolvedFocusItem : ''
    });
    setViewName('');
    toast.success(`${t('forecast.savedView')}: ${normalized}`);
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
        <Badge tone={hasImportedData ? 'success' : 'warning'}>{hasImportedData ? t('forecast.importedCsv') : t('forecast.mockFallback')}</Badge>
        <Badge tone={lastImportedAt ? 'neutral' : 'warning'}>{formatFreshness(lastImportedAt, t)} • {t('forecast.quality')} {formatNumber(reliabilityReport.dataQualityScore)}%</Badge>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="mb-2 text-sm text-text-muted">{t('forecast.category')}</p>
              <Select options={availableCategories.map((category) => ({ label: category, value: category }))} value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} />
            </div>
            <div>
              <p className="mb-2 text-sm text-text-muted">{t('forecast.showBy')}</p>
              <div className="inline-flex w-full rounded-2xl border border-border bg-surface-muted p-1">
                <Button
                  type="button"
                  variant={forecastMode === 'item' ? 'default' : 'ghost'}
                  className="flex-1 rounded-xl"
                  onClick={() => setForecastMode('item')}
                >
                  {t('forecast.byItem')}
                </Button>
                <Button
                  type="button"
                  variant={forecastMode === 'category' ? 'default' : 'ghost'}
                  className="flex-1 rounded-xl"
                  onClick={() => setForecastMode('category')}
                >
                  {t('forecast.byCategory')}
                </Button>
              </div>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={exportCsv}>
                <Download className="h-4 w-4" /> {t('forecast.exportCsv')}
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-text">Shift WMA Estimates (7 reports)</p>
              {shiftEstimatesLoading ? <Badge tone="neutral">Calculating...</Badge> : null}
            </div>
            <div className="mt-3">
              <p className="mb-2 text-xs uppercase tracking-[0.12em] text-text-muted">Database Product</p>
              <Select
                options={dbItemOptions.map((item) => ({ label: item.label, value: item.id }))}
                value={selectedDbItemId}
                onChange={(event) => setSelectedDbItemId(event.target.value)}
                disabled={dbItemsLoading || dbItemOptions.length === 0}
              />
            </div>
            {shiftEstimatesError ? <p className="mt-3 text-xs text-red-600">{shiftEstimatesError}</p> : null}
            {!restaurantId ? <p className="mt-3 text-xs text-text-muted">Set a restaurant first to load product options.</p> : null}
            {restaurantId && !dbItemsLoading && dbItemOptions.length === 0 ? (
              <p className="mt-3 text-xs text-text-muted">No database products available for this restaurant.</p>
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {SHIFT_LABELS.map((shiftLabel) => {
                const estimate = shiftEstimates[shiftLabel];
                return (
                  <div key={shiftLabel} className="rounded-2xl border border-border bg-surface-muted p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{shiftLabel}</p>
                      {estimate.status === 'ready' ? (
                        <Badge tone={badgeToneFromConfidence(estimate.confidence)}>{estimate.confidence}</Badge>
                      ) : (
                        <Badge tone="neutral">Insufficient Data</Badge>
                      )}
                    </div>
                    {estimate.status === 'ready' ? (
                      <>
                        <p className="mt-2 text-sm font-medium">Estimate: <span className="font-mono">{estimate.prediction}</span> units</p>
                        <p className="mt-1 text-xs text-text-muted">Based on avg. {estimate.avgTransactions} transactions</p>
                      </>
                    ) : (
                      <p className="mt-2 text-xs text-text-muted">Need {estimate.missingCount} more reports for this shift.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 border-t border-border pt-4 sm:grid-cols-[1fr_1fr_auto] xl:grid-cols-[1fr_1fr_auto_auto]">
            <Select
              options={[
                { label: t('forecast.loadSavedView'), value: '' },
                ...savedForecastViews.map((view) => ({ label: view.name, value: view.id }))
              ]}
              value={selectedViewId}
              onChange={(event) => setSelectedViewId(event.target.value)}
            />
            <Input value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder={t('forecast.saveAs')} maxLength={50} />
            <Button type="button" variant="secondary" onClick={saveCurrentView}>{t('forecast.saveView')}</Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                if (!selectedViewId) {
                  toast.error(t('forecast.selectViewDelete'));
                  return;
                }
                deleteForecastView(selectedViewId);
                setSelectedViewId('');
                toast.success(t('forecast.savedViewDeleted'));
              }}
            >
              <Trash2 className="h-4 w-4" /> {t('forecast.delete')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ForecastChart data={forecast.chartData} />

      <div className="grid gap-6 xl:grid-cols-[1fr_0.42fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('forecast.tableTitle')}</CardTitle>
            <CardDescription>{t('forecast.tableDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="overflow-hidden rounded-[1.75rem] border border-border">
              <div className="overflow-auto">
                <Table>
                  <TableHeader className="bg-surface-muted/80">
                    <TableRow>
                      <TableHead>{t('import.date')}</TableHead>
                      <TableHead>{t('forecast.item')}</TableHead>
                      <TableHead>{t('forecast.predictedQty')}</TableHead>
                      <TableHead>{t('forecast.confidence')}</TableHead>
                      <TableHead>{t('forecast.trend')}</TableHead>
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
              <CardTitle>{t('forecast.logicTitle')}</CardTitle>
              <CardDescription>{t('forecast.logicDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-3xl bg-forest-50 p-4 dark:bg-forest-900/20">
                <p className="text-xs uppercase tracking-[0.18em] text-forest-800/70 dark:text-forest-100/70">{t('forecast.selectedScope')}</p>
                <p className="mt-1 text-lg font-semibold">{forecastMode === 'item' ? resolvedFocusItem : selectedCategory}</p>
              </div>
              <div className="rounded-3xl border border-border bg-surface-muted p-4 text-sm text-text-muted">
                {hasImportedData ? t('forecast.importedRowsInfo') : t('forecast.mockRowsInfo')}
              </div>
              <div className="rounded-2xl border border-border p-3">
                <p className="text-sm font-medium text-text">{t('forecast.confidenceBands')}</p>
                <p className="mt-1 text-sm text-text-muted">{t('forecast.confidenceBandsDesc')}</p>
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
                    {t('forecast.bandCoverage')} {formatNumber(reliabilityReport.coverageScore)}%
                  </Badge>
                </div>
                <p className="mt-3 text-xs text-text-muted">{t('forecast.walkForwardPoints')}: {reliabilityReport.backtestPoints}</p>
                {reliabilityReport.warnings.length > 0 ? (
                  <ul className="mt-2 list-disc pl-5 text-xs text-text-muted">
                    {reliabilityReport.warnings.slice(0, 2).map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-xs text-text-muted">{t('forecast.noCriticalWarnings')}</p>
                )}
              </div>
              <div className="rounded-3xl border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-text">{t('forecast.holidayNeural')}</p>
                  <Badge tone={holidayLoading ? 'neutral' : 'success'}>{holidayLoading ? t('forecast.loadingHolidays') : t('forecast.webHolidayLookupOn')}</Badge>
                </div>
                <p className="mt-1 text-xs text-text-muted">{t('forecast.neuralDesc')}</p>
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
                              <p className="text-xs text-text-muted">{impact.date} • {impact.eventType === 'seasonal-event' ? t('forecast.seasonalEvent') : t('forecast.holiday')} • {impact.phase}</p>
                            </div>
                            <Badge tone={isUp ? 'success' : isDown ? 'danger' : 'neutral'}>
                              {isUp ? t('forecast.spike') : isDown ? t('forecast.downgrade') : t('forecast.flat')}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                            <div className="rounded-lg bg-white px-2 py-1 dark:bg-slate-950">
                              <p className="text-text-muted">{t('forecast.baselineQty')}</p>
                              <p className="font-mono font-semibold">{impact.baselineQty}</p>
                            </div>
                            <div className="rounded-lg bg-white px-2 py-1 dark:bg-slate-950">
                              <p className="text-text-muted">{t('forecast.adjusted')}</p>
                              <p className="font-mono font-semibold">{impact.adjustedQty}</p>
                            </div>
                            <div className="rounded-lg bg-white px-2 py-1 dark:bg-slate-950">
                              <p className="text-text-muted">{t('forecast.delta')}</p>
                              <p className={`font-mono font-semibold ${isUp ? 'text-emerald-700' : isDown ? 'text-red-600' : 'text-text'}`}>
                                {impact.deltaQty > 0 ? '+' : ''}{impact.deltaQty} ({impact.deltaPct.toFixed(1)}%)
                              </p>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-text-muted">{t('forecast.reasoning')}: {impact.reason}</p>
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
                  <p className="mt-2 text-xs text-text-muted">{t('forecast.noUpcomingHolidays')}</p>
                )}
              </div>
              <Button className="w-full" variant="secondary" onClick={() => toast.success(t('forecast.refreshSuccess'))}>
                {t('forecast.refresh')}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {!hasImportedData ? (
        <EmptyState
          title={t('forecast.usingMockTitle')}
          description={t('forecast.usingMockDesc')}
          ctaLabel={t('forecast.goToImport')}
          ctaHref="/import"
        />
      ) : null}
    </div>
  );
}
