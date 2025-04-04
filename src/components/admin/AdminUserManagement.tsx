
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthContext } from '@/context/AuthContext';
import { getOrganizations, getAllUsers } from '@/utils/supabase-helpers';
import { UserWithConfirmation, Organization } from './types';
import OrganizationManagement from './OrganizationManagement';
import UserManagement from './UserManagement';

const AdminUserManagement = () => {
  const [users, setUsers] = useState<UserWithConfirmation[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('organizations');
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuthContext();
  
  // Fetch data from Supabase
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch organizations using our helper function
        const orgsData = await getOrganizations();
        
        // Fetch all users with confirmation status
        const usersData = await getAllUsers();
        
        setOrganizations(orgsData || []);
        setUsers(usersData || []);
      } catch (error: any) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  return (
    <div className="space-y-6">
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
