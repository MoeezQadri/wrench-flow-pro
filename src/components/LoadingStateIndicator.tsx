import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LoadingRecoveryPanel } from '@/components/debug/LoadingRecoveryPanel';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface LoadingStateIndicatorProps {
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
  onForceRefresh?: () => void;
  loadingMessage?: string;
  showRecoveryAfter?: number; // Show recovery panel after X seconds
}

export const LoadingStateIndicator: React.FC<LoadingStateIndicatorProps> = ({
  isLoading,
  error,
  onRetry,
  onForceRefresh,
  loadingMessage = "Loading data...",
  showRecoveryAfter = 10000 // 10 seconds
}) => {
  const [loadingDuration, setLoadingDuration] = useState(0);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLoading) {
      setLoadingDuration(0);
      setShowRecovery(false);
      
      interval = setInterval(() => {
        setLoadingDuration(prev => {
          const newDuration = prev + 100;
          if (newDuration >= showRecoveryAfter) {
            setShowRecovery(true);
          }
          return newDuration;
        });
      }, 100);
    } else {
      setLoadingDuration(0);
      setShowRecovery(false);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading, showRecoveryAfter]);

  const progressPercentage = Math.min((loadingDuration / showRecoveryAfter) * 100, 100);

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="ml-2"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
        
        {showRecovery && (
          <LoadingRecoveryPanel onForceRefresh={onForceRefresh} />
        )}
      </div>
    );
  }

  if (!isLoading) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>{loadingMessage}</span>
          <span className="text-muted-foreground">
            {Math.round(loadingDuration / 1000)}s
          </span>
        </div>
        
        <Progress 
          value={progressPercentage} 
          className="h-2"
        />
        
        {loadingDuration > 5000 && !showRecovery && (
          <p className="text-xs text-muted-foreground">
            Loading is taking longer than usual...
          </p>
        )}
      </div>
      
      {showRecovery && (
        <div className="space-y-2">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Loading is taking too long. You may want to try the recovery options below.
            </AlertDescription>
          </Alert>
          
          <LoadingRecoveryPanel onForceRefresh={onForceRefresh} />
        </div>
      )}
    </div>
  );
};