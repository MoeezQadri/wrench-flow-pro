
import { useState } from 'react';
import type { Invoice } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createInvoiceOptimized, updateInvoiceOptimized, deleteInvoiceOptimized, CreateInvoiceData } from '@/services/optimized-invoice-service';
import { useOrganizationAwareQuery } from '@/hooks/useOrganizationAwareQuery';

const INVOICE_SELECT = `
                    *,
                    invoice_items(*),
                    payments(*),
                    vehicles(make, model, year, license_plate)
                `;

// Shared row -> Invoice mapping so single-invoice and list loads stay identical.
const transformInvoiceRow = (invoice: any) => ({
    ...invoice,
    items: invoice.invoice_items?.map((item: any) => ({
        id: item.id,
        description: item.description,
        type: item.type,
        quantity: item.quantity,
        price: item.price,
        part_id: item.part_id,
        task_id: item.task_id,
        is_auto_added: item.is_auto_added || false,
        cost: item.cost || 0,
        unit_of_measure: item.unit_of_measure || 'piece',
        creates_inventory_part: item.creates_inventory_part || false,
        creates_task: item.creates_task || false,
        custom_part_data: item.custom_part_data,
        custom_labor_data: item.custom_labor_data
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
});

export const useInvoices = () => {
    const { applyOrganizationFilter } = useOrganizationAwareQuery();
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    const addInvoice = async (invoiceData: CreateInvoiceData) => {
        try {
            console.log('useInvoices: Creating invoice with data:', invoiceData);
            const newInvoice = await createInvoiceOptimized(invoiceData);
            
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
            await deleteInvoiceOptimized(id);
            setInvoices((prev) => prev.filter((item) => item.id !== id));
            toast.success('Invoice deleted successfully');
        } catch (error: any) {
            console.error('Error removing invoice:', error);
            toast.error(error?.message || 'Failed to delete invoice');
            throw error;
        }
    };


    const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
        try {
            console.log('useInvoices: Updating invoice with ID:', id);
            console.log('Updates:', updates);
            
            const updatedInvoice = await updateInvoiceOptimized(updates as Invoice);
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

    // Fetch a single invoice (same shape as loadInvoices) without pulling the
    // whole invoice table with all its items and payments.
    const fetchInvoiceById = async (id: string): Promise<Invoice | null> => {
        if (!id) return null;
        try {
            let query = supabase
                .from('invoices')
                .select(INVOICE_SELECT)
                .eq('id', id);

            query = applyOrganizationFilter(query);

            const { data, error } = await query.maybeSingle();

            if (error) {
                console.error('Error fetching invoice:', error);
                return null;
            }
            if (!data) return null;

            const transformed = transformInvoiceRow(data) as Invoice;
            setInvoices((prev) => prev.some((item) => item.id === transformed.id)
                ? prev.map((item) => item.id === transformed.id ? transformed : item)
                : [...prev, transformed]);
            return transformed;
        } catch (error) {
            console.error('Error fetching invoice:', error);
            return null;
        }
    };

    const loadInvoices = async () => {
        try {
            console.log('Loading invoices from database...');
            let query = supabase
                .from('invoices')
                .select(INVOICE_SELECT);
            
            // Apply organization filter
            query = applyOrganizationFilter(query);
            
            const { data: invoicesData, error: invoicesError } = await query;

            if (invoicesError) {
                console.error('Error fetching invoices:', invoicesError);
                toast.error('Failed to load invoices');
            } else {
                const transformedInvoices = (invoicesData || []).map((invoice: any) => transformInvoiceRow(invoice));
                
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
        fetchInvoiceById,
        loadInvoices
    };
};
