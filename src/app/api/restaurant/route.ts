import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// POST /api/restaurant - Get or create restaurant by ID
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, name, address } = body;
    const restaurantKey = (restaurantId || name || '').trim();

    if (!restaurantKey) {
      return NextResponse.json({ error: 'Restaurant name is required' }, { status: 400 });
    }

    // Only check by name (case-insensitive)
    const { data: existingRestaurant, error: findError } = await supabase
      .from('restaurants')
      .select('id, name, address, type, plan, location_name, holiday_region, stop_buy_threshold, notifications_email, notifications_whatsapp, notifications_low_stock, notifications_forecast')
      .ilike('name', restaurantKey)
      .is('deleted_at', null)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw new Error(`Database error: ${findError.message}`);
    }

    if (existingRestaurant) {
      // Restaurant exists by name - return it
      return NextResponse.json({
        success: true,
        restaurant: {
          id: existingRestaurant.id,
          name: existingRestaurant.name,
          address: existingRestaurant.address,
          type: existingRestaurant.type,
          plan: existingRestaurant.plan,
          locationName: existingRestaurant.location_name,
          holidayRegion: existingRestaurant.holiday_region,
          stopBuyThreshold: existingRestaurant.stop_buy_threshold,
          notifications: {
            email: existingRestaurant.notifications_email,
            whatsapp: existingRestaurant.notifications_whatsapp,
            lowStock: existingRestaurant.notifications_low_stock,
            forecast: existingRestaurant.notifications_forecast,
          }
        },
        isNew: false
      });
    }

    // Generate UUID for new restaurant
    const newRestaurantId = crypto.randomUUID();

    // Restaurant doesn't exist - create new one
    const { data: newRestaurant, error: insertError } = await supabase
      .from('restaurants')
      .insert({
        id: newRestaurantId,
        name: restaurantKey,
        address: address || 'Unknown Address',
        type: 'independent',
        plan: 'Basic',
        location_name: restaurantKey,
        holiday_region: 'MD',
        stop_buy_threshold: 3,
        notifications_email: true,
        notifications_whatsapp: false,
        notifications_low_stock: true,
        notifications_forecast: true,
      })
      .select('id, name, address, type, plan, location_name, holiday_region, stop_buy_threshold, notifications_email, notifications_whatsapp, notifications_low_stock, notifications_forecast')
      .single();

    if (insertError) {
      throw new Error(`Failed to create restaurant: ${insertError.message}`);
    }

    if (!newRestaurant) {
      throw new Error('Failed to create restaurant: no data returned');
    }

    return NextResponse.json({
      success: true,
      restaurant: {
        id: newRestaurant.id,
        name: newRestaurant.name,
        address: newRestaurant.address,
        type: newRestaurant.type,
        plan: newRestaurant.plan,
        locationName: newRestaurant.location_name,
        holidayRegion: newRestaurant.holiday_region,
        stopBuyThreshold: newRestaurant.stop_buy_threshold,
        notifications: {
          email: newRestaurant.notifications_email,
          whatsapp: newRestaurant.notifications_whatsapp,
          lowStock: newRestaurant.notifications_low_stock,
          forecast: newRestaurant.notifications_forecast,
        }
      },
      isNew: true
    });

  } catch (error) {
    console.error('Restaurant API error:', error);
    return NextResponse.json(
      { error: `Failed to process restaurant: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
