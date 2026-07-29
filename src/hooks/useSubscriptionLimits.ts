import { useAuthContext } from '@/context/AuthContext';

export const useSubscriptionLimits = () => {
  const { organization, currentUser } = useAuthContext();

  const getSubscriptionLimits = () => {
    const level = organization?.subscription_level || 'trial';
    
    switch (level.toLowerCase()) {
      case 'trial':
      case 'free':
        // 14-day full access — every feature unlocked
        return {
          maxUsers: 1,
          maxInvoices: 50,
          maxCustomers: 25,
          maxVehicles: 25,
          features: {
            reports: true,
            analytics: true,
            automatedReminders: true,
            smsEmailDelivery: true,
            reviewRequests: true,
            reactivationCampaigns: true,
            bookingForm: true,
            customBranding: true,
            api: true,
          }
        };
      case 'basic':
        return {
          maxUsers: 3,
          maxInvoices: 500,
          maxCustomers: 200,
          maxVehicles: 200,
          features: {
            reports: true,
            analytics: true,
            automatedReminders: false,
            smsEmailDelivery: false,
            reviewRequests: false,
            reactivationCampaigns: false,
            bookingForm: false,
            customBranding: false,
            api: false,
          }
        };
      case 'professional':
        return {
          maxUsers: 10,
          maxInvoices: 2000,
          maxCustomers: 1000,
          maxVehicles: 1000,
          features: {
            reports: true,
            analytics: true,
            automatedReminders: true,
            smsEmailDelivery: true,
            reviewRequests: true,
            reactivationCampaigns: false,
            bookingForm: false,
            customBranding: false,
            api: false,
          }
        };
      case 'enterprise':
        return {
          maxUsers: 50,
          maxInvoices: -1,
          maxCustomers: -1,
          maxVehicles: -1,
          features: {
            reports: true,
            analytics: true,
            automatedReminders: true,
            smsEmailDelivery: true,
            reviewRequests: true,
            reactivationCampaigns: true,
            bookingForm: true,
            customBranding: true,
            api: true,
          }
        };
      default:
        return {
          maxUsers: 1,
          maxInvoices: 50,
          maxCustomers: 25,
          maxVehicles: 25,
          features: {
            reports: false,
            analytics: false,
            automatedReminders: false,
            smsEmailDelivery: false,
            reviewRequests: false,
            reactivationCampaigns: false,
            bookingForm: false,
            customBranding: false,
            api: false,
          }
        };
    }
  };

  const canAccess = (feature: string) => {
    if (currentUser?.role === 'superuser' || currentUser?.role === 'superadmin') {
      return true; // Super admins can access everything
    }

    const limits = getSubscriptionLimits();
    return limits.features[feature as keyof typeof limits.features] ?? false;
  };

  const isWithinLimit = (type: 'users' | 'invoices' | 'customers' | 'vehicles', currentCount: number) => {
    if (currentUser?.role === 'superuser' || currentUser?.role === 'superadmin') {
      return true; // Super admins bypass limits
    }

    const limits = getSubscriptionLimits();
    const limitKey = `max${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof limits;
    const maxLimit = limits[limitKey] as number;
    
    return maxLimit === -1 || currentCount < maxLimit;
  };

  const getLimitWarning = (type: 'users' | 'invoices' | 'customers' | 'vehicles', currentCount: number) => {
    const limits = getSubscriptionLimits();
    const limitKey = `max${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof typeof limits;
    const maxLimit = limits[limitKey] as number;
    
    if (maxLimit === -1) return null;
    
    const percentage = (currentCount / maxLimit) * 100;
    
    if (percentage >= 90) {
      return {
        level: 'error' as const,
        message: `You've reached ${Math.round(percentage)}% of your ${type} limit (${currentCount}/${maxLimit}). Please upgrade your plan.`
      };
    } else if (percentage >= 75) {
      return {
        level: 'warning' as const,
        message: `You're approaching your ${type} limit (${currentCount}/${maxLimit}). Consider upgrading soon.`
      };
    }
    
    return null;
  };

  return {
    limits: getSubscriptionLimits(),
    canAccess,
    isWithinLimit,
    getLimitWarning,
    subscriptionLevel: organization?.subscription_level || 'trial',
    subscriptionStatus: organization?.subscription_status || 'active',
  };
};