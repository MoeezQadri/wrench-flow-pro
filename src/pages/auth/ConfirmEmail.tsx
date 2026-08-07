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
        // Supabase returns the tokens in the URL *hash* for the implicit flow
        // (#access_token=...&type=signup) and as ?code=... for PKCE. Reading
        // only the query string missed both, which made every valid
        // confirmation link look "invalid".
        const hash = new URLSearchParams(
          window.location.hash.startsWith('#')
            ? window.location.hash.slice(1)
            : window.location.hash
        );

        const pick = (key: string) => hash.get(key) ?? searchParams.get(key);

        const access_token = pick('access_token');
        const refresh_token = pick('refresh_token');
        const code = pick('code');
        const token_hash = pick('token_hash') ?? pick('token');
        const type = pick('type');
        const errorDescription = pick('error_description') ?? pick('error');

        // Preserve post-confirmation destination if provided
        const next = searchParams.get('next') || '/';
        const tab = searchParams.get('tab');
        const plan = searchParams.get('plan');

        const buildPostConfirmUrl = () => {
          if (!next || next === '/') return '/';
          const params = new URLSearchParams();
          if (tab) params.set('tab', tab);
          if (plan) params.set('plan', plan);
          const query = params.toString();
          return query ? `${next}?${query}` : next;
        };

        if (errorDescription) {
          throw new Error(
            decodeURIComponent(errorDescription).replace(/\+/g, ' ')
          );
        }

        // Recovery / invite flows are handled by dedicated pages.
        if (type === 'recovery') {
          const params = new URLSearchParams({ type: 'recovery' });
          if (access_token) params.set('access_token', access_token);
          if (refresh_token) params.set('refresh_token', refresh_token);
          if (token_hash) params.set('token_hash', token_hash);
          navigate(`/auth/reset-password?${params.toString()}`, { replace: true });
          return;
        }

        if (type === 'invite') {
          const params = new URLSearchParams({ type: 'invite' });
          if (access_token) params.set('access_token', access_token);
          if (refresh_token) params.set('refresh_token', refresh_token);
          if (token_hash) params.set('token_hash', token_hash);
          navigate(`/auth/setup-password?${params.toString()}`, { replace: true });
          return;
        }

        // Establish the session. Any of these paths can be the live one
        // depending on the link format Supabase generated.
        let user = null as any;

        if (access_token && refresh_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) throw error;
          user = data.user;
        } else if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          user = data.user;
        } else if (token_hash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'signup',
          });
          if (error) throw error;
          user = data.user;
        } else {
          // detectSessionInUrl may already have consumed the hash and signed
          // the user in before this effect ran — that is still a success.
          const { data } = await supabase.auth.getSession();
          user = data.session?.user ?? null;
          if (!user) {
            throw new Error(
              'This confirmation link is invalid or has already been used. Please log in, or request a new confirmation email.'
            );
          }
        }

        if (!user) {
          throw new Error('Failed to confirm email');
        }

        // Only genuinely invited users go through password setup. Self-service
        // registrations now also carry organization_id in their metadata, so
        // that alone must not route them here.
        const userMetadata = user.user_metadata || {};
        const isInvitedUser =
          !!userMetadata.invited_by && userMetadata.role !== 'owner';

        if (isInvitedUser) {
          const params = new URLSearchParams({ type: 'invite' });
          if (access_token) params.set('access_token', access_token);
          if (refresh_token) params.set('refresh_token', refresh_token);
          navigate(`/auth/setup-password?${params.toString()}`, { replace: true });
          return;
        }

        const postConfirmUrl = buildPostConfirmUrl();
        setStatus('success');
        toast({
          title: 'Email confirmed successfully!',
          description: 'Welcome to the platform. Redirecting you now...',
        });

        setTimeout(() => {
          navigate(postConfirmUrl, { replace: true });
        }, 2000);
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