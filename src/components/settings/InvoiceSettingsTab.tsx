import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FileText, Building2 } from 'lucide-react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceSettings {
  invoice_prefix: string;
  next_invoice_number: number;
  default_currency: string;
  tax_rate: number;
  payment_terms: string;
  footer_text: string;
  logo_url?: string;
}

const InvoiceSettingsTab = () => {
  const { currentUser, organization } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState<InvoiceSettings>({
    invoice_prefix: 'INV',
    next_invoice_number: 1001,
    default_currency: 'USD',
    tax_rate: 0,
    payment_terms: 'Net 30',
    footer_text: 'Thank you for your business!',
    logo_url: '',
  });

  useEffect(() => {
    loadInvoiceSettings();
  }, [currentUser?.organization_id]);

  const loadInvoiceSettings = async () => {
    if (!currentUser?.organization_id) {
      setLoading(false);
      return;
    }

    try {
      // Load from organization data for now
      // In a real app, you might have a separate invoice_settings table
      if (organization) {
        setInvoiceSettings(prev => ({
          ...prev,
          default_currency: 'USD',
        }));
      }
      
      // You could also load the next invoice number from the database
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id')
        .eq('organization_id', currentUser.organization_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && invoices && invoices.length > 0) {
        // Calculate next invoice number (this is simplified)
        setInvoiceSettings(prev => ({
          ...prev,
          next_invoice_number: invoices.length + 1001,
        }));
      }
    } catch (error) {
      console.error('Error loading invoice settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser?.organization_id) {
      toast.error('No organization found');
      return;
    }

    setSaving(true);
    
    try {
      // Update organization with invoice-related settings
      const { error } = await supabase
        .from('organizations')
        .update({
          currency: invoiceSettings.default_currency,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.organization_id);

      if (error) {
        console.error('Error updating invoice settings:', error);
        toast.error('Failed to update invoice settings');
      } else {
        toast.success('Invoice settings saved successfully');
      }
    } catch (error) {
      console.error('Error updating invoice settings:', error);
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof InvoiceSettings, value: string | number) => {
    setInvoiceSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-center">Loading invoice settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invoice Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Invoice Configuration
          </CardTitle>
          <CardDescription>
            Configure how your invoices are generated and displayed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prefix">Invoice Prefix</Label>
                <Input
                  id="prefix"
                  value={invoiceSettings.invoice_prefix}
                  onChange={(e) => handleInputChange('invoice_prefix', e.target.value)}
                  placeholder="INV"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nextNumber">Next Invoice Number</Label>
                <Input
                  id="nextNumber"
                  type="number"
                  value={invoiceSettings.next_invoice_number}
                  onChange={(e) => handleInputChange('next_invoice_number', parseInt(e.target.value))}
                  min="1"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Default Currency</Label>
                <Select 
                  value={invoiceSettings.default_currency} 
                  onValueChange={(value) => handleInputChange('default_currency', value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  step="0.01"
                  value={invoiceSettings.tax_rate}
                  onChange={(e) => handleInputChange('tax_rate', parseFloat(e.target.value))}
                  min="0"
                  max="100"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Select 
                  value={invoiceSettings.payment_terms} 
                  onValueChange={(value) => handleInputChange('payment_terms', value)}
                >
                  <SelectTrigger id="paymentTerms">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                    <SelectItem value="Net 15">Net 15</SelectItem>
                    <SelectItem value="Net 30">Net 30</SelectItem>
                    <SelectItem value="Net 60">Net 60</SelectItem>
                    <SelectItem value="Net 90">Net 90</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="footerText">Invoice Footer Text</Label>
              <Textarea
                id="footerText"
                value={invoiceSettings.footer_text}
                onChange={(e) => handleInputChange('footer_text', e.target.value)}
                placeholder="Thank you for your business!"
                rows={3}
              />
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save Invoice Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Organization Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            Invoice Branding
          </CardTitle>
          <CardDescription>
            Customize how your organization appears on invoices
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input value={organization?.name || ''} disabled className="bg-muted" />
              <p className="text-sm text-muted-foreground">
                Update in Organization settings
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Organization Email</Label>
              <Input value={organization?.name || ''} disabled className="bg-muted" />
              <p className="text-sm text-muted-foreground">
                Update in Organization settings
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={organization?.name || ''} disabled className="bg-muted" />
              <p className="text-sm text-muted-foreground">
                Update in Organization settings
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={organization?.name || ''} disabled className="bg-muted" />
              <p className="text-sm text-muted-foreground">
                Update in Organization settings
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceSettingsTab;