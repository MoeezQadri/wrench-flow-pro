import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import { useInitialDataLoader } from '@/hooks/useInitialDataLoader';

interface InitialDataLoaderProps {
  children: React.ReactNode;
}

export const InitialDataLoader: React.FC<InitialDataLoaderProps> = ({ children }) => {
  const { 
    isLoading, 
    isComplete, 
    error, 
    progress, 
    progressPercentage,
    retryLoad 
  } = useInitialDataLoader();

  // Show loading overlay only on first load
  if (isLoading && !isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Loading Your Data</h3>
              <p className="text-sm text-muted-foreground">
                {progress.currentStep}
              </p>
            </div>

            <div className="space-y-2">
              <Progress value={progressPercentage} className="w-full" />
              <p className="text-xs text-muted-foreground">
                {progress.loaded} of {progress.total} components loaded ({progressPercentage}%)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state with retry option
  if (error && !isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center space-y-6">
            <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-destructive">Loading Failed</h3>
              <p className="text-sm text-muted-foreground">
                {error}
              </p>
            </div>

            <Button onClick={retryLoad} variant="outline" className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success notification briefly after initial load
  if (isComplete && progress.loaded === progress.total) {
    return (
      <>
        {children}
        <div className="fixed bottom-4 right-4 z-50">
          <Card className="bg-primary text-primary-foreground shadow-lg">
            <CardContent className="p-3 flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Data loaded successfully</span>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Normal render when data is loaded
  return <>{children}</>;
};