import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Organization } from '@/components/admin/types';
import { CreditCard, Calendar, AlertCircle } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@radix-ui/react-accordion';
import { suspendSubscription } from '@/utils/supabase-helpers';

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

  // --- Toggle states for collapsible cards ---
  const [trialOpen, setTrialOpen] = useState(true);
  const [expiredOpen, setExpiredOpen] = useState(true);
  const [suspendedOpen, setSuspendedOpen] = useState(true);
  const [activeOpen, setActiveOpen] = useState(true);

  // --- Helper functions ---
  const getTrialOrganizations = () =>
    organizations.filter(
      (org) =>
        org.subscription_level === 'trial' ||
        (org.trial_ends_at && new Date(org.trial_ends_at) > new Date())
    );

  const getExpiredTrials = () =>
    organizations.filter(
      (org) => org.trial_ends_at && new Date(org.trial_ends_at) < new Date()
    );

  const getPaidSubscriptions = () =>
    organizations.filter(
      (org) =>
        org.subscription_level !== 'trial' &&
        org.subscription_status === 'active' &&
        !org.suspended
    );

  const getSuspendedSubscriptions = () =>
    organizations.filter(
      (org) => org.suspended || org.subscription_status === 'suspended'
    );

  const groupByOrg = (list: Organization[]) => {
    const groups = list.reduce(
      (acc, u) => {
        if (!acc[u.id]) acc[u.id] = { org: u, users: [] };
        acc[u.id].users.push(u);
        return acc;
      },
      {} as Record<string, { org: Organization; users: Organization[] }>
    );
    return Object.values(groups).map(({ org, users }) => {
      const owner = users.filter((u) => u.user_role === 'owner');
      const others = users.filter((u) => u.user_role !== 'owner');
      return { org, owner, others };
    });
  };

  const handleSuspend = async (
    orgId: string,
    subscriptionLevel: string,
    subscriptionStatus: string,
    emails: string[],
    userIds: string[]
  ) => {
    setUpdating(orgId);
    try {
      await suspendSubscription({
        org_id: orgId,
        org_name: organizations.find((o) => o.id === orgId)?.name,
        sub_level: subscriptionLevel,
        sub_status: subscriptionStatus,
        user_ids: userIds,
        user_emails: emails,
      });
      toast({
        title: 'Subscription updated',
        description: 'Organization subscription has been updated successfully.',
      });
      onUpdate();
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to suspend subscription',
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  // --- Render collapsible card ---
  const CollapsibleCard = ({
    title,
    icon,
    count,
    open,
    setOpen,
    children,
  }: any) => (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setOpen(!open)}>
        <CardTitle className="flex items-center gap-2">
          {icon} {title} ({count})
        </CardTitle>
      </CardHeader>
      {open && <CardContent>{children}</CardContent>}
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Trial Organizations */}
      <CollapsibleCard
        title="Trial Organizations"
        icon={<Calendar className="h-5 w-5" />}
        count={getTrialOrganizations().length}
        open={trialOpen}
        setOpen={setTrialOpen}
      >
        <div className="space-y-4">
          {getTrialOrganizations().map((org) => (
            <div
              key={`${org.id} ${org.email}`}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <div className="font-medium">{org.name}</div>
                {org.trial_ends_at && (
                  <div className="text-sm text-muted-foreground">
                    Trial ends:{' '}
                    {new Date(org.trial_ends_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{org.email}</Badge>
                <Badge variant="outline">
                  {new Date(org.created_at).toDateString()}
                </Badge>
              </div>
            </div>
          ))}
          {getTrialOrganizations().length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No trial organizations
            </p>
          )}
        </div>
      </CollapsibleCard>

      {/* Expired Trials */}
      <CollapsibleCard
        title="Expired Trials"
        icon={<AlertCircle className="h-5 w-5 text-destructive" />}
        count={getExpiredTrials().length}
        open={expiredOpen}
        setOpen={setExpiredOpen}
      >
        <div className="space-y-4">
          {getExpiredTrials().map((org) => (
            <div
              key={`${org.id} ${org.email}`}
              className="flex items-center justify-between p-4 border border-destructive rounded-lg"
            >
              <div className="space-y-1">
                <div className="font-medium">{org.name}</div>
                {org.trial_ends_at && (
                  <div className="text-sm text-destructive">
                    Trial expired:{' '}
                    {new Date(org.trial_ends_at).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleSuspend(
                      org.id,
                      org.subscription_level,
                      'suspended',
                      [org.email],
                      [org.user_id]
                    )
                  }
                  disabled={updating === org.id}
                >
                  Suspend
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleCard>

      {/* Suspended Subscriptions */}
      <CollapsibleCard
        title="Suspended Subscriptions"
        icon={<CreditCard className="h-5 w-5" />}
        count={groupByOrg(getSuspendedSubscriptions()).length}
        open={suspendedOpen}
        setOpen={setSuspendedOpen}
      >
        {groupByOrg(getSuspendedSubscriptions()).map(
          ({ org, owner, others }) => (
            <div
              key={org.id}
              className="border rounded-xl p-4 bg-white shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-lg font-semibold">{org.name}</div>
                  {owner.map((o) => (
                    <div
                      key={o.user_id}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <Badge variant="default" className="capitalize">
                        {o.user_role}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {org.subscription_level}
                      </Badge>
                      <Badge variant="outline">{org.subscription_status}</Badge>
                      <Badge variant="outline">{o.email}</Badge>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleSuspend(
                      org.id,
                      org.subscription_level,
                      'suspended',
                      [
                        ...owner.map((o) => o.email),
                        ...others.map((u) => u.email),
                      ],
                      [
                        ...owner.map((o) => o.user_id),
                        ...others.map((u) => u.user_id),
                      ]
                    )
                  }
                  disabled={updating === org.id}
                >
                  Suspend
                </Button>
              </div>

              {others.length > 0 && (
                <Accordion type="single" collapsible>
                  <AccordionItem value="members">
                    <AccordionTrigger className="text-sm">
                      Team Members ({others.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-2 border-l">
                        {others.map((u) => (
                          <div
                            key={u.user_id}
                            className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {u.email}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {u.user_role}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </div>
          )
        )}
      </CollapsibleCard>

      {/* Active Subscriptions */}
      <CollapsibleCard
        title="Active Subscriptions"
        icon={<CreditCard className="h-5 w-5" />}
        count={groupByOrg(getPaidSubscriptions()).length}
        open={activeOpen}
        setOpen={setActiveOpen}
      >
        {groupByOrg(getPaidSubscriptions()).map(({ org, owner, others }) => (
          <div
            key={org.id}
            className="border rounded-xl p-4 bg-white shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-lg font-semibold">{org.name}</div>
                {owner.map((o) => (
                  <div
                    key={o.user_id}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <Badge variant="default" className="capitalize">
                      {o.user_role}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {org.subscription_level}
                    </Badge>
                    <Badge variant="outline">{org.subscription_status}</Badge>
                    <Badge variant="outline">{o.email}</Badge>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleSuspend(
                    org.id,
                    org.subscription_level,
                    'suspended',
                    [
                      ...owner.map((o) => o.email),
                      ...others.map((u) => u.email),
                    ],
                    [
                      ...owner.map((o) => o.user_id),
                      ...others.map((u) => u.user_id),
                    ]
                  )
                }
                disabled={updating === org.id}
              >
                Suspend
              </Button>
            </div>

            {others.length > 0 && (
              <Accordion type="single" collapsible>
                <AccordionItem value="members">
                  <AccordionTrigger className="text-sm">
                    Team Members ({others.length})
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-2 border-l">
                      {others.map((u) => (
                        <div
                          key={u.user_id}
                          className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {u.email}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {u.user_role}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        ))}
      </CollapsibleCard>
    </div>
  );
};
