import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';

// GET /api/items?restaurantId=&category=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const category = searchParams.get('category');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    let sql = `
      SELECT 
        i.id,
        i.restaurant_id as "restaurantId",
        i.item_name as "itemName",
        i.category_id as "categoryId",
        i.unit,
        i.stock_unit as "stockUnit",
        i.cost_per_unit as "costPerUnit",
        i.current_stock as "currentStock",
        i.shelf_life_days as "shelfLifeDays",
        i.avg_daily_sales as "avgDailySales",
        i.is_active as "isActive",
        i.created_at as "createdAt",
        i.updated_at as "updatedAt",
        jsonb_build_object('id', c.id, 'name', c.name) as category
      FROM items i
      JOIN categories c ON i.category_id = c.id
      WHERE i.restaurant_id = $1 AND i.deleted_at IS NULL
    `;
    const params: string[] = [restaurantId];

    if (category && category !== 'All categories') {
      sql += ` AND c.name = $2`;
      params.push(category);
    }

    sql += ` ORDER BY i.item_name ASC`;

    const items = await queryMany(sql, params);
    return NextResponse.json(items);
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

    const sql = `
      INSERT INTO items (restaurant_id, item_name, category_id, unit, stock_unit, cost_per_unit, shelf_life_days, current_stock, avg_daily_sales)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0)
      RETURNING *
    `;
    const item = await queryOne(sql, [
      restaurantId,
      itemName.toLowerCase().trim(),
      categoryId,
      unit,
      stockUnit,
      costPerUnit || 0,
      shelfLifeDays || null
    ]);

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

    // Build dynamic SET clause
    const allowedFields = ['itemName', 'categoryId', 'unit', 'stockUnit', 'costPerUnit', 'currentStock', 'shelfLifeDays', 'avgDailySales', 'isActive'];
    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        const dbField = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        updates.push(`${dbField} = $${paramIndex}`);
        values.push(value as string | number | boolean | null);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);
    const sql = `
      UPDATE items 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    const item = await queryOne(sql, values);

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

    const sql = `UPDATE items SET deleted_at = NOW() WHERE id = $1`;
    await queryOne(sql, [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Items DELETE error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
