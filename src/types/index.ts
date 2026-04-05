export type RestaurantType = 'independent' | 'chain' | 'cloud kitchen';
export type PlanType = 'Basic' | 'Pro' | 'Chain';
export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral';
export type Priority = 'High' | 'Med' | 'Low';
export type TrendDirection = 'up' | 'down' | 'flat';
export type ForecastMode = 'item' | 'category';
export type Category = 'Produce' | 'Dairy' | 'Meat' | 'Dry goods' | 'Beverages';
export type HolidayRegion = 'MD' | 'RO' | 'GLOBAL';
export type Language = 'en' | 'ro';

export interface InventoryRecord {
  date: string;
  item_name: string;
  quantity_sold: number;
  unit: string;
  stock_current: number;
  stock_unit: string;
  cost_per_unit: number;
  category: Category;
}

export interface ItemProfile {
  item_name: string;
  category: Category;
  unit: string;
  stock_unit: string;
  cost_per_unit: number;
  current_stock: number;
  shelf_life_days: number;
  days_to_expiry: number;
  avg_daily_sales: number;
}

export interface ForecastPoint {
  date: string;
  label: string;
  actual: number | null;
  predicted: number | null;
  baselinePredicted: number | null;
  lowerBound: number | null;
  upperBound: number | null;
  itemName: string;
  category: Category;
  confidence: number;
  trend: TrendDirection;
  isPredicted: boolean;
  isHoliday: boolean;
  holidayName: string | null;
  holidayDirection: 'up' | 'down' | 'flat';
}

export interface ForecastTableRow {
  date: string;
  item: string;
  predictedQty: number;
  confidence: number;
  trend: TrendDirection;
  category: Category;
}

export interface ForecastHolidayImpact {
  date: string;
  name: string;
  localName: string;
  baselineQty: number;
  adjustedQty: number;
  deltaQty: number;
  deltaPct: number;
  direction: 'up' | 'down' | 'flat';
  phase: 'pre' | 'during' | 'post' | 'none';
  reason: string;
  eventType: 'holiday' | 'seasonal-event';
  source: 'api' | 'fallback';
}

export interface OrderRow {
  item_name: string;
  current_stock: number;
  forecasted_need: number;
  recommended_order_qty: number;
  unit: string;
  estimated_cost: number;
  priority: Priority;
  category: Category;
  stop_buy: boolean;
  days_of_stock: number;
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  tone: BadgeTone;
  category: 'stop-buy' | 'expiring' | 'overstock' | 'forecast';
  item_name: string;
  unit: string;
}

export interface HolidayEvent {
  date: string;
  name: string;
  localName: string;
  countryCode: string;
  region: HolidayRegion;
  source: 'api' | 'fallback';
}

export interface ImportAuditEntry {
  id: string;
  importedAt: string;
  sourceName: string;
  rowsLoaded: number;
  duplicateRowsRemoved: number;
  invalidRowsSkipped: number;
  dataQualityScore: number;
}

export interface ActivityEvent {
  id: string;
  at: string;
  type: 'import' | 'order' | 'settings' | 'forecast';
  title: string;
  details: string;
}

export interface DashboardMetric {
  label: string;
  value: string;
  delta: string;
  tone: 'positive' | 'warning' | 'neutral';
}

export interface RestaurantProfile {
  name: string;
  address: string;
  type: RestaurantType;
  plan: PlanType;
  language: Language;
  locationName: string;
  holidayRegion: HolidayRegion;
  stopBuyThreshold: number;
  notifications: {
    email: boolean;
    whatsapp: boolean;
    lowStock: boolean;
    forecast: boolean;
  };
}

export interface AppState {
  profile: RestaurantProfile;
  selectedCategory: string;
  forecastMode: ForecastMode;
  startDate: string;
  endDate: string;
  dismissAlert: boolean;
}
