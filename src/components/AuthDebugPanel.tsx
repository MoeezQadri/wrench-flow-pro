import React, { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';

const AuthDebugPanel: React.FC = () => {
  const { session, currentUser, isAuthenticated, logout } = useAuthContext();
  const [clearing, setClearing] = useState(false);

  const clearSession = async () => {
    setClearing(true);
    try {
      // Clear all auth data
      await supabase.auth.signOut();
      
      // Clear localStorage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-zugmebtirwpdkblijlvx-auth-token');
      
      // Clear any other potential auth storage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('auth')) {
          localStorage.removeItem(key);
        }
      });
      
      // Force page reload to clear any stuck state
      window.location.reload();
    } catch (error) {
      console.error('Error clearing session:', error);
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Authentication Debug
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={isAuthenticated ? "default" : "secondary"}>
              {isAuthenticated ? "Authenticated" : "Not Authenticated"}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium">Session:</span>
            <Badge variant={session ? "default" : "secondary"}>
              {session ? "Active" : "None"}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm font-medium">User:</span>
            <Badge variant={currentUser ? "default" : "secondary"}>
              {currentUser ? "Loaded" : "None"}
            </Badge>
          </div>
          
          {currentUser && (
            <div className="text-xs text-muted-foreground mt-2">
              <div>ID: {currentUser.id}</div>
              <div>Email: {currentUser.email}</div>
              <div>Role: {currentUser.role}</div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
          
          <Button
            variant="destructive"
            size="sm"
            onClick={clearSession}
            disabled={clearing}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {clearing ? 'Clearing...' : 'Clear Session & Reload'}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          If you're experiencing login issues after signup, try "Clear Session & Reload"
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthDebugPanel;