import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const ConfirmEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Get tokens from URL parameters
        const access_token = searchParams.get('access_token');
        const refresh_token = searchParams.get('refresh_token');
        const type = searchParams.get('type');

        if (!access_token || !refresh_token || type !== 'signup') {
          throw new Error('Invalid confirmation link');
        }

        // Set the session using the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) throw error;

        if (data.user) {
          setStatus('success');
          toast({
            title: "Email confirmed successfully!",
            description: "Welcome to the platform. Redirecting to dashboard...",
          });

          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 2000);
        } else {
          throw new Error('Failed to confirm email');
        }
      } catch (error: any) {
        console.error('Error confirming email:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Failed to confirm email');
        toast({
          variant: "destructive",
          title: "Confirmation failed",
          description: error.message || 'Failed to confirm email. Please try again.',
        });
      }
    };

    confirmEmail();
  }, [searchParams, navigate, toast]);

  const handleRetryConfirmation = () => {
    navigate('/auth/register', { replace: true });
  };

  const handleGoToLogin = () => {
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Email Confirmation</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Confirming your email address...'}
            {status === 'success' && 'Your email has been confirmed!'}
            {status === 'error' && 'There was an issue confirming your email'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' && (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Processing confirmation...</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-green-50 p-4 rounded-md border border-green-200 mb-4 flex items-start">
              <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
              <div>
                <p className="text-green-800">Your email has been confirmed successfully!</p>
                <p className="text-green-700 mt-2">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="bg-red-50 p-4 rounded-md border border-red-200 flex items-start">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-red-800">Email confirmation failed</p>
                  <p className="text-red-700 mt-1 text-sm">{errorMessage}</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleRetryConfirmation} variant="outline" className="flex-1">
                  Try Again
                </Button>
                <Button onClick={handleGoToLogin} className="flex-1">
                  Go to Login
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmEmail;