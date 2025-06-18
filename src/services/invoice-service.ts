
import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceItem, Part, Task } from '@/types';
import { toast } from 'sonner';

export interface CreateInvoiceData {
  customerId: string;
  vehicleId: string;
  date: string;
  taxRate: number;
  discountType: string;
  discountValue: number;
  notes: string;
  items: InvoiceItem[];
}

export const createInvoice = async (invoiceData: CreateInvoiceData): Promise<Invoice> => {
  try {
    const invoiceId = crypto.randomUUID();
    
    console.log('Creating invoice with consolidated service:', invoiceData);

    // Create the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        id: invoiceId,
        customer_id: invoiceData.customerId,
        vehicle_id: invoiceData.vehicleId,
        date: invoiceData.date,
        tax_rate: invoiceData.taxRate,
        discount_type: invoiceData.discountType,
        discount_value: invoiceData.discountValue,
        notes: invoiceData.notes,
        status: 'open'
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      throw new Error(`Failed to create invoice: ${invoiceError.message}`);
    }

    console.log('Invoice created:', invoice);

    // Insert invoice items if any exist
    if (invoiceData.items && invoiceData.items.length > 0) {
      const itemsToInsert = invoiceData.items.map(item => ({
        id: crypto.randomUUID(),
        invoice_id: invoiceId,
        description: item.description,
        type: item.type,
        quantity: item.quantity,
        price: item.price,
        part_id: item.part_id || null,
        task_id: item.task_id || null,
        is_auto_added: item.is_auto_added || false
      }));

      console.log('Inserting invoice items:', itemsToInsert);

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error creating invoice items:', itemsError);
        throw new Error(`Failed to create invoice items: ${itemsError.message}`);
      }

      // Update parts inventory and task assignments
      await updatePartsAndTasksForInvoice(invoiceData.items, invoiceId);
    }

    // Return the created invoice with items
    return {
      ...invoice,
      items: invoiceData.items,
      payments: []
    } as Invoice;

  } catch (error) {
    console.error('Error in createInvoice:', error);
    throw error;
  }
};

export const updateInvoiceService = async (invoiceData: Invoice): Promise<Invoice> => {
  try {
    const { id, customer_id, vehicle_id, date, tax_rate, discount_type, discount_value, notes, status, items, payments } = invoiceData;

    console.log('Updating invoice service called with:', { id, items: items?.length, payments: payments?.length });

    // First, get existing items to clean up part assignments
    const { data: existingItems } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id);

    // Clean up old part assignments
    if (existingItems) {
      await cleanupOldPartAssignments(existingItems, id);
    }

    // Update the invoice
    const { data: invoiceResult, error: invoiceError } = await supabase
      .from('invoices')
      .update({
        customer_id,
        vehicle_id,
        date,
        tax_rate,
        discount_type,
        discount_value,
        notes,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (invoiceError) {
      console.error('Error updating invoice:', invoiceError);
      throw new Error(`Failed to update invoice: ${invoiceError.message}`);
    }

    // Handle invoice items
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
          id: crypto.randomUUID(),
          invoice_id: id,
          description: item.description,
          type: item.type,
          quantity: item.quantity,
          price: item.price,
          part_id: item.part_id || null,
          task_id: item.task_id || null,
          is_auto_added: item.is_auto_added || false
        }));

        console.log('Inserting updated invoice items:', itemsToInsert);

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error inserting updated invoice items:', itemsError);
          throw new Error(`Failed to update invoice items: ${itemsError.message}`);
        }

        // Update parts inventory and task assignments for new items
        await updatePartsAndTasksForInvoice(items, id);
      }
    }

    // Handle payments
    if (payments) {
      console.log('Processing payments:', payments);
      
      // Delete existing payments
      const { error: deletePaymentsError } = await supabase
        .from('payments')
        .delete()
        .eq('invoice_id', id);

      if (deletePaymentsError) {
        console.error('Error deleting existing payments:', deletePaymentsError);
      }

      // Insert new payments
      if (payments.length > 0) {
        const paymentsToInsert = payments.map(payment => ({
          id: payment.id.startsWith('temp-') ? crypto.randomUUID() : payment.id,
          invoice_id: id,
          amount: payment.amount,
          method: payment.method,
          date: payment.date,
          notes: payment.notes || ''
        }));

        console.log('Inserting payments:', paymentsToInsert);

        const { error: paymentsError } = await supabase
          .from('payments')
          .insert(paymentsToInsert);

        if (paymentsError) {
          console.error('Error inserting payments:', paymentsError);
          throw new Error(`Failed to save payments: ${paymentsError.message}`);
        }
      }
    }

    return {
      ...invoiceResult,
      items: items || [],
      payments: payments || []
    } as Invoice;

  } catch (error) {
    console.error('Error updating invoice:', error);
    throw error;
  }
};

