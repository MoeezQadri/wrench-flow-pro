
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle, LockKeyhole } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SuperAdminLogin = () => {
  const [passcode, setPasscode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // In a real app, this would verify with a secure backend
      // For demo purposes, we're using a simple check
      // Simulate auth process
      if (passcode === 'superadmin2023') {
        // Generate a mock token for superadmin
        const mockToken = `superadmin-${Date.now()}`;
        
        // Store the token in localStorage
        localStorage.setItem('superadminToken', mockToken);
        
        // Set the auth header for all subsequent Supabase function calls
        supabase.functions.setAuth(mockToken);
        
        toast({
          title: "Access granted",
          description: "Welcome to the SuperAdmin portal",
        });
        
        navigate('/superadmin/dashboard');
      } else {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "Invalid passcode. Please try again.",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "An error occurred during authentication.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            <CardTitle className="text-2xl">SuperAdmin Access</CardTitle>
          </div>
          <CardDescription>
            This area is restricted. Enter your passcode to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              <div className="relative">
                <Input
                  id="passcode"
                  placeholder="Enter passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="pr-10"
                  required
                />
                <LockKeyhole className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700">
                {isLoading ? "Authenticating..." : "Access System"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminLogin;
