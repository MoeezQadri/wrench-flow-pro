import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Payable } from '@/types';
import { toast } from 'sonner';

export const usePayables = () => {
  const [payables, setPayables] = useState<Payable[]>([]);

  const addPayable = async (payable: Omit<Payable, 'id'>): Promise<Payable | null> => {
    try {
      const newPayable = {
        ...payable,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('payables' as any)
        .insert(newPayable)
        .select()
        .single();

      if (error) {
        console.error('Error adding payable:', error);
        toast.error('Failed to add payable');
        return null;
      }

      const result = data as unknown as Payable;
      setPayables((prev) => [...prev, result]);
      toast.success('Payable added successfully');
      return result;
    } catch (error) {
      console.error('Error adding payable:', error);
      toast.error('Failed to add payable');
      return null;
    }
  };

  const removePayable = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from('payables' as any).delete().eq('id', id);
      
      if (error) {
        console.error('Error removing payable:', error);
        toast.error('Failed to remove payable');
        return;
      }

      setPayables((prev) => prev.filter((item) => item.id !== id));
      toast.success('Payable removed successfully');
    } catch (error) {
      console.error('Error removing payable:', error);
      toast.error('Failed to remove payable');
    }
  };

  const updatePayable = async (id: string, updates: Partial<Payable>): Promise<void> => {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('payables' as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating payable:', error);
        toast.error('Failed to update payable');
        return;
      }

      const result = data as unknown as Payable;
      setPayables((prev) => prev.map((item) => item.id === id ? result : item));
      toast.success('Payable updated successfully');
    } catch (error) {
      console.error('Error updating payable:', error);
      toast.error('Failed to update payable');
    }
  };

  const loadPayables = async () => {
    try {
      const { data: payablesData, error: payablesError } = await supabase.from('payables' as any).select('*');
      if (payablesError) {
        console.error('Error fetching payables:', payablesError);
        toast.error('Failed to load payables');
        return;
      }
      setPayables((payablesData || []) as unknown as Payable[]);
    } catch (error) {
      console.error('Error fetching payables:', error);
      toast.error('Failed to load payables');
    }
  };

  return {
    payables,
    setPayables,
    addPayable,
    removePayable,
    updatePayable,
    loadPayables
  };
};