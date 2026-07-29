import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { CheckCircle2, Sparkles } from 'lucide-react';

const AUTOMATIONS: { id: string; label: string; tier: 'pro' | 'enterprise' }[] = [
  { id: 'time_mileage_reminders', label: 'Time/Mileage-based reminders', tier: 'pro' },
  { id: 'sms_delivery', label: 'Automated SMS delivery', tier: 'pro' },
  { id: 'email_delivery', label: 'Automated email delivery', tier: 'pro' },
  { id: 'review_requests', label: 'Post-service review requests (Google/Yelp)', tier: 'pro' },
  { id: 'reactivation_campaigns', label: 'Customer reactivation campaigns', tier: 'enterprise' },
  { id: 'lapsed_outreach', label: 'Lapsed-customer outreach', tier: 'enterprise' },
  { id: 'booking_form', label: 'Website booking form', tier: 'enterprise' },
  { id: 'custom_branding', label: 'Custom branding', tier: 'enterprise' },
];

type RequestRow = {
  id: string;
  automations: string[];
  status: string;
  created_at: string;
  notes: string | null;
};

const statusVariant = (s: string) =>
  s === 'completed' ? 'default' : s === 'in_progress' ? 'secondary' : 'outline';

const AutomationSetupTab: React.FC = () => {
  const { currentUser, organization, subscribed, subscriptionTier } = useAuthContext();
  const plan = (
    (subscribed && subscriptionTier) || organization?.subscription_level || ''
  ).toLowerCase();
  const isEnterprise = plan === 'enterprise';

  const [selected, setSelected] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [contactTime, setContactTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  const availableAutomations = useMemo(
    () => AUTOMATIONS.filter((a) => isEnterprise || a.tier === 'pro'),
    [isEnterprise]
  );

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('automation_requests' as any)
      .select('id, automations, status, created_at, notes')
      .order('created_at', { ascending: false });
    if (!error && data) setRequests(data as unknown as RequestRow[]);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const submit = async () => {
    if (selected.length === 0) {
      toast({ title: 'Pick at least one automation', variant: 'destructive' });
      return;
    }
    if (notes.length > 2000) {
      toast({ title: 'Notes too long (max 2000 chars)', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'request-automation-setup',
        {
          body: {
            automations: selected,
            phone,
            preferred_contact_time: contactTime,
            notes,
          },
        }
      );
      if (error) throw error;
      toast({
        title: 'Request sent',
        description:
          data?.email_sent === false
            ? 'Saved. Our team will reach out within 1 business day.'
            : "We'll be in touch within 1 business day.",
      });
      setSelected([]);
      setPhone('');
      setContactTime('');
      setNotes('');
      loadRequests();
    } catch (e: any) {
      toast({
        title: 'Could not submit request',
        description: e?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>Request Automation Setup</CardTitle>
          </div>
          <CardDescription>
            Our team configures automations for you. Tell us what you need and we'll reach out to
            get it running quickly — typically within 1 business day.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Automations to configure</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableAutomations.map((a) => (
                <label
                  key={a.id}
                  className="flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={selected.includes(a.id)}
                    onCheckedChange={() => toggle(a.id)}
                    className="mt-0.5"
                  />
                  <div className="text-sm leading-tight">
                    {a.label}
                    {a.tier === 'enterprise' && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Enterprise
                      </Badge>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Best number to reach you"
                maxLength={40}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactTime">Preferred contact time</Label>
              <Input
                id="contactTime"
                value={contactTime}
                onChange={(e) => setContactTime(e.target.value)}
                placeholder="e.g. Weekdays 10am–2pm PT"
                maxLength={200}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything specific about your workflow, integrations, or timelines"
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">{notes.length}/2000</p>
          </div>

          <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
            Submitting as{' '}
            <span className="text-foreground font-medium">
              {currentUser?.name || currentUser?.email}
            </span>{' '}
            for <span className="text-foreground font-medium">{organization?.name}</span> ({plan})
          </div>

          <div className="flex justify-end">
            <Button onClick={submit} disabled={submitting}>
              {submitting ? 'Sending…' : 'Send request'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your requests</CardTitle>
          <CardDescription>Track the status of your automation setup requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <ul className="space-y-3">
              {requests.map((r) => (
                <li key={r.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {r.automations
                        .map((a) => AUTOMATIONS.find((x) => x.id === a)?.label || a)
                        .join(', ')}
                    </div>
                    <Badge variant={statusVariant(r.status) as any}>
                      {r.status === 'completed' && (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      )}
                      {r.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                  {r.notes && (
                    <p className="text-sm mt-2 whitespace-pre-wrap">{r.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationSetupTab;
