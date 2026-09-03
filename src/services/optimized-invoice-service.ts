import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceItem, Part, Task, Payment, InvoiceStatus } from '@/types';
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
  payments?: Payment[];
  status?: InvoiceStatus;
}

export interface BatchPartUpdate {
  partId: string;
  quantity: number;
  operation: 'add' | 'remove';
  invoiceId: string;
}

export interface BatchTaskUpdate {
  taskId: string;
  invoiceId: string;
  price?: number;
}

// Batch database operations for better performance
export const batchUpdateParts = async (updates: BatchPartUpdate[], organizationId: string) => {
  console.log('Starting batch part updates:', updates.length);
  
  if (updates.length === 0) return;

  // Group updates by part ID to combine operations
  const partUpdates = new Map<string, { quantity: number; invoiceIds: string[] }>();
  
  for (const update of updates) {
    const key = update.partId;
    const existing = partUpdates.get(key) || { quantity: 0, invoiceIds: [] };
    
    if (update.operation === 'add') {
      existing.quantity -= update.quantity; // Subtract from inventory
      if (!existing.invoiceIds.includes(update.invoiceId)) {
        existing.invoiceIds.push(update.invoiceId);
      }
    } else {
      existing.quantity += update.quantity; // Add back to inventory
      existing.invoiceIds = existing.invoiceIds.filter(id => id !== update.invoiceId);
    }
    
    partUpdates.set(key, existing);
  }

  // Execute batch updates
  const updatePromises = Array.from(partUpdates.entries()).map(async ([partId, changes]) => {
    // Get current part data
    const { data: part, error: fetchError } = await supabase
      .from('parts')
      .select('quantity, invoice_ids')
      .eq('id', partId)
      .single();

    if (fetchError || !part) {
      console.error('Error fetching part for batch update:', fetchError);
      return;
    }

    const newQuantity = Math.max(0, part.quantity + changes.quantity);
    const currentInvoiceIds = part.invoice_ids || [];
    
    // Merge invoice IDs
    const newInvoiceIds = [...new Set([...currentInvoiceIds, ...changes.invoiceIds])];

    return supabase
      .from('parts')
      .update({
        quantity: newQuantity,
        invoice_ids: newInvoiceIds,
        updated_at: new Date().toISOString()
      })
      .eq('id', partId);
  });

  const results = await Promise.allSettled(updatePromises);
  const errors = results.filter(r => r.status === 'rejected');
  
  if (errors.length > 0) {
    console.error('Some batch part updates failed:', errors);
    throw new Error(`Failed to update ${errors.length} parts`);
  }
  
  console.log('Batch part updates completed successfully');
};

export const batchUpdateTasks = async (updates: BatchTaskUpdate[]) => {
  console.log('Starting batch task updates:', updates.length);
  
  if (updates.length === 0) return;

  const updatePromises = updates.map(update => 
    supabase
      .from('tasks')
      .update({
        invoice_id: update.invoiceId,
        price: update.price,
        updated_at: new Date().toISOString()
      })
      .eq('id', update.taskId)
  );

  const results = await Promise.allSettled(updatePromises);
  const errors = results.filter(r => r.status === 'rejected');
  
  if (errors.length > 0) {
    console.error('Some batch task updates failed:', errors);
    throw new Error(`Failed to update ${errors.length} tasks`);
  }
  
  console.log('Batch task updates completed successfully');
};

