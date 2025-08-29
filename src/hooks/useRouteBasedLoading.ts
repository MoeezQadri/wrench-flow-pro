import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

type DataType = 'customers' | 'invoices' | 'vehicles' | 'parts' | 'tasks' | 'mechanics' | 'vendors' | 'expenses' | 'attendance';

// Define minimal data requirements for each route - load only what's absolutely needed
const ROUTE_DATA_REQUIREMENTS: Record<string, DataType[]> = {
  '/': ['customers'], // Dashboard can start with minimal data
  '/dashboard': ['customers'],
  '/customers': ['customers'],
  '/invoices': ['invoices', 'customers'],
  '/invoices/new': ['customers'], // InvoiceForm will load its own data
  '/invoices/edit': ['invoices', 'customers'],
  '/tasks': ['tasks'],
  '/mechanics': ['mechanics'],
  '/parts': ['parts'],
  '/vehicles': ['vehicles'],
  '/expenses': ['expenses'],
  '/attendance': ['attendance'],
  '/reports': [], // Reports load their own data
  '/settings': [], // Settings don't need bulk data
};

export function useRouteBasedLoading() {
  const location = useLocation();
  
  // Determine required data for current route
  const requiredData = useMemo(() => {
    const path = location.pathname;
    
    // Check for exact matches first
    const exactMatch = ROUTE_DATA_REQUIREMENTS[path];
    if (exactMatch) {
      return exactMatch;
    }
    
    // Check for pattern matches - keep them minimal
    if (path.startsWith('/invoices/edit/')) {
      return ['invoices', 'customers'] as DataType[];
    }
    
    if (path.startsWith('/invoices/')) {
      return ['customers'] as DataType[]; // Invoice pages load their own specific data
    }
    
    if (path.startsWith('/customers/')) {
      return ['customers'] as DataType[];
    }
    
    if (path.startsWith('/reports/')) {
      return [] as DataType[]; // Reports handle their own data loading
    }
    
    // Default to no data - let components load what they need
    return [] as DataType[];
  }, [location.pathname]);

  const shouldLoadData = (dataType: DataType): boolean => {
    return requiredData.includes(dataType);
  };

  const isDataCritical = (dataType: DataType): boolean => {
    // Only customers are truly critical for initial load
    const criticalData = ['customers'];
    return criticalData.includes(dataType);
  };

  return {
    requiredData,
    shouldLoadData,
    isDataCritical,
    currentRoute: location.pathname
  };
}