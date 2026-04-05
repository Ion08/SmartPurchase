import type { InventoryRecord, OrderRow, Priority } from '@/types';

function dailyAverage(rows: InventoryRecord[]) {
  if (rows.length === 0) return 0;
  const total = rows.reduce((sum, row) => sum + row.quantity_sold, 0);
  const uniqueDays = new Set(rows.map((row) => row.date)).size;
  return total / Math.max(uniqueDays, 1);
}

function latestRecord(rows: InventoryRecord[]) {
  if (rows.length === 0) return undefined;
  return [...rows]
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1);
}

function safetyFactor(category: string) {
  return category === 'Produce' || category === 'Dairy' || category === 'Meat' ? 1.15 : 1.1;
}

function priorityFromDays(daysOfStock: number, threshold: number): Priority {
  if (daysOfStock <= threshold) return 'High';
  if (daysOfStock <= threshold + 2) return 'Med';
  return 'Low';
}

export function generateOrderRows(rows: InventoryRecord[], threshold = 3) {
  const uniqueItems = [...new Set(rows.map((row) => row.item_name))];

  return uniqueItems
    .map((itemName) => {
      const itemRows = rows.filter((row) => row.item_name === itemName);
      const latest = latestRecord(itemRows);
      if (!latest) return null;

      const avgDaily = dailyAverage(itemRows);
      const forecastedNeed = avgDaily * 7;
      const currentStock = latest.stock_current;
      const daysOfStock = currentStock / Math.max(avgDaily, 0.1);
      const stopBuy = daysOfStock <= threshold;
      const rawOrder = Math.max(0, forecastedNeed - currentStock);
      const recommended_order_qty = Math.max(0, rawOrder * safetyFactor(latest.category));
      const estimatedCost = recommended_order_qty * latest.cost_per_unit;
      const priority = priorityFromDays(daysOfStock, threshold);

      return {
        item_name: itemName,
        current_stock: currentStock,
        forecasted_need: forecastedNeed,
        recommended_order_qty,
        unit: latest.unit,
        estimated_cost: estimatedCost,
        priority,
        category: latest.category,
        stop_buy: stopBuy,
        days_of_stock: daysOfStock
      } satisfies OrderRow;
    })
    .filter((row): row is OrderRow => Boolean(row))
    .filter((row) => row.recommended_order_qty > 0 || row.stop_buy)
    .sort((a, b) => {
      const priorityScore = { High: 0, Med: 1, Low: 2 };
      return priorityScore[a.priority] - priorityScore[b.priority];
    });
}
