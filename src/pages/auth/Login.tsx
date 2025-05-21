
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LoginForm {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const { signIn, currentUser } = useAuthContext();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  
  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const onSubmit = async (formData: LoginForm) => {
    setLoading(true);
    setError('');
    
    if (!signIn) {
      setError('Authentication service unavailable');
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await signIn(formData.email, formData.password);
      
      if (error) {
        if (error.message.includes('credentials')) {
          setError('Invalid email or password');
        } else {
          setError(error.message || 'An error occurred during login');
        }
      } else if (data) {
        toast.success('Login successful');
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      {/* Branding Side */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 text-white bg-zinc-100">
        <div className="max-w-md">
          <img 
            alt="Garage Pro" 
            src="/lovable-uploads/ed35fded-80cf-4192-b64b-e97730ee6384.png" 
            className="w-72 mb-8 text-white object-contain" 
          />
          <p className="text-xl mb-8 text-slate-800 text-left">Garage management software helping you streamline:</p>
          <div className="space-y-4 text-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-3 bg-slate-800"></div>
              <p className="text-slate-800">Streamline your garage processes </p>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-3 bg-slate-800"></div>
              <p className="text-slate-800">Customer management</p>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full mr-3 bg-slate-800"></div>
              <p className="text-slate-800">Vehicle service tracking</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Login Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white px-8 py-10 shadow-lg rounded-lg">
            <div className="flex justify-center mb-6">
              <img 
                alt="Garage Pro" 
                className="h-16" 
                src="/lovable-uploads/b52e749c-5ab7-46f8-9727-4269e4dd0240.png" 
              />
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  {...register('email', { 
                    required: 'Email is required', 
                    pattern: { 
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, 
                      message: 'Invalid email address' 
                    } 
                  })}
                  className="w-full"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link to="/auth/forgot-password" className="text-sm text-gray-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  {...register('password', { required: 'Password is required' })}
                  className="w-full"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Logging in...' : 'Log in'}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/auth/register" className="text-gray-700 hover:underline">
                  Register
                </Link>
              </p>
            </div>

            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Demo credentials:</p>
              <p>Email: demo@garagepro.com</p>
              <p>Password: demo1234</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
