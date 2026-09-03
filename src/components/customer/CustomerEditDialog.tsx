import React, { useEffect, useState } from 'react';
import { Customer } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface CustomerEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  onSave: (updates: Partial<Customer>) => Promise<void>;
}

const CustomerEditDialog: React.FC<CustomerEditDialogProps> = ({ open, onOpenChange, customer, onSave }) => {
  const [name, setName] = useState(customer.name || '');
  const [email, setEmail] = useState(customer.email || '');
  const [phone, setPhone] = useState(customer.phone || '');
  const [address, setAddress] = useState(customer.address || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(customer.name || '');
      setEmail(customer.email || '');
      setPhone(customer.phone || '');
      setAddress(customer.address || '');
    }
  }, [open, customer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!phone.trim()) {
      toast.error('Phone is required');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      toast.success('Customer details updated');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update customer:', error);
      toast.error('Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>Update this customer's contact details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">Name *</Label>
            <Input id="customer-name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer-phone">Phone *</Label>
              <Input id="customer-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555 000 0000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-email">Email</Label>
              <Input id="customer-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-address">Address</Label>
            <Textarea id="customer-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" rows={2} />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerEditDialog;
