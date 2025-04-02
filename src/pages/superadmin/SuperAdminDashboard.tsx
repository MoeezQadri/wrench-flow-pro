
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle, BarChart, Users, CreditCard, Settings, LogOut } from 'lucide-react';
import AdminMetricsPanel from '@/components/admin/AdminMetricsPanel';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminPaymentManagement from '@/components/admin/AdminPaymentManagement';
import AdminAnalyticsIntegration from '@/components/admin/AdminAnalyticsIntegration';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = React.useState('metrics');
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
            <TabsList className="grid grid-cols-4 md:w-fit">
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
              <TabsTrigger value="analytics">
                <Settings className="h-4 w-4 mr-2" />
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
            
            <TabsContent value="analytics" className="space-y-6">
              <AdminAnalyticsIntegration />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
