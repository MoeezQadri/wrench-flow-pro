
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/services/data-service';
import { BarChart, Users, CreditCard, PieChart, LineChart, Gauge } from 'lucide-react';
import AdminMetricsPanel from '@/components/admin/AdminMetricsPanel';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminPaymentManagement from '@/components/admin/AdminPaymentManagement';
import AdminAnalyticsIntegration from '@/components/admin/AdminAnalyticsIntegration';
import { Organization, UserWithConfirmation } from '@/components/admin/types';
import { getAllUsers, getOrganizations } from '@/utils/supabase-helpers';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('metrics');
  const { currentUser } = useAuthContext();
  const [users, setUsers] = useState<UserWithConfirmation[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const orgsData = await getOrganizations();
        const usersData = await getAllUsers();
        
        setOrganizations(orgsData || []);
        setUsers(usersData || []);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Only owner and manager roles should access admin dashboard
  const canAccessAdmin = currentUser?.role === 'owner' || currentUser?.role === 'manager';

  if (!canAccessAdmin) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Access Restricted</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have permission to access the admin dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage all aspects of your product and track important metrics
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 md:w-fit">
          <TabsTrigger value="metrics">
            <Gauge className="h-4 w-4 mr-2" />
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
            <BarChart className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="metrics" className="space-y-6">
          <AdminMetricsPanel />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <AdminUserManagement 
            users={users}
            setUsers={setUsers}
            organizations={organizations}
            setOrganizations={setOrganizations}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-6">
          <AdminPaymentManagement />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <AdminAnalyticsIntegration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
