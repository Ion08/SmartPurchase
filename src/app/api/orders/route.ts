import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// GET /api/orders?restaurantId=&status=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    let query = supabase
      .from('orders')
      .select(`
        id,
        restaurant_id,
        order_date,
        status,
        total_estimated_cost,
        notes,
        created_at,
        updated_at,
        order_items (
          id,
          item_id,
          current_stock,
          forecasted_need,
          recommended_order_qty,
          estimated_cost,
          priority,
          stop_buy,
          days_of_stock,
          items (
            id,
            item_name,
            unit,
            categories (id, name)
          )
        )
      `)
      .eq('restaurant_id', restaurantId)
      .order('order_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Transform to camelCase
    const transformedOrders = orders?.map(order => ({
      id: order.id,
      restaurantId: order.restaurant_id,
      orderDate: order.order_date,
      status: order.status,
      totalEstimatedCost: order.total_estimated_cost,
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      orderItems: order.order_items?.map((item: Record<string, unknown>) => ({
        id: item.id,
        itemId: item.item_id,
        currentStock: item.current_stock,
        forecastedNeed: item.forecasted_need,
        recommendedOrderQty: item.recommended_order_qty,
        estimatedCost: item.estimated_cost,
        priority: item.priority,
        stopBuy: item.stop_buy,
        daysOfStock: item.days_of_stock,
        item: item.items,
      })) || [],
    })) || [];

    return NextResponse.json(transformedOrders);
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// POST /api/orders
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, notes, items } = body;

    if (!restaurantId || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const totalCost = items.reduce((sum: number, item: { estimatedCost?: number }) => sum + (item.estimatedCost || 0), 0);

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurantId,
        notes: notes || null,
        total_estimated_cost: totalCost,
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error(`Failed to create order: ${orderError?.message}`);
    }

    // Insert order items
    const orderItemsData = items.map((item: {
      itemId: string;
      currentStock: number;
      forecastedNeed: number;
      recommendedOrderQty: number;
      estimatedCost: number;
      priority: string;
      stopBuy: boolean;
      daysOfStock: number;
    }) => ({
      order_id: order.id,
      item_id: item.itemId,
      current_stock: item.currentStock,
      forecasted_need: item.forecastedNeed,
      recommended_order_qty: item.recommendedOrderQty,
      estimated_cost: item.estimatedCost,
      priority: item.priority,
      stop_buy: item.stopBuy,
      days_of_stock: item.daysOfStock,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) {
      console.error('Error inserting order items:', itemsError);
    }

    // Return full order
    const { data: fullOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        id,
        restaurant_id,
        order_date,
        status,
        total_estimated_cost,
        notes,
        created_at,
        updated_at,
        order_items (
          id,
          item_id,
          current_stock,
          forecasted_need,
          recommended_order_qty,
          estimated_cost,
          priority,
          stop_buy,
          days_of_stock,
          items (
            id,
            item_name,
            unit,
            categories (id, name)
          )
        )
      `)
      .eq('id', order.id)
      .single();

    if (fetchError || !fullOrder) {
      // Return basic order if full fetch fails
      return NextResponse.json(order);
    }

    // Transform to camelCase
    const transformedOrder = {
      id: fullOrder.id,
      restaurantId: fullOrder.restaurant_id,
      orderDate: fullOrder.order_date,
      status: fullOrder.status,
      totalEstimatedCost: fullOrder.total_estimated_cost,
      notes: fullOrder.notes,
      createdAt: fullOrder.created_at,
      updatedAt: fullOrder.updated_at,
      orderItems: fullOrder.order_items?.map((item: Record<string, unknown>) => ({
        id: item.id,
        itemId: item.item_id,
        currentStock: item.current_stock,
        forecastedNeed: item.forecasted_need,
        recommendedOrderQty: item.recommended_order_qty,
        estimatedCost: item.estimated_cost,
        priority: item.priority,
        stopBuy: item.stop_buy,
        daysOfStock: item.days_of_stock,
        item: item.items,
      })) || [],
    };

    return NextResponse.json(transformedOrder);
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// PUT /api/orders - update status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (status) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    updates.updated_at = new Date().toISOString();

    const { data: order, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Update error: ${error.message}`);
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Orders PUT error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
