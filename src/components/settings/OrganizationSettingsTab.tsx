
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
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
import { toast } from 'sonner';
import { Building } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { GLOBAL_COUNTRIES, GLOBAL_CURRENCIES } from '@/utils/global-data';
import { ALL_TIMEZONES, timezoneForCountry, timezoneOffsetLabel } from '@/utils/timezones';
import { setOrgTimezone } from '@/utils/datetime';

const OrganizationSettingsTab = () => {
  const { currentUser, organization, refreshProfile } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applyingTaxRate, setApplyingTaxRate] = useState(false);
  const [taxPromptOpen, setTaxPromptOpen] = useState(false);
  const [savedTaxRate, setSavedTaxRate] = useState(0);
  const [initialTaxRate, setInitialTaxRate] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    country: 'United States',
    currency: 'USD',
    timezone: 'America/New_York',
    default_tax_rate: '0',
  });

  // Only owners and admins may change organization-wide billing/locale settings
  const canEditOrgSettings = ['owner', 'admin', 'superuser', 'superadmin'].includes(
    currentUser?.role || ''
  );

  const timezoneOptions = ALL_TIMEZONES.map((tz) => ({
    value: tz,
    label: tz.replace(/_/g, ' '),
    description: timezoneOffsetLabel(tz),
  }));

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
        const org = orgData as typeof orgData & { timezone?: string | null; default_tax_rate?: number | null };
        const country = org.country || 'United States';
        const taxRate = Number(org.default_tax_rate ?? 0);

        setFormData({
          name: org.name || '',
          country,
          currency: org.currency || 'USD',
          timezone: org.timezone || timezoneForCountry(country),
          default_tax_rate: String(taxRate),
        });
        setInitialTaxRate(taxRate);
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

    const taxRate = parseFloat(formData.default_tax_rate);
    if (canEditOrgSettings && (isNaN(taxRate) || taxRate < 0 || taxRate > 100)) {
      toast.error('Default tax rate must be between 0 and 100');
      return;
    }

    setSaving(true);

    try {
      const updates: Record<string, unknown> = {
        name: formData.name,
        country: formData.country,
        currency: formData.currency,
        updated_at: new Date().toISOString(),
      };

      if (canEditOrgSettings) {
        updates.timezone = formData.timezone;
        updates.default_tax_rate = taxRate;
      }

      const { error } = await supabase
        .from('organizations')
        .update(updates as any)
        .eq('id', currentUser.organization_id);

      if (error) {
        console.error('Error updating organization:', error);
        toast.error('Failed to update organization');
        return;
      }

      toast.success('Organization settings saved successfully');

      if (canEditOrgSettings) {
        setOrgTimezone(formData.timezone);
      }

      // Refresh the organization data in auth context to update across the app
      await refreshProfile();

      if (canEditOrgSettings && taxRate !== initialTaxRate) {
        setSavedTaxRate(taxRate);
        setInitialTaxRate(taxRate);
        setTaxPromptOpen(true);
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const applyTaxRateToOpenInvoices = async () => {
    if (!currentUser?.organization_id) return;

    setApplyingTaxRate(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({ tax_rate: savedTaxRate, updated_at: new Date().toISOString() } as any)
        .eq('organization_id', currentUser.organization_id)
        .in('status', ['open', 'in-progress', 'completed', 'partial'])
        .select('id');

      if (error) {
        console.error('Error applying tax rate to invoices:', error);
        toast.error('Failed to update existing invoices');
        return;
      }

      toast.success(
        `Applied ${savedTaxRate}% tax to ${data?.length ?? 0} unpaid invoice${
          (data?.length ?? 0) === 1 ? '' : 's'
        }`
      );
    } catch (error) {
      console.error('Error applying tax rate to invoices:', error);
      toast.error('An error occurred while updating invoices');
    } finally {
      setApplyingTaxRate(false);
      setTaxPromptOpen(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => {
      // Keep the timezone in sync with the country until it is set explicitly
      if (field === 'country') {
        const suggested = timezoneForCountry(value);
        const wasSuggested =
          !prev.timezone || prev.timezone === timezoneForCountry(prev.country);
        return {
          ...prev,
          country: value,
          timezone: wasSuggested ? suggested : prev.timezone,
        };
      }

      return { ...prev, [field]: value };
    });
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
    <>
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

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                {canEditOrgSettings ? (
                  <SearchableSelect
                    id="timezone"
                    value={formData.timezone}
                    onChange={(value) => handleInputChange('timezone', value)}
                    options={timezoneOptions}
                    placeholder="Select timezone"
                    searchPlaceholder="Search timezones..."
                    emptyText="No timezone found"
                    selectedLabel={formData.timezone.replace(/_/g, ' ')}
                  />
                ) : (
                  <Input id="timezone" value={formData.timezone} readOnly disabled />
                )}
                <p className="text-xs text-muted-foreground">
                  Invoice and payment dates are shown in this timezone
                  {formData.timezone ? ` (${timezoneOffsetLabel(formData.timezone)})` : ''}.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_tax_rate">Default Tax Rate (%)</Label>
                <Input
                  id="default_tax_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.default_tax_rate}
                  onChange={(e) => handleInputChange('default_tax_rate', e.target.value)}
                  readOnly={!canEditOrgSettings}
                  disabled={!canEditOrgSettings}
                />
                <p className="text-xs text-muted-foreground">
                  {canEditOrgSettings
                    ? 'Used as the starting tax rate on new invoices. Still editable per invoice.'
                    : 'Only owners and admins can change the default tax rate.'}
                </p>
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

      <AlertDialog open={taxPromptOpen} onOpenChange={setTaxPromptOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apply {savedTaxRate}% to existing invoices?</AlertDialogTitle>
            <AlertDialogDescription>
              This updates the tax rate on all unpaid invoices (open, in progress, completed and
              partially paid). Paid invoices are never changed. New invoices already use the new
              default.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={applyingTaxRate}>New invoices only</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                applyTaxRateToOpenInvoices();
              }}
              disabled={applyingTaxRate}
            >
              {applyingTaxRate ? 'Updating...' : 'Apply to unpaid invoices'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default OrganizationSettingsTab;
