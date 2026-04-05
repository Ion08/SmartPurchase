import type { Category, InventoryRecord } from '@/types';

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shiftDays(date: Date, offset: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
}

function zeroPadSeries(map: Map<string, number>, dates: string[]) {
  return dates.map((date) => ({ date, value: map.get(date) ?? 0 }));
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function dayDiff(fromDate: Date, toDate: Date) {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((toDate.getTime() - fromDate.getTime()) / msPerDay);
}

function roundQty(value: number, unit: string) {
  const normalized = unit.toLowerCase();
  if (normalized.includes('kg') || normalized.includes('l')) {
    return Math.round(value * 10) / 10;
  }
  return Math.round(value);
}

function aggregateItemDaily(rows: InventoryRecord[]) {
  const map = new Map<string, number>();
  rows.forEach((row) => {
    map.set(row.date, (map.get(row.date) ?? 0) + row.quantity_sold);
  });
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, qty]) => ({ date, qty }));
}

function weightedAverage(values: number[]) {
  if (values.length === 0) return 0;
  const weights = values.map((_, index) => index + 1);
  const numerator = values.reduce((sum, value, index) => sum + value * weights[index], 0);
  const denominator = weights.reduce((sum, value) => sum + value, 0);
  return numerator / denominator;
}

function weekdayFactors(series: Array<{ date: string; qty: number }>) {
  const totals = new Map<number, { sum: number; count: number }>();
  series.forEach((entry) => {
    const weekday = new Date(entry.date).getDay();
    const current = totals.get(weekday) ?? { sum: 0, count: 0 };
    current.sum += entry.qty;
    current.count += 1;
    totals.set(weekday, current);
  });

  const globalAvg = Math.max(series.reduce((sum, entry) => sum + entry.qty, 0) / Math.max(series.length, 1), 0.1);
  const factors = new Map<number, number>();
  for (let day = 0; day < 7; day += 1) {
    const stats = totals.get(day);
    if (!stats || stats.count === 0) {
      factors.set(day, 1);
      continue;
    }
    const raw = (stats.sum / stats.count) / globalAvg;
    factors.set(day, Math.max(0.8, Math.min(1.25, raw)));
  }
  return factors;
}

function estimateDemandForDate(rows: InventoryRecord[], targetDate: Date) {
  const series = aggregateItemDaily(rows);
  if (series.length === 0) return 0;

  const values = series.map((entry) => entry.qty);
  const recent = values.slice(-Math.min(7, values.length));
  const baseline = weightedAverage(recent);
  const trendRaw = recent.length > 1 ? (recent[recent.length - 1] - recent[0]) / (recent.length - 1) : 0;
  const trend = Math.max(-baseline * 0.12, Math.min(baseline * 0.12, trendRaw));

  const lastKnownDate = new Date(series[series.length - 1].date);
  const daysAhead = Math.max(1, dayDiff(startOfDay(lastKnownDate), startOfDay(targetDate)));
  const factors = weekdayFactors(series);
  const weekday = targetDate.getDay();
  const factor = factors.get(weekday) ?? 1;
  return Math.max(0.1, (baseline + trend * daysAhead) * factor);
}

export interface BuyPlanItem {
  itemName: string;
  category: Category;
  unit: string;
  qty: number;
  estimatedCost: number;
}

export interface BuyPlanDay {
  dayLabel: 'Azi' | 'Maine' | 'Poimaine';
  date: string;
  totalQty: number;
  totalCost: number;
  items: BuyPlanItem[];
}

export interface SoldProductPlanItem {
  itemName: string;
  category: Category;
  unit: string;
  predictedQty: number;
}

export interface SoldProductPlanDay {
  dayLabel: 'Azi' | 'Maine' | 'Poimaine';
  date: string;
  totalPredictedQty: number;
  items: SoldProductPlanItem[];
}

export interface IngredientNeedItem {
  ingredient: string;
  unit: string;
  requiredQty: number;
  buyQty: number;
  estimatedCost: number;
}

