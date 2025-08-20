
import { useState, useCallback } from 'react';
import type { Payment } from '@/types';
import { toast } from 'sonner';
import { useOrganizationAwareQuery } from '@/hooks/useOrganizationAwareQuery';
import { paymentService, CreatePaymentData, UpdatePaymentData } from '@/services/payment-service';
import { supabase } from '@/integrations/supabase/client';

export const usePayments = () => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const { applyOrganizationFilter } = useOrganizationAwareQuery();

    const addPayment = useCallback(async (paymentData: CreatePaymentData): Promise<Payment> => {
        try {
            const payment = await paymentService.createPayment(paymentData);
            setPayments((prev) => [...prev, payment]);
            toast.success('Payment added successfully');
            return payment;
        } catch (error) {
            console.error('Error adding payment:', error);
            toast.error('Failed to add payment');
            throw error;
        }
    }, []);

    const removePayment = useCallback(async (id: string): Promise<void> => {
        try {
            await paymentService.deletePayment(id);
            setPayments((prev) => prev.filter((item) => item.id !== id));
            toast.success('Payment deleted successfully');
        } catch (error) {
            console.error('Error removing payment:', error);
            toast.error('Failed to delete payment');
            throw error;
        }
    }, []);

    const updatePayment = useCallback(async (updateData: UpdatePaymentData): Promise<Payment> => {
        try {
            const payment = await paymentService.updatePayment(updateData);
            setPayments((prev) => prev.map((item) => item.id === updateData.id ? payment : item));
            toast.success('Payment updated successfully');
            return payment;
        } catch (error) {
            console.error('Error updating payment:', error);
            toast.error('Failed to update payment');
            throw error;
        }
    }, []);

    const loadPaymentsByInvoice = useCallback(async (invoiceId: string): Promise<Payment[]> => {
        try {
            const invoicePayments = await paymentService.getPaymentsByInvoice(invoiceId);
            return invoicePayments;
        } catch (error) {
            console.error('Error loading payments for invoice:', error);
            toast.error('Failed to load payments');
            return [];
        }
    }, []);

    const replaceInvoicePayments = useCallback(async (
        invoiceId: string, 
        newPayments: Omit<CreatePaymentData, 'invoice_id'>[]
    ): Promise<Payment[]> => {
        try {
            const payments = await paymentService.replaceInvoicePayments(invoiceId, newPayments);
            toast.success('Payments updated successfully');
            return payments;
        } catch (error) {
            console.error('Error replacing invoice payments:', error);
            toast.error('Failed to update payments');
            throw error;
        }
    }, []);

    const loadPayments = useCallback(async (): Promise<void> => {
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
    }, [applyOrganizationFilter]);

    return {
        payments,
        setPayments,
        addPayment,
        removePayment,
        updatePayment,
        loadPayments,
        loadPaymentsByInvoice,
        replaceInvoicePayments
    };
};
