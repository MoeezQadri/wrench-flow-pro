import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RotateCcw, SkipForward } from 'lucide-react';
import { toast } from 'sonner';

interface LoadingRecoveryProps {
  onForceLoad: () => void;
  onRefresh: () => void;
  loadingDuration: number;
}

export const LoadingRecovery: React.FC<LoadingRecoveryProps> = ({
  onForceLoad,
  onRefresh,
  loadingDuration
}) => {
  const handleForceLoad = () => {
    toast.info('Forcing app to load...');
    onForceLoad();
  };

  const handleRefresh = () => {
    toast.info('Refreshing application...');
    onRefresh();
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader className="text-center">
        <div className="mx-auto h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center text-warning mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <CardTitle className="text-lg">Loading Taking Too Long?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Loading has been running for {Math.round(loadingDuration / 1000)} seconds.
          If this continues, try one of these options:
        </p>
        
        <div className="space-y-2">
          <Button 
            onClick={handleForceLoad}
            variant="outline" 
            className="w-full"
          >
            <SkipForward className="mr-2 h-4 w-4" />
            Skip Loading & Continue
          </Button>
          
          <Button 
            onClick={handleRefresh}
            variant="outline" 
            className="w-full"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Refresh Application
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          This usually happens due to network issues or cached data conflicts.
        </p>
      </CardContent>
    </Card>
  );
};