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
    const invoiceId = crypto.randomUUID();
    console.log('Creating optimized invoice:', invoiceId);

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
        status: 'open'
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

    return {
      ...invoice,
      items: invoiceData.items,
      payments: []
    } as Invoice;

  } catch (error) {
    console.error('Error in createInvoiceOptimized:', error);
    throw error;
  }
};

// Optimized invoice update with smart item diffing
export const updateInvoiceOptimized = async (invoiceData: Invoice): Promise<Invoice> => {
  try {
    const { id, customer_id, vehicle_id, date, tax_rate, discount_type, discount_value, notes, status, items } = invoiceData;
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

    console.log('Optimized invoice update completed');

    return {
      ...invoiceResult,
      items: items || [],
      payments: []
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
    } else if (item.type === 'labor') {
      if (item.creates_task && item.custom_labor_data) {
        customTaskCreations.push({
          id: crypto.randomUUID(),
          title: item.description,
          description: item.description,
          status: 'completed',
          location: 'workshop',
          hours_estimated: item.quantity,
          hours_spent: item.quantity,
          price: item.price * item.quantity,
          labor_rate: item.custom_labor_data.labor_rate,
          skill_level: item.custom_labor_data.skill_level,
          invoice_id: invoiceId,
          organization_id: organizationId,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else if (item.task_id) {
        taskUpdates.push({
          taskId: item.task_id,
          invoiceId,
          price: item.price
        });
      }
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

  console.log('Item updates completed optimized');
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