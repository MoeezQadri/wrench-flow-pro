import { GLOBAL_COUNTRIES, GLOBAL_CURRENCIES, type Country, type Currency } from '@/utils/global-data';

/**
 * Format currency amount according to organization's currency settings
 */
export const formatCurrency = (
  amount: number, 
  currencyCode?: string, 
  options: Intl.NumberFormatOptions = {}
): string => {
  if (!currencyCode) {
    return `$${amount.toFixed(2)}`; // Default to USD format
  }

  const currency = GLOBAL_CURRENCIES.find(c => c.code === currencyCode);
  if (!currency) {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount);
  } catch (error) {
    // Fallback if currency is not supported by Intl.NumberFormat
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
};

/**
 * Get currency symbol for a given currency code
 */
export const getCurrencySymbol = (currencyCode?: string): string => {
  if (!currencyCode) return '$';
  
  const currency = GLOBAL_CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};

/**
 * Get currency details by currency code
 */
export const getCurrencyDetails = (currencyCode?: string): Currency | null => {
  if (!currencyCode) return null;
  return GLOBAL_CURRENCIES.find(c => c.code === currencyCode) || null;
};

/**
 * Get country details by country name
 */
export const getCountryDetails = (countryName?: string): Country | null => {
  if (!countryName) return null;
  return GLOBAL_COUNTRIES.find(c => c.name === countryName) || null;
};

/**
 * Get country flag emoji by country name
 */
export const getCountryFlag = (countryName?: string): string => {
  if (!countryName) return '🌍';
  
  const country = GLOBAL_COUNTRIES.find(c => c.name === countryName);
  return country?.flag || '🌍';
};

/**
 * Format phone number according to country standards
 */
export const formatPhoneNumber = (phone: string, countryName?: string): string => {
  if (!phone) return '';
  
  // Basic phone formatting - can be enhanced based on country
  const cleaned = phone.replace(/\D/g, '');
  
  // Default US format for now - can be expanded for other countries
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
  }
  
  return phone; // Return as-is if doesn't match common patterns
};

/**
 * Format address according to country conventions
 */
export const formatAddress = (address: string, countryName?: string): string => {
  if (!address) return '';
  
  // Basic address formatting - can be enhanced based on country
  return address.trim();
};

/**
 * Get locale string for Intl formatting based on country
 */
export const getLocaleFromCountry = (countryName?: string): string => {
  if (!countryName) return 'en-US';
  
  // Common country to locale mappings
  const countryLocaleMap: Record<string, string> = {
    'United States': 'en-US',
    'United Kingdom': 'en-GB',
    'Germany': 'de-DE',
    'France': 'fr-FR',
    'Spain': 'es-ES',
    'Italy': 'it-IT',
    'Japan': 'ja-JP',
    'China': 'zh-CN',
    'India': 'en-IN',
    'Canada': 'en-CA',
    'Australia': 'en-AU',
    'Brazil': 'pt-BR',
    'Mexico': 'es-MX',
    'Netherlands': 'nl-NL',
    'Sweden': 'sv-SE',
    'Norway': 'nb-NO',
    'Denmark': 'da-DK',
    'Finland': 'fi-FI',
  };
  
  return countryLocaleMap[countryName] || 'en-US';
};

/**
 * Format date according to organization's country locale
 */
export const formatDate = (date: Date | string, countryName?: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = getLocaleFromCountry(countryName);
  
  try {
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return dateObj.toLocaleDateString('en-US');
  }
};

/**
 * Format number according to organization's locale
 */
export const formatNumber = (
  number: number, 
  countryName?: string, 
  options: Intl.NumberFormatOptions = {}
): string => {
  const locale = getLocaleFromCountry(countryName);
  
  try {
    return new Intl.NumberFormat(locale, options).format(number);
  } catch (error) {
    return number.toString();
  }
};

/**
 * Get timezone suggestions based on country
 */
export const getTimezonesByCountry = (countryName?: string): string[] => {
  if (!countryName) return ['UTC'];
  
  // Basic timezone mappings for common countries
  const countryTimezones: Record<string, string[]> = {
    'United States': ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu'],
    'United Kingdom': ['Europe/London'],
    'Germany': ['Europe/Berlin'],
    'France': ['Europe/Paris'],
    'Japan': ['Asia/Tokyo'],
    'Australia': ['Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth'],
    'Canada': ['America/Toronto', 'America/Vancouver', 'America/Edmonton'],
    'India': ['Asia/Kolkata'],
    'China': ['Asia/Shanghai'],
    'Brazil': ['America/Sao_Paulo'],
    'Mexico': ['America/Mexico_City'],
  };
  
  return countryTimezones[countryName] || ['UTC'];
};