export interface IngredientNeedDay {
  dayLabel: 'Azi' | 'Maine' | 'Poimaine';
  date: string;
  totalRequiredQty: number;
  totalBuyQty: number;
  totalCost: number;
  items: IngredientNeedItem[];
}

type ProductRecipeItem = {
  ingredient: string;
  qtyPerUnit: number;
  unit: string;
};

type ProductProfile = {
  name: string;
  category: Category;
  unit: string;
  baseDailyDemand: number;
  weekendMultiplier: number;
  recipe: ProductRecipeItem[];
};

const SOLD_PRODUCT_PROFILES: ProductProfile[] = [
  {
    name: 'croasante',
    category: 'Dry goods',
    unit: 'buc',
    baseDailyDemand: 34,
    weekendMultiplier: 1.22,
    recipe: [
      { ingredient: 'ouă', qtyPerUnit: 0.08, unit: 'buc' },
      { ingredient: 'zahăr', qtyPerUnit: 0.01, unit: 'kg' },
      { ingredient: 'smântână', qtyPerUnit: 0.015, unit: 'kg' }
    ]
  },
  {
    name: 'paste carbonara',
    category: 'Dry goods',
    unit: 'porție',
    baseDailyDemand: 22,
    weekendMultiplier: 1.12,
    recipe: [
      { ingredient: 'paste', qtyPerUnit: 0.11, unit: 'kg' },
      { ingredient: 'ouă', qtyPerUnit: 0.35, unit: 'buc' },
      { ingredient: 'smântână', qtyPerUnit: 0.06, unit: 'kg' },
      { ingredient: 'pui', qtyPerUnit: 0.04, unit: 'kg' }
    ]
  },
  {
    name: 'salata caprese',
    category: 'Produce',
    unit: 'porție',
    baseDailyDemand: 17,
    weekendMultiplier: 1.06,
    recipe: [
      { ingredient: 'roșii', qtyPerUnit: 0.14, unit: 'kg' },
      { ingredient: 'mozzarella', qtyPerUnit: 0.09, unit: 'kg' },
      { ingredient: 'ulei de măsline', qtyPerUnit: 0.01, unit: 'l' }
    ]
  },
  {
    name: 'piept de pui grill',
    category: 'Meat',
    unit: 'porție',
    baseDailyDemand: 20,
    weekendMultiplier: 1.08,
    recipe: [
      { ingredient: 'pui', qtyPerUnit: 0.2, unit: 'kg' },
      { ingredient: 'ulei de măsline', qtyPerUnit: 0.01, unit: 'l' }
    ]
  },
  {
    name: 'latte',
    category: 'Beverages',
    unit: 'pahar',
    baseDailyDemand: 26,
    weekendMultiplier: 1.18,
    recipe: [
      { ingredient: 'cafea', qtyPerUnit: 0.014, unit: 'kg' },
      { ingredient: 'smântână', qtyPerUnit: 0.03, unit: 'kg' },
      { ingredient: 'zahăr', qtyPerUnit: 0.007, unit: 'kg' }
    ]
  },
  {
    name: 'spritzer vin alb',
    category: 'Beverages',
    unit: 'pahar',
    baseDailyDemand: 14,
    weekendMultiplier: 1.2,
    recipe: [
      { ingredient: 'vin alb', qtyPerUnit: 0.22, unit: 'sticlă' }
    ]
  }
];

