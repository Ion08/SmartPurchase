import { NextRequest, NextResponse } from 'next/server';
import { getHolidayEvents } from '@/lib/holidayService';
import type { HolidayRegion } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearParam = Number(searchParams.get('year'));
  const regionParam = (searchParams.get('region') ?? 'MD').toUpperCase() as HolidayRegion;

  const year = Number.isFinite(yearParam) ? yearParam : new Date().getFullYear();
  const region: HolidayRegion = ['MD', 'RO', 'GLOBAL'].includes(regionParam) ? regionParam : 'MD';

  const events = await getHolidayEvents(year, region);
  return NextResponse.json({ year, region, events });
}
