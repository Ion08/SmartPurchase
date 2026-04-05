/**
 * Shared date utility functions
 * Centralizes date formatting and manipulation logic
 */

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

export function isValidDate(dateStr: string): boolean {
  const date = parseDate(dateStr);
  return !Number.isNaN(date.getTime());
}

export function isFutureDate(dateStr: string): boolean {
  const date = parseDate(dateStr);
  return date > new Date();
}

export function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(12, 0, 0, 0);
  return formatDate(date);
}

export function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return formatDate(date);
}

export function daysBetween(startStr: string, endStr: string): number {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function isWeekend(dateStr: string): boolean {
  const date = parseDate(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function formatDateReadable(dateStr: string, locale: string = 'en-US'): string {
  const date = parseDate(dateStr);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
