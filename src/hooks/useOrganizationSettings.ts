import { useAuthContext } from '@/context/AuthContext';
import { 
  formatCurrency, 
  getCurrencySymbol, 
  getCurrencyDetails, 
  getCountryDetails, 
  getCountryFlag,
  formatPhoneNumber,
  formatDate,
  formatNumber 
} from '@/utils/organization-utils';

/**
 * Custom hook to access organization settings and utilities
 */
export const useOrganizationSettings = () => {
  const { organization, currentUser } = useAuthContext();

  // Currency utilities
  const formatOrgCurrency = (amount: number, options?: Intl.NumberFormatOptions) => {
    return formatCurrency(amount, organization?.currency, options);
  };

  const getOrgCurrencySymbol = () => {
    return getCurrencySymbol(organization?.currency);
  };

  const getOrgCurrencyDetails = () => {
    return getCurrencyDetails(organization?.currency);
  };

  // Country utilities
  const getOrgCountryDetails = () => {
    return getCountryDetails(organization?.country);
  };

  const getOrgCountryFlag = () => {
    return getCountryFlag(organization?.country);
  };

  // Phone formatting
  const formatOrgPhone = (phone: string) => {
    return formatPhoneNumber(phone, organization?.country);
  };

  // Date formatting according to org locale
  const formatOrgDate = (date: Date | string) => {
    return formatDate(date, organization?.country);
  };

  // Number formatting according to org locale
  const formatOrgNumber = (number: number, options?: Intl.NumberFormatOptions) => {
    return formatNumber(number, organization?.country, options);
  };

  // Organization contact info
  const organizationInfo = {
    name: organization?.name || '',
    email: organization?.email || '',
    phone: organization?.phone || '',
    address: organization?.address || '',
    country: organization?.country || '',
    currency: organization?.currency || '',
    countryFlag: getOrgCountryFlag(),
    currencySymbol: getOrgCurrencySymbol(),
    formattedPhone: organization?.phone ? formatOrgPhone(organization.phone) : '',
  };

  return {
    organization,
    organizationInfo,
    formatCurrency: formatOrgCurrency,
    getCurrencySymbol: getOrgCurrencySymbol,
    getCurrencyDetails: getOrgCurrencyDetails,
    getCountryDetails: getOrgCountryDetails,
    getCountryFlag: getOrgCountryFlag,
    formatPhone: formatOrgPhone,
    formatDate: formatOrgDate,
    formatNumber: formatOrgNumber,
  };
};