import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  CheckCircle,
  Edit,
  MoreHorizontal,
  Search,
  Trash,
  UserPlus,
  Users,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';
import {
  enableUserWithoutConfirmation,
  cleanUserData
} from '@/utils/supabase-helpers';
import { toast } from 'sonner';
import { UserWithConfirmation, Organization } from './types';
import AddUserDialog from './AddUserDialog';
import EditUserDialog from './EditUserDialog';
import { UserRole } from '@/types';

interface UserManagementProps {
  users: UserWithConfirmation[];
  setUsers: React.Dispatch<React.SetStateAction<UserWithConfirmation[]>>;
  organizations: Organization[];
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({
  users,
  setUsers,
  organizations,
  searchTerm,
  setSearchTerm,
  isLoading
}) => {
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithConfirmation | null>(null);

  // Function to handle enabling a user without email confirmation
  const handleEnableUser = async (userId: string) => {
    try {
      await enableUserWithoutConfirmation(userId);
      // Update the user's email_confirmed status in the local state
      const updatedUsers = users.map(user =>
        user.id === userId ? { ...user, email_confirmed_at: new Date().toISOString() } : user
      );
      setUsers(updatedUsers);
      toast.success('User enabled successfully!');
    } catch (error) {
      console.error('Error enabling user:', error);
      toast.error('Failed to enable user. Please try again.');
    }
  };

  // Function to handle cleaning user data
  const handleCleanUserData = async (userId: string) => {
    try {
      await cleanUserData(userId);
      toast.success('User data cleaned successfully!');
    } catch (error) {
      console.error('Error cleaning user data:', error);
      toast.error('Failed to clean user data. Please try again.');
    }
  };

  // Function to handle adding a new user
  const handleUserAdded = (newUser: UserWithConfirmation) => {
    setUsers([...users, newUser]);
  };

  // Function to handle updating a user
  const handleUserUpdated = (updatedUser: UserWithConfirmation) => {
    const updatedUsers = users.map(user =>
      user.id === updatedUser.id ? updatedUser : user
    );
    setUsers(updatedUsers);
  };

  // Function to handle role change
  const handleRoleChange = (user: UserWithConfirmation, newRole: string) => {
    const updatedUsers = users.map(u => 
      u.id === user.id 
        ? { ...u, role: newRole as UserRole }
        : u
    );
    setUsers(updatedUsers);
  };

  // Function to handle organization change
  const handleOrganizationChange = (user: UserWithConfirmation, newOrgId: string) => {
    const updatedUsers = users.map(u => 
      u.id === user.id 
        ? { ...u, organization_id: newOrgId }
        : u
    );
    setUsers(updatedUsers);
  };

  // Filter users by search term
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.organization_id && user.organization_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          {/* Add New User Button */}
          <Button
            onClick={() => setIsAddUserDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold">
                  {users.filter(user => user.is_active).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Unconfirmed</p>
                <p className="text-2xl font-bold">
                  {users.filter(user => user.role !== 'superuser' && !user.email_confirmed).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => {
                    const userOrg = organizations.find(org => org.id === user.organization_id);
                    
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name || 'Unnamed User'}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'superuser' ? 'destructive' : 'outline'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {userOrg ? userOrg.name : user.organization_id || 'No Organization'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={user.is_active ? 'default' : 'secondary'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {user.email_confirmed_at && (
                              <Badge variant="outline" className="text-xs">
                                Confirmed
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.last_login ? 
                            format(new Date(user.last_login), 'MMM dd, yyyy') : 
                            'Never'
                          }
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsEditUserDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              
                              {!user.email_confirmed_at && (
                                <DropdownMenuItem
                                  onClick={() => handleEnableUser(user.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Enable Without Confirmation
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem
                                onClick={() => handleCleanUserData(user.id)}
                                className="text-red-600"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Clean User Data
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddUserDialog
        open={isAddUserDialogOpen}
        onOpenChange={setIsAddUserDialogOpen}
        organizations={organizations}
        onUserAdded={handleUserAdded}
      />
      
      <EditUserDialog
        open={isEditUserDialogOpen}
        onOpenChange={setIsEditUserDialogOpen}
        user={selectedUser}
        organizations={organizations}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
};

export default UserManagement;
