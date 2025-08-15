import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import SubscriptionPlans from '@/components/subscription/SubscriptionPlans';
import SubscriptionStatus from '@/components/subscription/SubscriptionStatus';
import { useAuthContext } from '@/context/AuthContext';

const Subscriptions: React.FC = () => {
  const { subscribed } = useAuthContext();

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
        <p className="text-muted-foreground">
          Manage your subscription plan and billing information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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

export default Subscriptions;