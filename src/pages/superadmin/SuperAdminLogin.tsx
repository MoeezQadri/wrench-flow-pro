
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ShieldAlert } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';

const SUPER_ADMIN_USERNAME = "superadmin";
const SUPER_ADMIN_PASSWORD = "superuser123"; // In a real app, this would be hashed and stored securely

const SuperAdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setCurrentUser, setToken } = useAuthContext();

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

      // Generate a token
      const token = `superadmin-${Date.now()}`;
      
      // Update auth context
      setCurrentUser(superUser);
      setToken(token);
      
      // Store token in local storage
      localStorage.setItem('superadminToken', token);
      
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
