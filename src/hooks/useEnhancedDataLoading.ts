import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ConnectionMonitor, LoadingRecovery, RequestDeduplication } from '@/utils/supabase-client-config';
import { toast } from 'sonner';
import { useOrganizationFilter } from './useOrganizationFilter';
import type { Database } from '@/integrations/supabase/types';

interface DataLoadingOptions {
  enableRetry?: boolean;
  enableDeduplication?: boolean;
  enableTimeout?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

export const useEnhancedDataLoading = <T extends Record<string, any>>(
  tableName: keyof Database['public']['Tables'],
  options: DataLoadingOptions = {}
) => {
  const {
    enableRetry = true,
    enableDeduplication = true,
    enableTimeout = true,
    retryAttempts = 3,
    retryDelay = 1000,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState({ isOnline: true, reconnectAttempts: 0 });
  
  const retryCountRef = useRef(0);
  const { organizationId, canAccessAllOrganizations } = useOrganizationFilter();
  const connectionMonitor = ConnectionMonitor.getInstance();

  // Monitor connection status
  useEffect(() => {
    const unsubscribe = connectionMonitor.addListener((isOnline) => {
      setConnectionStatus(prev => ({ ...prev, isOnline }));
      if (isOnline && error && error.includes('network')) {
        console.log('Connection restored, retrying data load...');
        loadData();
      }
    });

    return unsubscribe;
  }, [error]);

  const applyOrganizationFilter = useCallback((query: any) => {
    if (canAccessAllOrganizations) {
      return query;
    }
    
    if (!organizationId) {
      return query.eq('organization_id', 'no-match');
    }
    
    return query.eq('organization_id', organizationId);
  }, [organizationId, canAccessAllOrganizations]);

  const loadData = useCallback(async (forceRefresh = false) => {
    if (loading && !forceRefresh) {
      console.log(`${tableName} already loading, skipping duplicate request`);
      return;
    }

    const requestKey = `load-${tableName}-${organizationId}`;
    
    if (!forceRefresh && enableDeduplication) {
      try {
        return await RequestDeduplication.deduplicate(requestKey, () => performDataLoad());
      } catch (err: any) {
        handleLoadError(err);
      }
    } else {
      return performDataLoad();
    }
  }, [tableName, organizationId, loading, enableDeduplication]);

  const performDataLoad = async (): Promise<T[]> => {
    const loadingKey = `${tableName}-loading`;
    
    setLoading(true);
    setError(null);
    retryCountRef.current = 0;

    // Start loading timeout if enabled
    if (enableTimeout) {
      LoadingRecovery.startLoadingTimer(loadingKey, () => {
        console.warn(`Loading timeout for ${tableName}`);
        setError('Loading is taking longer than expected. You can try refreshing the page.');
        toast.error(`Loading ${tableName} is taking too long. Try refreshing the page.`, {
          action: {
            label: 'Refresh',
            onClick: () => window.location.reload(),
          },
        });
      });
    }

    try {
      if (!connectionStatus.isOnline) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      console.log(`Loading ${tableName} data...`);
      
      let query = supabase.from(tableName as any).select('*');
      query = applyOrganizationFilter(query);
      
      const { data: fetchedData, error: fetchError } = await query;
      
      if (fetchError) {
        throw fetchError;
      }

      const safeData = Array.isArray(fetchedData) ? (fetchedData as unknown as T[]) : [];
      console.log(`${tableName} loaded:`, safeData.length, 'records');
      
      setData(safeData);
      setError(null);
      retryCountRef.current = 0;

      return safeData;
    } catch (err: any) {
      await handleLoadError(err);
      throw err;
    } finally {
      setLoading(false);
      if (enableTimeout) {
        LoadingRecovery.clearLoadingTimer(loadingKey);
      }
    }
  };

  const handleLoadError = async (err: any) => {
    console.error(`Error loading ${tableName}:`, err);
    
    let errorMessage = err?.message || `Failed to load ${tableName}`;
    
    // Handle specific error types
    if (err.name === 'AbortError' || errorMessage.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
    } else if (err.code === 'PGRST301' || errorMessage.includes('JWT')) {
      errorMessage = 'Session expired. Please refresh the page and log in again.';
    } else if (!connectionStatus.isOnline) {
      errorMessage = 'No internet connection. Please check your network.';
    }

    setError(errorMessage);

    // Retry logic
    if (enableRetry && retryCountRef.current < retryAttempts && connectionStatus.isOnline) {
      retryCountRef.current++;
      const delay = retryDelay * retryCountRef.current;
      
      console.log(`Retrying ${tableName} load in ${delay}ms (attempt ${retryCountRef.current}/${retryAttempts})`);
      
      setTimeout(() => {
        loadData(true);
      }, delay);
    } else {
      toast.error(errorMessage, {
        action: {
          label: 'Retry',
          onClick: () => loadData(true),
        },
      });
    }
  };

  const forceRefresh = useCallback(() => {
    console.log(`Force refreshing ${tableName} data`);
    RequestDeduplication.clearPendingRequest(`load-${tableName}-${organizationId}`);
    LoadingRecovery.clearLoadingTimer(`${tableName}-loading`);
    setError(null);
    loadData(true);
  }, [tableName, organizationId, loadData]);

  const getDebugInfo = useCallback(() => {
    return {
      tableName,
      dataCount: data.length,
      loading,
      error,
      retryCount: retryCountRef.current,
      connectionStatus,
      organizationId,
      canAccessAllOrganizations,
    };
  }, [tableName, data.length, loading, error, connectionStatus, organizationId, canAccessAllOrganizations]);

  return {
    data,
    setData,
    loading,
    error,
    connectionStatus,
    loadData,
    forceRefresh,
    getDebugInfo,
  };
};