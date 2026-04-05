import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';

// GET /api/orders?restaurantId=&status=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    let sql = `
      SELECT 
        o.id,
        o.restaurant_id as "restaurantId",
        o.order_date as "orderDate",
        o.status,
        o.total_estimated_cost as "totalEstimatedCost",
        o.notes,
        o.created_at as "createdAt",
        o.updated_at as "updatedAt",
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', oi.id,
              'itemId', oi.item_id,
              'currentStock', oi.current_stock,
              'forecastedNeed', oi.forecasted_need,
              'recommendedOrderQty', oi.recommended_order_qty,
              'estimatedCost', oi.estimated_cost,
              'priority', oi.priority,
              'stopBuy', oi.stop_buy,
              'daysOfStock', oi.days_of_stock,
              'item', jsonb_build_object(
                'id', i.id,
                'itemName', i.item_name,
                'unit', i.unit,
                'category', jsonb_build_object('id', c.id, 'name', c.name)
              )
            ) ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::jsonb
        ) as "orderItems"
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN items i ON oi.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE o.restaurant_id = $1
    `;
    const params: (string | null)[] = [restaurantId];

    if (status) {
      sql += ` AND o.status = $2`;
      params.push(status);
    }

    sql += ` GROUP BY o.id ORDER BY o.order_date DESC`;

    const orders = await queryMany(sql, params);
    return NextResponse.json(orders);
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
    const orderSql = `
      INSERT INTO orders (restaurant_id, notes, total_estimated_cost)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const order = await queryOne(orderSql, [restaurantId, notes || null, totalCost]);

    // Insert order items
    for (const item of items as Array<{
      itemId: string;
      currentStock: number;
      forecastedNeed: number;
      recommendedOrderQty: number;
      estimatedCost: number;
      priority: string;
      stopBuy: boolean;
      daysOfStock: number;
    }>) {
      const itemSql = `
        INSERT INTO order_items (order_id, item_id, current_stock, forecasted_need, recommended_order_qty, estimated_cost, priority, stop_buy, days_of_stock)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `;
      await queryOne(itemSql, [
        order.id,
        item.itemId,
        item.currentStock,
        item.forecastedNeed,
        item.recommendedOrderQty,
        item.estimatedCost,
        item.priority,
        item.stopBuy,
        item.daysOfStock
      ]);
    }

    // Return full order with items
    const fullOrderSql = `
      SELECT 
        o.*,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', oi.id,
              'itemId', oi.item_id,
              'currentStock', oi.current_stock,
              'forecastedNeed', oi.forecasted_need,
              'recommendedOrderQty', oi.recommended_order_qty,
              'estimatedCost', oi.estimated_cost,
              'priority', oi.priority,
              'stopBuy', oi.stop_buy,
              'daysOfStock', oi.days_of_stock,
              'item', jsonb_build_object(
                'id', i.id,
                'itemName', i.item_name,
                'unit', i.unit,
                'category', jsonb_build_object('id', c.id, 'name', c.name)
              )
            ) ORDER BY oi.id
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'::jsonb
        ) as "orderItems"
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN items i ON oi.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE o.id = $1
      GROUP BY o.id
    `;
    const fullOrder = await queryOne(fullOrderSql, [order.id]);

    return NextResponse.json(fullOrder);
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

    const sql = `
      UPDATE orders 
      SET status = $2, notes = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    const order = await queryOne(sql, [id, status, notes]);

    return NextResponse.json(order);
  } catch (error) {
    console.error('Orders PUT error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
