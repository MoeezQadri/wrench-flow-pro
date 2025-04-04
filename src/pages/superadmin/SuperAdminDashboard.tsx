
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BarChart, Users, CreditCard, Settings, LogOut, Activity, LineChart, PieChart, MousePointer, Package, Shield, Search, Trash } from 'lucide-react';
import AdminMetricsPanel from '@/components/admin/AdminMetricsPanel';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminPaymentManagement from '@/components/admin/AdminPaymentManagement';
import AdminAnalyticsIntegration from '@/components/admin/AdminAnalyticsIntegration';
import SubscriptionPlansManagement from '@/components/admin/SubscriptionPlansManagement';
import RolesManagementTab from '@/components/settings/RolesManagementTab';
import OrganizationSearch from '@/components/admin/OrganizationSearch';
import DataCleanupPanel from '@/components/admin/DataCleanupPanel';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('metrics');
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('overview');
  const { currentUser, logout } = useAuthContext();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is a superuser
    if (!currentUser || currentUser.role !== 'superuser') {
      navigate('/superadmin/login');
    }
  }, [currentUser, navigate]);
  
  const handleLogout = () => {
    logout();
    localStorage.removeItem('superadminToken');
    navigate('/superadmin/login');
  };

  if (!currentUser || currentUser.role !== 'superuser') {
    return null; // Or loading indicator
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-red-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <AlertTriangle size={24} />
            <h1 className="text-xl font-bold">SUPERADMIN PORTAL</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span>Logged in as {currentUser.name}</span>
            <Button variant="ghost" className="text-white hover:bg-red-700" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
    
      <main className="container mx-auto p-4 md:p-6">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">System Administration</h1>
              <p className="text-muted-foreground">
                Complete platform control and management
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-9 md:w-fit">
              <TabsTrigger value="metrics">
                <BarChart className="h-4 w-4 mr-2" />
                Metrics
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="payments">
                <CreditCard className="h-4 w-4 mr-2" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="subscriptions">
                <Package className="h-4 w-4 mr-2" />
                Subscriptions
              </TabsTrigger>
              <TabsTrigger value="roles">
                <Shield className="h-4 w-4 mr-2" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="search">
                <Search className="h-4 w-4 mr-2" />
                Search
              </TabsTrigger>
              <TabsTrigger value="cleanup">
                <Trash className="h-4 w-4 mr-2" />
                Cleanup
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <Activity className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="metrics" className="space-y-6">
              <AdminMetricsPanel />
            </TabsContent>
            
            <TabsContent value="users" className="space-y-6">
              <AdminUserManagement />
            </TabsContent>
            
            <TabsContent value="payments" className="space-y-6">
              <AdminPaymentManagement />
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-6">
              <SubscriptionPlansManagement />
            </TabsContent>
            
            <TabsContent value="roles" className="space-y-6">
              <RolesManagementTab />
            </TabsContent>
            
            <TabsContent value="search" className="space-y-6">
              <OrganizationSearch />
            </TabsContent>
            
            <TabsContent value="cleanup" className="space-y-6">
              <DataCleanupPanel />
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure global system settings and parameters
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    System settings content will be displayed here, including application configuration,
                    security settings, and global parameters.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics" className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Analytics & Reporting</h2>
                  <p className="text-muted-foreground">
                    Monitor platform performance and user engagement
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

              <Tabs value={activeAnalyticsTab} onValueChange={setActiveAnalyticsTab} className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">
                    <PieChart className="h-4 w-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="traffic">
                    <LineChart className="h-4 w-4 mr-2" />
                    Traffic
                  </TabsTrigger>
                  <TabsTrigger value="users">
                    <Users className="h-4 w-4 mr-2" />
                    Users
                  </TabsTrigger>
                  <TabsTrigger value="behavior">
                    <MousePointer className="h-4 w-4 mr-2" />
                    Behavior
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                  <AdminAnalyticsIntegration />
                </TabsContent>
                
                <TabsContent value="traffic" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Traffic Analysis</CardTitle>
                      <CardDescription>Detailed breakdown of your website traffic</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Detailed traffic analysis data will be displayed here.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="users" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Analytics</CardTitle>
                      <CardDescription>User growth and engagement metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        User analytics content will be displayed here.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="behavior" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>User Behavior</CardTitle>
                      <CardDescription>How users are interacting with your platform</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        User behavior analytics will be displayed here.
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
