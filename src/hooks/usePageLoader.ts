import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface UsePageLoaderProps {
  loadData: () => Promise<void>;
  dependencies?: any[];
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  autoLoad?: boolean;
}

export const usePageLoader = ({
  loadData,
  dependencies = [],
  loadingMessage = "Loading...",
  successMessage,
  errorMessage = "Failed to load data",
  autoLoad = true
}: UsePageLoaderProps) => {
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const execute = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    
    try {
      await loadData();
      setLoaded(true);
      if (successMessage && !silent) {
        toast.success(successMessage);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : errorMessage;
      setError(errorMsg);
      if (!silent) {
        toast.error(errorMsg);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [loadData, successMessage, errorMessage]);

  const retry = useCallback(() => {
    execute();
  }, [execute]);

  const refresh = useCallback(() => {
    execute(true); // Silent refresh
  }, [execute]);

  // Auto-load on mount and when dependencies change
  useEffect(() => {
    if (autoLoad) {
      execute();
    }
  }, dependencies);

  return {
    loading,
    error,
    loaded,
    execute,
    retry,
    refresh,
    loadingMessage
  };
};

export default usePageLoader;