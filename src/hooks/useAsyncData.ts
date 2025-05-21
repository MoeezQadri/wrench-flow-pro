
import { useState, useEffect } from 'react';
import { resolvePromiseAndSetState } from '@/utils/async-helpers';

/**
 * A hook for working with async data that properly resolves promises
 * @param asyncFn The async function to call
 * @param deps Dependencies array (similar to useEffect)
 * @param initialData Initial data to use before the promise resolves
 * @returns [data, loading, error] tuple
 */
export function useAsyncData<T>(
  asyncFn: () => Promise<T>, 
  deps: any[] = [], 
  initialData: T | null = null
): [T | null, boolean, Error | null] {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await resolvePromiseAndSetState(asyncFn(), (result) => {
          if (isMounted) {
            setData(result);
          }
        });
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, deps);

  return [data, loading, error];
}

/**
 * A hook for working with async data that properly resolves promises and handles automatic reloading
 * @param asyncFn The async function to call
 * @param deps Dependencies array (similar to useEffect)
 * @param initialData Initial data to use before the promise resolves
 * @returns [data, loading, error, reload] tuple where reload is a function to trigger a reload
 */
export function useAsyncDataWithReload<T>(
  asyncFn: () => Promise<T>, 
  deps: any[] = [], 
  initialData: T | null = null
): [T | null, boolean, Error | null, () => void] {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        await resolvePromiseAndSetState(asyncFn(), (result) => {
          if (isMounted) {
            setData(result);
          }
        });
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [...deps, reloadCount]);

  const reload = () => {
    setReloadCount(count => count + 1);
  };

  return [data, loading, error, reload];
}

export default useAsyncData;
