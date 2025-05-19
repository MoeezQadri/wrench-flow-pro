import React, { useState, useEffect } from 'react';
import {
  fetchOrganizations,
  fetchUsers,
  updateUserStatus,
  deleteOrganization as deleteOrganizationService
} from '@/services/superadmin-service';
import { Profile as UserWithConfirmation, Organization } from '@/components/admin/types';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import OrganizationManagement from '@/components/admin/OrganizationManagement';

// Update the component to fix the type issues
const SuperAdminDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Updated for correct typing
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
      setOrganizations(organizationsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Mock data with correct types
  const mockOrganizations: Organization[] = [
    {
      id: 'org-1',
      name: 'Acme Auto Repair',
      subscriptionLevel: 'professional',
      subscriptionStatus: 'active',
      logo: '',
      trialEndsAt: '',
      address: '',
      phone: '',
      email: '',
      country: '',
      currency: ''
    },
    // ... add more organizations as needed
  ];
  
  const mockUsers: UserWithConfirmation[] = [
    {
      id: 'user-1',
      name: 'John Smith',
      email: 'john@example.com',
      role: 'owner',
      is_active: true,
      organization_id: 'org-1',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      email_confirmed_at: '2023-01-01'
    },
    // ... add more users as needed
  ];

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