export function buildThreeDaySoldProductsPlan(rows: InventoryRecord[], limit = 6): SoldProductPlanDay[] {
  const rowsByItem = new Map<string, InventoryRecord[]>();

  rows.forEach((row) => {
    const history = rowsByItem.get(row.item_name) ?? [];
    history.push(row);
    rowsByItem.set(row.item_name, history);
  });

  const marketSeries = aggregateItemDaily(rows);
  const marketRecent = marketSeries.slice(-Math.min(7, marketSeries.length)).map((entry) => entry.qty);
  const marketBaseline = Math.max(weightedAverage(marketRecent), 0.1);

  const labels: Array<'Azi' | 'Maine' | 'Poimaine'> = ['Azi', 'Maine', 'Poimaine'];
  const today = startOfDay(new Date());

  return labels.map((dayLabel, index) => {
    const date = shiftDays(today, index);
    const predictedMarketDemand = estimateDemandForDate(rows, date);
    const marketIndex = Math.max(0.75, Math.min(1.35, predictedMarketDemand / marketBaseline));
    const isWeekend = [0, 6].includes(date.getDay());

    const items: SoldProductPlanItem[] = SOLD_PRODUCT_PROFILES.map((product) => {
      const weekendFactor = isWeekend ? product.weekendMultiplier : 1;
      const predictedRaw = product.baseDailyDemand * marketIndex * weekendFactor;
      const predictedQty = Math.max(1, Math.round(predictedRaw));
      return {
        itemName: product.name,
        category: product.category,
        unit: product.unit,
        predictedQty
      };
    });

    const sorted = items
      .filter((item) => item.predictedQty > 0)
      .sort((a, b) => b.predictedQty - a.predictedQty)
      .slice(0, limit);

    return {
      dayLabel,
      date: formatDate(date),
      totalPredictedQty: Math.round(sorted.reduce((sum, item) => sum + item.predictedQty, 0) * 10) / 10,
      items: sorted
    };
  });
}

export function buildThreeDayIngredientNeedsFromSales(
  rows: InventoryRecord[],
  soldPlan: SoldProductPlanDay[]
): IngredientNeedDay[] {
  const latestByIngredient = new Map<string, InventoryRecord>();
  rows.forEach((row) => {
    const previous = latestByIngredient.get(row.item_name);
    if (!previous || previous.date.localeCompare(row.date) < 0) {
      latestByIngredient.set(row.item_name, row);
    }
  });

  const stockState = new Map<string, number>();
  latestByIngredient.forEach((record, ingredient) => {
    stockState.set(ingredient, record.stock_current);
  });

  return soldPlan.map((day) => {
    const requiredMap = new Map<string, { qty: number; unit: string }>();

    day.items.forEach((soldProduct) => {
      const profile = SOLD_PRODUCT_PROFILES.find((candidate) => candidate.name === soldProduct.itemName);
      if (!profile) return;

      profile.recipe.forEach((recipeItem) => {
        const current = requiredMap.get(recipeItem.ingredient) ?? { qty: 0, unit: recipeItem.unit };
        current.qty += soldProduct.predictedQty * recipeItem.qtyPerUnit;
        requiredMap.set(recipeItem.ingredient, current);
      });
    });

    const items: IngredientNeedItem[] = [...requiredMap.entries()].map(([ingredient, payload]) => {
      const requiredQty = roundQty(payload.qty, payload.unit);
      const currentStock = stockState.get(ingredient) ?? 0;
      const buyQty = roundQty(Math.max(0, requiredQty - currentStock), payload.unit);
      const reference = latestByIngredient.get(ingredient);
      const costPerUnit = reference?.cost_per_unit ?? 0;
      const estimatedCost = buyQty * costPerUnit;

      stockState.set(ingredient, Math.max(0, currentStock + buyQty - requiredQty));

      return {
        ingredient,
        unit: payload.unit,
        requiredQty,
        buyQty,
        estimatedCost
      };
    });

    const prioritized = items
      .filter((item) => item.requiredQty > 0)
      .sort((a, b) => b.buyQty - a.buyQty || b.requiredQty - a.requiredQty)
      .slice(0, 8);

    return {
      dayLabel: day.dayLabel,
      date: day.date,
      totalRequiredQty: Math.round(prioritized.reduce((sum, item) => sum + item.requiredQty, 0) * 10) / 10,
      totalBuyQty: Math.round(prioritized.reduce((sum, item) => sum + item.buyQty, 0) * 10) / 10,
      totalCost: Math.round(prioritized.reduce((sum, item) => sum + item.estimatedCost, 0)),
      items: prioritized
    };
  });
}

