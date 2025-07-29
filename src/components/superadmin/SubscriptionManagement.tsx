import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Organization } from '@/components/admin/types';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, Calendar, AlertCircle } from 'lucide-react';

interface SubscriptionManagementProps {
  organizations: Organization[];
  onUpdate: () => void;
}

export const SubscriptionManagement = ({
  organizations,
  onUpdate,
}: SubscriptionManagementProps) => {
  const { toast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleUpdateSubscription = async (
    orgId: string,
    subscriptionLevel: string,
    subscriptionStatus: string
  ) => {
    setUpdating(orgId);

    try {
      const { data, error } = await supabase.functions.invoke('admin-utils', {
        body: {
          action: 'update_organization',
          data: {
            org_id: orgId,
            org_name: organizations.find(o => o.id === orgId)?.name,
            sub_level: subscriptionLevel,
            sub_status: subscriptionStatus,
          },
        },
      });

      if (error) throw error;

      toast({
        title: 'Subscription updated',
        description: 'Organization subscription has been updated successfully.',
      });

      onUpdate();
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update subscription',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const getTrialOrganizations = () => {
    return organizations.filter(org => 
      org.subscription_level === 'trial' || 
      (org.trial_ends_at && new Date(org.trial_ends_at) > new Date())
    );
  };

  const getExpiredTrials = () => {
    return organizations.filter(org => 
      org.trial_ends_at && new Date(org.trial_ends_at) < new Date()
    );
  };

  const getPaidSubscriptions = () => {
    return organizations.filter(org => 
      org.subscription_level !== 'trial' && org.subscription_status === 'active'
    );
  };

  return (
    <div className="space-y-6">
      {/* Trial Organizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Trial Organizations ({getTrialOrganizations().length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getTrialOrganizations().map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="font-medium">{org.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {org.trial_ends_at && (
                      <span>
                        Trial ends: {new Date(org.trial_ends_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    defaultValue={org.subscription_level}
                    onValueChange={(value) =>
                      handleUpdateSubscription(org.id, value, 'active')
                    }
                    disabled={updating === org.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
            {getTrialOrganizations().length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No trial organizations
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expired Trials */}
      {getExpiredTrials().length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Expired Trials ({getExpiredTrials().length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getExpiredTrials().map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 border border-destructive rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{org.name}</div>
                    <div className="text-sm text-destructive">
                      Trial expired: {org.trial_ends_at && new Date(org.trial_ends_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      defaultValue={org.subscription_level}
                      onValueChange={(value) =>
                        handleUpdateSubscription(org.id, value, 'active')
                      }
                      disabled={updating === org.id}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleUpdateSubscription(org.id, org.subscription_level, 'suspended')
                      }
                      disabled={updating === org.id}
                    >
                      Suspend
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Paid Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Active Subscriptions ({getPaidSubscriptions().length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getPaidSubscriptions().map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="font-medium">{org.name}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{org.subscription_level}</Badge>
                    <Badge className="bg-success text-success-foreground">
                      {org.subscription_status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    defaultValue={org.subscription_level}
                    onValueChange={(value) =>
                      handleUpdateSubscription(org.id, value, 'active')
                    }
                    disabled={updating === org.id}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handleUpdateSubscription(org.id, org.subscription_level, 'suspended')
                    }
                    disabled={updating === org.id}
                  >
                    Suspend
                  </Button>
                </div>
              </div>
            ))}
            {getPaidSubscriptions().length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No active paid subscriptions
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};