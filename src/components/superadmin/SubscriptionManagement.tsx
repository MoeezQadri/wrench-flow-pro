import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Organization } from '@/components/admin/types';
import { CreditCard, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@radix-ui/react-accordion';
import {
  suspendSubscription,
  unsuspendSubscription,
} from '@/utils/supabase-helpers';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  getOrgStatus,
  getStatusLabel,
} from '@/utils/subscription-status';

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
  const [orgToUnsuspend, setOrgToUnsuspend] = useState<{
    id: string;
    name: string;
    subscription_level: string;
    emails: string[];
    userIds: string[];
  } | null>(null);
  const [orgToSuspend, setOrgToSuspend] = useState<{
    id: string;
    name: string;
    subscription_level: string;
    accessUntil: string | null;
    emails: string[];
    userIds: string[];
  } | null>(null);

  // --- Toggle states for collapsible cards ---
  const [trialOpen, setTrialOpen] = useState(true);
  const [expiredOpen, setExpiredOpen] = useState(true);
  const [cancelingOpen, setCancelingOpen] = useState(true);

  const [suspendedOpen, setSuspendedOpen] = useState(true);
  const [activeOpen, setActiveOpen] = useState(true);

  // --- Helper functions ---
  const getTrialOrganizations = () =>
    organizations.filter((org) => getOrgStatus(org) === 'trial_active');

  const getExpiredTrials = () =>
    organizations.filter((org) =>
      ['trial_expired', 'subscription_ended'].includes(getOrgStatus(org))
    );

  const getCancelingSubscriptions = () =>
    organizations.filter((org) => getOrgStatus(org) === 'canceling');

  const getPaidSubscriptions = () =>
    organizations.filter((org) =>
      ['paid', 'internal'].includes(getOrgStatus(org))
    );


  const getSuspendedSubscriptions = () =>
    organizations.filter((org) => getOrgStatus(org) === 'suspended');

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

  const handleSuspend = async () => {
    if (!orgToSuspend) return;
    const target = orgToSuspend;
    setUpdating(target.id);
    try {
      const result = await suspendSubscription({
        org_id: target.id,
        org_name: target.name,
        sub_level: target.subscription_level,
        sub_status: 'suspended',
        user_ids: target.userIds.filter(Boolean),
        user_emails: target.emails.filter(Boolean),
      });
      toast({
        title: result?.billing_changed
          ? 'Billing stopped'
          : 'Organization suspended',
        description:
          result?.message ||
          'The organization has been suspended.',
      });
      await onUpdate();
      setOrgToSuspend(null);
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

  const handleUnsuspend = async () => {
    if (!orgToUnsuspend) return;
    const target = orgToUnsuspend;
    setUpdating(target.id);
    try {
      const result = await unsuspendSubscription({
        org_id: target.id,
        org_name: target.name,
        sub_level: target.subscription_level,
        user_ids: target.userIds.filter(Boolean),
        user_emails: target.emails.filter(Boolean),
      });
      toast({
        title: result?.resumed
          ? 'Subscription resumed'
          : 'Suspension lifted',
        description:
          result?.message ||
          'The organization is no longer suspended.',
      });
      await onUpdate();
      setOrgToUnsuspend(null);
    } catch (error: any) {
      console.error(error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to un-suspend organization',
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
                <div className="text-sm text-muted-foreground">
                  {getStatusLabel(org)}
                </div>
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

      {/* Cancelled by customer */}
      <CollapsibleCard
        title="Cancelled by customer"
        icon={<Calendar className="h-5 w-5 text-orange-500" />}
        count={getCancelingSubscriptions().length}
        open={cancelingOpen}
        setOpen={setCancelingOpen}
      >
        <div className="space-y-4">
          {getCancelingSubscriptions().map((org) => (
            <div
              key={`${org.id} ${org.email}`}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="space-y-1">
                <div className="font-medium">{org.name}</div>
                <div className="text-sm text-muted-foreground">
                  {getStatusLabel(org)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {org.subscription_level}
                </Badge>
                <Badge variant="outline">{org.email}</Badge>
              </div>
            </div>
          ))}
          {getCancelingSubscriptions().length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No cancelled subscriptions
            </p>
          )}
        </div>
      </CollapsibleCard>

      {/* Expired trials and ended subscriptions */}
      <CollapsibleCard
        title="Expired Trials & Ended Subscriptions"
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
                <div className="text-sm text-destructive">
                  {getStatusLabel(org)}
                </div>
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
                      <Badge variant="outline">{getStatusLabel(org)}</Badge>
                      <Badge variant="outline">{o.email}</Badge>
                    </div>
                  ))}
                  {(org.next_billing_date || org.trial_ends_at) && (
                    <div className="text-xs text-muted-foreground">
                      Access ends on{' '}
                      {new Date(
                        (org.next_billing_date || org.trial_ends_at) as string
                      ).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setOrgToUnsuspend({
                      id: org.id,
                      name: org.name,
                      subscription_level: org.subscription_level,
                      emails: [
                        ...owner.map((o) => o.email),
                        ...others.map((u) => u.email),
                      ],
                      userIds: [
                        ...owner.map((o) => o.user_id),
                        ...others.map((u) => u.user_id),
                      ],
                    })
                  }
                  disabled={updating === org.id}
                >
                  {updating === org.id ? 'Working…' : 'Un-suspend'}
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
              {getOrgStatus(org) === 'paid' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setOrgToSuspend({
                      id: org.id,
                      name: org.name,
                      subscription_level: org.subscription_level,
                      accessUntil:
                        org.next_billing_date || org.trial_ends_at || null,
                      emails: [
                        ...owner.map((o) => o.email),
                        ...others.map((u) => u.email),
                      ],
                      userIds: [
                        ...owner.map((o) => o.user_id),
                        ...others.map((u) => u.user_id),
                      ],
                    })
                  }
                  disabled={updating === org.id}
                >
                  {updating === org.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Suspending…
                    </>
                  ) : (
                    'Suspend'
                  )}
                </Button>
              )}
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
        <p className="text-xs text-muted-foreground">
          Suspending stops billing at the end of the current paid period. The
          shop keeps access until that date, then moves to Expired Trials &
          Ended Subscriptions.
        </p>

      </CollapsibleCard>

      <AlertDialog
        open={!!orgToSuspend}
        onOpenChange={(open) => {
          if (updating) return;
          if (!open) setOrgToSuspend(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {orgToSuspend?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Billing stops now, but the shop keeps access until the end of the
              period it has already paid for
              {orgToSuspend?.accessUntil
                ? ` — ${new Date(orgToSuspend.accessUntil).toLocaleDateString()}`
                : ''}
              . After that date everything except Settings is locked and the
              shop appears under ended subscriptions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!updating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!!updating}
              onClick={(event) => {
                event.preventDefault();
                handleSuspend();
              }}
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Suspending…
                </>
              ) : (
                'Suspend'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


      <AlertDialog
        open={!!orgToUnsuspend}
        onOpenChange={(open) => {
          if (updating) return;
          if (!open) setOrgToUnsuspend(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Un-suspend {orgToUnsuspend?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This lifts the suspension for the shop and all of its users. If
              their paid subscription was only scheduled to stop, billing
              continues as before. If it has already ended, the shop goes back
              on trial and will need to subscribe again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!updating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!!updating}
              onClick={(event) => {
                event.preventDefault();
                handleUnsuspend();
              }}
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Restoring…
                </>
              ) : (
                'Un-suspend'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
