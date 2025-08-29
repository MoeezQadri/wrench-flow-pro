import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface PageLoaderProps {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  loadingMessage?: string;
  children?: React.ReactNode;
}

export const PageLoader: React.FC<PageLoaderProps> = ({
  loading = false,
  error = null,
  onRetry,
  loadingMessage = "Loading...",
  children
}) => {
  // Error state
  if (error && !loading) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium text-destructive mb-2">Error Loading Data</h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
          <h3 className="text-lg font-medium mb-2">{loadingMessage}</h3>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch your data.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Content state
  return <>{children}</>;
};

export default PageLoader;