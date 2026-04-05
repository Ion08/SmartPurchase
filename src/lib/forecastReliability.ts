import type { ForecastMode, HolidayEvent, InventoryRecord } from '@/types';
import { buildForecast } from '@/lib/forecastAlgorithm';
import { FORECAST_CONSTANTS } from '@/lib/constants';

function sortedDates(rows: InventoryRecord[]) {
  return [...new Set(rows.map((row) => row.date))].sort();
}

function aggregateActualForScope(
  rows: InventoryRecord[],
  mode: ForecastMode,
  selectedCategory: string,
  focusItem?: string
) {
  const scopedRows = selectedCategory === 'All categories'
    ? rows
    : rows.filter((row) => row.category === selectedCategory);

  const map = new Map<string, number>();
  scopedRows.forEach((row) => {
    if (mode === 'item' && focusItem && row.item_name !== focusItem) {
      return;
    }
    map.set(row.date, (map.get(row.date) ?? 0) + row.quantity_sold);
  });
  return map;
}

function percentage(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export interface ForecastQualityReport {
  dataQualityScore: number;
  coverageScore: number;
  backtestPoints: number;
  mae: number;
  wape: number;
  bias: number;
  warnings: string[];
}

export function buildForecastQualityReport(
  rows: InventoryRecord[],
  mode: ForecastMode,
  selectedCategory: string,
  focusItem?: string,
  holidayEvents: HolidayEvent[] = []
): ForecastQualityReport {
  const warnings: string[] = [];
  const dates = sortedDates(rows);

  let quality = 100;
  if (rows.length < 50) {
    quality -= 25;
    warnings.push('Limited history: import at least 50 rows for stable forecasts.');
  }

  const invalidQtyRows = rows.filter((row) => row.quantity_sold < 0).length;
  if (invalidQtyRows > 0) {
    quality -= Math.min(30, invalidQtyRows * 3);
    warnings.push('Some rows have negative sales quantities.');
  }

  if (dates.length > 1) {
    const missingDateGaps = dates.reduce((gaps, date, index) => {
      if (index === 0) return gaps;
      const prev = new Date(dates[index - 1]);
      const curr = new Date(date);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      return gaps + Math.max(0, diffDays - 1);
    }, 0);

    if (missingDateGaps > 0) {
      quality -= Math.min(20, missingDateGaps * 2);
      warnings.push('Date continuity gaps detected in import history.');
    }
  }

  const actualMap = aggregateActualForScope(rows, mode, selectedCategory, focusItem);
  const evalLookback = Math.min(10, Math.max(3, Math.floor(dates.length / 3)));

  const absErrors: number[] = [];
  const signedErrors: number[] = [];
  const actuals: number[] = [];
  let coveredPoints = 0;

  for (let offset = evalLookback; offset >= 1; offset -= 1) {
    const targetIndex = dates.length - offset;
    const targetDate = dates[targetIndex];
    if (!targetDate || targetIndex <= FORECAST_CONSTANTS.historicalDays - 1) {
      continue;
    }

    const trainEndDate = dates[targetIndex - 1];
    const trainRows = rows.filter((row) => row.date <= trainEndDate);
    const forecast = buildForecast(trainRows, mode, selectedCategory, focusItem, holidayEvents);
    const predictedRow = forecast.tableRows[0];
    if (!predictedRow) {
      continue;
    }

    const chartPoint = forecast.chartData.find((point) => point.date === targetDate && point.isPredicted);
    const actual = actualMap.get(targetDate) ?? 0;
    const predicted = predictedRow.predictedQty;

    const error = predicted - actual;
    signedErrors.push(error);
    absErrors.push(Math.abs(error));
    actuals.push(actual);

    if (chartPoint && chartPoint.lowerBound !== null && chartPoint.upperBound !== null) {
      if (actual >= chartPoint.lowerBound && actual <= chartPoint.upperBound) {
        coveredPoints += 1;
      }
    }
  }

  if (absErrors.length < 3) {
    warnings.push('Not enough historical windows for reliable backtesting.');
  }

  const mae = absErrors.length > 0 ? absErrors.reduce((a, b) => a + b, 0) / absErrors.length : 0;
  const actualTotal = actuals.reduce((a, b) => a + b, 0);
  const errorTotal = absErrors.reduce((a, b) => a + b, 0);
  const signedTotal = signedErrors.reduce((a, b) => a + b, 0);
  const wape = actualTotal > 0 ? (errorTotal / actualTotal) * 100 : 0;
  const bias = actualTotal > 0 ? (signedTotal / actualTotal) * 100 : 0;
  const coverageScore = absErrors.length > 0 ? percentage((coveredPoints / absErrors.length) * 100) : 0;

  if (wape > 26) {
    warnings.push('Forecast error is high (WAPE > 26%). Consider more data and event signals.');
  }
  if (Math.abs(bias) > 12) {
    warnings.push('Forecast bias is high. Model tends to over- or under-predict consistently.');
  }

  return {
    dataQualityScore: percentage(quality),
    coverageScore,
    backtestPoints: absErrors.length,
    mae: Number(mae.toFixed(2)),
    wape: Number(wape.toFixed(2)),
    bias: Number(bias.toFixed(2)),
    warnings
  };
}
