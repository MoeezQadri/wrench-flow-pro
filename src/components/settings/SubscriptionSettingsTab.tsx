import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/context/AuthContext';
import { Users } from 'lucide-react';
import SubscriptionPlans from '@/components/subscription/SubscriptionPlans';
import SubscriptionStatus from '@/components/subscription/SubscriptionStatus';
import { Separator } from '@/components/ui/separator';

const SubscriptionSettingsTab = () => {
  const { currentUser, subscribed } = useAuthContext();
  // Only owners and admins can manage subscriptions organization-wide
  const canManageSubscription = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  
  if (!canManageSubscription) {
    return (
      <Card>
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
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Subscription Management</h2>
        <p className="text-muted-foreground">
          Manage your organization's subscription plan and billing information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <SubscriptionStatus />
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Available Plans</CardTitle>
              <CardDescription>
                {subscribed 
                  ? "Upgrade or downgrade your current subscription plan." 
                  : "Choose a subscription plan that works best for your garage management needs."
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionPlans />
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      <div className="bg-muted/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Subscription Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Advanced Analytics</h4>
            <p className="text-sm text-muted-foreground">
              Get detailed insights into your garage operations with advanced reporting and analytics.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Priority Support</h4>
            <p className="text-sm text-muted-foreground">
              Access to priority customer support with faster response times.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Team Collaboration</h4>
            <p className="text-sm text-muted-foreground">
              Add team members and manage permissions for better collaboration.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Unlimited Storage</h4>
            <p className="text-sm text-muted-foreground">
              Store unlimited customer data, invoices, and vehicle information.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Mobile Access</h4>
            <p className="text-sm text-muted-foreground">
              Access your garage management system from any mobile device.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Backup & Security</h4>
            <p className="text-sm text-muted-foreground">
              Enhanced data backup and security features to protect your business data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSettingsTab;
