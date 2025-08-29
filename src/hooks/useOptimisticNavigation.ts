import { useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from './useDebounce';

export function useOptimisticNavigation() {
  const navigate = useNavigate();
  const pendingNavigation = useRef<string | null>(null);
  const navigationTimeout = useRef<number | null>(null);

  const navigateOptimistically = useCallback((path: string, delay = 100) => {
    // Clear any pending navigation
    if (navigationTimeout.current) {
      clearTimeout(navigationTimeout.current);
    }

    // Navigate immediately for instant UI feedback
    navigate(path);
    
    // Track pending navigation for data loading coordination
    pendingNavigation.current = path;
    
    // Clear pending after delay
    navigationTimeout.current = setTimeout(() => {
      pendingNavigation.current = null;
    }, delay) as any;
  }, [navigate]);

  const debouncedNavigate = useDebounce(navigateOptimistically, 50);

  return {
    navigateOptimistically,
    debouncedNavigate,
    pendingNavigation: pendingNavigation.current
  };
}