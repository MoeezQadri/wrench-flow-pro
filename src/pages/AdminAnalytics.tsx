
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/services/data-service';
import SubscriptionAnalytics from '@/components/analytics/SubscriptionAnalytics';
import { PieChart, LineChart, BarChart, Users, Settings } from 'lucide-react';

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { currentUser } = useAuthContext();
  
  // Check if current user has permission to view analytics
  const canViewAnalytics = hasPermission(currentUser, 'reports', 'view');

  if (!canViewAnalytics) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Settings className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Permission Required</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have permission to view admin analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Analytics</h1>
          <p className="text-muted-foreground">
            Monitor your platform performance and metrics
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            Last 7 Days
          </Button>
          <Button variant="outline" size="sm">
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm">
            Last Quarter
          </Button>
          <Button variant="outline" size="sm">
            Last Year
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">
            <PieChart className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <LineChart className="h-4 w-4 mr-2" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="usage">
            <BarChart className="h-4 w-4 mr-2" />
            Usage
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <SubscriptionAnalytics />
        </TabsContent>
        
        <TabsContent value="subscriptions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Detailed subscription metrics and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Subscription analytics content will be displayed here. This would include detailed metrics on
                subscription growth, churn rate, lifetime value, and other subscription-related KPIs.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>
                User growth and engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                User analytics content will be displayed here. This would include detailed metrics on
                user acquisition, retention, activity levels, and other user-related KPIs.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="usage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Platform Usage</CardTitle>
              <CardDescription>
                How users are using the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Usage analytics content will be displayed here. This would include detailed metrics on
                feature usage, popular workflows, peak usage times, and other platform usage KPIs.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
