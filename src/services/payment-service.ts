import { supabase } from '@/integrations/supabase/client';
import { Payment } from '@/types';
import { toast } from 'sonner';

export interface CreatePaymentData {
  invoice_id: string;
  amount: number;
  method: string;
  date: string;
  notes?: string;
  organization_id: string;
}

export interface UpdatePaymentData extends Partial<CreatePaymentData> {
  id: string;
}

export const paymentService = {
  async createPayment(paymentData: CreatePaymentData): Promise<Payment> {
    console.log('[PaymentService] Creating payment:', paymentData);
    
    const { data, error } = await supabase
      .from('payments')
      .insert({
        ...paymentData,
        amount: Number(paymentData.amount), // Ensure number type
        date: new Date(paymentData.date).toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('[PaymentService] Error creating payment:', error);
      throw new Error(`Failed to create payment: ${error.message}`);
    }

    console.log('[PaymentService] Payment created successfully:', data);
    return data as Payment;
  },

  async updatePayment(updateData: UpdatePaymentData): Promise<Payment> {
    console.log('[PaymentService] Updating payment:', updateData);
    
    const { id, ...updates } = updateData;
    const processedUpdates = {
      ...updates,
      ...(updates.amount && { amount: Number(updates.amount) }),
      ...(updates.date && { date: new Date(updates.date).toISOString() })
    };

    const { data, error } = await supabase
      .from('payments')
      .update(processedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[PaymentService] Error updating payment:', error);
      throw new Error(`Failed to update payment: ${error.message}`);
    }

    console.log('[PaymentService] Payment updated successfully:', data);
    return data as Payment;
  },

  async deletePayment(paymentId: string): Promise<void> {
    console.log('[PaymentService] Deleting payment:', paymentId);
    
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);

    if (error) {
      console.error('[PaymentService] Error deleting payment:', error);
      throw new Error(`Failed to delete payment: ${error.message}`);
    }

    console.log('[PaymentService] Payment deleted successfully');
  },

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    console.log('[PaymentService] Fetching payments for invoice:', invoiceId);
    
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('date', { ascending: false });

    if (error) {
      console.error('[PaymentService] Error fetching payments:', error);
      throw new Error(`Failed to fetch payments: ${error.message}`);
    }

    console.log('[PaymentService] Fetched payments:', data?.length || 0);
    return data || [];
  },

  async replaceInvoicePayments(invoiceId: string, payments: Omit<CreatePaymentData, 'invoice_id'>[]): Promise<Payment[]> {
    console.log('[PaymentService] Replacing all payments for invoice:', invoiceId, 'new payments:', payments.length);
    
    // Start transaction by deleting existing payments
    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('invoice_id', invoiceId);

    if (deleteError) {
      console.error('[PaymentService] Error deleting existing payments:', deleteError);
      throw new Error(`Failed to clear existing payments: ${deleteError.message}`);
    }

    // If no payments to create, return empty array
    if (payments.length === 0) {
      console.log('[PaymentService] No payments to create, returning empty array');
      return [];
    }

    // Insert new payments
    const paymentsToInsert = payments.map(payment => ({
      ...payment,
      invoice_id: invoiceId,
      amount: Number(payment.amount),
      date: new Date(payment.date).toISOString()
    }));

    const { data, error: insertError } = await supabase
      .from('payments')
      .insert(paymentsToInsert)
      .select();

    if (insertError) {
      console.error('[PaymentService] Error inserting new payments:', insertError);
      throw new Error(`Failed to create new payments: ${insertError.message}`);
    }

    console.log('[PaymentService] Successfully replaced payments:', data?.length || 0);
    return data || [];
  },

  /**
   * Adds, updates and removes payment rows individually instead of wiping the
   * whole set, so a payment recorded by one person is never lost to another
   * person's save.
   */
  async syncInvoicePayments(
    invoiceId: string,
    payments: (Partial<CreatePaymentData> & { id?: string; amount: number; method: string; date: string })[],
    organizationId: string,
    allowDeletes: boolean
  ): Promise<Payment[]> {
    const { data: existing, error: readError } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId);

    if (readError) {
      throw new Error(`Failed to load existing payments: ${readError.message}`);
    }

    const existingRows = (existing || []) as Payment[];
    const existingById = new Map(existingRows.map(row => [row.id, row]));
    const keptIds = new Set<string>();

    for (const payment of payments) {
      const current = payment.id ? existingById.get(payment.id) : undefined;

      if (current) {
        keptIds.add(current.id);

        const changed =
          Number(current.amount) !== Number(payment.amount) ||
          current.method !== payment.method ||
          new Date(current.date as string).getTime() !== new Date(payment.date).getTime() ||
          (current.notes || null) !== (payment.notes || null);

        if (changed) {
          const { error } = await supabase
            .from('payments')
            .update({
              amount: Number(payment.amount),
              method: payment.method,
              date: new Date(payment.date).toISOString(),
              notes: payment.notes || null
            })
            .eq('id', current.id);

          if (error) throw new Error(`Failed to update payment: ${error.message}`);
        }
        continue;
      }

      const { data: inserted, error } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoiceId,
          amount: Number(payment.amount),
          method: payment.method,
          date: new Date(payment.date).toISOString(),
          notes: payment.notes || null,
          organization_id: organizationId
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create payment: ${error.message}`);
      if (inserted?.id) keptIds.add(inserted.id);
    }

    if (allowDeletes) {
      const removed = existingRows.filter(row => !keptIds.has(row.id)).map(row => row.id);
      if (removed.length > 0) {
        const { error } = await supabase.from('payments').delete().in('id', removed);
        if (error) throw new Error(`Failed to remove payment: ${error.message}`);
      }
    }

    const { data: finalRows, error: finalError } = await supabase
      .from('payments')
      .select('*')
      .eq('invoice_id', invoiceId);

    if (finalError) throw new Error(`Failed to reload payments: ${finalError.message}`);

    return (finalRows || []) as Payment[];
  }
};
