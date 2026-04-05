'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function useRestaurantInit() {
  const restaurantId = useAppStore((state) => state.restaurantId);
  const setRestaurantId = useAppStore((state) => state.setRestaurantId);
  const profile = useAppStore((state) => state.profile);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Skip if already initialized with a valid UUID
    if (restaurantId) {
      setIsInitialized(true);
      return;
    }

    // Initialize restaurant on first load
    const initRestaurant = async () => {
      try {
        const response = await fetch('/api/restaurant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: profile.name,
            address: profile.address,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to initialize restaurant: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success && data.restaurant?.id) {
          setRestaurantId(data.restaurant.id);
          setIsInitialized(true);
        } else {
          throw new Error('Invalid response from restaurant API');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize restaurant';
        console.error('Restaurant initialization error:', message);
        setError(message);
        // Still mark as initialized to prevent infinite loops
        setIsInitialized(true);
      }
    };

    initRestaurant();
  }, [restaurantId, setRestaurantId, profile]);

  return { isInitialized, error };
}
