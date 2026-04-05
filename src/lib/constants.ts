/**
 * Configuration constants for the SmartPurchase application
 * Centralizes all magic numbers and configuration values
 */

export const FORECAST_CONSTANTS = {
  // Variance calculation in forecast algorithm
  varianceMin: 0.95,
  varianceRange: 0.1,

  // Seasonal boost (weekend effect)
  seasonalBoost: 1.08,
  seasonalBoostThreshold: 5, // Day number when boost kicks in

  // Confidence range
  confidenceBase: 88,
  confidenceMin: 78,
  confidenceMax: 96,
  confidenceMultiplier: 1.4,

  // Trend detection thresholds
  trendUpThreshold: 0.06,
  trendDownThreshold: -0.06,

  // Forecast periods
  historicalDays: 14,
  forecastDays: 30,
  movingAverageWindow: 7
};

export const ORDER_CONSTANTS = {
  // Safety buffers by category
  safetyBuffers: {
    'Produce': 0.15,
    'Dairy': 0.15,
    'Meat': 0.15,
    'Beverages': 0.10,
    'Dry goods': 0.10
  },

  // Default supplier lead time (in days)
  defaultLeadTimeDays: 1,

  // Min/max days of stock to maintain
  minDaysOfStock: 1,
  maxDaysOfStock: 30
};

export const CSV_CONSTANTS = {
  // File size limit (10MB)
  maxFileSizeMB: 10,
  maxFileSizeBytes: 10 * 1024 * 1024,

  // Preview rows shown
  previewRowCount: 10,

  // Required CSV columns
  requiredColumns: [
    'date',
    'item_name',
    'quantity_sold',
    'unit',
    'stock_current',
    'stock_unit',
    'cost_per_unit'
  ]
};

export const UI_CONSTANTS = {
  // Artificial loading delay (ms) - for perceived smoothness
  loadingDelay: 800,

  // Debounce delays
  searchDebounce: 300,
  saveDebounce: 500,

  // Animation durations (ms)
  transitionDuration: 450,

  // Max items to display before virtualization
  maxVisibleItems: 100
};

export const VALIDATION_CONSTANTS = {
  // Input field constraints
  maxNameLength: 255,
  maxAddressLength: 500,
  minNameLength: 1,

  // Threshold constraints
  minThreshold: 1,
  maxThreshold: 7,
  defaultThreshold: 3,

  // Numeric field constraints
  minCost: 0.01,
  minQuantity: 0,
  minStock: 0
};

export const STORAGE_CONSTANTS = {
  // LocalStorage keys
  appStorageKey: 'smartpurchase-horeca-store',
  importStorageKey: 'smartpurchase-import-memory-store'
};
