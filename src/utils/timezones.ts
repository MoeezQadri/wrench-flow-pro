/**
 * Timezone helpers for the organization settings picker.
 * The list comes from the browser's IANA database when available, with a
 * curated fallback for older environments.
 */

const FALLBACK_TIMEZONES = [
  'UTC',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Sao_Paulo',
  'America/Toronto',
  'Asia/Dhaka',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Riyadh',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Melbourne',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Berlin',
  'Europe/Istanbul',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Paris',
  'Pacific/Auckland',
];

export const ALL_TIMEZONES: string[] = (() => {
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] })
      .supportedValuesOf?.('timeZone');
    if (supported && supported.length) return supported;
  } catch {
    // ignore and fall back
  }
  return FALLBACK_TIMEZONES;
})();

/** Current UTC offset label for a timezone, e.g. "UTC+05:00". */
export const timezoneOffsetLabel = (timezone: string): string => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    }).formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value || '';
  } catch {
    return '';
  }
};

/** Default timezone for a country name (best guess; user can override). */
const COUNTRY_TIMEZONES: Record<string, string> = {
  Afghanistan: 'Asia/Kabul',
  Argentina: 'America/Argentina/Buenos_Aires',
  Australia: 'Australia/Sydney',
  Austria: 'Europe/Vienna',
  Bahrain: 'Asia/Bahrain',
  Bangladesh: 'Asia/Dhaka',
  Belgium: 'Europe/Brussels',
  Brazil: 'America/Sao_Paulo',
  Canada: 'America/Toronto',
  Chile: 'America/Santiago',
  China: 'Asia/Shanghai',
  Colombia: 'America/Bogota',
  Denmark: 'Europe/Copenhagen',
  Egypt: 'Africa/Cairo',
  Finland: 'Europe/Helsinki',
  France: 'Europe/Paris',
  Germany: 'Europe/Berlin',
  Ghana: 'Africa/Accra',
  Greece: 'Europe/Athens',
  'Hong Kong': 'Asia/Hong_Kong',
  India: 'Asia/Kolkata',
  Indonesia: 'Asia/Jakarta',
  Iraq: 'Asia/Baghdad',
  Ireland: 'Europe/Dublin',
  Israel: 'Asia/Jerusalem',
  Italy: 'Europe/Rome',
  Japan: 'Asia/Tokyo',
  Jordan: 'Asia/Amman',
  Kenya: 'Africa/Nairobi',
  Kuwait: 'Asia/Kuwait',
  Malaysia: 'Asia/Kuala_Lumpur',
  Mexico: 'America/Mexico_City',
  Morocco: 'Africa/Casablanca',
  Netherlands: 'Europe/Amsterdam',
  'New Zealand': 'Pacific/Auckland',
  Nigeria: 'Africa/Lagos',
  Norway: 'Europe/Oslo',
  Oman: 'Asia/Muscat',
  Pakistan: 'Asia/Karachi',
  Philippines: 'Asia/Manila',
  Poland: 'Europe/Warsaw',
  Portugal: 'Europe/Lisbon',
  Qatar: 'Asia/Qatar',
  Romania: 'Europe/Bucharest',
  Russia: 'Europe/Moscow',
  'Saudi Arabia': 'Asia/Riyadh',
  Singapore: 'Asia/Singapore',
  'South Africa': 'Africa/Johannesburg',
  'South Korea': 'Asia/Seoul',
  Spain: 'Europe/Madrid',
  'Sri Lanka': 'Asia/Colombo',
  Sweden: 'Europe/Stockholm',
  Switzerland: 'Europe/Zurich',
  Taiwan: 'Asia/Taipei',
  Thailand: 'Asia/Bangkok',
  Turkey: 'Europe/Istanbul',
  Ukraine: 'Europe/Kyiv',
  'United Arab Emirates': 'Asia/Dubai',
  'United Kingdom': 'Europe/London',
  'United States': 'America/New_York',
  Vietnam: 'Asia/Ho_Chi_Minh',
};

export const timezoneForCountry = (country?: string | null): string =>
  (country && COUNTRY_TIMEZONES[country]) || 'UTC';
