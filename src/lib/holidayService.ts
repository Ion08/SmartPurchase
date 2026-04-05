import type { HolidayEvent, HolidayRegion } from '@/types';

type ImpactPhase = 'pre' | 'during' | 'post' | 'none';
type EventType = 'holiday' | 'seasonal-event';

interface EventProfile {
  id: string;
  eventType: EventType;
  pattern: RegExp;
  preOffsets: number[];
  duringOffsets: number[];
  postOffsets: number[];
  preMultiplier: number;
  duringMultiplier: number;
  postMultiplier: number;
  preReason: string;
  duringReason: string;
  postReason: string;
  confidencePenalty: number;
}

const EVENT_PROFILES: EventProfile[] = [
  {
    id: 'good-friday',
    eventType: 'holiday',
    pattern: /good friday|vinerea mare/i,
    preOffsets: [-2, -1],
    duringOffsets: [0],
    postOffsets: [1],
    preMultiplier: 1.1,
    duringMultiplier: 1.13,
    postMultiplier: 1.08,
    preReason: 'Shopping accelerates right before Good Friday and Easter weekend.',
    duringReason: 'Good Friday drives preparation purchases before Easter travel.',
    postReason: 'Demand remains elevated while households finish Easter prep.',
    confidencePenalty: 3
  },
  {
    id: 'easter',
    eventType: 'holiday',
    pattern: /easter|paste|pastele|pasti|pasca/i,
    preOffsets: [-3, -2, -1],
    duringOffsets: [0, 1],
    postOffsets: [2, 3],
    preMultiplier: 1.14,
    duringMultiplier: 0.82,
    postMultiplier: 0.9,
    preReason: 'Pre-holiday stock-up: families buy more before leaving the city.',
    duringReason: 'Holiday migration to villages lowers city demand during Easter.',
    postReason: 'Demand stays soft right after Easter while people return.',
    confidencePenalty: 4
  },
  {
    id: 'christmas',
    eventType: 'holiday',
    pattern: /christmas|craciun/i,
    preOffsets: [-3, -2, -1],
    duringOffsets: [0, 1],
    postOffsets: [2],
    preMultiplier: 1.16,
    duringMultiplier: 0.84,
    postMultiplier: 0.92,
    preReason: 'Strong pre-Christmas shopping basket drives higher demand.',
    duringReason: 'During Christmas, many customers stay home or travel.',
    postReason: 'Post-holiday demand is still below baseline for a short period.',
    confidencePenalty: 4
  },
  {
    id: 'new-year',
    eventType: 'holiday',
    pattern: /new year|anul nou/i,
    preOffsets: [-2, -1],
    duringOffsets: [0, 1],
    postOffsets: [2],
    preMultiplier: 1.2,
    duringMultiplier: 0.8,
    postMultiplier: 0.9,
    preReason: 'Year-end preparations create a clear stock-up spike.',
    duringReason: 'City demand drops while people celebrate and travel.',
    postReason: 'Demand normalizes gradually after New Year.',
    confidencePenalty: 4
  },
  {
    id: 'womens-day',
    eventType: 'holiday',
    pattern: /womens day|ziua femeii|valentine/i,
    preOffsets: [-1],
    duringOffsets: [0],
    postOffsets: [1],
    preMultiplier: 1.06,
    duringMultiplier: 1.11,
    postMultiplier: 0.97,
    preReason: 'Gift and dining preparation lifts demand the day before.',
    duringReason: 'Celebration traffic increases demand on event day.',
    postReason: 'A small cooldown follows after celebration events.',
    confidencePenalty: 2
  },
  {
    id: 'independence',
    eventType: 'holiday',
    pattern: /independence/i,
    preOffsets: [-1],
    duringOffsets: [0],
    postOffsets: [1],
    preMultiplier: 1.04,
    duringMultiplier: 1.08,
    postMultiplier: 0.97,
    preReason: 'Event preparation creates a mild pre-day uplift.',
    duringReason: 'Public celebrations increase short-term demand.',
    postReason: 'Demand eases after the event day.',
    confidencePenalty: 2
  },
  {
    id: 'victory-day',
    eventType: 'holiday',
    pattern: /victory/i,
    preOffsets: [-1],
    duringOffsets: [0],
    postOffsets: [1],
    preMultiplier: 1.03,
    duringMultiplier: 1.06,
    postMultiplier: 0.98,
    preReason: 'Small preparation effect before commemorative events.',
    duringReason: 'Event activity can temporarily lift transactions.',
    postReason: 'Short normalization after event traffic.',
    confidencePenalty: 2
  },
  {
    id: 'labour-day',
    eventType: 'holiday',
    pattern: /labour|ziua muncii/i,
    preOffsets: [-1],
    duringOffsets: [0, 1],
    postOffsets: [2],
    preMultiplier: 1.03,
    duringMultiplier: 0.88,
    postMultiplier: 0.95,
    preReason: 'Some pre-holiday buying appears before closures.',
    duringReason: 'Holiday outings and closures reduce urban demand.',
    postReason: 'Demand recovers gradually after Labour Day.',
    confidencePenalty: 3
  },
  {
    id: 'language-day',
    eventType: 'holiday',
    pattern: /language day|limba noastra/i,
    preOffsets: [-1],
    duringOffsets: [0],
    postOffsets: [1],
    preMultiplier: 1.02,
    duringMultiplier: 0.9,
    postMultiplier: 0.96,
    preReason: 'Minor pre-event purchases before schedule shifts.',
    duringReason: 'Public events can reduce regular shopping cadence.',
    postReason: 'Activity returns with a short lag.',
    confidencePenalty: 2
  },
  {
    id: 'black-friday',
    eventType: 'seasonal-event',
    pattern: /black friday/i,
    preOffsets: [-1],
    duringOffsets: [0],
    postOffsets: [1],
    preMultiplier: 1.07,
    duringMultiplier: 1.12,
    postMultiplier: 0.96,
    preReason: 'Promo anticipation starts increasing basket size.',
    duringReason: 'Discount-driven behavior generates a clear demand spike.',
    postReason: 'After promotions, demand usually cools briefly.',
    confidencePenalty: 3
  },
  {
    id: 'back-to-school',
    eventType: 'seasonal-event',
    pattern: /back to school|school start/i,
    preOffsets: [-2, -1],
    duringOffsets: [0],
    postOffsets: [1, 2],
    preMultiplier: 1.05,
    duringMultiplier: 1.08,
    postMultiplier: 1.03,
    preReason: 'Households prepare before school routines restart.',
    duringReason: 'School restart brings back weekday urban demand.',
    postReason: 'Higher routine demand persists for a few days.',
    confidencePenalty: 2
  }
];

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDaysUtc(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function dedupeEvents(events: HolidayEvent[]) {
  const seen = new Set<string>();
  return events.filter((event) => {
    const key = `${event.date}|${event.name}|${event.countryCode}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getOrthodoxEasterDate(year: number) {
  // Meeus Julian algorithm + Gregorian offset (valid for modern years used by app)
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;

  const julianDate = new Date(Date.UTC(year, month - 1, day));
  // 13 days offset for 1900-2099 between Julian and Gregorian calendars
  return addDaysUtc(julianDate, 13);
}

function getLastFridayOfNovember(year: number) {
  const date = new Date(Date.UTC(year, 10, 30));
  while (date.getUTCDay() !== 5) {
    date.setUTCDate(date.getUTCDate() - 1);
  }
  return date;
}

function getFirstSaturdayOfOctober(year: number) {
  const date = new Date(Date.UTC(year, 9, 1));
  while (date.getUTCDay() !== 6) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date;
}

function buildSeasonalAndMovableEvents(year: number, region: HolidayRegion): HolidayEvent[] {
  const easter = getOrthodoxEasterDate(year);
  const blackFriday = getLastFridayOfNovember(year);
  const wineFestival = getFirstSaturdayOfOctober(year);

  const events = [
    { date: addDaysUtc(easter, -2), name: 'Good Friday', localName: 'Vinerea mare' },
    { date: easter, name: 'Orthodox Easter Sunday', localName: 'Pastele' },
    { date: addDaysUtc(easter, 1), name: 'Orthodox Easter Monday', localName: 'A doua zi de Paste' },
    { date: new Date(Date.UTC(year, 1, 14)), name: 'Valentine\'s Day', localName: 'Valentine\'s Day' },
    { date: new Date(Date.UTC(year, 8, 1)), name: 'Back to School', localName: 'Back to School' },
    { date: blackFriday, name: 'Black Friday', localName: 'Black Friday' },
    { date: wineFestival, name: 'National Wine Day', localName: 'Ziua Vinului' }
  ];

  return events.map((event) => ({
    date: formatDate(event.date),
    name: event.name,
    localName: event.localName,
    countryCode: region,
    region,
    source: 'fallback' as const
  }));
}

function buildFixedHolidayEvents(year: number, region: HolidayRegion): HolidayEvent[] {
  const templates = [
    { month: 1, day: 1, name: 'New Year\'s Day', localName: 'Anul Nou' },
    { month: 1, day: 2, name: 'Day after New Year', localName: 'A doua zi de Anul Nou' },
    { month: 1, day: 7, name: 'Orthodox Christmas Day', localName: 'Craciunul pe stil vechi' },
    { month: 3, day: 8, name: 'International Women\'s Day', localName: 'Ziua Femeii' },
    { month: 5, day: 1, name: 'Labour Day', localName: 'Ziua Muncii' },
    { month: 5, day: 9, name: 'Victory Day', localName: 'Ziua Victoriei' },
    { month: 8, day: 27, name: 'Independence Day', localName: 'Ziua Independentei' },
    { month: 8, day: 31, name: 'Language Day', localName: 'Limba Noastra' },
    { month: 12, day: 25, name: 'Christmas Day', localName: 'Craciunul pe stil nou' }
  ] as const;

  return templates.map((template) => ({
    date: formatDate(new Date(Date.UTC(year, template.month - 1, template.day))),
    name: template.name,
    localName: template.localName,
    countryCode: region,
    region,
    source: 'fallback' as const
  }));
}

function resolveProfile(name: string) {
  return EVENT_PROFILES.find((profile) => profile.pattern.test(name));
}

function resolvePhase(profile: EventProfile, offsetDays: number): ImpactPhase {
  if (profile.preOffsets.includes(offsetDays)) return 'pre';
  if (profile.duringOffsets.includes(offsetDays)) return 'during';
  if (profile.postOffsets.includes(offsetDays)) return 'post';
  return 'none';
}

function phaseMultiplier(profile: EventProfile, phase: ImpactPhase) {
  if (phase === 'pre') return profile.preMultiplier;
  if (phase === 'during') return profile.duringMultiplier;
  if (phase === 'post') return profile.postMultiplier;
  return 1;
}

function phaseReason(profile: EventProfile, phase: ImpactPhase) {
  if (phase === 'pre') return profile.preReason;
  if (phase === 'during') return profile.duringReason;
  if (phase === 'post') return profile.postReason;
  return 'No special demand effect for this day.';
}

async function fetchNagerHolidayEvents(year: number, countryCode: string): Promise<HolidayEvent[]> {
  const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`, {
    headers: { accept: 'application/json' },
    cache: 'no-store'
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json() as Array<{ date: string; localName: string; name: string; countryCode: string }>;
  return data.map((entry) => ({
    date: entry.date,
    name: entry.name,
    localName: entry.localName,
    countryCode: entry.countryCode,
    region: 'RO',
    source: 'api' as const
  }));
}

export async function getHolidayEvents(year: number, region: HolidayRegion): Promise<HolidayEvent[]> {
  const apiCountry = 'RO';
  const [apiEvents, fixedEvents, seasonalEvents] = await Promise.all([
    fetchNagerHolidayEvents(year, apiCountry).catch(() => []),
    Promise.resolve(buildFixedHolidayEvents(year, region)),
    Promise.resolve(buildSeasonalAndMovableEvents(year, region))
  ]);

  const fallbackCombined = [...fixedEvents, ...seasonalEvents];
  const combined = region === 'RO'
    ? apiEvents
    : [...fallbackCombined, ...apiEvents.map((event) => ({ ...event, region }))];

  return dedupeEvents(combined);
}

export function getHolidaySignal(dateStr: string, holidays: HolidayEvent[]) {
  const target = new Date(dateStr);
  const dayMs = 1000 * 60 * 60 * 24;

  const candidates = holidays
    .map((holiday) => {
      const holidayDate = new Date(holiday.date);
      const offsetDays = Math.round((target.getTime() - holidayDate.getTime()) / dayMs);
      const normalized = normalizeName(holiday.localName || holiday.name);
      const profile = resolveProfile(normalized);
      if (!profile) return null;
      const phase = resolvePhase(profile, offsetDays);
      if (phase === 'none') return null;
      const multiplier = phaseMultiplier(profile, phase);
      const direction = multiplier > 1 ? 'up' as const : multiplier < 1 ? 'down' as const : 'flat' as const;
      const score = Math.abs(multiplier - 1) * 100 - Math.abs(offsetDays) * 3 + (offsetDays === 0 ? 3 : 0);
      return {
        holiday,
        profile,
        offsetDays,
        phase,
        multiplier,
        direction,
        score
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .sort((a, b) => b.score - a.score);

  const selected = candidates[0];
  if (!selected) {
    return {
      isHoliday: false,
      name: '',
      multiplier: 1,
      confidencePenalty: 0,
      source: 'fallback' as const,
      proximityDays: Infinity,
      direction: 'flat' as const,
      phase: 'none' as const,
      reason: 'No significant holiday or event effect detected for this date.',
      eventType: 'holiday' as const
    };
  }

  const name = selected.holiday.localName || selected.holiday.name;
  return {
    isHoliday: selected.offsetDays === 0,
    name,
    multiplier: selected.multiplier,
    confidencePenalty: selected.profile.confidencePenalty + (Math.abs(selected.offsetDays) > 1 ? 1 : 0),
    source: selected.holiday.source,
    // Keep existing sign semantics: positive values mean the holiday is in the future.
    proximityDays: -selected.offsetDays,
    direction: selected.direction,
    phase: selected.phase,
    reason: phaseReason(selected.profile, selected.phase),
    eventType: selected.profile.eventType
  };
}

export function summarizeUpcomingHolidays(holidays: HolidayEvent[], fromDate: string, limit = 5) {
  const start = new Date(fromDate);
  return holidays
    .map((holiday) => ({
      ...holiday,
      distanceDays: Math.round((new Date(holiday.date).getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    }))
    .filter((holiday) => holiday.distanceDays >= 0 && holiday.distanceDays <= 30)
    .sort((a, b) => a.distanceDays - b.distanceDays)
    .slice(0, limit);
}
