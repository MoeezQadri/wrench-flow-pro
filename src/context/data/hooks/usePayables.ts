import { useState } from 'react';
import { Payable } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useOrganizationAwareQuery } from '@/hooks/useOrganizationAwareQuery';

export const usePayables = () => {
  const [payables, setPayables] = useState<Payable[]>([]);
  const { toast } = useToast();
  const { applyOrganizationFilter } = useOrganizationAwareQuery();

  const addPayable = async (payableData: Omit<Payable, 'id'>): Promise<Payable> => {
    try {
      const { data, error } = await supabase
        .from('payables')
        .insert([payableData])
        .select()
        .single();

      if (error) throw error;

      const newPayable = data as Payable;
      setPayables(prev => [...prev, newPayable]);
      
      toast({
        title: "Success",
        description: "Payable record created successfully",
      });

      return newPayable;
    } catch (error) {
      console.error('Error adding payable:', error);
      toast({
        title: "Error",
        description: "Failed to create payable record",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updatePayable = async (id: string, updates: Partial<Payable>): Promise<Payable> => {
    try {
      const { data, error } = await supabase
        .from('payables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedPayable = data as Payable;
      setPayables(prev => prev.map(p => p.id === id ? updatedPayable : p));
      
      toast({
        title: "Success",
        description: "Payable updated successfully",
      });

      return updatedPayable;
    } catch (error) {
      console.error('Error updating payable:', error);
      toast({
        title: "Error",
        description: "Failed to update payable",
        variant: "destructive",
      });
      throw error;
    }
  };

  /**
   * Record a payment against a bill. Supports partial payments: the bill stays
   * pending until the paid amount covers the bill total. Keeps the linked
   * expense in sync so expense reports show the same payment state.
   */
  const markAsPaid = async (id: string, paymentData: {
    amount: number;
    payment_method: string;
    payment_date?: string;
    notes?: string;
  }): Promise<Payable> => {
    try {
      const existing = payables.find(p => p.id === id);
      const billTotal = existing?.amount ?? paymentData.amount;
      const alreadyPaid = existing?.paid_amount ?? 0;
      const newPaid = Math.min(billTotal, alreadyPaid + Math.max(0, paymentData.amount));
      const fullyPaid = newPaid >= billTotal - 0.005;
      const paymentDate = paymentData.payment_date || new Date().toISOString();

      const updates: Partial<Payable> = {
        status: fullyPaid ? 'paid' : 'pending',
        paid_amount: newPaid,
        payment_method: paymentData.payment_method,
        payment_date: paymentDate,
      };
      if (paymentData.notes) {
        updates.notes = existing?.notes
          ? `${existing.notes}\n${paymentData.notes}`
          : paymentData.notes;
      }

      const updated = await updatePayable(id, updates);

      // Keep the linked expense aligned with the bill's payment state
      if (existing?.expense_id) {
        const { error: expenseError } = await supabase
          .from('expenses')
          .update({
            payment_status: fullyPaid ? 'paid' : 'partial',
            payment_method: paymentData.payment_method,
          } as any)
          .eq('id', existing.expense_id);
        if (expenseError) {
          console.error('Error syncing expense payment state:', expenseError);
        }
      }

      return updated;
    } catch (error) {
      console.error('Error recording payable payment:', error);
      throw error;
    }
  };


  const removePayable = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('payables')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPayables(prev => prev.filter(p => p.id !== id));
      
      toast({
        title: "Success",
        description: "Payable deleted successfully",
      });
    } catch (error) {
      console.error('Error removing payable:', error);
      toast({
        title: "Error",
        description: "Failed to delete payable",
        variant: "destructive",
      });
      throw error;
    }
  };

  const loadPayables = async (): Promise<void> => {
    try {
      const query = supabase
        .from('payables')
        .select('*')
        .order('created_at', { ascending: false });
      
      const { data, error } = await applyOrganizationFilter(query);
      
      if (error) throw error;

      setPayables(data || []);
    } catch (error) {
      console.error('Error loading payables:', error);
    }
  };

  const getPayablesByVendor = async (vendorId: string): Promise<Payable[]> => {
    try {
      const query = supabase
        .from('payables')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });
      
      const { data, error } = await applyOrganizationFilter(query);
      
      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error loading vendor payables:', error);
      return [];
    }
  };

  return {
    payables,
    setPayables,
    addPayable,
    updatePayable,
    markAsPaid,
    removePayable,
    loadPayables,
    getPayablesByVendor,
  };
};