export function buildThreeDayBuyPlan(rows: InventoryRecord[]): BuyPlanDay[] {
  const latestByItem = new Map<string, InventoryRecord>();
  const rowsByItem = new Map<string, InventoryRecord[]>();

  rows.forEach((row) => {
    const previous = latestByItem.get(row.item_name);
    if (!previous || previous.date.localeCompare(row.date) < 0) {
      latestByItem.set(row.item_name, row);
    }
    const list = rowsByItem.get(row.item_name) ?? [];
    list.push(row);
    rowsByItem.set(row.item_name, list);
  });

  const itemStates = [...latestByItem.values()].map((latest) => ({
    itemName: latest.item_name,
    category: latest.category,
    unit: latest.unit,
    costPerUnit: latest.cost_per_unit,
    stock: latest.stock_current,
    rows: rowsByItem.get(latest.item_name) ?? []
  }));

  const labels: Array<'Azi' | 'Maine' | 'Poimaine'> = ['Azi', 'Maine', 'Poimaine'];
  const today = startOfDay(new Date());

  return labels.map((label, index) => {
    const date = shiftDays(today, index);
    const items: BuyPlanItem[] = [];

    itemStates.forEach((state) => {
      const predictedDemand = estimateDemandForDate(state.rows, date);
      const targetStock = predictedDemand * 1.08;
      const rawBuyQty = Math.max(0, targetStock - state.stock);
      const buyQty = roundQty(rawBuyQty, state.unit);

      if (buyQty > 0) {
        items.push({
          itemName: state.itemName,
          category: state.category,
          unit: state.unit,
          qty: buyQty,
          estimatedCost: buyQty * state.costPerUnit
        });
      }

      state.stock = Math.max(0, state.stock + buyQty - predictedDemand);
    });

    const sortedItems = items.sort((a, b) => b.qty - a.qty);
    const totalQty = sortedItems.reduce((sum, item) => sum + item.qty, 0);
    const totalCost = sortedItems.reduce((sum, item) => sum + item.estimatedCost, 0);

    return {
      dayLabel: label,
      date: formatDate(date),
      totalQty: Math.round(totalQty * 10) / 10,
      totalCost: Math.round(totalCost),
      items: sortedItems.slice(0, 6)
    };
  });
}

export function buildSalesTrend(rows: InventoryRecord[], days = 30) {
  const today = new Date();
  const dates: string[] = [];
  for (let index = days - 1; index >= 0; index -= 1) {
    dates.push(formatDate(shiftDays(today, -index)));
  }

  const map = new Map<string, number>();
  rows.forEach((row) => {
    map.set(row.date, (map.get(row.date) ?? 0) + row.quantity_sold * row.cost_per_unit);
  });

  return zeroPadSeries(map, dates).map((entry) => ({
    ...entry,
    sales: Math.round(entry.value)
  }));
}

export function buildCategoryComparison(rows: InventoryRecord[]) {
  const categories: Category[] = ['Produce', 'Dairy', 'Meat', 'Dry goods', 'Beverages'];
  return categories.map((category) => {
    const categoryRows = rows.filter((row) => row.category === category);
    const consumption = Math.round(categoryRows.reduce((sum, row) => sum + row.quantity_sold, 0));
    const latestStockByItem = new Map<string, InventoryRecord>();

    categoryRows.forEach((row) => {
      const previous = latestStockByItem.get(row.item_name);
      if (!previous || previous.date.localeCompare(row.date) < 0) {
        latestStockByItem.set(row.item_name, row);
      }
    });

    const stock = Math.round([...latestStockByItem.values()].reduce((sum, row) => sum + row.stock_current, 0));
    return {
      category,
      inventory: stock,
      consumption
    };
  });
}

export function buildSparkline(values: number[], size = 8) {
  const source = values.slice(-size);
  return source.length >= size ? source : [...Array(size - source.length).fill(source[0] ?? 0), ...source];
}

export function buildCategoryWasteSeries() {
  return [
    { label: 'Produce', value: 13 },
    { label: 'Dairy', value: 9 },
    { label: 'Meat', value: 16 },
    { label: 'Dry goods', value: 7 },
    { label: 'Beverages', value: 3 }
  ];
}
