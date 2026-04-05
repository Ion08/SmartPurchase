import type { Category, ForecastHolidayImpact, ForecastMode, ForecastPoint, ForecastTableRow, HolidayEvent, InventoryRecord, TrendDirection } from '@/types';
import { FORECAST_CONSTANTS } from '@/lib/constants';
import { buildHolidayAwareNeuralForecast } from '@/lib/neuralForecast';
import { getHolidaySignal } from '@/lib/holidayService';

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sortedDates(rows: InventoryRecord[]) {
  return [...new Set(rows.map((row) => row.date))].sort();
}

function aggregateByDate(rows: InventoryRecord[], groupKey: 'item_name' | 'category', groupValue: string) {
  const map = new Map<string, number>();
  rows
    .filter((row) => (groupKey === 'item_name' ? row.item_name === groupValue : row.category === groupValue))
    .forEach((row) => {
      map.set(row.date, (map.get(row.date) ?? 0) + row.quantity_sold);
    });
  return map;
}

function aggregateAllByDate(rows: InventoryRecord[]) {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    map.set(row.date, (map.get(row.date) ?? 0) + row.quantity_sold);
  });
  return map;
}

function weightedMovingAverage(values: number[]) {
  if (values.length === 0) return 0;
  const weights = values.map((_, index) => index + 1);
  const weighted = values.reduce((sum, value, index) => sum + value * weights[index], 0);
  const divider = weights.reduce((sum, value) => sum + value, 0);
  return weighted / divider;
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDev(values: number[]) {
  if (values.length <= 1) return 0;
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function weekdaySeasonality(dates: string[], values: number[]) {
  const totals = new Map<number, { sum: number; count: number }>();
  dates.forEach((dateStr, index) => {
    const day = new Date(dateStr).getDay();
    const current = totals.get(day) ?? { sum: 0, count: 0 };
    current.sum += values[index] ?? 0;
    current.count += 1;
    totals.set(day, current);
  });

  const globalAvg = Math.max(average(values), 1);
  const factors = new Map<number, number>();
  for (let day = 0; day < 7; day += 1) {
    const stats = totals.get(day);
    if (!stats || stats.count === 0) {
      factors.set(day, 1);
      continue;
    }
    factors.set(day, clamp((stats.sum / stats.count) / globalAvg, 0.82, 1.22));
  }
  return factors;
}

function trendFromChange(change: number): TrendDirection {
  // Guard against NaN/Infinity from division operations
  if (!Number.isFinite(change)) return 'flat';
  if (change > FORECAST_CONSTANTS.trendUpThreshold) return 'up';
  if (change < FORECAST_CONSTANTS.trendDownThreshold) return 'down';
  return 'flat';
}

export interface ForecastResult {
  chartData: ForecastPoint[];
  tableRows: ForecastTableRow[];
  holidayImpacts: ForecastHolidayImpact[];
}

export function buildForecast(
  rows: InventoryRecord[],
  mode: ForecastMode,
  selectedCategory: string,
  focusItem?: string,
  holidayEvents: HolidayEvent[] = []
): ForecastResult {
  const filteredRows = selectedCategory === 'All categories'
    ? rows
    : rows.filter((row) => row.category === selectedCategory);

  // Validate focusItem exists in data when in item mode
  const validFocusItem = mode === 'item' && focusItem && filteredRows.some((r) => r.item_name === focusItem)
    ? focusItem
    : undefined;

  const focusName = mode === 'item'
    ? (validFocusItem ?? filteredRows[0]?.item_name ?? rows[0]?.item_name)
    : selectedCategory === 'All categories'
      ? 'All categories'
      : selectedCategory;
  
  // If no valid focus name can be determined, return empty result
  if (!focusName) {
    return {
      chartData: [],
      tableRows: [],
      holidayImpacts: []
    };
  }
  const historyMap = mode === 'item'
    ? aggregateByDate(filteredRows, 'item_name', focusName)
    : selectedCategory === 'All categories'
      ? aggregateAllByDate(filteredRows)
      : aggregateByDate(filteredRows, 'category', focusName);
  const dates = sortedDates(filteredRows);
  const lastActualDates = dates.slice(-FORECAST_CONSTANTS.historicalDays);
  const lastValues = lastActualDates.map((date) => historyMap.get(date) ?? 0);
  const baseline = weightedMovingAverage(lastValues.slice(-FORECAST_CONSTANTS.movingAverageWindow));
  const overallAverage = average(lastValues);
  const recentWindow = lastValues.slice(-Math.min(6, lastValues.length));
  const trendPerDayRaw = recentWindow.length > 1
    ? (recentWindow[recentWindow.length - 1] - recentWindow[0]) / (recentWindow.length - 1)
    : 0;
  const trendPerDay = clamp(trendPerDayRaw, -baseline * 0.15, baseline * 0.15);
  const variation = stdDev(lastValues) / Math.max(overallAverage, 1);
  const weekdayFactors = weekdaySeasonality(lastActualDates, lastValues);
  const categoryLabel = mode === 'item'
    ? (rows.find((row) => row.item_name === focusName)?.category ?? 'Dry goods')
    : (selectedCategory === 'All categories' ? 'Dry goods' : (selectedCategory as Category));

  const chartData: ForecastPoint[] = [];
  lastActualDates.forEach((date) => {
    chartData.push({
      date,
      label: date,
      actual: historyMap.get(date) ?? 0,
      predicted: null,
      baselinePredicted: null,
      lowerBound: null,
      upperBound: null,
      itemName: focusName,
      category: categoryLabel,
      confidence: 0,
      trend: 'flat',
      isPredicted: false
      ,
      isHoliday: false,
      holidayName: null,
      holidayDirection: 'flat'
    });
  });

  // Bridge point: keep forecast and bands anchored to the last actual value
  // so the chart doesn't show a visual gap between historical and predicted lines.
  if (chartData.length > 0) {
    const anchor = chartData[chartData.length - 1];
    if (anchor.actual !== null) {
      anchor.predicted = anchor.actual;
      anchor.lowerBound = anchor.actual;
      anchor.upperBound = anchor.actual;
    }
  }

  const futureDate = new Date(lastActualDates.length ? lastActualDates[lastActualDates.length - 1] : new Date());
  futureDate.setDate(futureDate.getDate() + 1);
  const futureDates = Array.from({ length: FORECAST_CONSTANTS.forecastDays }, (_, index) => {
    const date = new Date(futureDate);
    date.setDate(futureDate.getDate() + index);
    return formatDate(date);
  });
  const neuralForecast = buildHolidayAwareNeuralForecast({
    historyDates: lastActualDates,
    historyValues: lastValues,
    futureDates,
    holidays: holidayEvents
  });

  const forecastRows: ForecastTableRow[] = [];
  const holidayImpacts: ForecastHolidayImpact[] = [];
  let previousPredicted = chartData[chartData.length - 1]?.actual ?? overallAverage;

  futureDates.forEach((dateStr, index) => {
    const date = new Date(dateStr);
    const dayFactor = weekdayFactors.get(date.getDay()) ?? 1;
    const trendBase = baseline + trendPerDay * (index + 1);
    const rawPredicted = Math.max(0, trendBase * dayFactor);
    const holidaySignal = getHolidaySignal(dateStr, holidayEvents);
    const neuralValue = neuralForecast.values[index] ?? rawPredicted;
    const blendedPredicted = (neuralValue * 0.68) + (rawPredicted * 0.32);
    const baselineBeforeHoliday = Math.max(0, blendedPredicted);
    const predicted = index === 0
      ? previousPredicted + (rawPredicted - previousPredicted) * 0.35
      : previousPredicted + (blendedPredicted - previousPredicted) * 0.55;
    const confidence = Math.max(
      FORECAST_CONSTANTS.confidenceMin,
      Math.min(
        FORECAST_CONSTANTS.confidenceMax,
        Math.round(
          Math.min(
            neuralForecast.confidence,
            FORECAST_CONSTANTS.confidenceBase
            - variation * 20
            - Math.abs(trendPerDay) / Math.max(baseline, 1) * 8
            - index * 0.8
            - holidaySignal.confidencePenalty
          )
        )
      )
    );
    const rounded = Math.round(predicted * holidaySignal.multiplier);
    const baselineRounded = Math.max(0, Math.round(predicted));
    const uncertaintyPct = clamp(0.06 + variation * 0.25 + index * 0.01 + (holidaySignal.isHoliday ? 0.03 : 0), 0.06, 0.22);
    const bandSize = Math.max(1, Math.round(rounded * uncertaintyPct));
    const lowerBound = Math.max(0, rounded - bandSize);
    const upperBound = rounded + bandSize;
    const previous = previousPredicted;
    previousPredicted = rounded;
    chartData.push({
      date: dateStr,
      label: dateStr,
      actual: null,
      predicted: rounded,
      baselinePredicted: baselineRounded,
      lowerBound,
      upperBound,
      itemName: focusName,
      category: categoryLabel,
      confidence,
      trend: trendFromChange((predicted - previous) / Math.max(previous, 1)),
      isPredicted: true,
      isHoliday: holidaySignal.direction !== 'flat',
      holidayName: holidaySignal.name || null,
      holidayDirection: holidaySignal.direction
    });

    forecastRows.push({
      date: dateStr,
      item: focusName,
      predictedQty: rounded,
      confidence,
      trend: trendFromChange((predicted - previous) / Math.max(previous, 1)),
      category: categoryLabel
    });

    if (holidaySignal.direction !== 'flat' || holidaySignal.isHoliday || holidaySignal.name) {
      holidayImpacts.push({
        date: dateStr,
        name: holidaySignal.name || 'Holiday impact',
        localName: holidaySignal.name || 'Holiday impact',
        baselineQty: baselineRounded,
        adjustedQty: rounded,
        deltaQty: rounded - baselineRounded,
        deltaPct: baselineRounded > 0 ? ((rounded - baselineRounded) / baselineRounded) * 100 : 0,
        direction: holidaySignal.direction,
        phase: holidaySignal.phase,
        reason: holidaySignal.reason,
        eventType: holidaySignal.eventType,
        source: holidaySignal.source
      });
    }
  });

  return { chartData, tableRows: forecastRows, holidayImpacts };
}

export function generateForecastExportRows(rows: ForecastTableRow[]) {
  return rows.map((row) => ({
    Date: row.date,
    Item: row.item,
    'Predicted Qty': row.predictedQty,
    'Confidence %': row.confidence,
    Trend: row.trend,
    'Best Case Qty (+)': Math.round(row.predictedQty * 1.1),
    'Worst Case Qty (-)': Math.round(Math.max(0, row.predictedQty * 0.9))
  }));
}
