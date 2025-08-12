
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GLOBAL_COUNTRIES, GLOBAL_CURRENCIES } from '@/utils/global-data';

const OrganizationSettingsTab = () => {
  const { currentUser, organization, refreshProfile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    currency: '',
    address: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    loadOrganizationData();
  }, [currentUser?.organization_id]);

  const loadOrganizationData = async () => {
    if (!currentUser?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      const { data: orgData, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', currentUser.organization_id)
        .single();

      if (error) {
        console.error('Error loading organization:', error);
        toast.error('Failed to load organization data');
      } else if (orgData) {
        setFormData({
          name: orgData.name || '',
          country: orgData.country || '',
          currency: orgData.currency || '',
          address: orgData.address || '',
          phone: orgData.phone || '',
          email: orgData.email || '',
        });
      }
    } catch (error) {
      console.error('Error loading organization:', error);
      toast.error('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.organization_id) {
      toast.error('No organization found');
      return;
    }
    
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: formData.name,
          country: formData.country,
          currency: formData.currency,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.organization_id);

      if (error) {
        console.error('Error updating organization:', error);
        toast.error('Failed to update organization');
      } else {
        toast.success('Organization settings saved successfully');
        // Refresh the organization data in auth context to update across the app
        await refreshProfile();
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-center">Loading organization settings...</div>
      </div>
    );
  }

  if (!currentUser?.organization_id) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-center text-muted-foreground">No organization found</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="mr-2 h-5 w-5" />
          General Information
        </CardTitle>
        <CardDescription>
          Basic information about your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input 
                id="name" 
                value={formData.name} 
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email} 
                onChange={(e) => handleInputChange('email', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                value={formData.phone} 
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                value={formData.address} 
                onChange={(e) => handleInputChange('address', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select 
                value={formData.country} 
                onValueChange={(value) => handleInputChange('country', value)}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {GLOBAL_COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.name}>
                      {country.flag} {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => handleInputChange('currency', value)}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {GLOBAL_CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.code} ({curr.symbol}) - {curr.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default OrganizationSettingsTab;
