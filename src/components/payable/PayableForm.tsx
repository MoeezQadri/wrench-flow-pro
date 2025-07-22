import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDataContext } from '@/context/data/DataContext';
import { Payable } from '@/types';
import { toast } from 'sonner';

const payableSchema = z.object({
  vendor_id: z.string().optional(),
  expense_id: z.string().optional(),
  reference_number: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  due_date: z.string().optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'cancelled']).default('pending'),
  paid_amount: z.number().optional(),
  payment_date: z.string().optional(),
  payment_method: z.string().optional(),
  notes: z.string().optional(),
});

type PayableFormValues = z.infer<typeof payableSchema>;

interface PayableFormProps {
  payable?: Payable | null;
  onSuccess: (payable: Payable) => void;
  onCancel: () => void;
}

export const PayableForm: React.FC<PayableFormProps> = ({
  payable,
  onSuccess,
  onCancel,
}) => {
  const { vendors } = useDataContext();
  const { addPayable, updatePayable } = useDataContext();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<PayableFormValues>({
    resolver: zodResolver(payableSchema),
    defaultValues: {
      vendor_id: payable?.vendor_id || '',
      expense_id: payable?.expense_id || '',
      reference_number: payable?.reference_number || '',
      description: payable?.description || '',
      amount: payable?.amount || 0,
      due_date: payable?.due_date ? new Date(payable.due_date).toISOString().split('T')[0] : '',
      status: payable?.status || 'pending',
      paid_amount: payable?.paid_amount || 0,
      payment_date: payable?.payment_date ? new Date(payable.payment_date).toISOString().split('T')[0] : '',
      payment_method: payable?.payment_method || '',
      notes: payable?.notes || '',
    },
  });

  const onSubmit = async (data: PayableFormValues) => {
    try {
      const payableData = {
        ...data,
        description: data.description || '',
        status: data.status || 'pending',
        amount: Number(data.amount),
        paid_amount: data.paid_amount ? Number(data.paid_amount) : undefined,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : undefined,
        payment_date: data.payment_date ? new Date(data.payment_date).toISOString() : undefined,
      } as Omit<Payable, 'id'>;

      if (payable?.id) {
        await updatePayable(payable.id, payableData);
        onSuccess({ ...payable, ...payableData } as Payable);
      } else {
        const newPayable = await addPayable(payableData);
        if (newPayable) {
          onSuccess(newPayable);
        }
      }
    } catch (error) {
      console.error('Error saving payable:', error);
      toast.error('Failed to save payable');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vendor_id">Vendor</Label>
          <Select onValueChange={(value) => setValue('vendor_id', value)} value={watch('vendor_id')}>
            <SelectTrigger>
              <SelectValue placeholder="Select vendor..." />
            </SelectTrigger>
            <SelectContent>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reference_number">Reference Number</Label>
          <Input
            id="reference_number"
            {...register('reference_number')}
            placeholder="Enter reference number..."
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            {...register('description')}
            placeholder="Enter description..."
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            {...register('amount', { valueAsNumber: true })}
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">Due Date</Label>
          <Input
            id="due_date"
            type="date"
            {...register('due_date')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select onValueChange={(value) => setValue('status', value as any)} value={watch('status')}>
            <SelectTrigger>
              <SelectValue placeholder="Select status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paid_amount">Paid Amount</Label>
          <Input
            id="paid_amount"
            type="number"
            step="0.01"
            {...register('paid_amount', { valueAsNumber: true })}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_date">Payment Date</Label>
          <Input
            id="payment_date"
            type="date"
            {...register('payment_date')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_method">Payment Method</Label>
          <Select onValueChange={(value) => setValue('payment_method', value)} value={watch('payment_method')}>
            <SelectTrigger>
              <SelectValue placeholder="Select payment method..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
              <SelectItem value="check">Check</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            {...register('notes')}
            placeholder="Additional notes..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : payable ? 'Update Payable' : 'Add Payable'}
        </Button>
      </div>
    </form>
  );
};