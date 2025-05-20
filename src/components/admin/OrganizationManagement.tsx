import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Search, FileText, Edit, Trash2, Building } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Organization, OrganizationManagementProps } from './types';
import { deleteOrganization, updateOrganization, createOrganization, getOrganizations } from '@/utils/supabase-helpers';

const OrganizationManagement: React.FC<OrganizationManagementProps> = ({
  organizations,
  setOrganizations,
  searchTerm,
  setSearchTerm,
  isLoading
}) => {
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);

  // Filter organizations based on search term
  const filteredOrganizations = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditOrganization = (org: Organization) => {
    setSelectedOrganization(org);
    setIsOrgDialogOpen(true);
  };
  
  const handleAddOrganization = () => {
    setSelectedOrganization(null);
    setIsOrgDialogOpen(true);
  };
  
  const handleDeleteOrganization = async (orgId: string) => {
    if (!setOrganizations) return;
    
    if (window.confirm('Are you sure you want to delete this organization? This will also remove all associated users.')) {
      try {
        await deleteOrganization(orgId);
        
        setOrganizations(organizations.filter(org => org.id !== orgId));
        toast.success('Organization deleted successfully');
      } catch (error: any) {
        console.error('Error deleting organization:', error);
        toast.error('Failed to delete organization');
      }
    }
  };

  const handleSaveOrganization = async (e: React.FormEvent) => {
    if (!setOrganizations) return;
    
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    try {
      if (selectedOrganization) {
        // Update existing organization
        await updateOrganization({
          org_id: selectedOrganization.id,
          org_name: formData.get('name') as string,
          sub_level: formData.get('subscriptionPlan') as string
        });
        
        setOrganizations(organizations.map(org => 
          org.id === selectedOrganization.id ? {
            ...selectedOrganization,
            name: formData.get('name') as string,
            subscription_level: formData.get('subscriptionPlan') as string,
            updated_at: new Date().toISOString()
          } : org
        ));
        toast.success('Organization updated successfully');
      } else {
        // Create new organization
        await createOrganization({
          org_name: formData.get('name') as string,
          sub_level: formData.get('subscriptionPlan') as string,
          owner_name: formData.get('ownerName') as string,
          owner_email: formData.get('ownerEmail') as string
        });
        
        // Fetch updated organizations
        const updatedOrgs = await getOrganizations();
        setOrganizations(updatedOrgs);
        
        toast.success('Organization created successfully');
      }
      
      setIsOrgDialogOpen(false);
      setSelectedOrganization(null);
      
    } catch (error: any) {
      console.error('Error saving organization:', error);
      toast.error('Failed to save organization: ' + error.message);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <h2 className="text-2xl font-bold">Organization Management</h2>
        <Button onClick={handleAddOrganization}>
          <Plus className="mr-2 h-4 w-4" /> Add Organization
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter by plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell className="font-medium">{org.name}</TableCell>
                  <TableCell>
                    <Badge variant={org.subscription_level === 'enterprise' ? 'default' : 
                          org.subscription_level === 'pro' ? 'secondary' : 'outline'}>
                      {org.subscription_level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={org.subscription_status === 'active' ? 'default' : 'destructive'}>
                      {org.subscription_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditOrganization(org)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteOrganization(org.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredOrganizations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Building className="h-8 w-8 mb-2" />
                      <p>No organizations found</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={handleAddOrganization}
                      >
                        Add your first organization
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Organization Dialog */}
      <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{selectedOrganization ? 'Edit Organization' : 'Add Organization'}</DialogTitle>
            <DialogDescription>
              {selectedOrganization 
                ? 'Edit the organization details below.' 
                : 'Create a new organization and owner.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSaveOrganization}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name</Label>
                <Input 
                  id="name" 
                  name="name"
                  defaultValue={selectedOrganization?.name || ''} 
                  required
                />
              </div>
              
              {!selectedOrganization && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">Owner Name</Label>
                      <Input 
                        id="ownerName" 
                        name="ownerName"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ownerEmail">Owner Email</Label>
                      <Input 
                        id="ownerEmail" 
                        name="ownerEmail"
                        type="email"
                        required
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                  <Select 
                    name="subscriptionPlan"
                    defaultValue={selectedOrganization?.subscription_level || 'trial'}
                  >
                    <SelectTrigger id="subscriptionPlan">
                      <SelectValue placeholder="Select plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="seats">Number of Seats</Label>
                  <Input 
                    id="seats" 
                    name="seats"
                    type="number"
                    min="1"
                    defaultValue="5" 
                    required
                  />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOrgDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedOrganization ? 'Update Organization' : 'Create Organization'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrganizationManagement;
