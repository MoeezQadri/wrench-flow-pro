import { useState, useCallback, useRef } from 'react';

interface LoadedData {
  invoices: boolean;
  customers: boolean;
  parts: boolean;
  tasks: boolean;
  mechanics: boolean;
  vehicles: boolean;
  vendors: boolean;
  expenses: boolean;
  attendance: boolean;
}

export const useSmartDataLoading = () => {
  const [loadedData, setLoadedData] = useState<LoadedData>({
    invoices: false,
    customers: false,
    parts: false,
    tasks: false,
    mechanics: false,
    vehicles: false,
    vendors: false,
    expenses: false,
    attendance: false
  });
  
  const loadingInProgress = useRef<Set<keyof LoadedData>>(new Set());

  const markAsLoaded = useCallback((dataType: keyof LoadedData) => {
    setLoadedData(prev => ({ ...prev, [dataType]: true }));
    loadingInProgress.current.delete(dataType);
  }, []);

  const isLoaded = useCallback((dataType: keyof LoadedData) => {
    return loadedData[dataType];
  }, [loadedData]);

  const isLoading = useCallback((dataType: keyof LoadedData) => {
    return loadingInProgress.current.has(dataType);
  }, []);

  const smartLoad = useCallback(async (
    dataType: keyof LoadedData,
    loadFunction: () => Promise<void>,
    forceReload = false
  ) => {
    // Skip if already loaded and not forcing reload
    if (isLoaded(dataType) && !forceReload) {
      console.log(`${dataType} already loaded, skipping`);
      return;
    }

    // Skip if already loading (unless forcing reload)
    if (isLoading(dataType) && !forceReload) {
      console.log(`${dataType} already loading, skipping`);
      return;
    }

    loadingInProgress.current.add(dataType);
    
    try {
      console.log(`Smart loading ${dataType}${forceReload ? ' (forced)' : ''}...`);
      await loadFunction();
      markAsLoaded(dataType);
      console.log(`${dataType} loaded successfully`);
    } catch (error) {
      console.error(`Error loading ${dataType}:`, error);
      loadingInProgress.current.delete(dataType);
      throw error;
    }
  }, [isLoaded, isLoading, markAsLoaded]);

  const resetLoadedState = useCallback((dataType?: keyof LoadedData) => {
    if (dataType) {
      setLoadedData(prev => ({ ...prev, [dataType]: false }));
    } else {
      setLoadedData({
        invoices: false,
        customers: false,
        parts: false,
        tasks: false,
        mechanics: false,
        vehicles: false,
        vendors: false,
        expenses: false,
        attendance: false
      });
    }
  }, []);

  return {
    smartLoad,
    isLoaded,
    isLoading,
    markAsLoaded,
    resetLoadedState,
    loadedData
  };
};