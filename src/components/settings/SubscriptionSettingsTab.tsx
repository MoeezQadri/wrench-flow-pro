import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Users, CreditCard, RefreshCw, Settings, CheckCircle, AlertCircle, Star, Crown, Zap, Building2, Calendar, ExternalLink } from 'lucide-react';
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
    subscriptionTier,
    subscriptionEnd,
    refreshSubscription
  } = useAuthContext();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [managingSubscription, setManagingSubscription] = useState(false);

  // Only owners and admins can manage subscriptions organization-wide
  const canManageSubscription = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  useEffect(() => {
    loadPlans();
  }, []);
  const loadPlans = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('subscription_plans').select('*').eq('is_active', true).order('sort_order');
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
  const handleSubscribe = async (planId: string, billingFrequency: 'monthly' | 'yearly' = 'monthly') => {
    if (!currentUser) {
      toast.error('Please log in to subscribe');
      return;
    }
    setCheckoutLoading(planId);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('create-checkout', {
        body: {
          planId,
          billingFrequency
        }
      });
      if (error) throw error;

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setCheckoutLoading(null);
    }
  };
  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;

      // Open customer portal in a new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management');
    } finally {
      setManagingSubscription(false);
    }
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  const getStatusColor = (): "default" | "secondary" | "destructive" | "outline" => {
    if (!subscribed) return 'destructive';
    if (subscriptionEnd) {
      const daysUntilExpiry = Math.ceil((new Date(subscriptionEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
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
    return <Card>
        <CardHeader>
          <CardTitle>Subscription Information</CardTitle>
          <CardDescription>
            Only organization owners and administrators can view and manage subscription settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Contact your organization administrator to view subscription details.</p>
          </div>
        </CardContent>
      </Card>;
  }
  if (loading) {
    return <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>;
  }
  return <div className="space-y-6">
      {/* Current Subscription Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {subscribed ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-orange-500" />}
                Current Subscription
              </CardTitle>
              <CardDescription>
                Your organization's current subscription status and plan details.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefreshSubscription} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={getStatusColor()}>
                  {subscribed ? 'Active' : 'No Active Subscription'}
                </Badge>
              </div>
              {subscriptionTier && <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Plan:</span>
                  <div className="flex items-center gap-2">
                    {getPlanIcon(subscriptionTier)}
                    <Badge variant="outline">{subscriptionTier}</Badge>
                  </div>
                </div>}
            </div>

            {subscriptionEnd && <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Next Billing:</span>
                </div>
                <p className="text-sm text-muted-foreground">{formatDate(subscriptionEnd)}</p>
              </div>}

            {subscribed && <div className="flex items-end">
                <Button variant="outline" onClick={handleManageSubscription} disabled={managingSubscription} className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  {managingSubscription ? "Loading..." : "Manage Subscription"}
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </div>}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Available Subscription Plans */}
      <div>
        <div className="mb-6">
          <h3 className="text-lg font-semibold">
            {subscribed ? "Upgrade or Change Plan" : "Choose Your Plan"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {subscribed ? "Upgrade or downgrade your current subscription plan." : "Select a subscription plan that works best for your garage management needs."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(plan => {
          const isCurrentPlan = subscriptionTier === plan.name;
          const isPopular = plan.name === 'Professional';
          const features = Array.isArray(plan.features) ? plan.features : typeof plan.features === 'string' ? JSON.parse(plan.features) : [];
          return <Card key={plan.id} className={`relative ${isCurrentPlan ? 'ring-2 ring-primary' : ''}`}>
                {isPopular && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  </div>}
                
                {isCurrentPlan && <div className="absolute -top-3 right-4">
                    <Badge variant="secondary">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Current
                    </Badge>
                  </div>}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    {getPlanIcon(plan.name)}
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <div className="text-2xl font-bold">
                    ${plan.price_monthly}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </div>
                  {plan.price_yearly && plan.price_yearly > 0 && (
                    <div className="text-lg text-muted-foreground">
                      ${plan.price_yearly}
                      <span className="text-sm">/year</span>
                      {plan.price_monthly && (
                        <span className="text-xs text-green-600 ml-1">
                          (Save {Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100)}%)
                        </span>
                      )}
                    </div>
                  )}
                  <CardDescription className="text-xs">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-2 mb-4">
                    {features.slice(0, 4).map((feature: string, index: number) => <li key={index} className="flex items-center gap-2 text-xs">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>)}
                    {features.length > 4 && <li className="text-xs text-muted-foreground">
                        +{features.length - 4} more features
                      </li>}
                  </ul>

                  {plan.name.toLowerCase() !== 'trial' && (
                    <div className="space-y-2">
                      <Button 
                        onClick={() => handleSubscribe(plan.id, 'monthly')}
                        disabled={checkoutLoading === plan.id || isCurrentPlan}
                        className="w-full text-sm"
                        variant={isCurrentPlan ? "outline" : "default"}
                      >
                        {checkoutLoading === plan.id ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : isCurrentPlan ? (
                          "Current Plan"
                        ) : (
                          `$${plan.price_monthly}/month`
                        )}
                      </Button>
                      
                      {plan.price_yearly && plan.price_yearly > 0 && (
                        <Button 
                          onClick={() => handleSubscribe(plan.id, 'yearly')}
                          disabled={checkoutLoading === plan.id || isCurrentPlan}
                          className="w-full text-sm"
                          variant="outline"
                        >
                          {checkoutLoading === plan.id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <div className="flex flex-col">
                              <span>${plan.price_yearly}/year</span>
                              {plan.price_monthly && (
                                <span className="text-xs text-green-600">
                                  Save {Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100)}%
                                </span>
                              )}
                            </div>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>;
        })}
        </div>
      </div>

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
              Get detailed insights into your garage operations with advanced reporting.
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
              Advanced data backup and security features to protect your business.
            </p>
          </div>
        </div>
      </div>
    </div>;
};
export default SubscriptionSettingsTab;