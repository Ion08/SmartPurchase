import { NextRequest, NextResponse } from 'next/server';
import { queryMany, queryOne } from '@/lib/db';

// GET /api/activity?restaurantId=&limit=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    const sql = `
      SELECT 
        id,
        restaurant_id as "restaurantId",
        event_type as "eventType",
        title,
        details,
        created_at as "createdAt"
      FROM activity_events
      WHERE restaurant_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const events = await queryMany(sql, [restaurantId, limit]);
    return NextResponse.json(events);
  } catch (error) {
    console.error('Activity GET error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

// POST /api/activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { restaurantId, eventType, title, details } = body;

    if (!restaurantId || !eventType || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sql = `
      INSERT INTO activity_events (restaurant_id, event_type, title, details)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const event = await queryOne(sql, [restaurantId, eventType, title, details || null]);
    return NextResponse.json(event);
  } catch (error) {
    console.error('Activity POST error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
