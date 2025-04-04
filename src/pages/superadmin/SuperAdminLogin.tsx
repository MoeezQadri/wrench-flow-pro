
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle, LockKeyhole, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Form, FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthContext } from '@/context/AuthContext';

// Form validation schema
const formSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(1, { message: "Password is required" })
});

type FormData = z.infer<typeof formSchema>;

const SuperAdminLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, setCurrentUser, setSession } = useAuthContext();
  
  // Check if already authenticated as superadmin
  useEffect(() => {
    const superAdminToken = localStorage.getItem('superadminToken');
    if (superAdminToken) {
      navigate('/superadmin/dashboard');
    }
  }, [navigate]);
  
  // Set up form with validation
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });
  
  const handleLogin = async (values: FormData) => {
    setIsLoading(true);
    
    try {
      // In a real app, this would verify with a secure backend
      // For demo purposes, we're using hardcoded credentials
      // The username is "admin" and password is "superadmin2023"
      if (values.username === 'admin' && values.password === 'superadmin2023') {
        // Generate a mock token for superadmin
        const mockToken = `superadmin-${Date.now()}`;
        
        // Store the token in localStorage
        localStorage.setItem('superadminToken', mockToken);
        
        // Set the auth header for all subsequent Supabase function calls
        supabase.functions.setAuth(mockToken);
        
        // Create a mock superadmin user object for context
        const superadminUser = {
          id: 'superadmin-id',
          email: 'superadmin@example.com',
          name: 'Super Admin',
          role: 'superuser',
          isActive: true,
          lastLogin: new Date().toISOString()
        };
        
        // Update auth context with superadmin user
        setCurrentUser(superadminUser);
        setSession({
          access_token: mockToken,
          refresh_token: '',
          user: {
            id: 'superadmin-id',
            email: 'superadmin@example.com',
            user_metadata: {
              name: 'Super Admin',
              role: 'superuser'
            }
          }
        });
        
        toast({
          title: "Access granted",
          description: "Welcome to the SuperAdmin portal",
        });
        
        // Redirect to the dashboard with a slight delay to ensure token is set
        setTimeout(() => {
          navigate('/superadmin/dashboard');
        }, 100);
      } else {
        toast({
          variant: "destructive",
          title: "Access denied",
          description: "Invalid username or password. Please try again.",
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
            This area is restricted. Enter your credentials to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                    <FormControl>
                      <div className="relative">
                        <Input
                          id="username"
                          placeholder="Enter username"
                          className="pr-10"
                          {...field}
                        />
                        <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <FormControl>
                      <div className="relative">
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter password"
                          className="pr-10"
                          {...field}
                        />
                        <LockKeyhole className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700">
                {isLoading ? "Authenticating..." : "Access System"}
              </Button>
              
              <div className="text-xs text-center text-gray-500 mt-4">
                <p>Default Credentials (for demo):</p>
                <p>Username: admin | Password: superadmin2023</p>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminLogin;
