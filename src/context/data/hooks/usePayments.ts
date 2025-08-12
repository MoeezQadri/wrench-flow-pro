
import { useState } from 'react';
import type { Payment } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationAwareQuery } from '@/hooks/useOrganizationAwareQuery';

export const usePayments = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const { applyOrganizationFilter } = useOrganizationAwareQuery();

    const addPayment = async (payment: Payment) => {
        try {
            const { data, error } = await supabase.from('payments').insert(payment).select();
            if (error) {
                console.error('Error adding payment:', error);
                toast.error('Failed to add payment');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Payment;
                setPayments((prev) => [...prev, result]);
                toast.success('Payment added successfully');
            }
        } catch (error) {
            console.error('Error adding payment:', error);
            toast.error('Failed to add payment');
            throw error;
        }
    };

    const removePayment = async (id: string) => {
        try {
            const { error } = await supabase.from('payments').delete().eq('id', id);
            if (error) {
                console.error('Error removing payment:', error);
                toast.error('Failed to delete payment');
                throw error;
            }
            setPayments((prev) => prev.filter((item) => item.id !== id));
            toast.success('Payment deleted successfully');
        } catch (error) {
            console.error('Error removing payment:', error);
            toast.error('Failed to delete payment');
            throw error;
        }
    };

    const updatePayment = async (id: string, updates: Partial<Payment>) => {
        try {
            const { data, error } = await supabase
                .from('payments')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating payment:', error);
                toast.error('Failed to update payment');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Payment;
                setPayments((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Payment updated successfully');
            }
        } catch (error) {
            console.error('Error updating payment:', error);
            toast.error('Failed to update payment');
            throw error;
        }
    };

    const loadPayments = async () => {
        try {
            const query = supabase.from('payments').select('*');
            const { data: paymentsData, error: paymentsError } = await applyOrganizationFilter(query);
            if (paymentsError) {
                console.error('Error fetching payments:', paymentsError);
                toast.error('Failed to load payments');
            } else {
                setPayments(paymentsData || []);
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
            toast.error('Failed to load payments');
        }
    };

    return {
        payments,
        setPayments,
        addPayment,
        removePayment,
        updatePayment,
        loadPayments
    };
};
