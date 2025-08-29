import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

interface StuckState {
  isStuck: boolean;
  failureCount: number;
  lastFailureTime: number;
  type: 'loading' | 'network' | 'data' | 'unknown';
  context?: string;
}

interface RecoveryAction {
  id: string;
  label: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  action: () => Promise<void>;
}

export const useGlobalRecovery = () => {
  const [stuckState, setStuckState] = useState<StuckState>({
    isStuck: false,
    failureCount: 0,
    lastFailureTime: 0,
    type: 'unknown'
  });
  const [isRecovering, setIsRecovering] = useState(false);
  const [showRecoveryPanel, setShowRecoveryPanel] = useState(false);
  
  const failureHistory = useRef<Array<{ timestamp: number; type: string; context?: string }>>([]);
  const recoveryAttempts = useRef(0);

  // Track failures
  const reportFailure = useCallback((type: StuckState['type'], context?: string) => {
    const now = Date.now();
    failureHistory.current.push({ timestamp: now, type, context });
    
    // Keep only last 10 failures
    if (failureHistory.current.length > 10) {
      failureHistory.current = failureHistory.current.slice(-10);
    }

    // Check if we should consider the app \"stuck\"
    const recentFailures = failureHistory.current.filter(
      f => now - f.timestamp < 30000 // Last 30 seconds
    );

    if (recentFailures.length >= 3) {
      setStuckState({
        isStuck: true,
        failureCount: recentFailures.length,
        lastFailureTime: now,
        type,
        context
      });
      
      // Auto-show recovery panel after multiple failures
      if (recentFailures.length >= 5) {
        setShowRecoveryPanel(true);
        toast.error('Multiple failures detected. Recovery options available.');
      }
    }
  }, []);

  // Clear stuck state
  const clearStuckState = useCallback(() => {
    setStuckState({
      isStuck: false,
      failureCount: 0,
      lastFailureTime: 0,
      type: 'unknown'
    });
    failureHistory.current = [];
    setShowRecoveryPanel(false);
  }, []);

  // Recovery actions
  const getRecoveryActions = useCallback((): RecoveryAction[] => {
    const actions: RecoveryAction[] = [
      {
        id: 'retry',
        label: 'Retry',
        description: 'Retry the last failed operation',
        severity: 'low',
        action: async () => {
          window.location.reload();
        }
      },
      {
        id: 'clear_cache',
        label: 'Clear Cache',
        description: 'Clear browser cache and retry',
        severity: 'medium',
        action: async () => {
          // Clear various caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
          
          // Clear localStorage
          localStorage.clear();
          
          // Clear sessionStorage
          sessionStorage.clear();
          
          // Reload
          window.location.reload();
        }
      },
      {
        id: 'force_refresh',
        label: 'Force Refresh',
        description: 'Force refresh all data and reset the application',
        severity: 'high',
        action: async () => {
          // Hard reload bypassing cache
          window.location.reload();
        }
      }
    ];

    // Add context-specific actions based on failure type
    if (stuckState.type === 'network') {
      actions.unshift({
        id: 'test_connection',
        label: 'Test Connection',
        description: 'Test your network connection',
        severity: 'low',
        action: async () => {
          try {
            const response = await fetch('/api/health', { method: 'HEAD' });
            if (response.ok) {
              toast.success('Connection test successful');
            } else {
              toast.error('Connection test failed');
            }
          } catch {
            toast.error('Network connection failed');
          }
        }
      });
    }

    return actions;
  }, [stuckState.type]);

  // Execute recovery action
  const executeRecovery = useCallback(async (actionId: string) => {
    const actions = getRecoveryActions();
    const action = actions.find(a => a.id === actionId);
    
    if (!action) return;

    setIsRecovering(true);
    recoveryAttempts.current++;
    
    try {
      await action.action();
      toast.success(`Recovery action \"${action.label}\" completed`);
      clearStuckState();
    } catch (error) {
      toast.error(`Recovery action failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reportFailure('unknown', `Recovery action ${actionId} failed`);
    } finally {
      setIsRecovering(false);
    }
  }, [getRecoveryActions, clearStuckState, reportFailure]);

  // Keyboard shortcut for recovery (Ctrl+Shift+R)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        setShowRecoveryPanel(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    stuckState,
    isRecovering,
    showRecoveryPanel,
    setShowRecoveryPanel,
    reportFailure,
    clearStuckState,
    getRecoveryActions,
    executeRecovery,
    recoveryAttempts: recoveryAttempts.current
  };
};
