
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthContext } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { useToast } from '@/hooks/use-toast';

const SuperAdminLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { signIn } = useAuthContext();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: error.message || "Invalid credentials. Please try again.",
        });
        return;
      }

      toast({
        title: "Access granted",
        description: "Welcome to the Super Admin portal",
      });

      navigate('/superadmin/dashboard');
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="mb-8 text-center">
        <Logo size="lg" />
        <h1 className="mt-4 text-2xl font-bold">Super Admin Access</h1>
        <p className="text-muted-foreground mt-1">Restricted area for system administrators</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Super Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-8 w-full max-w-md">
        <CardContent className="p-4">
          <div className="text-xs text-muted-foreground">
            <p className="mb-1">This area is restricted to system administrators only.</p>
            <p>If you need access, please contact your system administrator.</p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <a
          href="/"
          className="text-primary hover:underline text-sm"
        >
          Return to main application
        </a>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
