
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

const InvoiceSettingsTab = () => {
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [defaultTaxRate, setDefaultTaxRate] = useState(10);
  const [defaultTerms, setDefaultTerms] = useState('Payment due within 30 days');
  const [defaultNotes, setDefaultNotes] = useState('Thank you for your business');
  const [autoSendInvoices, setAutoSendInvoices] = useState(false);
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState('bank-transfer');
  const [saving, setSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate saving
    setTimeout(() => {
      toast.success('Invoice settings saved');
      setSaving(false);
    }, 800);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Invoice Settings
        </CardTitle>
        <CardDescription>
          Configure default settings for your invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
              <Input 
                id="invoicePrefix" 
                value={invoicePrefix} 
                onChange={(e) => setInvoicePrefix(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This will appear before invoice numbers, e.g. INV-001
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
              <Input 
                id="defaultTaxRate" 
                type="number" 
                min="0" 
                max="100"
                value={defaultTaxRate} 
                onChange={(e) => setDefaultTaxRate(parseInt(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="defaultPaymentMethod">Default Payment Method</Label>
              <Select 
                value={defaultPaymentMethod} 
                onValueChange={setDefaultPaymentMethod}
              >
                <SelectTrigger id="defaultPaymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="autoSendInvoices">Auto-send Invoices</Label>
                <Switch 
                  id="autoSendInvoices" 
                  checked={autoSendInvoices} 
                  onCheckedChange={setAutoSendInvoices} 
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically email invoices to customers when created
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="defaultTerms">Default Terms</Label>
            <Textarea 
              id="defaultTerms" 
              value={defaultTerms} 
              onChange={(e) => setDefaultTerms(e.target.value)}
              rows={2}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="defaultNotes">Default Notes</Label>
            <Textarea 
              id="defaultNotes" 
              value={defaultNotes} 
              onChange={(e) => setDefaultNotes(e.target.value)}
              rows={2}
            />
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

export default InvoiceSettingsTab;
