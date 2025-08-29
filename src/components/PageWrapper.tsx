import React from 'react';
import { PageContainer } from './PageContainer';
import { usePageLoader } from '@/hooks/usePageLoader';
import { Skeleton } from '@/components/ui/skeleton';

interface PageWrapperProps {
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  loadData?: () => Promise<void>;
  loadingMessage?: string;
  showSkeleton?: boolean;
  skeletonType?: 'table' | 'grid' | 'cards' | 'custom';
  customSkeleton?: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  title,
  subtitle,
  headerActions,
  children,
  className,
  loadData,
  loadingMessage,
  showSkeleton = true,
  skeletonType = 'cards',
  customSkeleton,
  loading: externalLoading,
  error: externalError,
  onRetry
}) => {
  const { loading: internalLoading, error: internalError, retry: internalRetry } = usePageLoader({
    loadData: loadData || (() => Promise.resolve()),
    loadingMessage,
    autoLoad: !!loadData
  });

  // Use external loading/error state if provided, otherwise use internal
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  const error = externalError !== undefined ? externalError : internalError;
  const retry = onRetry || internalRetry;

  const renderSkeleton = () => {
    if (customSkeleton) return customSkeleton;

    switch (skeletonType) {
      case 'table':
        return <TableSkeleton />;
      case 'grid':
        return <GridSkeleton />;
      case 'cards':
        return <CardsSkeleton />;
      default:
        return <CardsSkeleton />;
    }
  };

  const content = loading && showSkeleton ? renderSkeleton() : children;

  return (
    <PageContainer
      title={title}
      subtitle={subtitle}
      headerActions={headerActions}
      loading={loading && !showSkeleton}
      error={error}
      onRetry={retry}
      loadingMessage={loadingMessage}
      className={className}
    >
      {content}
    </PageContainer>
  );
};

const TableSkeleton = () => (
  <div className="space-y-4">
    <div className="border rounded-lg">
      <div className="p-4 border-b">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const GridSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="border rounded-lg p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    ))}
  </div>
);

const CardsSkeleton = () => (
  <div className="space-y-6">
    {/* Summary cards */}
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>

    {/* Main content card */}
    <div className="border rounded-lg p-6 space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default PageWrapper;