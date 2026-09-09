import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataContext } from '@/context/data/DataContext';
import { orgToday, toOrgDayStart } from '@/utils/datetime';

interface AddBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void | Promise<void>;
}

const CATEGORIES = ['parts', 'tools', 'rent', 'utilities', 'salaries', 'marketing', 'insurance', 'other'];

/**
 * Records money the workshop owes. It creates an unpaid expense (so it lands in
 * expense and profit reports) and the database turns that into a bill that can
 * be paid from the Finance page.
 */
export const AddBillDialog: React.FC<AddBillDialogProps> = ({ open, onOpenChange, onCreated }) => {
  const { vendors } = useDataContext();
  const { toast } = useToast();

  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('other');
  const [amount, setAmount] = useState<number>(0);
  const [vendorId, setVendorId] = useState('none');
  const [billDate, setBillDate] = useState(orgToday());
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setDescription('');
    setCategory('other');
    setAmount(0);
    setVendorId('none');
    setBillDate(orgToday());
    setDueDate('');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({ title: 'Error', description: 'Add a description for this bill', variant: 'destructive' });
      return;
    }
    if (amount <= 0) {
      toast({ title: 'Error', description: 'Amount must be greater than 0', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const vendor = vendors.find(v => v.id === vendorId);
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          description: description.trim(),
          category,
          amount,
          date: toOrgDayStart(billDate),
          vendor_id: vendor?.id || null,
          vendor_name: vendor?.name || null,
          payment_status: 'unpaid',
          notes: notes || null,
        } as any)
        .select()
        .single();

      if (error) throw error;

      // The expense trigger creates the bill; add the chosen due date to it
      if (dueDate && data?.id) {
        const { error: dueError } = await supabase
          .from('payables')
          .update({ due_date: toOrgDayStart(dueDate) } as any)
          .eq('expense_id', data.id);
        if (dueError) console.error('Error setting bill due date:', dueError);
      }

      toast({ title: 'Success', description: 'Bill added' });
      await onCreated?.();
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding bill:', error);
      toast({ title: 'Error', description: 'Failed to add bill', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add bill</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="billDescription">Description</Label>
            <Input
              id="billDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Brake pads from supplier"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billAmount">Amount</Label>
              <Input
                id="billAmount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Vendor (optional)</Label>
            <Select value={vendorId} onValueChange={setVendorId}>
              <SelectTrigger>
                <SelectValue placeholder="Select vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No vendor</SelectItem>
                {vendors.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billDate">Bill date</Label>
              <Input id="billDate" type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billDueDate">Due date (optional)</Label>
              <Input id="billDueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billNotes">Notes (optional)</Label>
            <Textarea id="billNotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Add bill'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
