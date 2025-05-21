
import { useState, useCallback } from 'react';

export function useAsyncData<T>(asyncFn: (...args: any[]) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: any[]) => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await asyncFn(...args);
        setData(result);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  return { data, loading, error, execute };
}

export function useAsyncCache<T>(fetchFn: (id: string) => Promise<T>): [
  (id: string) => Promise<T>,
  Record<string, T>
] {
  const [cache, setCache] = useState<Record<string, T>>({});

  const getWithCache = useCallback(
    async (id: string): Promise<T> => {
      if (id in cache) {
        return cache[id];
      }

      try {
        const data = await fetchFn(id);
        setCache(prevCache => ({
          ...prevCache,
          [id]: data
        }));
        return data;
      } catch (error) {
        console.error(`Error fetching data for id ${id}:`, error);
        throw error;
      }
    },
    [cache, fetchFn]
  );

  return [getWithCache, cache];
}
