import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';

// GET /api/activity?restaurantId=&limit=
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!restaurantId) {
      return NextResponse.json({ error: 'restaurantId required' }, { status: 400 });
    }

    // Validate restaurantId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(restaurantId)) {
      return NextResponse.json(
        { error: 'Invalid restaurantId format. Please initialize your restaurant first.' },
        { status: 400 }
      );
    }

    const { data: events, error } = await supabase
      .from('activity_events')
      .select('id, restaurant_id, event_type, title, details, created_at')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Transform to camelCase
    const transformedEvents = events?.map(event => ({
      id: event.id,
      restaurantId: event.restaurant_id,
      eventType: event.event_type,
      title: event.title,
      details: event.details,
      createdAt: event.created_at,
    })) || [];

    return NextResponse.json(transformedEvents);
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

    const { data: event, error } = await supabase
      .from('activity_events')
      .insert({
        restaurant_id: restaurantId,
        event_type: eventType,
        title,
        details: details || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Insert error: ${error.message}`);
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error('Activity POST error:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
