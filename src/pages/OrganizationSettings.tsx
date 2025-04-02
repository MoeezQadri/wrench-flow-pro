
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { availableCountries, availableCurrencies, getOrganizationById, updateOrganization } from '@/services/auth-service';
import { Organization } from '@/types';
import { Building, Users, CreditCard } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';

const OrganizationSettings = () => {
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
    if (currentUser?.organizationId) {
      const org = getOrganizationById(currentUser.organizationId);
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
    
    if (!currentUser?.organizationId) {
      toast.error('No organization found');
      return;
    }
    
    setSaving(true);
    
    try {
      const updatedOrg = updateOrganization(currentUser.organizationId, {
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
      <div className="flex justify-center items-center h-96">
        <div className="text-center">Loading organization settings...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center text-muted-foreground">Organization not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6">
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
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage users in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You can manage users, assign roles, and permissions from the Users page.
              </p>
              <Button variant="secondary" onClick={() => window.location.href = '/users'}>
                Go to User Management
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription plan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <div className="font-medium">Current Plan</div>
                  <div className="flex items-center justify-between mt-2">
                    <div>
                      <div className="font-semibold capitalize">{organization.subscriptionLevel}</div>
                      <div className="text-sm text-muted-foreground capitalize">{organization.subscriptionStatus}</div>
                    </div>
                    {organization.subscriptionStatus === 'trial' && (
                      <div className="text-sm">
                        <span className="font-medium">Trial ends: </span>
                        {organization.trialEndsAt ? new Date(organization.trialEndsAt).toLocaleDateString() : 'N/A'}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Available Plans</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border border-primary">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Basic</CardTitle>
                        <CardDescription>For small workshops</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">$29<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                        <ul className="text-sm space-y-2 mb-4">
                          <li>Up to 3 users</li>
                          <li>Basic reporting</li>
                          <li>Standard support</li>
                        </ul>
                        <Button className="w-full">Select Plan</Button>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-2 border-primary relative">
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-2 py-1 text-xs rounded-bl-lg">Popular</div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Professional</CardTitle>
                        <CardDescription>For growing businesses</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">$79<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                        <ul className="text-sm space-y-2 mb-4">
                          <li>Up to 10 users</li>
                          <li>Advanced reporting</li>
                          <li>Priority support</li>
                        </ul>
                        <Button className="w-full">Select Plan</Button>
                      </CardContent>
                    </Card>
                    
                    <Card className="border border-primary">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Enterprise</CardTitle>
                        <CardDescription>For large operations</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">$199<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                        <ul className="text-sm space-y-2 mb-4">
                          <li>Unlimited users</li>
                          <li>Custom reporting</li>
                          <li>24/7 support</li>
                        </ul>
                        <Button className="w-full">Select Plan</Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationSettings;
