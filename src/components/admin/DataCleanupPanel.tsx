
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, RefreshCw, AlertTriangle } from 'lucide-react';
import { getInactiveUsers, cleanUserData } from '@/utils/supabase-helpers';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

type InactiveUser = {
  id: string;
  name: string;
  email: string;
  last_login: string | null;
  days_since_login: number;
};

const DataCleanupPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [inactiveUsers, setInactiveUsers] = useState<InactiveUser[]>([]);
  const [daysInactive, setDaysInactive] = useState('90');
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<InactiveUser | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loadInactiveUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Calling getInactiveUsers with days:', parseInt(daysInactive));
      const data = await getInactiveUsers(parseInt(daysInactive));
      console.log('Received data:', data);
      
      // Ensure data format matches our expected type
      const formattedData: InactiveUser[] = data.map((user: any) => ({
        id: user.id,
        name: user.name || 'Unknown',
        email: user.email || '',
        last_login: user.last_login,
        days_since_login: user.days_since_login
      }));
      
      setInactiveUsers(formattedData || []);
    } catch (error: any) {
      console.error('Error loading inactive users:', error);
      setError(error.message || 'Failed to load inactive users');
      toast.error('Failed to load inactive users: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInactiveUsers();
  }, []);

  const handleCleanUser = async () => {
    if (!selectedUser) return;
    
    try {
      await cleanUserData(selectedUser.id);
      toast.success(`User data for ${selectedUser.name} has been cleaned`);
      setInactiveUsers(prev => prev.filter(user => user.id !== selectedUser.id));
      setConfirmDialog(false);
      setConfirmText('');
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error cleaning user data:', error);
      toast.error('Failed to clean user data: ' + (error.message || 'Unknown error'));
    }
  };

  const promptCleanUser = (user: InactiveUser) => {
    setSelectedUser(user);
    setConfirmDialog(true);
  };

  const isConfirmButtonDisabled = confirmText !== 'CLEAN';

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Data Cleanup</CardTitle>
        <CardDescription>
          Clean data for inactive users to maintain database hygiene
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Data cleaning will anonymize the user's personal information but won't delete the account. 
            This action cannot be undone.
          </AlertDescription>
        </Alert>

        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-grow">
            <Select 
              value={daysInactive} 
              onValueChange={setDaysInactive}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Select days inactive" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30+ Days Inactive</SelectItem>
                <SelectItem value="60">60+ Days Inactive</SelectItem>
                <SelectItem value="90">90+ Days Inactive</SelectItem>
                <SelectItem value="180">180+ Days Inactive</SelectItem>
                <SelectItem value="365">365+ Days Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={loadInactiveUsers}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Days Inactive</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inactiveUsers.length > 0 ? (
                inactiveUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="text-center">{user.days_since_login}</TableCell>
                    <TableCell>{formatDate(user.last_login)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => promptCleanUser(user)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Clean
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {isLoading ? (
                      'Loading inactive users...'
                    ) : error ? (
                      'Failed to load inactive users. Please try again later.'
                    ) : (
                      'No inactive users found for the selected criteria.'
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Confirm Data Cleaning
              </DialogTitle>
              <DialogDescription>
                This action will anonymize user data for {selectedUser?.name} ({selectedUser?.email}). 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="confirmText" className="text-sm font-medium">
                Type CLEAN to confirm
              </Label>
              <Input
                id="confirmText"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="mt-2"
                placeholder="CLEAN"
              />
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setConfirmDialog(false);
                  setConfirmText('');
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCleanUser}
                disabled={isConfirmButtonDisabled}
              >
                Clean User Data
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default DataCleanupPanel;
