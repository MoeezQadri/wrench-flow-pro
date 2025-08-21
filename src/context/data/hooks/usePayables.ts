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

  const markAsPaid = async (id: string, paymentData: {
    amount: number;
    payment_method: string;
    payment_date?: string;
    notes?: string;
  }): Promise<Payable> => {
    try {
      const updates: Partial<Payable> = {
        status: 'paid',
        paid_amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        payment_date: paymentData.payment_date || new Date().toISOString(),
        notes: paymentData.notes,
      };

      return await updatePayable(id, updates);
    } catch (error) {
      console.error('Error marking payable as paid:', error);
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