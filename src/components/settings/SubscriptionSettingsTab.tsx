import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  CreditCard,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Star,
  Crown,
  Zap,
  Building2,
  Calendar,
  Loader2,
} from 'lucide-react';
import PricingPlans from './PricingPlans';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cancelOwnSubscription } from '@/utils/supabase-helpers';
import { trackSelectPlan, trackViewPlans } from '@/lib/analytics';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly?: number;
  features: any;
  is_active: boolean;
  sort_order: number;
}
const SubscriptionSettingsTab = () => {
  const {
    currentUser,
    subscribed,
    subscriptionSuspended,
    subscriptionTier,
    subscriptionEnd,
    subscriptionCanceling,
    subscriptionExpiredReason,
    refreshSubscription,
  } = useAuthContext();
  const [searchParams] = useSearchParams();
  const highlightedPlan = searchParams.get('plan') || undefined;
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelWorking, setCancelWorking] = useState(false);

  const isPaidPlan =
    !!subscriptionTier && subscriptionTier.toLowerCase() !== 'trial';

  const handleCancelSubscription = async () => {
    setCancelWorking(true);
    try {
      const result = await cancelOwnSubscription('cancel');
      if (result?.changed === false) {
        toast.warning(
          result?.message ||
            'No active subscription was found for your organization.'
        );
        return;
      }
      toast.success(
        result?.message ||
          'Your subscription will stop at the end of the current period.'
      );
      await refreshSubscription();
      setCancelDialogOpen(false);
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Could not cancel the subscription. Please try again.';
      toast.error(message);
    } finally {
      setCancelWorking(false);
    }
  };





  // Only owners and admins can manage subscriptions organization-wide
  const canManageSubscription =
    currentUser?.role === 'owner' || currentUser?.role === 'admin';
  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    if (!loading && canManageSubscription) {
      trackViewPlans(subscriptionTier || undefined);
    }
  }, [loading, canManageSubscription, subscriptionTier]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };
  const handleRefreshSubscription = async () => {
    setRefreshing(true);
    try {
      await refreshSubscription();
      toast.success('Subscription status refreshed');
    } catch (error) {
      console.error('Error refreshing subscription:', error);
      toast.error('Failed to refresh subscription status');
    } finally {
      setRefreshing(false);
    }
  };
  const handleSubscribe = async (
    planId: string,
    billingFrequency: 'monthly' | 'yearly' = 'monthly'
  ) => {
    console.log('Subscribe button clicked', {
      planId,
      billingFrequency,
      currentUser,
    });

    if (!currentUser) {
      toast.error('Please log in to subscribe');
      return;
    }

    const selectedPlan = plans.find((p) => p.id === planId);
    trackSelectPlan({
      planId,
      planName: selectedPlan?.name,
      billingFrequency,
      price:
        billingFrequency === 'yearly'
          ? selectedPlan?.price_yearly ?? selectedPlan?.price_monthly
          : selectedPlan?.price_monthly,
    });

    setCheckoutLoading(planId);
    try {
      console.log('Invoking create-checkout function...');
      const { data, error } = await supabase.functions.invoke(
        'create-checkout',
        {
          body: {
            planId,
            billingFrequency,
          },
        }
      );

      console.log('Create-checkout response:', { data, error });

      if (error) throw error;

      if (data?.url) {
        console.log('Opening checkout URL:', data.url);
        // Open Stripe checkout in the same window
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error(
        `Failed to start checkout process: ${error.message || 'Unknown error'}`
      );
    } finally {
      setCheckoutLoading(null);
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  const getStatusColor = ():
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline' => {
    if (!subscribed) return 'destructive';
    if (subscriptionEnd || subscriptionSuspended) {
      const daysUntilExpiry = Math.ceil(
        (new Date(subscriptionEnd).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry <= 7) return 'secondary';
    }
    return 'default';
  };
  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'trial':
        return <Zap className="h-5 w-5" />;
      case 'basic':
        return <Users className="h-5 w-5" />;
      case 'professional':
        return <Crown className="h-5 w-5" />;
      case 'enterprise':
        return <Building2 className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };
  if (!canManageSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Subscription Information</CardTitle>
          <CardDescription>
            Only organization owners and administrators can view and manage
            subscription settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              Contact your organization administrator to view subscription
              details.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {subscribed && !subscriptionSuspended ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                )}
                Current Subscription
              </CardTitle>
              <CardDescription>
                Your organization's current subscription status and plan
                details.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshSubscription}
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={getStatusColor()}>
                  {subscribed
                    ? subscriptionCanceling
                      ? 'Cancelling'
                      : 'Active'
                    : 'No Active Subscription'}
                </Badge>
                {subscriptionSuspended && (
                  <Badge variant={'destructive'}>{'Suspended'}</Badge>
                )}
              </div>
              {subscriptionTier && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Plan:</span>
                  <div className="flex items-center gap-2">
                    {getPlanIcon(subscriptionTier)}
                    <Badge variant="outline">{subscriptionTier}</Badge>
                  </div>
                </div>
              )}
            </div>

            {subscriptionEnd && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {subscriptionSuspended || subscriptionCanceling
                      ? 'Access until:'
                      : `Next Billing:`}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(subscriptionEnd)}
                </p>
              </div>
            )}
          </div>

          {!subscribed && (
            <div className="mt-6 rounded-md border border-orange-300 bg-orange-50 p-4 dark:bg-orange-950/30">
              <p className="text-sm font-medium">
                {subscriptionExpiredReason === 'subscription'
                  ? 'Your subscription has ended.'
                  : subscriptionEnd
                    ? `Your free trial ended on ${formatDate(subscriptionEnd)}.`
                    : 'Your free trial has ended.'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a plan below to restore access. Your data is safe and
                waiting for you.
              </p>
            </div>
          )}

          {subscribed && isPaidPlan && subscriptionCanceling && (
            <div className="mt-6 rounded-md border border-orange-300 bg-orange-50 p-4 dark:bg-orange-950/30">
              <p className="text-sm font-medium">
                {subscriptionEnd
                  ? `Your subscription ends on ${formatDate(subscriptionEnd)}.`
                  : 'Your subscription ends at the end of the current period.'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                You keep full access until then, and you will not be billed
                again. After that date you can choose a plan below to restore
                access.
              </p>
            </div>
          )}

          {subscribed && isPaidPlan && !subscriptionCanceling && canManageSubscription && (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                You can stop your plan at any time; it stays active until the
                end of the period you have paid for.
              </p>
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => setCancelDialogOpen(true)}
                disabled={cancelWorking}
              >
                {cancelWorking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  'Cancel subscription'
                )}
              </Button>
            </div>
          )}

        </CardContent>
      </Card>

      <AlertDialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          if (cancelWorking) return;
          setCancelDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You keep full access until
              {subscriptionEnd ? ` ${formatDate(subscriptionEnd)}` : ' the end of the period you have already paid for'}
              , and you will not be billed again. No refund is issued for the
              current period. After that date you can choose a plan again to
              restore access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelWorking}>
              Keep subscription
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancelSubscription();
              }}
              disabled={cancelWorking}
            >
              {cancelWorking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Yes, cancel'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <Separator />

      {/* Available Subscription Plans */}
      <PricingPlans
        plans={plans}
        subscribed={subscribed}
        subscriptionTier={subscriptionTier}
        checkoutLoading={checkoutLoading}
        onSubscribe={handleSubscribe}
        highlightedPlan={highlightedPlan}
      />

      {/* Subscription Benefits */}
      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Why Subscribe?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Advanced Analytics
            </h4>
            <p className="text-sm text-muted-foreground">
              Get detailed insights into your garage operations with advanced
              reporting.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Priority Support
            </h4>
            <p className="text-sm text-muted-foreground">
              Access to priority customer support with faster response times.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Team Collaboration
            </h4>
            <p className="text-sm text-muted-foreground">
              Add team members and manage permissions for better collaboration.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Unlimited Storage
            </h4>
            <p className="text-sm text-muted-foreground">
              Store unlimited customer data, invoices, and vehicle information.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Mobile Access
            </h4>
            <p className="text-sm text-muted-foreground">
              Access your garage management system from any mobile device.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Enhanced Security
            </h4>
            <p className="text-sm text-muted-foreground">
              Advanced data backup and security features to protect your
              business.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SubscriptionSettingsTab;
