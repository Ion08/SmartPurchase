import type { AlertItem, Category, DashboardMetric, InventoryRecord, ItemProfile, OrderRow, RestaurantProfile } from '@/types';

function seededRandom(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function previousDays(count: number) {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  cursor.setDate(cursor.getDate() - count + 1);
  for (let index = 0; index < count; index += 1) {
    const next = new Date(cursor);
    next.setDate(cursor.getDate() + index);
    dates.push(next);
  }
  return dates;
}

export const restaurantProfile: RestaurantProfile = {
  name: 'La Furculiță',
  address: 'Str. București 12, Chișinău, Moldova',
  type: 'independent',
  plan: 'Pro',
  language: 'en',
  locationName: 'La Furculiță - Centru',
  holidayRegion: 'MD',
  stopBuyThreshold: 3,
  notifications: {
    email: true,
    whatsapp: false,
    lowStock: true,
    forecast: true
  }
};

export const menuItems: ItemProfile[] = [
  { item_name: 'roșii', category: 'Produce', unit: 'kg', stock_unit: 'kg', cost_per_unit: 1.9, current_stock: 6, shelf_life_days: 4, days_to_expiry: 2, avg_daily_sales: 8.2 },
  { item_name: 'mozzarella', category: 'Dairy', unit: 'kg', stock_unit: 'kg', cost_per_unit: 7.6, current_stock: 4, shelf_life_days: 5, days_to_expiry: 3, avg_daily_sales: 5.4 },
  { item_name: 'pui', category: 'Meat', unit: 'kg', stock_unit: 'kg', cost_per_unit: 4.9, current_stock: 12, shelf_life_days: 3, days_to_expiry: 2, avg_daily_sales: 6.1 },
  { item_name: 'paste', category: 'Dry goods', unit: 'kg', stock_unit: 'kg', cost_per_unit: 2.2, current_stock: 25, shelf_life_days: 180, days_to_expiry: 95, avg_daily_sales: 7.8 },
  { item_name: 'ulei de măsline', category: 'Dry goods', unit: 'l', stock_unit: 'l', cost_per_unit: 8.9, current_stock: 18, shelf_life_days: 365, days_to_expiry: 210, avg_daily_sales: 1.5 },
  { item_name: 'smântână', category: 'Dairy', unit: 'kg', stock_unit: 'kg', cost_per_unit: 3.1, current_stock: 3, shelf_life_days: 6, days_to_expiry: 1, avg_daily_sales: 4.1 },
  { item_name: 'ouă', category: 'Produce', unit: 'buc', stock_unit: 'buc', cost_per_unit: 0.22, current_stock: 62, shelf_life_days: 20, days_to_expiry: 8, avg_daily_sales: 18.5 },
  { item_name: 'vin alb', category: 'Beverages', unit: 'sticlă', stock_unit: 'sticlă', cost_per_unit: 6.8, current_stock: 19, shelf_life_days: 365, days_to_expiry: 120, avg_daily_sales: 2.7 },
  { item_name: 'cafea', category: 'Beverages', unit: 'kg', stock_unit: 'kg', cost_per_unit: 11.5, current_stock: 37, shelf_life_days: 120, days_to_expiry: 60, avg_daily_sales: 3.2 },
  { item_name: 'zahăr', category: 'Dry goods', unit: 'kg', stock_unit: 'kg', cost_per_unit: 1.3, current_stock: 54, shelf_life_days: 365, days_to_expiry: 280, avg_daily_sales: 1.9 }
];

export function buildMockInventoryRows(days = 14) {
  const rng = seededRandom(143);
  const dates = previousDays(days);
  const rows: InventoryRecord[] = [];

  dates.forEach((date, index) => {
    const weekendBoost = [0, 6].includes(date.getDay()) ? 1.3 : 1;
    const trend = 1 + index * 0.018;
    menuItems.forEach((item) => {
      const noise = 0.78 + rng() * 0.44;
      const base = item.avg_daily_sales * weekendBoost * trend * noise;
      const quantity_sold = Math.max(1, Math.round(base));
      rows.push({
        date: formatDate(date),
        item_name: item.item_name,
        quantity_sold,
        unit: item.unit,
        stock_current: item.current_stock,
        stock_unit: item.stock_unit,
        cost_per_unit: item.cost_per_unit,
        category: item.category
      });
    });
  });

  const bonusRows = [
    { item: menuItems[0], qty: 9 },
    { item: menuItems[1], qty: 6 },
    { item: menuItems[2], qty: 8 }
  ];

  bonusRows.forEach((entry) => {
    rows.push({
      date: formatDate(dates[dates.length - 1]),
      item_name: entry.item.item_name,
      quantity_sold: entry.qty,
      unit: entry.item.unit,
      stock_current: entry.item.current_stock,
      stock_unit: entry.item.stock_unit,
      cost_per_unit: entry.item.cost_per_unit,
      category: entry.item.category
    });
  });

  return rows;
}

export function buildSampleCsv() {
  const rows = buildMockInventoryRows();
  const headers = ['date', 'item_name', 'quantity_sold', 'unit', 'stock_current', 'stock_unit', 'cost_per_unit'];
  const csvRows = [headers.join(',')];
  rows.forEach((row) => {
    csvRows.push([
      row.date,
      row.item_name,
      row.quantity_sold,
      row.unit,
      row.stock_current,
      row.stock_unit,
      row.cost_per_unit.toFixed(2)
    ].join(','));
  });
  return csvRows.join('\n');
}

export function getDashboardMetrics() : DashboardMetric[] {
  return [
    { label: 'Food waste reduced this week', value: '28 kg', delta: '-12%', tone: 'positive' },
    { label: 'Gross margin improvement', value: '€1,840', delta: '+8.7%', tone: 'positive' },
    { label: 'Forecast accuracy', value: '91%', delta: '+4 pts', tone: 'positive' },
    { label: 'Active stop-buy items', value: '3', delta: '2 urgent', tone: 'warning' }
  ];
}

export function getUrgencyAlerts(): AlertItem[] {
  return [
    {
      id: 'alert-roșii',
      title: 'Stop-buy: roșii',
      message: 'Inventory covers less than 2 days. Pause purchasing until tomorrow delivery is confirmed.',
      tone: 'danger',
      category: 'stop-buy',
      item_name: 'roșii',
      unit: 'kg'
    },
    {
      id: 'alert-mozzarella',
      title: 'Stop-buy: mozzarella',
      message: 'Consumption pace is above threshold and current stock is under 3 days of cover.',
      tone: 'danger',
      category: 'stop-buy',
      item_name: 'mozzarella',
      unit: 'kg'
    },
    {
      id: 'alert-smantana',
      title: 'Expiring soon: smântână',
      message: 'Batch expires in 1 day. Push on today’s specials and freeze future orders.',
      tone: 'warning',
      category: 'expiring',
      item_name: 'smântână',
      unit: 'kg'
    },
    {
      id: 'alert-zahar',
      title: 'Overstocked: zahăr',
      message: 'More than 25 days of stock on hand. Lower the next purchase cycle.',
      tone: 'warning',
      category: 'overstock',
      item_name: 'zahăr',
      unit: 'kg'
    }
  ];
}

export function getTopRiskItems(rows: InventoryRecord[], limit = 10) {
  const latestByItem = new Map<string, InventoryRecord>();
  rows.forEach((row) => {
    const previous = latestByItem.get(row.item_name);
    if (!previous || row.date > previous.date) {
      latestByItem.set(row.item_name, row);
    }
  });

  return [...latestByItem.values()]
    .map((row) => {
      const daysOfCover = row.quantity_sold > 0 ? row.stock_current / row.quantity_sold : row.stock_current;
      const riskScore = Math.round(
        Math.max(0, 100 - daysOfCover * 24) +
        Math.min(28, row.quantity_sold * 2)
      );
      return {
        itemName: row.item_name,
        category: row.category,
        stock: row.stock_current,
        dailyBurn: row.quantity_sold,
        daysOfCover: Number(daysOfCover.toFixed(1)),
        riskScore
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, limit);
}

export function getCategorySpendData() {
  return [
    { name: 'Produce', value: 1320 },
    { name: 'Dairy', value: 980 },
    { name: 'Meat', value: 1680 },
    { name: 'Dry goods', value: 1100 },
    { name: 'Beverages', value: 790 }
  ];
}

export function getAnalyticsSeries() {
  return {
    waste: [
      { month: 'Nov', value: 58 },
      { month: 'Dec', value: 55 },
      { month: 'Jan', value: 48 },
      { month: 'Feb', value: 41 },
      { month: 'Mar', value: 36 },
      { month: 'Apr', value: 28 }
    ],
    accuracy: [
      { month: 'Nov', value: 83 },
      { month: 'Dec', value: 84 },
      { month: 'Jan', value: 86 },
      { month: 'Feb', value: 88 },
      { month: 'Mar', value: 90 },
      { month: 'Apr', value: 91 }
    ],
    margin: [
      { category: 'Produce', before: 29, after: 34 },
      { category: 'Dairy', before: 24, after: 31 },
      { category: 'Meat', before: 31, after: 37 },
      { category: 'Dry goods', before: 36, after: 41 },
      { category: 'Beverages', before: 41, after: 45 }
    ]
  };
}

export function categoryFromItem(itemName: string): Category {
  return menuItems.find((item) => item.item_name.toLowerCase() === itemName.toLowerCase())?.category ?? 'Dry goods';
}
