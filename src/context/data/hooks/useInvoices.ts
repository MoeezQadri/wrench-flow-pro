
import { useState } from 'react';
import type { Invoice } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createInvoice, updateInvoiceService, CreateInvoiceData } from '@/services/invoice-service';

export const useInvoices = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    const addInvoice = async (invoiceData: CreateInvoiceData) => {
        try {
            console.log('useInvoices: Creating invoice with data:', invoiceData);
            const newInvoice = await createInvoice(invoiceData);
            
            setInvoices((prev) => [...prev, newInvoice]);
            toast.success('Invoice created successfully');
            return newInvoice;
        } catch (error) {
            console.error('Error adding invoice:', error);
            toast.error(`Failed to create invoice: ${error.message}`);
            throw error;
        }
    };

    const removeInvoice = async (id: string) => {
        try {
            // First delete payments
            const { error: paymentsError } = await supabase
                .from('payments')
                .delete()
                .eq('invoice_id', id);

            if (paymentsError) {
                console.error('Error removing payments:', paymentsError);
            }

            // Then delete invoice items
            const { error: itemsError } = await supabase
                .from('invoice_items')
                .delete()
                .eq('invoice_id', id);

            if (itemsError) {
                console.error('Error removing invoice items:', itemsError);
            }

            // Finally delete the invoice
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
            console.log('useInvoices: Updating invoice with ID:', id);
            console.log('Updates:', updates);
            
            const updatedInvoice = await updateInvoiceService(updates as Invoice);
            setInvoices((prev) => prev.map((item) => item.id === id ? updatedInvoice : item));
            toast.success('Invoice updated successfully');
            return updatedInvoice;
        } catch (error) {
            console.error('Error updating invoice:', error);
            toast.error(`Failed to update invoice: ${error.message}`);
            throw error;
        }
    };

    const getInvoiceById = (id: string) => {
        const invoice = invoices.find(invoice => invoice.id === id);
        return invoice || null;
    };

    const loadInvoices = async () => {
        try {
            console.log('Loading invoices from database...');
            const { data: invoicesData, error: invoicesError } = await supabase
                .from('invoices')
                .select(`
                    *,
                    invoice_items(*),
                    payments(*),
                    vehicles(make, model, year, license_plate)
                `);

            if (invoicesError) {
                console.error('Error fetching invoices:', invoicesError);
                toast.error('Failed to load invoices');
            } else {
                const transformedInvoices = (invoicesData || []).map((invoice: any) => ({
                    ...invoice,
                    items: invoice.invoice_items?.map((item: any) => ({
                        id: item.id,
                        description: item.description,
                        type: item.type,
                        quantity: item.quantity,
                        price: item.price,
                        part_id: item.part_id,
                        task_id: item.task_id,
                        is_auto_added: item.is_auto_added || false
                    })) || [],
                    payments: invoice.payments?.map((payment: any) => ({
                        id: payment.id,
                        invoice_id: payment.invoice_id,
                        amount: payment.amount,
                        method: payment.method,
                        date: payment.date,
                        notes: payment.notes || ''
                    })) || [],
                    vehicleInfo: invoice.vehicles ? {
                        make: invoice.vehicles.make,
                        model: invoice.vehicles.model,
                        year: invoice.vehicles.year,
                        license_plate: invoice.vehicles.license_plate
                    } : undefined
                }));
                
                console.log('Invoices loaded successfully:', transformedInvoices);
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
