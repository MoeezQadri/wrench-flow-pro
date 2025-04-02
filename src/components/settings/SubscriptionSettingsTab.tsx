
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { getOrganizationById } from '@/services/auth-service';
import { useEffect, useState } from 'react';
import { Organization } from '@/types';

const SubscriptionSettingsTab = () => {
  const { currentUser } = useAuthContext();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser?.organizationId) {
      const org = getOrganizationById(currentUser.organizationId);
      if (org) {
        setOrganization(org);
      }
      setLoading(false);
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-center">Loading subscription information...</div>
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
  );
};

export default SubscriptionSettingsTab;
