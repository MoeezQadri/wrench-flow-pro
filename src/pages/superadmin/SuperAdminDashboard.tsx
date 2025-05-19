
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/context/AuthContext';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import { AlertTriangle, RefreshCcw, Users, Building, CreditCard, LineChart, Settings, ShieldCheck, BarChart4, Globe } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import SubscriptionPlansManagement from '@/components/admin/SubscriptionPlansManagement';
import OrganizationManagement from '@/components/admin/OrganizationManagement';
import SuperAdminAnalytics from '@/components/superadmin/SuperAdminAnalytics';
import SuperAdminSettings from '@/components/superadmin/SuperAdminSettings';
import SuperAdminRoles from '@/components/superadmin/SuperAdminRoles';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser, session } = useAuthContext();
  const navigate = useNavigate();
  
  // Check if user is a superadmin
  const isSuperAdmin = currentUser?.role === 'superuser';
  
  // Verify session on component mount
  useEffect(() => {
    const verifySession = async () => {
      if (!session || !isSuperAdmin) {
        navigate('/superadmin/login');
        return;
      }
      
      // Authorization is checked in components using the session token
      setIsLoading(false);
    };
    
    verifySession();
  }, [session, isSuperAdmin, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/superadmin/login')} 
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh Session
            </Button>
          </div>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-red-600">SuperAdmin Dashboard</h1>
          <p className="text-muted-foreground">
            System-wide administration and management
          </p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>
            Welcome, {currentUser?.name || 'SuperAdmin'}. You have full access to all system features and data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="organizations" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Organizations
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Subscriptions
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="metrics" className="flex items-center gap-2">
                <BarChart4 className="h-4 w-4" />
                Metrics
              </TabsTrigger>
              <TabsTrigger value="integration" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Integration
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="space-y-6">
              <AdminUserManagement />
            </TabsContent>
            
            <TabsContent value="organizations">
              <OrganizationManagement />
            </TabsContent>
            
            <TabsContent value="subscriptions">
              <SubscriptionPlansManagement />
            </TabsContent>
            
            <TabsContent value="analytics">
              <SuperAdminAnalytics />
            </TabsContent>
            
            <TabsContent value="roles">
              <SuperAdminRoles />
            </TabsContent>
            
            <TabsContent value="settings">
              <SuperAdminSettings />
            </TabsContent>

            <TabsContent value="metrics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Metrics</CardTitle>
                  <CardDescription>Monitor key system performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">System metrics coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="integration" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics Integration</CardTitle>
                  <CardDescription>Add Google Analytics or GTM tracking scripts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground mb-4">Analytics integration coming soon</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;
