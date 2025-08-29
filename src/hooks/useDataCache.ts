import { useState, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  loading: boolean;
}

export function useDataCache<T = any>(
  cacheKey: string,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
) {
  const cache = useRef<Map<string, CacheEntry<any>>>(new Map());
  const [loading, setLoading] = useState(false);

  const getCachedData = useCallback((key: string): any => {
    const entry = cache.current.get(key);
    if (!entry) return null;
    
    const isExpired = Date.now() - entry.timestamp > ttl;
    if (isExpired) {
      cache.current.delete(key);
      return null;
    }
    
    return entry.data;
  }, [ttl]);

  const setCachedData = useCallback((key: string, data: any) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      loading: false
    });
  }, []);

  const fetchWithCache = useCallback(
    async <R>(
      key: string,
      fetchFn: () => Promise<R>,
      force = false
    ): Promise<R> => {
      // Check cache first unless forced
      if (!force) {
        const cached = getCachedData(key);
        if (cached) {
          return cached as R;
        }
      }

      // Set loading state
      setLoading(true);
      
      try {
        const data = await fetchFn();
        setCachedData(key, data);
        return data;
      } finally {
        setLoading(false);
      }
    },
    [getCachedData, setCachedData]
  );

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  const isLoading = useCallback((key: string) => {
    const entry = cache.current.get(key);
    return entry?.loading || false;
  }, []);

  return {
    fetchWithCache,
    getCachedData,
    setCachedData,
    clearCache,
    isLoading,
    loading
  };
}