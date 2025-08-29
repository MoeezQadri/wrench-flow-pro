import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { ConnectionMonitor, LoadingRecovery, RequestDeduplication } from '@/utils/supabase-client-config';
import { toast } from 'sonner';

interface LoadingRecoveryPanelProps {
  onForceRefresh?: () => void;
  className?: string;
}

export const LoadingRecoveryPanel: React.FC<LoadingRecoveryPanelProps> = ({
  onForceRefresh,
  className
}) => {
  const [connectionStatus, setConnectionStatus] = useState({ isOnline: true, reconnectAttempts: 0 });
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const connectionMonitor = ConnectionMonitor.getInstance();

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const isConnected = await connectionMonitor.testConnection();
      if (isConnected) {
        toast.success('Connection test successful');
      } else {
        toast.error('Connection test failed');
      }
      return isConnected;
    } catch (error) {
      toast.error('Connection test failed');
      return false;
    } finally {
      setIsTestingConnection(false);
    }
  };

  const clearAllCaches = () => {
    RequestDeduplication.clearAllPendingRequests();
    LoadingRecovery.clearAllTimers();
    
    // Clear browser caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    toast.success('All caches cleared');
  };

  const handleFullRefresh = () => {
    clearAllCaches();
    if (onForceRefresh) {
      onForceRefresh();
    } else {
      window.location.reload();
    }
  };

  const handleForceRefresh = () => {
    if (onForceRefresh) {
      onForceRefresh();
      toast.success('Data refresh initiated');
    } else {
      toast.info('No refresh function provided');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-warning" />
          Loading Recovery
        </CardTitle>
        <CardDescription>
          Diagnostic tools to help resolve stuck loading states
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Connection Status</span>
            <Badge variant={connectionStatus.isOnline ? "default" : "destructive"}>
              {connectionStatus.isOnline ? (
                <>
                  <Wifi className="h-3 w-3 mr-1" />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={testConnection}
            disabled={isTestingConnection}
            className="w-full"
          >
            {isTestingConnection ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
        </div>

        <Separator />

        {/* Recovery Actions */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Recovery Actions</span>
          
          <div className="grid gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceRefresh}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Data Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllCaches}
              className="w-full"
            >
              Clear All Caches
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={handleFullRefresh}
              className="w-full"
            >
              Full Page Refresh
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>If loading is stuck:</strong>
            <br />
            1. Try "Force Data Refresh" first
            <br />
            2. If that fails, try "Clear All Caches"
            <br />
            3. As a last resort, use "Full Page Refresh"
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};