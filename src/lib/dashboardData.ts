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
