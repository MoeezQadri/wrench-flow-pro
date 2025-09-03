import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useDataContext } from '@/context/data/DataContext';
import { toast } from 'sonner';

interface InitialDataLoadState {
  isLoading: boolean;
  isComplete: boolean;
  error: string | null;
  progress: {
    loaded: number;
    total: number;
    currentStep: string;
  };
}

export const useInitialDataLoader = () => {
  const { isAuthenticated, currentUser, loading: authLoading } = useAuthContext();
  const {
    loadCustomers,
    loadMechanics,
    loadVendors,
    loadParts,
    loadTasks,
    loadInvoices
  } = useDataContext();
  
  const [loadState, setLoadState] = useState<InitialDataLoadState>({
    isLoading: false,
    isComplete: false,
    error: null,
    progress: { loaded: 0, total: 6, currentStep: '' }
  });

  const loadInitialData = useCallback(async (force = false) => {
    if (!isAuthenticated || !currentUser?.organization_id) {
      console.log('[InitialDataLoader] Skipping - user not authenticated or no org');
      return;
    }

    // Skip if already complete and not forcing
    if (loadState.isComplete && !force) {
      console.log('[InitialDataLoader] Skipping - already complete');
      return;
    }

    console.log('[InitialDataLoader] Starting initial data load...');
    setLoadState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      progress: { loaded: 0, total: 6, currentStep: 'Starting...' }
    }));

    try {
      // Load critical data first
      setLoadState(prev => ({
        ...prev,
        progress: { ...prev.progress, currentStep: 'Loading Customers...' }
      }));
      await loadCustomers();
      
      setLoadState(prev => ({
        ...prev,
        progress: { loaded: 1, total: 6, currentStep: 'Loading Mechanics...' }
      }));
      await loadMechanics();

      // Load remaining data in parallel
      setLoadState(prev => ({
        ...prev,
        progress: { loaded: 2, total: 6, currentStep: 'Loading additional data...' }
      }));

      await Promise.allSettled([
        loadVendors(),
        loadParts(),
        loadTasks(),
        loadInvoices(),
      ]);

      setLoadState(prev => ({
        ...prev,
        isLoading: false,
        isComplete: true,
        progress: { loaded: 6, total: 6, currentStep: 'Complete!' }
      }));

      console.log('[InitialDataLoader] Initial data load complete');
      
    } catch (error) {
      console.error('[InitialDataLoader] Error loading initial data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      
      setLoadState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        progress: { ...prev.progress, currentStep: 'Error occurred' }
      }));

      toast.error('Failed to load application data. Some features may not work properly.');
    }
  }, [isAuthenticated, currentUser?.organization_id, loadState.isComplete, loadCustomers, loadMechanics, loadVendors, loadParts, loadTasks, loadInvoices]);

  const retryLoad = useCallback(() => {
    setLoadState({
      isLoading: false,
      isComplete: false,
      error: null,
      progress: { loaded: 0, total: 6, currentStep: '' }
    });
    loadInitialData(true);
  }, [loadInitialData]);

  // Auto-load when authenticated and organization is available
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentUser?.organization_id) {
      console.log('[InitialDataLoader] User authenticated, starting auto-load...');
      loadInitialData();
    }
  }, [authLoading, isAuthenticated, currentUser?.organization_id, loadInitialData]);

  // Reset when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('[InitialDataLoader] User logged out, resetting state...');
      setLoadState({
        isLoading: false,
        isComplete: false,
        error: null,
        progress: { loaded: 0, total: 6, currentStep: '' }
      });
    }
  }, [isAuthenticated]);

  return {
    ...loadState,
    loadInitialData,
    retryLoad,
    progressPercentage: Math.round((loadState.progress.loaded / loadState.progress.total) * 100)
  };
};