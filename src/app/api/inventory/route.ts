import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// GET /api/inventory?restaurantId=&startDate=&endDate=&category=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    let query = supabase
      .from('inventory_records')
      .select(`
        id,
        restaurant_id,
        item_id,
        record_date,
        quantity_sold,
        stock_current,
        cost_per_unit,
        created_at,
        updated_at,
        items (
          id,
          item_name,
          unit,
          stock_unit,
          categories (id, name)
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('record_date', { ascending: false });

    if (startDate && endDate) {
      query = query
        .gte('record_date', startDate)
        .lte('record_date', endDate);
    }

    if (category && category !== 'All categories') {
      query = query.eq('items.categories.name', category);
    }

    const { data: records, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Transform to camelCase for frontend compatibility
    const transformedRecords = records?.map(record => ({
      id: record.id,
      restaurantId: record.restaurant_id,
      itemId: record.item_id,
      recordDate: record.record_date,
      quantitySold: record.quantity_sold,
      stockCurrent: record.stock_current,
      costPerUnit: record.cost_per_unit,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      item: record.items,
    })) || [];

    return NextResponse.json(transformedRecords);
  } catch (error) {
    console.error('Inventory GET error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// POST /api/inventory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, itemId, recordDate, quantitySold, stockCurrent, costPerUnit } = body;

    if (!restaurantId || !itemId || !recordDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Try to update first
    const { data: updatedRecord, error: updateError } = await supabase
      .from('inventory_records')
      .update({
        quantity_sold: quantitySold || 0,
        stock_current: stockCurrent || 0,
        cost_per_unit: costPerUnit || 0,
        updated_at: new Date().toISOString(),
      })
      .eq('restaurant_id', restaurantId)
      .eq('item_id', itemId)
      .eq('record_date', recordDate)
      .select()
      .single();

    if (updateError && updateError.code !== 'PGRST116') {
      throw new Error(`Update error: ${updateError.message}`);
    }

    if (updatedRecord) {
      return NextResponse.json(updatedRecord);
    }

    // Insert new record if update didn't find anything
    const { data: newRecord, error: insertError } = await supabase
      .from('inventory_records')
      .insert({
        restaurant_id: restaurantId,
        item_id: itemId,
        record_date: recordDate,
        quantity_sold: quantitySold || 0,
        stock_current: stockCurrent || 0,
        cost_per_unit: costPerUnit || 0,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Insert error: ${insertError.message}`);
    }

    return NextResponse.json(newRecord);
  } catch (error) {
    console.error('Inventory POST error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
