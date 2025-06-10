
import { useState } from 'react';
import type { Invoice } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useInvoices = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    const generateUUID = () => crypto.randomUUID();

    const addInvoice = async (invoiceData: any) => {
        const newInvoice: Invoice = {
            id: generateUUID(),
            customer_id: invoiceData.customerId,
            vehicle_id: invoiceData.vehicleId,
            date: invoiceData.date,
            tax_rate: invoiceData.taxRate,
            status: 'open',
            notes: invoiceData.notes,
            items: invoiceData.items || [],
            payments: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            discount_type: invoiceData.discountType || 'none',
            discount_value: invoiceData.discountValue || 0,
            vehicleInfo: {
                make: 'Honda',
                model: 'Civic',
                year: '2015',
                license_plate: 'ABC-123'
            }
        };
        
        try {
            const { data, error } = await supabase.from('invoices').insert(newInvoice).select();
            if (error) {
                console.error('Error adding invoice:', error);
                toast.error('Failed to create invoice');
                throw error;
            }
            if (data && data.length > 0) {
                const result = { ...data[0], items: newInvoice.items } as Invoice;
                setInvoices((prev) => [...prev, result]);
                toast.success('Invoice created successfully');
                return result;
            }
            return newInvoice;
        } catch (error) {
            console.error('Error adding invoice:', error);
            toast.error('Failed to create invoice');
            throw error;
        }
    };

    const removeInvoice = async (id: string) => {
        try {
            const { error } = await supabase.from('invoices').delete().eq('id', id);
            if (error) {
                console.error('Error removing invoice:', error);
                toast.error('Failed to delete invoice');
                throw error;
            }
            setInvoices((prev) => prev.filter((item) => item.id !== id));
            toast.success('Invoice deleted successfully');
        } catch (error) {
            console.error('Error removing invoice:', error);
            toast.error('Failed to delete invoice');
            throw error;
        }
    };

    const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
        try {
            const { data, error } = await supabase
                .from('invoices')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating invoice:', error);
                toast.error('Failed to update invoice');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Invoice;
                setInvoices((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Invoice updated successfully');
            }
        } catch (error) {
            console.error('Error updating invoice:', error);
            toast.error('Failed to update invoice');
            throw error;
        }
    };

    const getInvoiceById = (id: string) => invoices.find(invoice => invoice.id === id) || null;

    const loadInvoices = async () => {
        try {
            const { data: invoicesData, error: invoicesError } = await supabase.from('invoices').select('*');
            if (invoicesError) {
                console.error('Error fetching invoices:', invoicesError);
                toast.error('Failed to load invoices');
            } else {
                const transformedInvoices = (invoicesData || []).map((invoice: any) => ({
                    ...invoice,
                    items: []
                }));
                setInvoices(transformedInvoices);
            }
        } catch (error) {
            console.error('Error fetching invoices:', error);
            toast.error('Failed to load invoices');
        }
    };

    return {
        invoices,
        setInvoices,
        addInvoice,
        removeInvoice,
        updateInvoice,
        getInvoiceById,
        loadInvoices
    };
};
