import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

type DataType = 'customers' | 'invoices' | 'vehicles' | 'parts' | 'tasks' | 'mechanics' | 'vendors' | 'expenses' | 'attendance';

// Define which data each route needs
const ROUTE_DATA_REQUIREMENTS: Record<string, DataType[]> = {
  '/': ['customers', 'invoices'], // Dashboard needs basic data
  '/dashboard': ['customers', 'invoices'],
  '/customers': ['customers', 'vehicles'],
  '/invoices': ['invoices', 'customers', 'parts'],
  '/invoices/new': ['customers', 'vehicles', 'parts'],
  '/invoices/edit': ['invoices', 'customers', 'vehicles', 'parts'],
  '/tasks': ['tasks', 'mechanics', 'customers'],
  '/mechanics': ['mechanics'],
  '/parts': ['parts', 'vendors'],
  '/vehicles': ['vehicles', 'customers'],
  '/expenses': ['expenses', 'vendors'],
  '/attendance': ['attendance', 'mechanics'],
  '/reports': [], // Reports load their own data
  '/settings': ['customers', 'mechanics'], // Basic data for settings
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
    
    // Check for pattern matches
    if (path.startsWith('/invoices/edit/') || path.startsWith('/invoices/')) {
      return ['invoices', 'customers', 'vehicles', 'parts'] as DataType[];
    }
    
    if (path.startsWith('/customers/')) {
      return ['customers', 'vehicles', 'invoices'] as DataType[];
    }
    
    if (path.startsWith('/reports/')) {
      return [] as DataType[]; // Reports handle their own data loading
    }
    
    // Default to minimal data set
    return ['customers'] as DataType[];
  }, [location.pathname]);

  const shouldLoadData = (dataType: DataType): boolean => {
    return requiredData.includes(dataType);
  };

  const isDataCritical = (dataType: DataType): boolean => {
    // Critical data should load immediately, non-critical can be deferred
    const criticalData = ['customers', 'invoices'];
    return criticalData.includes(dataType);
  };

  return {
    requiredData,
    shouldLoadData,
    isDataCritical,
    currentRoute: location.pathname
  };
}