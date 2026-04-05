import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';

// GET /api/forecast-views?restaurantId=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    const sql = `
      SELECT 
        id,
        restaurant_id as "restaurantId",
        name,
        selected_category as "selectedCategory",
        forecast_mode as "forecastMode",
        focus_item as "focusItem",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM forecast_views
      WHERE restaurant_id = $1
      ORDER BY updated_at DESC
    `;
    const views = await queryMany(sql, [restaurantId]);
    return NextResponse.json(views);
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
    await queryOne(`DELETE FROM forecast_views WHERE restaurant_id = $1 AND LOWER(name) = LOWER($2)`, [restaurantId, name]);

    // Insert new view
    const sql = `
      INSERT INTO forecast_views (restaurant_id, name, selected_category, forecast_mode, focus_item)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const view = await queryOne(sql, [restaurantId, name, selectedCategory || 'All categories', forecastMode || 'item', focusItem || null]);

    // Cleanup old views, keep only 12
    const cleanupSql = `
      DELETE FROM forecast_views
      WHERE id IN (
        SELECT id FROM forecast_views
        WHERE restaurant_id = $1
        ORDER BY updated_at DESC
        OFFSET 12
      )
    `;
    await queryOne(cleanupSql, [restaurantId]);

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

    await queryOne(`DELETE FROM forecast_views WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forecast views DELETE error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
