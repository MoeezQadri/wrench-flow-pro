
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
            // First, insert the invoice
            const { data: invoiceResult, error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                    id: newInvoice.id,
                    customer_id: newInvoice.customer_id,
                    vehicle_id: newInvoice.vehicle_id,
                    date: newInvoice.date,
                    tax_rate: newInvoice.tax_rate,
                    status: newInvoice.status,
                    notes: newInvoice.notes,
                    discount_type: newInvoice.discount_type,
                    discount_value: newInvoice.discount_value
                })
                .select();

            if (invoiceError) {
                console.error('Error adding invoice:', invoiceError);
                toast.error('Failed to create invoice');
                throw invoiceError;
            }

            // Then, insert the invoice items if any exist
            if (newInvoice.items && newInvoice.items.length > 0) {
                const itemsToInsert = newInvoice.items.map(item => ({
                    id: generateUUID(),
                    invoice_id: newInvoice.id,
                    description: item.description,
                    type: item.type,
                    quantity: item.quantity,
                    price: item.price,
                    part_id: item.part_id || null,
                    task_id: item.task_id || null,
                    is_auto_added: item.is_auto_added || false
                }));

                const { error: itemsError } = await supabase
                    .from('invoice_items')
                    .insert(itemsToInsert);

                if (itemsError) {
                    console.error('Error adding invoice items:', itemsError);
                    toast.error('Failed to save invoice items');
                    throw itemsError;
                }
            }

            if (invoiceResult && invoiceResult.length > 0) {
                const result = { ...invoiceResult[0], items: newInvoice.items } as Invoice;
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
            // First delete invoice items
            const { error: itemsError } = await supabase
                .from('invoice_items')
                .delete()
                .eq('invoice_id', id);

            if (itemsError) {
                console.error('Error removing invoice items:', itemsError);
            }

            // Then delete the invoice
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
            const { items, payments, ...invoiceFields } = updates;
            
            // Update the main invoice record
            const { data, error } = await supabase
                .from('invoices')
                .update({
                    ...invoiceFields,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating invoice:', error);
                toast.error('Failed to update invoice');
                throw error;
            }

            // Update invoice items if provided
            if (items) {
                // Delete existing items
                const { error: deleteError } = await supabase
                    .from('invoice_items')
                    .delete()
                    .eq('invoice_id', id);

                if (deleteError) {
                    console.error('Error deleting existing invoice items:', deleteError);
                }

                // Insert new items
                if (items.length > 0) {
                    const itemsToInsert = items.map(item => ({
                        id: generateUUID(),
                        invoice_id: id,
                        description: item.description,
                        type: item.type,
                        quantity: item.quantity,
                        price: item.price,
                        part_id: item.part_id || null,
                        task_id: item.task_id || null,
                        is_auto_added: item.is_auto_added || false
                    }));

                    const { error: itemsError } = await supabase
                        .from('invoice_items')
                        .insert(itemsToInsert);

                    if (itemsError) {
                        console.error('Error inserting updated invoice items:', itemsError);
                        toast.error('Failed to update invoice items');
                        throw itemsError;
                    }
                }
            }

            if (data && data.length > 0) {
                const result = { ...data[0], items: items || [] } as Invoice;
                setInvoices((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Invoice updated successfully');
            }
        } catch (error) {
            console.error('Error updating invoice:', error);
            toast.error('Failed to update invoice');
            throw error;
        }
    };

    const getInvoiceById = (id: string) => {
        const invoice = invoices.find(invoice => invoice.id === id);
        return invoice || null;
    };

    const loadInvoices = async () => {
        try {
            const { data: invoicesData, error: invoicesError } = await supabase
                .from('invoices')
                .select(`
                    *,
                    invoice_items(*),
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
                    vehicleInfo: invoice.vehicles ? {
                        make: invoice.vehicles.make,
                        model: invoice.vehicles.model,
                        year: invoice.vehicles.year,
                        license_plate: invoice.vehicles.license_plate
                    } : undefined
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
