
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building } from 'lucide-react';
import { availableCountries, availableCurrencies, getOrganizationById, updateOrganization } from '@/services/auth-service';
import { Organization } from '@/types';
import { useAuthContext } from '@/context/AuthContext';

const OrganizationSettingsTab = () => {
  const { currentUser } = useAuthContext();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser?.organization_id) {
      const org = getOrganizationById(currentUser.organization_id);
      if (org) {
        setOrganization(org);
        setName(org.name || '');
        setCountry(org.country || '');
        setCurrency(org.currency || '');
        setAddress(org.address || '');
        setPhone(org.phone || '');
        setEmail(org.email || '');
      }
      setLoading(false);
    }
  }, [currentUser]);

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.organization_id) {
      toast.error('No organization found');
      return;
    }
    
    setSaving(true);
    
    try {
      const updatedOrg = updateOrganization(currentUser.organization_id, {
        name,
        country,
        currency,
        address,
        phone,
        email
      });
      
      if (updatedOrg) {
        setOrganization(updatedOrg);
        toast.success('Organization settings saved');
      } else {
        toast.error('Failed to update organization');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-center">Loading organization settings...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-center text-muted-foreground">Organization not found</div>
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
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input 
                id="phone" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                value={address} 
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select 
                value={country} 
                onValueChange={setCountry}
              >
                <SelectTrigger id="country">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((countryName) => (
                    <SelectItem key={countryName} value={countryName}>
                      {countryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select 
                value={currency} 
                onValueChange={setCurrency}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((curr) => (
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