// Optimized invoice creation with minimal database calls
export const createInvoiceOptimized = async (invoiceData: CreateInvoiceData): Promise<Invoice> => {
  try {
    // Validate invoice data before creation
    if (!invoiceData.customerId) {
      throw new Error('Customer ID is required');
    }
    if (!invoiceData.vehicleId) {
      throw new Error('Vehicle ID is required');
    }
    if (!invoiceData.items || invoiceData.items.length === 0) {
      throw new Error('At least one item is required');
    }

    // Check for zero amount invoice
    const totalAmount = invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    if (totalAmount === 0) {
      throw new Error('Cannot create invoice with zero total amount. Please check item prices.');
    }

    const invoiceId = crypto.randomUUID();
    console.log('Creating optimized invoice:', invoiceId, 'with total amount:', totalAmount);

    // Single transaction for invoice and items
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
        status: invoiceData.status || 'open'
      })
      .select('*, organization_id')
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      throw new Error(`Failed to create invoice: ${invoiceError.message}`);
    }

    // Batch insert items if any exist
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
        is_auto_added: item.is_auto_added || false,
        unit_of_measure: item.unit_of_measure || 'piece',
        creates_inventory_part: item.creates_inventory_part || false,
        creates_task: item.creates_task || false,
        custom_part_data: item.custom_part_data || null,
        custom_labor_data: item.custom_labor_data || null,
        organization_id: invoice.organization_id
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Error creating invoice items:', itemsError);
        throw new Error(`Failed to create invoice items: ${itemsError.message}`);
      }

      // Process updates in batches
      await processItemUpdatesOptimized(invoiceData.items, invoiceId, invoice.organization_id);
    }

    // Batch insert payments if any exist
    const paymentsToReturn: Payment[] = [];
    if (invoiceData.payments && invoiceData.payments.length > 0) {
      const paymentsToInsert = invoiceData.payments.map(payment => ({
        id: crypto.randomUUID(),
        invoice_id: invoiceId,
        amount: payment.amount,
        method: payment.method,
        date: payment.date,
        notes: payment.notes || null,
        organization_id: invoice.organization_id
      }));

      const { data: insertedPayments, error: paymentsError } = await supabase
        .from('payments')
        .insert(paymentsToInsert)
        .select('*');

      if (paymentsError) {
        console.error('Error creating payments:', paymentsError);
        throw new Error(`Failed to create payments: ${paymentsError.message}`);
      }

      paymentsToReturn.push(...(insertedPayments || []));
    }

    return {
      ...invoice,
      items: invoiceData.items,
      payments: paymentsToReturn
    } as Invoice;

  } catch (error) {
    console.error('Error in createInvoiceOptimized:', error);
    throw error;
  }
};

// Optimized invoice update with smart item diffing
export const updateInvoiceOptimized = async (invoiceData: Invoice): Promise<Invoice> => {
  try {
    const { id, customer_id, vehicle_id, date, tax_rate, discount_type, discount_value, notes, status, items, payments } = invoiceData as Invoice & { payments?: Payment[] };
    console.log('Starting optimized invoice update:', id);

    // Update invoice record
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
      .select('*, organization_id')
      .single();

    if (invoiceError) {
      console.error('Error updating invoice:', invoiceError);
      throw new Error(`Failed to update invoice: ${invoiceError.message}`);
    }

    if (items) {
      // Get existing items for cleanup and diffing
      const { data: existingItems } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('invoice_id', id);

      // Clean up old assignments in batch
      if (existingItems) {
        await cleanupOldAssignmentsBatch(existingItems, id);
      }

      // Use smart update for items
      const { smartUpdateInvoiceItems } = await import('./smart-invoice-service');
      await smartUpdateInvoiceItems(id, items, invoiceResult.organization_id);

      // Process new assignments in batch
      await processItemUpdatesOptimized(items, id, invoiceResult.organization_id);
    }

    // Persist payments (replace the invoice's payment rows with the current list)
    let savedPayments: Payment[] = [];
    if (payments) {
      const { paymentService } = await import('./payment-service');
      savedPayments = await paymentService.replaceInvoicePayments(
        id,
        payments.map(payment => ({
          amount: Number(payment.amount),
          method: payment.method,
          date: payment.date,
          notes: payment.notes || undefined,
          organization_id: invoiceResult.organization_id
        }))
      );
    }

    console.log('Optimized invoice update completed');

    return {
      ...invoiceResult,
      items: items || [],
      payments: savedPayments
    } as Invoice;


  } catch (error) {
    console.error('Error in updateInvoiceOptimized:', error);
    throw error;
  }
};

