
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { Session } from '@supabase/supabase-js';

const SUPER_ADMIN_USERNAME = "superadmin";
const SUPER_ADMIN_PASSWORD = "superuser123"; // In a real app, this would be hashed and stored securely

const SuperAdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setCurrentUser, session, setSession, currentUser, isAuthenticated } = useAuthContext();

  // If already authenticated as superuser, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && currentUser?.role === 'superuser') {
      navigate('/superadmin/dashboard');
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simple credential check for demo purposes
    // In a real application, this would be a server API call
    if (username === SUPER_ADMIN_USERNAME && password === SUPER_ADMIN_PASSWORD) {
      // Create a superuser
      const superUser = {
        id: 'superuser-1',
        name: 'System Administrator',
        email: 'admin@system.com',
        role: 'superuser' as const,
        isActive: true,
        lastLogin: new Date().toISOString()
      };
      
      // Create a proper mock session that matches Supabase's Session type
      const mockSession: Session = {
        access_token: `superadmin-${Date.now()}`,
        refresh_token: `refresh-${Date.now()}`,
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: 'bearer',
        user: {
          id: superUser.id,
          email: superUser.email,
          app_metadata: { provider: 'superadmin' },
          user_metadata: { 
            name: superUser.name,
            role: superUser.role,
            isActive: superUser.isActive 
          },
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          role: '',
          identities: []
        }
      };
      
      // Update auth context
      setCurrentUser(superUser);
      setSession(mockSession);
      
      // Store in local storage for persistence
      localStorage.setItem('superadminSession', JSON.stringify(mockSession));
      
      toast.success('Logged in as System Administrator');
      navigate('/superadmin/dashboard');
    } else {
      toast.error('Invalid credentials');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ShieldAlert size={48} className="text-red-600" />
          </div>
          <h1 className="text-3xl font-bold">SUPERADMIN PORTAL</h1>
          <p className="text-muted-foreground">System administration access only</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Superadmin Login</CardTitle>
            <CardDescription>Enter your credentials to access the system administration portal</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 mr-2" />
                  <p className="text-sm text-amber-800">
                    This portal is restricted to system administrators only. 
                    Regular users should login through the main application.
                  </p>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700" 
                disabled={isLoading}
              >
                {isLoading ? 'Authenticating...' : 'Secure Login'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
