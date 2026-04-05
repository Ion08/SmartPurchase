import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';

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

    let sql = `
      SELECT 
        ir.id,
        ir.restaurant_id as "restaurantId",
        ir.item_id as "itemId",
        ir.record_date as "recordDate",
        ir.quantity_sold as "quantitySold",
        ir.stock_current as "stockCurrent",
        ir.cost_per_unit as "costPerUnit",
        ir.created_at as "createdAt",
        ir.updated_at as "updatedAt",
        jsonb_build_object(
          'id', i.id,
          'itemName', i.item_name,
          'unit', i.unit,
          'stockUnit', i.stock_unit,
          'category', jsonb_build_object(
            'id', c.id,
            'name', c.name
          )
        ) as item
      FROM inventory_records ir
      JOIN items i ON ir.item_id = i.id
      JOIN categories c ON i.category_id = c.id
      WHERE ir.restaurant_id = $1
    `;
    const params: (string | Date)[] = [restaurantId];

    if (startDate && endDate) {
      sql += ` AND ir.record_date BETWEEN $2 AND $3`;
      params.push(startDate, endDate);
    }

    if (category && category !== 'All categories') {
      sql += ` AND c.name = $${params.length + 1}`;
      params.push(category);
    }

    sql += ` ORDER BY ir.record_date DESC`;

    const records = await queryMany(sql, params);
    return NextResponse.json(records);
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

    // Try to update first, if not found insert
    const updateSql = `
      UPDATE inventory_records 
      SET quantity_sold = $4, stock_current = $5, cost_per_unit = $6, updated_at = NOW()
      WHERE restaurant_id = $1 AND item_id = $2 AND record_date = $3
      RETURNING *
    `;
    const updateResult = await queryOne(updateSql, [
      restaurantId,
      itemId,
      recordDate,
      quantitySold || 0,
      stockCurrent || 0,
      costPerUnit || 0
    ]);

    if (updateResult) {
      return NextResponse.json(updateResult);
    }

    // Insert new record
    const insertSql = `
      INSERT INTO inventory_records (restaurant_id, item_id, record_date, quantity_sold, stock_current, cost_per_unit)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const record = await queryOne(insertSql, [
      restaurantId,
      itemId,
      recordDate,
      quantitySold || 0,
      stockCurrent || 0,
      costPerUnit || 0
    ]);

    return NextResponse.json(record);
  } catch (error) {
    console.error('Inventory POST error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
