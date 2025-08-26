
import { supabase } from "@/integrations/supabase/client";
import { InvoiceItem, Part, Task } from "@/types";
import { toast } from "sonner";

/**
 * Service to handle bidirectional sync between invoice items and inventory/tasks
 */

// Helper function to handle errors
const handleError = (error: any, action: string) => {
  console.error(`Error ${action}:`, error);
  throw error;
};

/**
 * Sync invoice item changes back to parts inventory
 */
export const syncInvoiceItemToPart = async (item: InvoiceItem, invoiceId: string) => {
  if (item.type !== 'part' || !item.part_id) { // Changed from 'parts' to 'part'
    return;
  }

  try {
    // Get current part data
    const { data: part, error: fetchError } = await supabase
      .from('parts')
      .select('*')
      .eq('id', item.part_id)
      .single();

    if (fetchError) throw fetchError;
    if (!part) return;

    // Update part quantity (reduce by invoice item quantity)
    const newQuantity = Math.max(0, part.quantity - item.quantity);
    
    // Update invoice_ids array to include this invoice
    const currentInvoiceIds = part.invoice_ids || [];
    const updatedInvoiceIds = currentInvoiceIds.includes(invoiceId) 
      ? currentInvoiceIds 
      : [...currentInvoiceIds, invoiceId];

    const { error: updateError } = await supabase
      .from('parts')
      .update({
        quantity: newQuantity,
        invoice_ids: updatedInvoiceIds,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.part_id);

    if (updateError) throw updateError;
    
    console.log(`Part ${part.name} synced: quantity updated from ${part.quantity} to ${newQuantity}`);
  } catch (error) {
    handleError(error, 'syncing invoice item to part');
  }
};

/**
 * Sync invoice item changes back to task records
 */
export const syncInvoiceItemToTask = async (item: InvoiceItem, invoiceId: string, vehicleId?: string) => {
  if (item.type !== 'labor' || !item.task_id) {
    return;
  }

  try {
    // Update the task with invoice reference
    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        invoice_id: invoiceId,
        price: item.price,
        hours_estimated: item.quantity, // quantity represents hours for labor items
        updated_at: new Date().toISOString()
      })
      .eq('id', item.task_id);

    if (updateError) throw updateError;
    
    console.log(`Task ${item.task_id} synced with invoice ${invoiceId}`);
  } catch (error) {
    handleError(error, 'syncing invoice item to task');
  }
};

/**
 * Create a new task from a manual labor invoice item
 */
export const createTaskFromInvoiceItem = async (
  item: InvoiceItem, 
  invoiceId: string, 
  vehicleId: string,
  customerId: string
): Promise<string | null> => {
  if (item.type !== 'labor' || item.task_id) {
    return null; // Skip if not labor or already has task_id
  }

  try {
    // Create new task
    const taskData = {
      title: item.description,
      description: `Auto-created from invoice item: ${item.description}`,
      status: 'completed', // Since it's being invoiced, it's completed
      
      price: item.price,
      hours_estimated: item.quantity,
      hours_spent: item.quantity, // Assume estimated equals spent for completed tasks
      vehicle_id: vehicleId,
      invoice_id: invoiceId,
      mechanic_id: null // Will be assigned later by manager/foreman
    };

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;
    
    console.log(`Created new task ${task.id} from invoice item`);
    return task.id;
  } catch (error) {
    handleError(error, 'creating task from invoice item');
    return null;
  }
};

/**
 * Create a new part record from a manual parts invoice item
 */
export const createPartFromInvoiceItem = async (
  item: InvoiceItem, 
  invoiceId: string
): Promise<string | null> => {
  if (item.type !== 'part' || item.part_id) { // Changed from 'parts' to 'part'
    return null; // Skip if not parts or already has part_id
  }

  try {
    // Create new part record
    const partData = {
      name: item.description,
      description: `Auto-created from invoice item: ${item.description}`,
      price: item.price,
      quantity: 0, // Start with 0 since it's being used immediately
      part_number: null,
      vendor_id: null,
      vendor_name: null,
      invoice_ids: [invoiceId],
      reorder_level: 5
    };

    const { data: part, error } = await supabase
      .from('parts')
      .insert([partData])
      .select()
      .single();

    if (error) throw error;
    
    console.log(`Created new part ${part.id} from invoice item`);
    return part.id;
  } catch (error) {
    handleError(error, 'creating part from invoice item');
    return null;
  }
};

/**
 * Handle reverse sync when parts inventory is updated
 */
export const syncPartToInvoiceItems = async (partId: string, newQuantity: number) => {
  try {
    // Find all invoice items that reference this part
    const { data: invoiceItems, error } = await supabase
      .from('invoice_items')
      .select('*, invoices!inner(status)')
      .eq('part_id', partId)
      .eq('type', 'part'); // Changed from 'parts' to 'part'

    if (error) throw error;

    // Update invoice items if needed (for open/in-progress invoices only)
    for (const item of invoiceItems || []) {
      const invoice = (item as any).invoices;
      if (invoice.status === 'open' || invoice.status === 'in-progress') {
        // Could implement logic here to adjust invoice item quantities
        // based on part availability, but for now we'll just log
        console.log(`Part ${partId} quantity changed - may affect invoice item ${item.id}`);
      }
    }
  } catch (error) {
    handleError(error, 'syncing part changes to invoice items');
  }
};

/**
 * Handle reverse sync when task is updated
 */
export const syncTaskToInvoiceItems = async (taskId: string, updatedTask: Partial<Task>) => {
  try {
    // Find all invoice items that reference this task
    const { data: invoiceItems, error } = await supabase
      .from('invoice_items')
      .select('*, invoices!inner(status)')
      .eq('task_id', taskId)
      .eq('type', 'labor');

    if (error) throw error;

    // Update invoice items if needed (for open/in-progress invoices only)
    for (const item of invoiceItems || []) {
      const invoice = (item as any).invoices;
      if (invoice.status === 'open' || invoice.status === 'in-progress') {
        // Update invoice item with task changes
        const updates: any = {};
        if (updatedTask.price !== undefined) updates.price = updatedTask.price;
        if (updatedTask.hoursEstimated !== undefined) updates.quantity = updatedTask.hoursEstimated;

        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('invoice_items')
            .update(updates)
            .eq('id', item.id);

          if (updateError) throw updateError;
          console.log(`Updated invoice item ${item.id} from task ${taskId} changes`);
        }
      }
    }
  } catch (error) {
    handleError(error, 'syncing task changes to invoice items');
  }
};

/**
 * Assign mechanic to task created from invoice item
 */
export const assignMechanicToInvoiceTask = async (taskId: string, mechanicId: string) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .update({
        mechanic_id: mechanicId,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (error) throw error;
    
    console.log(`Assigned mechanic ${mechanicId} to task ${taskId}`);
  } catch (error) {
    console.error(`Error assigning mechanic to task:`, error);
    throw error;
  }
};
