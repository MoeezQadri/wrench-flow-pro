import { format } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

/**
 * Organization-scoped date/time formatting.
 *
 * All invoice / payment dates are stored as timestamps. Rendering them with the
 * viewer's browser timezone makes the same invoice look like a different day for
 * different users, so everything is formatted in the organization's timezone.
 */

const browserTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

let orgTimezone: string | null = null;

/** Called when the organization is loaded/updated (see AuthContext). */
export const setOrgTimezone = (timezone?: string | null) => {
  orgTimezone = timezone && timezone.trim() ? timezone.trim() : null;
};

export const getOrgTimezone = (): string => orgTimezone || browserTimezone();

const toDate = (value: string | Date | null | undefined): Date | null => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

/** e.g. "24 Aug 2026" — the organization's calendar day for this timestamp. */
export const formatOrgDate = (
  value: string | Date | null | undefined,
  pattern = 'dd MMM yyyy',
  fallback = 'N/A'
): string => {
  const date = toDate(value);
  if (!date) return fallback;
  return formatInTimeZone(date, getOrgTimezone(), pattern);
};

/** e.g. "24 Aug 2026, 6:04 PM" in the organization's timezone. */
export const formatOrgDateTime = (
  value: string | Date | null | undefined,
  pattern = "dd MMM yyyy, h:mm a",
  fallback = 'N/A'
): string => formatOrgDate(value, pattern, fallback);

/** "YYYY-MM-DD" for the organization's calendar day — good for date inputs. */
export const toOrgDateInputValue = (value: string | Date | null | undefined): string =>
  formatOrgDate(value, 'yyyy-MM-dd', '');

/** Calendar day selected in a browser control, without applying a timezone shift. */
export const selectedCalendarDay = (value: string | Date): string => {
  if (typeof value === 'string') {
    const match = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? '' : format(date, 'yyyy-MM-dd');
};

/** A local-noon Date for date-picker controls; avoids UTC-midnight moving a day. */
export const calendarDayToPickerDate = (day: string): Date => {
  const [year, month, date] = day.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, date, 12, 0, 0, 0);
};

/** Start/end timestamp for an organization calendar day, used by range queries. */
export const toOrgDayBoundary = (value: string | Date, endOfDay = false): string => {
  const day = selectedCalendarDay(value);
  const time = endOfDay ? '23:59:59.999' : '00:00:00.000';
  return fromZonedTime(`${day}T${time}`, getOrgTimezone()).toISOString();
};

/** Whole calendar days between two date-only values, independent of timezone. */
export const calendarDayDifference = (later: string, earlier: string): number => {
  const laterParts = selectedCalendarDay(later).split('-').map(Number);
  const earlierParts = selectedCalendarDay(earlier).split('-').map(Number);
  if (laterParts.length !== 3 || earlierParts.length !== 3) return 0;
  return Math.floor(
    (Date.UTC(laterParts[0], laterParts[1] - 1, laterParts[2]) -
      Date.UTC(earlierParts[0], earlierParts[1] - 1, earlierParts[2])) /
      86_400_000
  );
};

/** Compare stored timestamps by organization calendar day to picker boundaries. */
export const isOrgDayWithinRange = (value: string, start: Date, end: Date): boolean => {
  const day = toOrgDateInputValue(value);
  const startDay = selectedCalendarDay(start);
  const endDay = selectedCalendarDay(end);
  return Boolean(day && startDay && endDay && day >= startDay && day <= endDay);
};

/**
 * Turns a calendar day (Date or "YYYY-MM-DD") into a timestamp at midday in the
 * organization's timezone, so the stored value always renders back as that same
 * day regardless of who views it.
 */
export const toOrgDayStart = (value: string | Date | null | undefined): string => {
  const day =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)
      ? value.slice(0, 10)
      : value instanceof Date
        ? selectedCalendarDay(value)
        : formatOrgDate(value ?? new Date(), 'yyyy-MM-dd', '') || orgToday();

  return fromZonedTime(`${day}T12:00:00`, getOrgTimezone()).toISOString();
};

/** Today's calendar day in the organization's timezone, as "YYYY-MM-DD". */
export const orgToday = (): string => formatOrgDate(new Date(), 'yyyy-MM-dd');
