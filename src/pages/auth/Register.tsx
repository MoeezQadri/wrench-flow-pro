import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { checkEmailExists } from '@/utils/supabase-helpers';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('My Garage');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setCurrentUser, setSession } = useAuthContext();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if the email already exists using our helper function
      console.log('Registering user', {name, email, password, organizationName})
      const emailCheckResult = await checkEmailExists(email);
      console.log({emailCheckResult});
      if (emailCheckResult && emailCheckResult.exists) {
        // Email exists, check if it's active
        if (emailCheckResult.is_active) {
          // Active user
          toast.error('This email is already registered. Please use the login page instead.', {
            action: {
              label: 'Go to Login',
              onClick: () => navigate('/auth/login')
            }
          });
          setIsLoading(false);
          return;
        } else {
          // Inactive user
          toast.error('This email exists but is inactive. Please contact the administrator at support@garagepro.com');
          setIsLoading(false);
          return;
        }
      }
      
      // Generate a unique organization ID
      const orgId = crypto.randomUUID();
      
      // Register the user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            organization_id: orgId,
            role: 'owner'
          }
        }
      });
      console.log('User registered ', {data});
      if (error) throw error;
      
      if (data.user && data.session) {
        // Create the organization in the organizations table
        const { error: orgError, data } = await supabase
          .from('organizations')
          .insert({
            id: orgId,
            name: organizationName,
            subscription_level: 'trial',
            subscription_status: 'active'
          });
        console.log('Org registered ', {data});
          
        if (orgError) {
          console.error('Error creating organization:', orgError);
          // Continue anyway as the user is created
        }
        
        // Check if email confirmation is required
        if (data.user.email_confirmed_at) {
          // Email is already confirmed (instant confirmation)
          // Update auth context
          setSession(data.session);
          setCurrentUser({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || '',
            role: 'owner',
            isActive: true,
            organizationId: orgId,
            lastLogin: new Date().toISOString()
          });
          
          toast.success('Registration successful!');
          
          // Redirect to dashboard
          navigate('/');
        } else {
          // Email confirmation is required
          toast.success('Registration successful! Please check your email to confirm your account. You will be redirected to the login page once confirmed.');
          // No need to redirect now, the user will be redirected after confirming email
        }
      } else {
        // No session or user - likely email confirmation is required
        toast.success('Registration successful! Please check your email to confirm your account. You will be redirected to the login page once confirmed.');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      // Handle the case where email already exists but was not caught by our earlier checks
      if (error.message?.includes('User already registered')) {
        toast.error('This email is already registered. Please use the login page instead.', {
          action: {
            label: 'Go to Login',
            onClick: () => navigate('/auth/login')
          }
        });
      } else {
        toast.error(error.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-4">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Building size={48} className="text-wrench-light-blue" />
          </div>
          <h1 className="text-3xl font-bold">GARAGE PRO</h1>
          <p className="text-muted-foreground">Automotive workshop management system</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Sign up to get started</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationName">Garage Name</Label>
                <Input 
                  id="organizationName" 
                  type="text" 
                  placeholder="My Garage" 
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
                />
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Register'}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/auth/login" className="text-wrench-light-blue hover:underline">
                  Login here
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
