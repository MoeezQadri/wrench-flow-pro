import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/context/AuthContext';
import Logo from '@/components/Logo';
const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const {
    signIn
  } = useAuthContext();
  const navigate = useNavigate();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (!signIn) {
      setError('Authentication service unavailable');
      setLoading(false);
      return;
    }
    try {
      const {
        data,
        error
      } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else if (data) {
        navigate('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };
  return <div className="flex min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
      {/* Branding Side */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md">
          <img src="/garage-pro-logo.svg" alt="Garage Pro" className="w-72 mb-8 text-white object-scale-down" />
          <p className="text-xl mb-8">Automotive business management simplified</p>
          <div className="space-y-4 text-lg">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-white mr-3"></div>
              <p>Streamlined invoicing</p>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-white mr-3"></div>
              <p>Customer management</p>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-white mr-3"></div>
              <p>Vehicle service tracking</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Login Form Side */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white px-8 py-10 shadow-lg rounded-lg">
            <div className="flex justify-center mb-6">
              <img src="/garage-pro-logo.svg" alt="Garage Pro" className="h-16" />
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
            
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link to="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
              
              <button type="submit" disabled={loading} className={`w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}>
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link to="/auth/register" className="text-blue-600 hover:underline">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default Login;