// Helper function to update parts and tasks for an invoice
const updatePartsAndTasksForInvoice = async (items: InvoiceItem[], invoiceId: string) => {
  console.log('Updating parts and tasks for invoice:', invoiceId, 'items:', items);

  for (const item of items) {
    if (item.type === 'part' && item.part_id) {
      try {
        console.log('Processing part item:', item);
        
        // Get current part data
        const { data: part, error: partError } = await supabase
          .from('parts')
          .select('*')
          .eq('id', item.part_id)
          .single();

        if (partError) {
          console.error('Error fetching part for update:', partError);
          continue;
        }

        if (part) {
          // Update part with invoice reference and reduce quantity
          const currentInvoiceIds = part.invoice_ids || [];
          const updatedInvoiceIds = currentInvoiceIds.includes(invoiceId) 
            ? currentInvoiceIds 
            : [...currentInvoiceIds, invoiceId];

          const newQuantity = Math.max(0, part.quantity - item.quantity);

          console.log(`Updating part ${part.name}: quantity ${part.quantity} -> ${newQuantity}, invoice_ids:`, updatedInvoiceIds);

          const { error: updateError } = await supabase
            .from('parts')
            .update({
              quantity: newQuantity,
              invoice_ids: updatedInvoiceIds,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.part_id);

          if (updateError) {
            console.error('Error updating part inventory:', updateError);
          } else {
            console.log('Successfully updated part inventory for:', part.name);
          }
        }
      } catch (error) {
        console.error('Error processing part inventory update:', error);
      }
    }

    if (item.type === 'labor' && item.task_id) {
      try {
        console.log('Processing labor item:', item);
        
        const { error: taskError } = await supabase
          .from('tasks')
          .update({
            invoice_id: invoiceId,
            price: item.price,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.task_id);

        if (taskError) {
          console.error('Error updating task:', taskError);
        } else {
          console.log('Successfully updated task for invoice:', invoiceId);
        }
      } catch (error) {
        console.error('Error processing task update:', error);
      }
    }
  }
};

// Helper function to clean up old part assignments when updating an invoice
const cleanupOldPartAssignments = async (existingItems: any[], invoiceId: string) => {
  console.log('Cleaning up old part assignments for invoice:', invoiceId);

  for (const item of existingItems) {
    if (item.type === 'part' && item.part_id) {
      try {
        // Get current part data
        const { data: part, error: partError } = await supabase
          .from('parts')
          .select('*')
          .eq('id', item.part_id)
          .single();

        if (partError) {
          console.error('Error fetching part for cleanup:', partError);
          continue;
        }

        if (part) {
          // Remove invoice ID from part and restore quantity
          const currentInvoiceIds = part.invoice_ids || [];
          const updatedInvoiceIds = currentInvoiceIds.filter(id => id !== invoiceId);
          const restoredQuantity = part.quantity + item.quantity;

          console.log(`Cleaning up part ${part.name}: restoring quantity ${part.quantity} -> ${restoredQuantity}`);

          const { error: updateError } = await supabase
            .from('parts')
            .update({
              quantity: restoredQuantity,
              invoice_ids: updatedInvoiceIds,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.part_id);

          if (updateError) {
            console.error('Error cleaning up part:', updateError);
          } else {
            console.log('Successfully cleaned up part:', part.name);
          }
        }
      } catch (error) {
        console.error('Error cleaning up part assignment:', error);
      }
    }
  }
};
