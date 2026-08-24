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

/**
 * Turns a calendar day (Date or "YYYY-MM-DD") into a timestamp at midday in the
 * organization's timezone, so the stored value always renders back as that same
 * day regardless of who views it.
 */
export const toOrgDayStart = (value: string | Date | null | undefined): string => {
  const day =
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)
      ? value.slice(0, 10)
      : formatOrgDate(value ?? new Date(), 'yyyy-MM-dd', '') ||
        formatOrgDate(new Date(), 'yyyy-MM-dd');

  return fromZonedTime(`${day}T12:00:00`, getOrgTimezone()).toISOString();
};

/** Today's calendar day in the organization's timezone, as "YYYY-MM-DD". */
export const orgToday = (): string => formatOrgDate(new Date(), 'yyyy-MM-dd');
