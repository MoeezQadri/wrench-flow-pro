
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, UserCog, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/context/AuthContext';
import { getOrganizations, getAllUsers } from '@/utils/supabase-helpers';
import { UserWithConfirmation, Organization } from './types';
import OrganizationManagement from './OrganizationManagement';
import UserManagement from './UserManagement';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AdminUserManagement = () => {
  const [users, setUsers] = useState<UserWithConfirmation[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('organizations');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser, session } = useAuthContext();
  const navigate = useNavigate();
  
  // Function to fetch data from Supabase
  const fetchData = async (retryAuth = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Set auth token for functions if superadmin
      if (currentUser?.role === 'superuser' && retryAuth) {
        const superAdminToken = localStorage.getItem('superadminToken');
        if (superAdminToken) {
          console.log('Setting SuperAdmin token for API calls');
          supabase.functions.setAuth(superAdminToken);
        }
      }
      
      // Log what session we're using
      console.log('AdminUserManagement: Fetching data with auth token:', 
        session?.access_token?.substring(0, 10) + '...' || 'No session token');
      
      // Fetch organizations
      console.log('Fetching organizations...');
      const orgsData = await getOrganizations();
      console.log(`Fetched ${orgsData?.length || 0} organizations`);
      
      // Fetch all users with confirmation status
      console.log('Fetching users...');
      const usersData = await getAllUsers();
      console.log(`Fetched ${usersData?.length || 0} users`);
      
      setOrganizations(orgsData || []);
      setUsers(usersData || []);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      
      // Check if this is an authentication error
      if (error.message?.includes('401') || error.message?.includes('authentication failed')) {
        setError(`Authentication failed. Please try logging in again.`);
        // For superadmin, offer retry option
        if (currentUser?.role === 'superuser') {
          toast.error('Authentication error. Try refreshing your session.', {
            action: {
              label: 'Refresh',
              onClick: () => navigate('/superadmin/login')
            }
          });
        }
      } else {
        setError(`Failed to load data: ${error.message || 'Unknown error'}`);
        toast.error(`Failed to load data: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Initial fetch on component mount
  useEffect(() => {
    if (session) {
      fetchData();
    } else {
      console.warn('No session available, skipping data fetch');
      setIsLoading(false);
      setError('No active session. Please log in.');
    }
  }, [session]);
  
  // Handle refresh button click
  const handleRefresh = () => {
    fetchData(true);
  };
  
  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="organizations">
            <Building className="mr-2 h-4 w-4" />
            Organizations
          </TabsTrigger>
          <TabsTrigger value="users">
            <UserCog className="mr-2 h-4 w-4" />
            Users
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="organizations" className="space-y-6">
          <OrganizationManagement 
            organizations={organizations}
            setOrganizations={setOrganizations}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <UserManagement 
            users={users}
            setUsers={setUsers}
            organizations={organizations}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminUserManagement;
