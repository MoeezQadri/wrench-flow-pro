import React from 'react';
import { LoadingProgress } from '@/components/LoadingProgress';
import { useDataContext } from '@/context/data/DataContext';

export function AppWithProgress({ children }: { children: React.ReactNode }) {
  const { isLoadingData, loadingProgress } = useDataContext();
  
  return (
    <>
      <LoadingProgress 
        isVisible={isLoadingData && loadingProgress > 0} 
        progress={loadingProgress}
        message={loadingProgress < 50 ? "Loading essential data..." : "Loading additional data..."}
      />
      {children}
    </>
  );
}