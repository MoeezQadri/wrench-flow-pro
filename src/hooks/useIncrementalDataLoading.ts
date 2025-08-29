import { useState, useCallback, useRef } from 'react';
import { useDataCache } from './useDataCache';

type DataType = 'customers' | 'invoices' | 'vehicles' | 'parts' | 'tasks' | 'mechanics' | 'vendors' | 'expenses' | 'attendance';

interface LoadingState {
  isLoading: boolean;
  hasError: boolean;
  lastLoaded: number | null;
}

export function useIncrementalDataLoading() {
  const { fetchWithCache } = useDataCache('incremental-data', 2 * 60 * 1000); // 2 minute cache
  const [loadingStates, setLoadingStates] = useState<Record<DataType, LoadingState>>({
    customers: { isLoading: false, hasError: false, lastLoaded: null },
    invoices: { isLoading: false, hasError: false, lastLoaded: null },
    vehicles: { isLoading: false, hasError: false, lastLoaded: null },
    parts: { isLoading: false, hasError: false, lastLoaded: null },
    tasks: { isLoading: false, hasError: false, lastLoaded: null },
    mechanics: { isLoading: false, hasError: false, lastLoaded: null },
    vendors: { isLoading: false, hasError: false, lastLoaded: null },
    expenses: { isLoading: false, hasError: false, lastLoaded: null },
    attendance: { isLoading: false, hasError: false, lastLoaded: null }
  });

  const activeLoads = useRef<Set<DataType>>(new Set());

  const updateLoadingState = useCallback((dataType: DataType, update: Partial<LoadingState>) => {
    setLoadingStates(prev => ({
      ...prev,
      [dataType]: { ...prev[dataType], ...update }
    }));
  }, []);

  const loadDataType = useCallback(async (
    dataType: DataType,
    loadFunction: () => Promise<void>,
    priority: 'high' | 'low' = 'low'
  ) => {
    // Prevent duplicate loads
    if (activeLoads.current.has(dataType)) {
      console.log(`${dataType} already loading, skipping`);
      return;
    }

    // Check if recently loaded (within 1 minute for high priority, 5 minutes for low)
    const state = loadingStates[dataType];
    const now = Date.now();
    const recentlyLoaded = state.lastLoaded && 
      now - state.lastLoaded < (priority === 'high' ? 60 * 1000 : 5 * 60 * 1000);

    if (recentlyLoaded && !state.hasError) {
      console.log(`${dataType} recently loaded, skipping`);
      return;
    }

    activeLoads.current.add(dataType);
    updateLoadingState(dataType, { isLoading: true, hasError: false });

    try {
      await fetchWithCache(
        `${dataType}-data`,
        loadFunction,
        priority === 'high' // Force reload for high priority
      );
      
      updateLoadingState(dataType, { 
        isLoading: false, 
        hasError: false, 
        lastLoaded: now 
      });
      console.log(`${dataType} loaded successfully`);
    } catch (error) {
      console.error(`Error loading ${dataType}:`, error);
      updateLoadingState(dataType, { isLoading: false, hasError: true });
    } finally {
      activeLoads.current.delete(dataType);
    }
  }, [loadingStates, fetchWithCache, updateLoadingState]);

  const loadMultipleDataTypes = useCallback(async (
    requests: Array<{ dataType: DataType; loadFunction: () => Promise<void>; priority?: 'high' | 'low' }>
  ) => {
    // Sort by priority - high priority first
    const sortedRequests = requests.sort((a, b) => 
      (a.priority === 'high' ? 0 : 1) - (b.priority === 'high' ? 0 : 1)
    );

    // Load high priority items first
    const highPriorityRequests = sortedRequests.filter(req => req.priority === 'high');
    const lowPriorityRequests = sortedRequests.filter(req => req.priority !== 'high');

    // Load high priority in parallel
    if (highPriorityRequests.length > 0) {
      await Promise.allSettled(
        highPriorityRequests.map(req => 
          loadDataType(req.dataType, req.loadFunction, 'high')
        )
      );
    }

    // Load low priority with a small delay to not block UI
    if (lowPriorityRequests.length > 0) {
      setTimeout(() => {
        Promise.allSettled(
          lowPriorityRequests.map(req => 
            loadDataType(req.dataType, req.loadFunction, 'low')
          )
        );
      }, 100);
    }
  }, [loadDataType]);

  const getLoadingState = useCallback((dataType: DataType) => {
    return loadingStates[dataType];
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(state => state.isLoading);
  }, [loadingStates]);

  return {
    loadDataType,
    loadMultipleDataTypes,
    getLoadingState,
    isAnyLoading,
    loadingStates
  };
}