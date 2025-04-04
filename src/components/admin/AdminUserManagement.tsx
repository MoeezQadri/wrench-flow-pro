
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/context/AuthContext';
import { getOrganizations, getAllUsers } from '@/utils/supabase-helpers';
import { UserWithConfirmation, Organization } from './types';
import OrganizationManagement from './OrganizationManagement';
import UserManagement from './UserManagement';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const AdminUserManagement = () => {
  const [users, setUsers] = useState<UserWithConfirmation[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('organizations');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser, session } = useAuthContext();
  
  // Fetch data from Supabase
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('AdminUserManagement: Fetching data with session:', session?.access_token?.substring(0, 10) + '...');
        
        // Fetch organizations using our helper function
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
        setError(`Failed to load data: ${error.message || 'Unknown error'}`);
        toast.error(`Failed to load data: ${error.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (session) {
      fetchData();
    } else {
      console.warn('No session available, skipping data fetch');
      setIsLoading(false);
    }
  }, [session]);
  
  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
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
