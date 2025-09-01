import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useGlobalRecovery } from '@/hooks/useGlobalRecovery';
import { ConnectionMonitor } from '@/utils/supabase-client-config';

export const GlobalRecoveryButton: React.FC = () => {
  const {
    stuckState,
    isRecovering,
    getRecoveryActions,
    executeRecovery
  } = useGlobalRecovery();

  const [connectionStatus, setConnectionStatus] = React.useState(true);
  
  React.useEffect(() => {
    try {
      const monitor = ConnectionMonitor.getInstance();
      
      const handleConnectionChange = (isOnline: boolean) => {
        setConnectionStatus(isOnline);
      };
      
      const removeListener = monitor.addListener(handleConnectionChange);
      
      // Initial status
      setConnectionStatus(navigator.onLine);
      
      return removeListener;
    } catch (error) {
      console.warn('ConnectionMonitor failed to initialize:', error);
      // Fallback to basic online/offline detection
      setConnectionStatus(navigator.onLine);
      
      const handleOnline = () => setConnectionStatus(true);
      const handleOffline = () => setConnectionStatus(false);
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  const recoveryActions = getRecoveryActions();
  const hasIssues = stuckState.isStuck || !connectionStatus;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={hasIssues ? "destructive" : "ghost"} 
          size="sm"
          className="relative"
          disabled={isRecovering}
        >
          {isRecovering ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {!connectionStatus ? (
                <WifiOff className="h-4 w-4" />
              ) : hasIssues ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </>
          )}
          
          {hasIssues && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-3 w-3 p-0 flex items-center justify-center text-xs"
            >
              !
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          App Recovery
          <div className="flex items-center gap-2">
            {connectionStatus ? (
              <Wifi className="h-3 w-3 text-green-500" />
            ) : (
              <WifiOff className="h-3 w-3 text-red-500" />
            )}
            <span className="text-xs text-muted-foreground">
              {connectionStatus ? 'Online' : 'Offline'}
            </span>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {stuckState.isStuck && (
          <>
            <div className="px-2 py-1 text-xs text-destructive">
              Issues detected: {stuckState.failureCount} failures
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        
        {recoveryActions.map((action) => (
          <DropdownMenuItem
            key={action.id}
            onClick={() => executeRecovery(action.id)}
            disabled={isRecovering}
            className="flex flex-col items-start gap-1"
          >
            <div className="flex items-center justify-between w-full">
              <span className="font-medium">{action.label}</span>
              <Badge 
                variant={
                  action.severity === 'high' ? 'destructive' : 
                  action.severity === 'medium' ? 'secondary' : 
                  'outline'
                }
                className="text-xs"
              >
                {action.severity}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground">
              {action.description}
            </span>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1 text-xs text-muted-foreground">
          Shortcut: Ctrl+Shift+R
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};