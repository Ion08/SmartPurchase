import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// GET /api/forecast-views?restaurantId=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    const { data: views, error } = await supabase
      .from('forecast_views')
      .select('id, restaurant_id, name, selected_category, forecast_mode, focus_item, created_at, updated_at')
      .eq('restaurant_id', restaurantId)
      .order('updated_at', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Transform to camelCase
    const transformedViews = views?.map(view => ({
      id: view.id,
      restaurantId: view.restaurant_id,
      name: view.name,
      selectedCategory: view.selected_category,
      forecastMode: view.forecast_mode,
      focusItem: view.focus_item,
      createdAt: view.created_at,
      updatedAt: view.updated_at,
    })) || [];

    return NextResponse.json(transformedViews);
  } catch (error) {
    console.error('Forecast views GET error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// POST /api/forecast-views
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, name, selectedCategory, forecastMode, focusItem } = body;

    if (!restaurantId || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Delete existing with same name
    await supabase
      .from('forecast_views')
      .delete()
      .eq('restaurant_id', restaurantId)
      .ilike('name', name);

    // Insert new view
    const { data: view, error: insertError } = await supabase
      .from('forecast_views')
      .insert({
        restaurant_id: restaurantId,
        name,
        selected_category: selectedCategory || 'All categories',
        forecast_mode: forecastMode || 'item',
        focus_item: focusItem || null,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Insert error: ${insertError.message}`);
    }

    // Cleanup old views - get IDs to keep
    const { data: viewsToKeep } = await supabase
      .from('forecast_views')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .order('updated_at', { ascending: false })
      .limit(12);

    if (viewsToKeep && viewsToKeep.length > 0) {
      const keepIds = viewsToKeep.map(v => v.id);
      await supabase
        .from('forecast_views')
        .delete()
        .eq('restaurant_id', restaurantId)
        .not('id', 'in', `(${keepIds.join(',')})`);
    }

    return NextResponse.json(view);
  } catch (error) {
    console.error('Forecast views POST error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// DELETE /api/forecast-views?id=
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('forecast_views')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Delete error: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forecast views DELETE error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
