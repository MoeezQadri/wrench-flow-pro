
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Users, Building } from 'lucide-react';
import { toast } from 'sonner';
import { searchOrganizationById } from '@/utils/supabase-helpers';

interface Organization {
  id: string;
  name: string;
  subscription_level: string;
  subscription_status: string;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
  organization_id: string;
  lastLogin?: string;
}

const OrganizationSearch = () => {
  const [orgId, setOrgId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    organization: Organization | null;
    users: Profile[];
  } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) {
      toast.error('Please enter an organization ID');
      return;
    }

    setIsSearching(true);
    setSearchResult(null);

    try {
      const result = await searchOrganizationById(orgId);
      if (result) {
        setSearchResult(result);
      } else {
        toast.error('Organization not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('An error occurred while searching');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="mr-2 h-5 w-5" />
          Organization Search
        </CardTitle>
        <CardDescription>
          Search for an organization by its unique ID
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Label htmlFor="orgId" className="sr-only">Organization ID</Label>
              <Input
                id="orgId"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                placeholder="Enter organization ID"
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </form>

        {searchResult && searchResult.organization && (
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-medium flex items-center">
                <Building className="mr-2 h-5 w-5" />
                Organization Details
              </h3>
              <div className="mt-3 border rounded-lg p-4 bg-muted/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">ID</Label>
                    <p className="font-medium break-all">{searchResult.organization.id}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Name</Label>
                    <p className="font-medium">{searchResult.organization.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Subscription</Label>
                    <p className="font-medium capitalize">{searchResult.organization.subscription_level}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Status</Label>
                    <p className="font-medium capitalize">{searchResult.organization.subscription_status}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Created</Label>
                    <p className="font-medium">{new Date(searchResult.organization.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Last Updated</Label>
                    <p className="font-medium">{new Date(searchResult.organization.updated_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {searchResult.users && searchResult.users.length > 0 && (
              <div>
                <h3 className="text-lg font-medium flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Associated Users ({searchResult.users.length})
                </h3>
                <div className="mt-3 border rounded-lg overflow-hidden">
                  <table className="w-full border-collapse">
                    <thead className="bg-muted">
                      <tr>
                        <th className="py-2 px-4 text-left">Name</th>
                        <th className="py-2 px-4 text-left">Role</th>
                        <th className="py-2 px-4 text-left">Status</th>
                        <th className="py-2 px-4 text-left">Last Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResult.users.map((user) => (
                        <tr key={user.id} className="border-t">
                          <td className="py-2 px-4">{user.name}</td>
                          <td className="py-2 px-4 capitalize">{user.role}</td>
                          <td className="py-2 px-4">{user.is_active ? 'Active' : 'Inactive'}</td>
                          <td className="py-2 px-4">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationSearch;
