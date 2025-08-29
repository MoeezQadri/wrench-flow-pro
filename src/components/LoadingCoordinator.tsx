import React, { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useOrganizationContext } from '@/hooks/useOrganizationContext';
import { useDataContext } from '@/context/data/DataContext';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingCoordinatorProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

type LoadingPhase = 'auth' | 'organization' | 'data' | 'ready';

export const LoadingCoordinator: React.FC<LoadingCoordinatorProps> = ({ 
  children, 
  fallback 
}) => {
  const { loading: authLoading, isAuthenticated } = useAuthContext();
  const { selectedOrganizationId } = useOrganizationContext();
  const { isLoadingData } = useDataContext();
  const [phase, setPhase] = useState<LoadingPhase>('auth');

  // Determine current loading phase
  useEffect(() => {
    if (authLoading) {
      setPhase('auth');
    } else if (!isAuthenticated) {
      setPhase('ready'); // Not authenticated is ready state for auth pages
    } else if (!selectedOrganizationId) {
      setPhase('organization');
    } else if (isLoadingData) {
      setPhase('data');
    } else {
      setPhase('ready');
    }
  }, [authLoading, isAuthenticated, selectedOrganizationId, isLoadingData]);

  // Render loading states
  if (phase !== 'ready') {
    return fallback || <GlobalLoadingSkeleton phase={phase} />;
  }

  return <>{children}</>;
};

interface GlobalLoadingSkeletonProps {
  phase: LoadingPhase;
}

const GlobalLoadingSkeleton: React.FC<GlobalLoadingSkeletonProps> = ({ phase }) => {
  const getPhaseMessage = () => {
    switch (phase) {
      case 'auth':
        return 'Authenticating...';
      case 'organization':
        return 'Loading organization...';
      case 'data':
        return 'Loading data...';
      default:
        return 'Loading...';
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar skeleton */}
      <div className="w-60 border-r bg-sidebar">
        <div className="p-4 space-y-4">
          <Skeleton className="h-8 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1">
        {/* Header skeleton */}
        <div className="h-16 border-b px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-8 w-8" />
        </div>

        {/* Page content skeleton */}
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-96" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-6 border rounded-lg space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>

          <div className="border rounded-lg p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Loading indicator with phase message */}
          <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-3 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              <span className="text-sm font-medium">{getPhaseMessage()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingCoordinator;