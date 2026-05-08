import {
  parse,
  subHours,
  startOfDay,
  addHours,
  format,
  subDays,
  startOfWeek,
  startOfMonth,
  subMinutes,
  subMonths,
} from 'date-fns';
import './env';

const REFRESH_TIME = process.env.REFRESH_TIME || '04:00';

/**
 * Parses REFRESH_TIME into total hours. e.g. "04:00" -> 4.
 */
export function getOffsetHours(): number {
  const [hours] = REFRESH_TIME.split(':').map(Number);
  return hours || 0;
}

/**
 * Returns the "Business Day" boundary for a given timestamp.
 * A Business Day starts at REFRESH_TIME and ends at REFRESH_TIME the next day.
 * e.g., if REFRESH_TIME=04:00, 2024-05-01 03:00 -> 2024-04-30 00:00:00
 *
 * @param date The Date object to calculate from.
 * @returns A Date object representing midnight of that "Business Day".
 */
export function getBusinessDate(date: Date = new Date()): Date {
  const offset = getOffsetHours();
  const adjustedTime = subHours(date, offset);
  return startOfDay(adjustedTime);
}

/**
 * Returns the exact start Date/Time of the current "Business Day".
 */
export function getBusinessDayStart(date: Date = new Date()): Date {
  const bizDate = getBusinessDate(date);
  return addHours(bizDate, getOffsetHours());
}

/**
 * Formats a Date to ISO 8601 string without milliseconds.
 */
export function formatIso(date: Date = new Date()): string {
  return format(date, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

/**
 * Formats a Date to ISO 8601 YYYY-MM-DD for grouping.
 */
export function formatBusinessDateStr(date: Date): string {
  return format(getBusinessDate(date), 'yyyy-MM-dd');
}

/**
 * Parses a "since" or "until" relative/absolute string into an ISO string.
 * Supports: 3m (mins), 12h (hours), 30d (days), 3M (months) or YYYY-MM-DD.
 */
export function parseTimeString(timeStr?: string): string | undefined {
  if (!timeStr) return undefined;

  const match = timeStr.match(/^(\d+)([mhhdM])$/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const now = new Date();
    switch (unit) {
      case 'm': return formatIso(subMinutes(now, value));
      case 'h': return formatIso(subHours(now, value));
      case 'd': return formatIso(subDays(now, value));
      case 'M': return formatIso(subMonths(now, value));
    }
  }

  // Check absolute format
  if (/^\d{4}-\d{2}-\d{2}$/.test(timeStr)) {
    // Treat absolute date as starting at business day start
    const date = new Date(timeStr);
    return formatIso(getBusinessDayStart(date));
  }

  return undefined;
}

/**
 * Parses a "range" string into since and until ISO strings based on business logic.
 */
export function parseRange(range?: string): { since?: string; until?: string } {
  if (!range || range === 'all') return {};

  const now = new Date();
  const bizDate = getBusinessDate(now);
  const startOfBizToday = getBusinessDayStart(now);

  if (range === 'today') {
    return { since: formatIso(startOfBizToday) };
  }
  
  if (range === 'session' || range === 'cycle') {
    return { since: formatIso(startOfBizToday) };
  }
  
  if (range === 'yesterday') {
    const startOfBizYest = addHours(subDays(bizDate, 1), getOffsetHours());
    return {
      since: formatIso(startOfBizYest),
      until: formatIso(startOfBizToday),
    };
  }

  if (range === 'this_week') {
    // date-fns startOfWeek default is Sunday, adjust if needed.
    const weekStartBiz = startOfWeek(bizDate, { weekStartsOn: 1 }); // Monday
    return { since: formatIso(addHours(weekStartBiz, getOffsetHours())) };
  }

  if (range === 'this_month') {
    const monthStartBiz = startOfMonth(bizDate);
    return { since: formatIso(addHours(monthStartBiz, getOffsetHours())) };
  }

  return {};
}
