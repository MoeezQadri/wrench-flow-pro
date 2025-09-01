
import React, { useState, useEffect } from 'react';
import { LoadingRecovery } from '@/components/LoadingRecovery';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading..." 
}) => {
  const [showRecovery, setShowRecovery] = useState(false);
  const [startTime] = useState(Date.now());
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    const recoveryTimer = setTimeout(() => {
      setShowRecovery(true);
    }, 15000); // Show recovery after 15 seconds

    return () => {
      clearInterval(interval);
      clearTimeout(recoveryTimer);
    };
  }, []);

  const handleForceLoad = () => {
    // Clear any stuck authentication state
    localStorage.removeItem('sb-zugmebtirwpdkblijlvx-auth-token');
    window.location.reload();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const loadingDuration = currentTime - startTime;

  if (showRecovery) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingRecovery 
          onForceLoad={handleForceLoad}
          onRefresh={handleRefresh}
          loadingDuration={loadingDuration}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-12 w-12 rounded-full border-4 border-t-primary border-r-transparent border-b-primary border-l-transparent animate-spin"></div>
        <p className="text-lg font-medium">{message}</p>
        {loadingDuration > 10000 && (
          <p className="text-sm text-muted-foreground">
            Still loading... ({Math.round(loadingDuration / 1000)}s)
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
