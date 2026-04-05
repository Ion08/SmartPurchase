// API client utilities for SmartPurchase backend
// These functions call the Next.js API routes

const API_BASE = '';

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Types
interface CreateItemData {
  restaurantId: string;
  itemName: string;
  categoryId: string;
  unit: string;
  stockUnit: string;
  costPerUnit?: number;
  shelfLifeDays?: number;
}

// Inventory API
export const inventoryApi = {
  get: (restaurantId: string, startDate?: string, endDate?: string, category?: string) =>
    fetcher(`/api/inventory?restaurantId=${restaurantId}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}${category ? `&category=${category}` : ''}`),

  create: (data: {
    restaurantId: string;
    itemId: string;
    recordDate: string;
    quantitySold: number;
    stockCurrent: number;
    costPerUnit: number;
  }) => fetcher('/api/inventory', { method: 'POST', body: JSON.stringify(data) })
};

// Items API
export const itemsApi = {
  get: (restaurantId: string, category?: string) =>
    fetcher(`/api/items?restaurantId=${restaurantId}${category ? `&category=${category}` : ''}`),

  create: (data: CreateItemData) =>
    fetcher('/api/items', { method: 'POST', body: JSON.stringify(data) }),

  update: (data: { id: string } & Partial<CreateItemData>) =>
    fetcher('/api/items', { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id: string) =>
    fetcher(`/api/items?id=${id}`, { method: 'DELETE' })
};

// Orders API
export const ordersApi = {
  get: (restaurantId: string, status?: string) =>
    fetcher(`/api/orders?restaurantId=${restaurantId}${status ? `&status=${status}` : ''}`),

  create: (data: {
    restaurantId: string;
    notes?: string;
    items: Array<{
      itemId: string;
      currentStock: number;
      forecastedNeed: number;
      recommendedOrderQty: number;
      estimatedCost: number;
      priority: 'High' | 'Med' | 'Low';
      stopBuy: boolean;
      daysOfStock: number;
    }>;
  }) => fetcher('/api/orders', { method: 'POST', body: JSON.stringify(data) }),

  update: (data: { id: string; status?: string; notes?: string }) =>
    fetcher('/api/orders', { method: 'PUT', body: JSON.stringify(data) })
};

// Activity API
export const activityApi = {
  get: (restaurantId: string, limit?: number) =>
    fetcher(`/api/activity?restaurantId=${restaurantId}${limit ? `&limit=${limit}` : ''}`),

  create: (data: {
    restaurantId: string;
    eventType: 'import' | 'order' | 'settings' | 'forecast';
    title: string;
    details?: string;
  }) => fetcher('/api/activity', { method: 'POST', body: JSON.stringify(data) })
};

// Forecast Views API
export const forecastViewsApi = {
  get: (restaurantId: string) =>
    fetcher(`/api/forecast-views?restaurantId=${restaurantId}`),

  save: (data: {
    restaurantId: string;
    name: string;
    selectedCategory?: string;
    forecastMode?: 'item' | 'category';
    focusItem?: string;
  }) => fetcher('/api/forecast-views', { method: 'POST', body: JSON.stringify(data) }),

  delete: (id: string) =>
    fetcher(`/api/forecast-views?id=${id}`, { method: 'DELETE' })
};

// Import API
export const importApi = {
  bulkImport: (data: {
    restaurantId: string;
    sourceName?: string;
    records: Array<{
      itemName: string;
      recordDate: string;
      quantitySold?: number;
      stockCurrent?: number;
      costPerUnit?: number;
      unit?: string;
      stockUnit?: string;
    }>;
  }) => fetcher('/api/import', { method: 'POST', body: JSON.stringify(data) })
};
