import { useAuthContext } from '@/context/AuthContext';

export const useSubscriptionLimits = () => {
  const { organization, currentUser } = useAuthContext();

  const getSubscriptionLimits = () => {
    const level = organization?.subscription_level || 'trial';
    
    switch (level.toLowerCase()) {
      case 'trial':
        return {
          maxUsers: 2,
          maxInvoices: 50,
          maxCustomers: 25,
          maxVehicles: 25,
          features: {
            reports: false,
            analytics: false,
            api: false,
            customBranding: false,
          }
        };
      case 'basic':
        return {
          maxUsers: 5,
          maxInvoices: 500,
          maxCustomers: 100,
          maxVehicles: 100,
          features: {
            reports: true,
            analytics: false,
            api: false,
            customBranding: false,
          }
        };
      case 'professional':
        return {
          maxUsers: 20,
          maxInvoices: 2000,
          maxCustomers: 500,
          maxVehicles: 500,
          features: {
            reports: true,
            analytics: true,
            api: false,
            customBranding: true,
          }
        };
      case 'enterprise':
        return {
          maxUsers: -1, // unlimited
          maxInvoices: -1,
          maxCustomers: -1,
          maxVehicles: -1,
          features: {
            reports: true,
            analytics: true,
            api: true,
            customBranding: true,
          }
        };
      default:
        return {
          maxUsers: 1,
          maxInvoices: 10,
          maxCustomers: 5,
          maxVehicles: 5,
          features: {
            reports: false,
            analytics: false,
            api: false,
            customBranding: false,
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