import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActivityEvent, AppState, ForecastMode, InventoryRecord, PlanType, RestaurantProfile } from '@/types';

const initialProfile: RestaurantProfile = {
  name: 'La Furculiță',
  address: 'Str. București 12, Chișinău, Moldova',
  type: 'independent',
  plan: 'Pro',
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

type AppStore = AppState & {
  savedForecastViews: Array<{
    id: string;
    name: string;
    selectedCategory: string;
    forecastMode: ForecastMode;
    focusItem: string;
  }>;
  activityLog: ActivityEvent[];
  setProfile: (profile: Partial<RestaurantProfile>) => void;
  setSelectedCategory: (category: string) => void;
  setForecastMode: (mode: ForecastMode) => void;
  setDateRange: (startDate: string, endDate: string) => void;
  setDismissAlert: (dismissAlert: boolean) => void;
  setPlan: (plan: PlanType) => void;
  setRestaurantId: (restaurantId: string | null) => void;
  saveForecastView: (view: { name: string; selectedCategory: string; forecastMode: ForecastMode; focusItem: string }) => void;
  deleteForecastView: (id: string) => void;
  addActivityEvent: (event: Omit<ActivityEvent, 'id' | 'at'>) => void;
};

const today = new Date();
const defaultStart = new Date(today);
defaultStart.setDate(today.getDate() - 13);

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      profile: initialProfile,
      selectedCategory: 'All categories',
      forecastMode: 'item',
      startDate: defaultStart.toISOString().slice(0, 10),
      endDate: today.toISOString().slice(0, 10),
      dismissAlert: false,
      restaurantId: null,
      savedForecastViews: [],
      activityLog: [],
      setProfile: (profile) =>
        set((state) => ({
          profile: {
            ...state.profile,
            ...profile,
            notifications: {
              ...state.profile.notifications,
              ...(profile.notifications ?? {})
            }
          }
        })),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setForecastMode: (mode) => set({ forecastMode: mode }),
      setDateRange: (startDate, endDate) => set({ startDate, endDate }),
      setDismissAlert: (dismissAlert) => set({ dismissAlert }),
      setPlan: (plan) => set((state) => ({ profile: { ...state.profile, plan } })),
      setRestaurantId: (restaurantId) => set({ restaurantId }),
      saveForecastView: (view) =>
        set((state) => ({
          savedForecastViews: [
            ...state.savedForecastViews.filter((saved) => saved.name.toLowerCase() !== view.name.toLowerCase()),
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              ...view
            }
          ].slice(-12)
        })),
      deleteForecastView: (id) =>
        set((state) => ({
          savedForecastViews: state.savedForecastViews.filter((view) => view.id !== id)
        })),
      addActivityEvent: (event) =>
        set((state) => ({
          activityLog: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              at: new Date().toISOString(),
              ...event
            },
            ...state.activityLog
          ].slice(0, 50)
        }))
    }),
    {
      name: 'smartpurchase-horeca-store',
      partialize: (state) => ({
        profile: state.profile,
        selectedCategory: state.selectedCategory,
        forecastMode: state.forecastMode,
        startDate: state.startDate,
        endDate: state.endDate,
        dismissAlert: state.dismissAlert,
        restaurantId: state.restaurantId,
        savedForecastViews: state.savedForecastViews,
        activityLog: state.activityLog
      })
    }
  )
);
