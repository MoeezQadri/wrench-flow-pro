import { useRef, useCallback, useEffect } from 'react';
import { useGlobalRecovery } from './useGlobalRecovery';

interface TimeoutConfig {
  defaultTimeout: number;
  escalationTimeout: number;
  maxTimeout: number;
}

export const useUniversalTimeout = (config: TimeoutConfig = {
  defaultTimeout: 15000, // 15 seconds
  escalationTimeout: 30000, // 30 seconds  
  maxTimeout: 60000 // 1 minute
}) => {
  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const startTimes = useRef<Map<string, number>>(new Map());
  const { reportFailure, setShowRecoveryPanel } = useGlobalRecovery();

  // Start a timeout for a specific operation
  const startTimeout = useCallback((
    key: string, 
    context?: string,
    customTimeout?: number
  ) => {
    // Clear any existing timeout for this key
    const existingTimeout = timeouts.current.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = customTimeout || config.defaultTimeout;
    startTimes.current.set(key, Date.now());

    const timeoutId = setTimeout(() => {
      const duration = Date.now() - (startTimes.current.get(key) || 0);
      
      console.warn(`Universal timeout triggered for ${key} after ${duration}ms`);
      
      // Report the timeout as a failure
      reportFailure('loading', `Timeout: ${key} - ${context || 'No context'}`);
      
      // Show recovery panel for long timeouts
      if (duration >= config.escalationTimeout) {
        setShowRecoveryPanel(true);
      }
      
      // Clean up
      timeouts.current.delete(key);
      startTimes.current.delete(key);
    }, timeout);

    timeouts.current.set(key, timeoutId);
  }, [config.defaultTimeout, config.escalationTimeout, reportFailure, setShowRecoveryPanel]);

  // Clear a timeout for a specific operation
  const clearTimeoutByKey = useCallback((key: string) => {
    const timeoutId = timeouts.current.get(key);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeouts.current.delete(key);
      startTimes.current.delete(key);
    }
  }, []);

  // Get the duration of a current operation
  const getDuration = useCallback((key: string): number => {
    const startTime = startTimes.current.get(key);
    return startTime ? Date.now() - startTime : 0;
  }, []);

  // Check if an operation is timing out soon
  const isTimingOutSoon = useCallback((key: string, warningThreshold: number = 0.8): boolean => {
    const startTime = startTimes.current.get(key);
    if (!startTime) return false;
    
    const duration = Date.now() - startTime;
    return duration >= (config.defaultTimeout * warningThreshold);
  }, [config.defaultTimeout]);

  // Clear all timeouts on unmount
  useEffect(() => {
    return () => {
      timeouts.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      timeouts.current.clear();
      startTimes.current.clear();
    };
  }, []);

  // Higher-level timeout for page loads
  const startPageLoadTimeout = useCallback((pageName: string) => {
    startTimeout(`page_load_${pageName}`, `Loading page: ${pageName}`, config.escalationTimeout);
  }, [startTimeout, config.escalationTimeout]);

  const clearPageLoadTimeout = useCallback((pageName: string) => {
    clearTimeoutByKey(`page_load_${pageName}`);
  }, [clearTimeoutByKey]);

  // Higher-level timeout for data operations
  const startDataLoadTimeout = useCallback((operation: string, details?: string) => {
    startTimeout(`data_${operation}`, `Data operation: ${operation} - ${details || 'No details'}`);
  }, [startTimeout]);

  const clearDataLoadTimeout = useCallback((operation: string) => {
    clearTimeoutByKey(`data_${operation}`);
  }, [clearTimeoutByKey]);

  return {
    startTimeout,
    clearTimeout: clearTimeoutByKey,
    getDuration,
    isTimingOutSoon,
    startPageLoadTimeout,
    clearPageLoadTimeout,
    startDataLoadTimeout,
    clearDataLoadTimeout,
    activeTimeouts: timeouts.current.size
  };
};