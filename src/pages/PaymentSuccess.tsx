import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';
import { trackPaymentFailed, trackPurchase } from '@/lib/analytics';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { refreshSubscription, subscribed, subscriptionTier } =
    useAuthContext();
  const [status, setStatus] = useState<'verifying' | 'confirmed' | 'pending'>(
    'verifying'
  );
  const tracked = useRef(false);

  const sessionId = searchParams.get('session_id') || undefined;
  const plan = searchParams.get('plan') || undefined;

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      // Stripe webhooks can take a moment — retry a few times.
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await refreshSubscription?.();
        } catch (err) {
          console.error('[PaymentSuccess] refresh failed', err);
        }
        if (cancelled) return;
        if (subscribed) break;
        await new Promise((r) => setTimeout(r, 2000));
      }
      if (!cancelled) setStatus(subscribed ? 'confirmed' : 'pending');
    };

    verify();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (subscribed) setStatus('confirmed');
  }, [subscribed]);

  useEffect(() => {
    if (tracked.current) return;
    if (status === 'confirmed') {
      tracked.current = true;
      trackPurchase({
        transactionId: sessionId,
        planName: subscriptionTier || plan,
      });
    } else if (status === 'pending') {
      tracked.current = true;
      trackPaymentFailed({
        reason: 'subscription_not_confirmed',
        planName: plan,
      });
    }
  }, [status, sessionId, plan, subscriptionTier]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <div className="mx-auto mb-2">
            {status === 'verifying' && (
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            )}
            {status === 'confirmed' && (
              <CheckCircle className="h-12 w-12 text-green-500" />
            )}
            {status === 'pending' && (
              <AlertCircle className="h-12 w-12 text-orange-500" />
            )}
          </div>
          <CardTitle>
            {status === 'verifying' && 'Confirming your payment…'}
            {status === 'confirmed' && 'Thank you for subscribing!'}
            {status === 'pending' && 'Payment received, activation pending'}
          </CardTitle>
          <CardDescription>
            {status === 'verifying' &&
              'Please wait while we verify your subscription with our payment provider.'}
            {status === 'confirmed' &&
              `Your ${subscriptionTier || plan || 'new'} plan is now active. You have full access to GaragePro.`}
            {status === 'pending' &&
              'We could not confirm your subscription yet. It usually activates within a minute — refresh your subscription in settings.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link to="/">Go to dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/settings?tab=subscription">View subscription</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
