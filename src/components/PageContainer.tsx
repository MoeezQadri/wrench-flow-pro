import React from 'react';
import { PageLoader } from './PageLoader';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  loadingMessage?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  loading = false,
  error = null,
  onRetry,
  loadingMessage,
  headerActions,
  children,
  className = ""
}) => {
  return (
    <div className={`space-y-6 animate-fade-in ${className}`}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        {headerActions && !loading && !error && (
          <div className="flex items-center gap-2">
            {headerActions}
          </div>
        )}
      </div>

      {/* Page Content with Loading/Error States */}
      <PageLoader
        loading={loading}
        error={error}
        onRetry={onRetry}
        loadingMessage={loadingMessage}
      >
        {children}
      </PageLoader>
    </div>
  );
};

export default PageContainer;