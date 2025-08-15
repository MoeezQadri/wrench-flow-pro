import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SubscriptionStatus: React.FC = () => {
  const { subscribed, subscriptionTier, subscriptionEnd, refreshSubscription } = useAuthContext();
  const [refreshing, setRefreshing] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);

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

  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

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
      if (daysUntilExpiry <= 7) return 'secondary'; // Use secondary instead of warning
    }
    return 'default';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {subscribed ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-orange-500" />
            )}
            Subscription Status
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshSubscription}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={getStatusColor()}>
            {subscribed ? 'Active' : 'No Active Subscription'}
          </Badge>
        </div>

        {subscriptionTier && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Plan:</span>
            <Badge variant="outline">{subscriptionTier}</Badge>
          </div>
        )}

        {subscriptionEnd && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Next Billing:</span>
            <span className="text-sm">{formatDate(subscriptionEnd)}</span>
          </div>
        )}

        {subscribed && (
          <Button
            className="w-full"
            variant="outline"
            onClick={handleManageSubscription}
            disabled={managingSubscription}
          >
            <Settings className="w-4 h-4 mr-2" />
            {managingSubscription ? "Loading..." : "Manage Subscription"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;