import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// GET /api/items?restaurantId=&category=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const category = searchParams.get('category');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    let query = supabase
      .from('items')
      .select(`
        id,
        restaurant_id,
        item_name,
        category_id,
        unit,
        stock_unit,
        cost_per_unit,
        current_stock,
        shelf_life_days,
        avg_daily_sales,
        is_active,
        created_at,
        updated_at,
        categories (id, name)
      `)
      .eq('restaurant_id', restaurantId)
      .is('deleted_at', null)
      .order('item_name', { ascending: true });

    if (category && category !== 'All categories') {
      query = query.eq('categories.name', category);
    }

    const { data: items, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Transform to camelCase for frontend compatibility
    const transformedItems = items?.map(item => ({
      id: item.id,
      restaurantId: item.restaurant_id,
      itemName: item.item_name,
      categoryId: item.category_id,
      unit: item.unit,
      stockUnit: item.stock_unit,
      costPerUnit: item.cost_per_unit,
      currentStock: item.current_stock,
      shelfLifeDays: item.shelf_life_days,
      avgDailySales: item.avg_daily_sales,
      isActive: item.is_active,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      category: item.categories,
    })) || [];

    return NextResponse.json(transformedItems);
  } catch (error) {
    console.error('Items GET error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// POST /api/items
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, itemName, categoryId, unit, stockUnit, costPerUnit, shelfLifeDays } = body;

    if (!restaurantId || !itemName || !categoryId || !unit || !stockUnit) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from('items')
      .insert({
        restaurant_id: restaurantId,
        item_name: itemName.toLowerCase().trim(),
        category_id: categoryId,
        unit,
        stock_unit: stockUnit,
        cost_per_unit: costPerUnit || 0,
        shelf_life_days: shelfLifeDays || null,
        current_stock: 0,
        avg_daily_sales: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Insert error: ${error.message}`);
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Items POST error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// PUT /api/items
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    // Map camelCase to snake_case
    const fieldMapping: Record<string, string> = {
      itemName: 'item_name',
      categoryId: 'category_id',
      stockUnit: 'stock_unit',
      costPerUnit: 'cost_per_unit',
      currentStock: 'current_stock',
      shelfLifeDays: 'shelf_life_days',
      avgDailySales: 'avg_daily_sales',
      isActive: 'is_active',
    };

    const updates: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const dbField = fieldMapping[key] || key;
        updates[dbField] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from('items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Update error: ${error.message}`);
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Items PUT error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// DELETE /api/items?id=
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Delete error: ${error.message}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Items DELETE error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
