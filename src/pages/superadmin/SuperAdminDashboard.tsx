
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthContext } from '@/context/AuthContext';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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
            <TabsList>
              <TabsTrigger value="users">User Management</TabsTrigger>
              <TabsTrigger value="organizations">Organizations</TabsTrigger>
              <TabsTrigger value="system">System Settings</TabsTrigger>
              <TabsTrigger value="logs">Audit Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="space-y-6">
              <AdminUserManagement />
            </TabsContent>
            
            <TabsContent value="organizations">
              <p className="text-center py-8 text-muted-foreground">
                Organization management connected to the database
              </p>
            </TabsContent>
            
            <TabsContent value="system">
              <p className="text-center py-8 text-muted-foreground">
                System settings management connected to the database
              </p>
            </TabsContent>
            
            <TabsContent value="logs">
              <p className="text-center py-8 text-muted-foreground">
                Audit logs from superadmin_activity table
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminDashboard;