// Process item updates using batch operations
const processItemUpdatesOptimized = async (items: InvoiceItem[], invoiceId: string, organizationId: string) => {
  console.log('Processing item updates optimized:', items.length);

  // Separate different types of operations
  const partUpdates: BatchPartUpdate[] = [];
  const taskUpdates: BatchTaskUpdate[] = [];
  const customPartCreations: any[] = [];
  const customTaskCreations: any[] = [];

  items.forEach(item => {
    if (item.type === 'part') {
      if (item.creates_inventory_part && item.custom_part_data) {
        customPartCreations.push({
          id: crypto.randomUUID(),
          name: item.description,
          description: item.description,
          price: item.price,
          quantity: 0,
          part_number: item.custom_part_data.part_number,
          manufacturer: item.custom_part_data.manufacturer,
          category: item.custom_part_data.category,
          location: item.custom_part_data.location,
          unit: item.unit_of_measure || 'piece',
          invoice_ids: [invoiceId],
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else if (item.part_id) {
        partUpdates.push({
          partId: item.part_id,
          quantity: item.quantity,
          operation: 'add',
          invoiceId
        });
      }
    } else if (item.type === 'labor' && item.task_id) {
      // Existing task selected on the line: just link it and refresh the price
      taskUpdates.push({
        taskId: item.task_id,
        invoiceId,
        price: item.price
      });
    }
  });


  // Execute all operations in parallel
  const operations = [];

  if (customPartCreations.length > 0) {
    operations.push(
      supabase.from('parts').insert(customPartCreations)
    );
  }

  if (customTaskCreations.length > 0) {
    // kept for compatibility; labor tasks are synced by syncLaborTasks below
    operations.push(
      supabase.from('tasks').insert(customTaskCreations)
    );
  }


  if (partUpdates.length > 0) {
    operations.push(
      batchUpdateParts(partUpdates, organizationId)
    );
  }

  if (taskUpdates.length > 0) {
    operations.push(
      batchUpdateTasks(taskUpdates)
    );
  }

  if (operations.length > 0) {
    await Promise.all(operations);
  }

  // Labor lines are always recorded as tasks, created exactly once per line
  await syncLaborTasks(items, invoiceId, organizationId);

  console.log('Item updates completed optimized');
};

/**
 * Ensures every custom labor line on the invoice has exactly one task row.
 * Uses the persisted invoice_items.task_id as the idempotency key, so repeated
 * saves update the existing task instead of inserting duplicates.
 */
const syncLaborTasks = async (items: InvoiceItem[], invoiceId: string, organizationId: string) => {
  const laborItems = items.filter(item => item.type === 'labor' && !item.task_id);
  if (laborItems.length === 0) return;

  const { data: rows, error } = await supabase
    .from('invoice_items')
    .select('id, description, type, task_id')
    .eq('invoice_id', invoiceId)
    .eq('type', 'labor');

  if (error) {
    console.error('syncLaborTasks: failed to load invoice items:', error);
    return;
  }

  const used = new Set<string>();

  for (const item of laborItems) {
    const row = (rows || []).find(
      r => !used.has(r.id) && r.description === item.description
    );
    if (row) used.add(row.id);

    const labor = item.custom_labor_data;
    const status = labor?.status ?? 'completed';
    const hoursEstimated = labor?.hours_estimated ?? item.quantity;
    // Hours spent is only set when explicitly entered on the invoice line; otherwise
    // it falls back to the estimate so reports still have a value, and manual
    // check-in/out tracking on the Tasks page is preserved on later saves.
    const hoursSpent = labor?.hours_spent;

    const taskPayload: Record<string, any> = {
      title: item.description,
      description: item.description,
      status,
      location: 'workshop',
      hours_estimated: hoursEstimated,
      price: item.price * item.quantity,
      mechanic_id: labor?.mechanic_id ?? null,
      labor_rate: labor?.labor_rate ?? null,
      billing_type: labor?.billing_type ?? 'hourly',
      skill_level: labor?.skill_level ?? null,
      invoice_id: invoiceId,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    if (row?.task_id) {
      const updatePayload = { ...taskPayload };
      if (hoursSpent !== undefined) updatePayload.hours_spent = hoursSpent;
      // Don't overwrite hours logged via check-in/out when left blank on the invoice

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updatePayload as any)
        .eq('id', row.task_id);

      if (updateError) console.error('syncLaborTasks: failed to update task:', updateError);
      continue;
    }

    taskPayload.hours_spent = hoursSpent ?? hoursEstimated;

    const newTaskId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from('tasks')
      .insert({
        id: newTaskId,
        ...taskPayload,
        organization_id: organizationId,
        created_at: new Date().toISOString()
      } as any);

    if (insertError) {
      console.error('syncLaborTasks: failed to create task:', insertError);
      continue;
    }

    if (row) {
      const { error: linkError } = await supabase
        .from('invoice_items')
        .update({ task_id: newTaskId, creates_task: true })
        .eq('id', row.id);

      if (linkError) console.error('syncLaborTasks: failed to link task to item:', linkError);
    }
  }
};


// Batch cleanup of old part assignments
const cleanupOldAssignmentsBatch = async (existingItems: any[], invoiceId: string) => {
  console.log('Cleaning up old assignments in batch:', existingItems.length);

  const partUpdates: BatchPartUpdate[] = [];

  existingItems.forEach(item => {
    if (item.type === 'part' && item.part_id) {
      partUpdates.push({
        partId: item.part_id,
        quantity: item.quantity,
        operation: 'remove',
        invoiceId
      });
    }
  });

  if (partUpdates.length > 0) {
    // Get organization ID from the first item (they should all be the same)
    const organizationId = existingItems[0]?.organization_id || '';
    await batchUpdateParts(partUpdates, organizationId);
  }

  console.log('Old assignments cleanup completed');
};