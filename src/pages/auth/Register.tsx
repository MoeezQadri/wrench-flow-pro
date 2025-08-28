
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const Register: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [organizationName, setOrganizationName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { signUp } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getErrorMessage = (error: any): string => {
    if (!error) return 'An unexpected error occurred';
    
    const message = error.message || error.toString();
    
    // Handle specific error cases
    if (message.includes('User already registered')) {
      return 'An account with this email already exists. Please login instead.';
    }
    
    if (message.includes('organization already exists') || message.includes('Organization already exists')) {
      return 'This organization already exists. Please contact your administrator to be added to the organization.';
    }
    
    if (message.includes('Invalid email')) {
      return 'Please enter a valid email address.';
    }
    
    if (message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    
    if (message.includes('Failed to process organization')) {
      return 'There was an issue setting up your organization. Please try again.';
    }
    
    if (message.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    // Return the original message if no specific handling
    return message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('Registration attempt:', { email, name, organizationName });
    
    // Basic validation
    if (password !== confirmPassword) {
      const errorMsg = 'Passwords do not match';
      setError(errorMsg);
      toast({
        title: "Validation Error",
        description: errorMsg,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    if (password.length < 6) {
      const errorMsg = 'Password must be at least 6 characters long';
      setError(errorMsg);
      toast({
        title: "Validation Error", 
        description: errorMsg,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    if (!signUp) {
      const errorMsg = 'Authentication service unavailable';
      setError(errorMsg);
      toast({
        title: "Service Error",
        description: errorMsg,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // Show loading toast
      toast({
        title: "Creating Account",
        description: "Please wait while we set up your account...",
      });
      
      console.log('Calling signUp function...');
      const { data, error } = await signUp(email, password, name.trim(), organizationName.trim());
      
      console.log('SignUp result:', { data, error });
      
      if (error) {
        const errorMessage = getErrorMessage(error);
        console.error('Registration error:', error);
        setError(errorMessage);
        
        toast({
          title: "Registration Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else if (data) {
        console.log('Registration successful:', data);
        
        toast({
          title: "Account Created Successfully!",
          description: "Please check your email to verify your account. You may need to check your spam folder.",
          action: (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" />
              <span>Success</span>
            </div>
          ),
        });
        
        // Small delay to let user see the success message
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        // Edge case: no data and no error
        console.warn('Registration completed but no data returned');
        toast({
          title: "Account Created",
          description: "Please check your email to verify your account.",
        });
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err: any) {
      const errorMessage = getErrorMessage(err);
      console.error('Registration exception:', err);
      setError(errorMessage);
      
      toast({
        title: "Registration Failed", 
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md">
        <div className="bg-white px-8 py-10 shadow-md rounded-lg">
          <h1 className="text-2xl font-bold text-center mb-6">Create an Account</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                id="organizationName"
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your organization name"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter your organization name. If it doesn't exist, you'll become the admin of a new organization. If it already exists, contact your admin to be added.
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Creating account...' : 'Register'}
            </button>
          </form>
          
          <div className="mt-6 text-center">
            <p>
              Already have an account?{' '}
              <Link to="/auth/login" className="text-blue-600 hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
