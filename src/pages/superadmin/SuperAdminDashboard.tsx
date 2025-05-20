
import React, { useState, useEffect } from 'react';
import {
  fetchOrganizations,
  fetchUsers,
  updateUserStatus,
  deleteOrganization as deleteOrganizationService
} from '@/services/superadmin-service';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import OrganizationManagement from '@/components/admin/OrganizationManagement';
import { Profile, Organization, UserWithConfirmation } from '@/components/admin/types';

const SuperAdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Updated for correct typing from admin/types.ts
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<UserWithConfirmation[]>([]);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setIsLoading(true);
    try {
      const organizationsData = await fetchOrganizations();
      const usersData = await fetchUsers();
      
      // Convert types to match the components/admin/types.ts definitions
      const convertedOrgs = (organizationsData || []).map(org => ({
        id: org.id,
        name: org.name,
        subscription_level: org.subscription_level || 'trial',
        subscription_status: org.subscription_status || 'active',
        trial_ends_at: org.trial_ends_at || '',
        logo: org.logo || '',
        address: org.address || '',
        phone: org.phone || '',
        email: org.email || '',
        country: org.country || '',
        currency: org.currency || '',
        created_at: org.created_at || new Date().toISOString(),
        updated_at: org.updated_at || undefined
      })) as Organization[];
      
      setOrganizations(convertedOrgs);
      setUsers(usersData as UserWithConfirmation[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Super Admin Dashboard</h1>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search organizations or users..."
          className="w-full px-4 py-2 border rounded-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdminUserManagement 
          users={users}
          setUsers={setUsers}
          organizations={organizations}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isLoading={isLoading}
        />
        
        <OrganizationManagement 
          organizations={organizations}
          setOrganizations={setOrganizations}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
