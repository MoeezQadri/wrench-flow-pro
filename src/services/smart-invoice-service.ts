import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceItem } from '@/types';

export interface InvoiceItemDiff {
  toAdd: InvoiceItem[];
  toUpdate: { existing: any; updated: InvoiceItem }[];
  toDelete: string[];
}

export const computeItemDiff = (existingItems: any[], newItems: InvoiceItem[]): InvoiceItemDiff => {
  const toAdd: InvoiceItem[] = [];
  const toUpdate: { existing: any; updated: InvoiceItem }[] = [];
  const toDelete: string[] = [];

  // Find items to add or update
  newItems.forEach(newItem => {
    const existing = existingItems.find(item => 
      (item.part_id && newItem.part_id && item.part_id === newItem.part_id) ||
      (item.task_id && newItem.task_id && item.task_id === newItem.task_id) ||
      (item.description === newItem.description && item.type === newItem.type)
    );

    if (existing) {
      // Check if update is needed
      if (existing.quantity !== newItem.quantity || 
          existing.price !== newItem.price || 
          existing.description !== newItem.description) {
        toUpdate.push({ existing, updated: newItem });
      }
    } else {
      toAdd.push(newItem);
    }
  });

  // Find items to delete
  existingItems.forEach(existing => {
    const stillExists = newItems.some(newItem =>
      (existing.part_id && newItem.part_id && existing.part_id === newItem.part_id) ||
      (existing.task_id && newItem.task_id && existing.task_id === newItem.task_id) ||
      (existing.description === newItem.description && existing.type === newItem.type)
    );

    if (!stillExists) {
      toDelete.push(existing.id);
    }
  });

  return { toAdd, toUpdate, toDelete };
};

export const smartUpdateInvoiceItems = async (invoiceId: string, newItems: InvoiceItem[], organizationId: string) => {
  console.log('Starting smart update for invoice items:', invoiceId);

  // Get existing items
  const { data: existingItems, error: fetchError } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId);

  if (fetchError) {
    throw new Error(`Failed to fetch existing items: ${fetchError.message}`);
  }

  const diff = computeItemDiff(existingItems || [], newItems);
  console.log('Item diff computed:', diff);

  // Delete items
  if (diff.toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .in('id', diff.toDelete);

    if (deleteError) {
      throw new Error(`Failed to delete items: ${deleteError.message}`);
    }
    console.log('Deleted items:', diff.toDelete);
  }

  // Update items
  for (const { existing, updated } of diff.toUpdate) {
    const { error: updateError } = await supabase
      .from('invoice_items')
      .update({
        description: updated.description,
        quantity: updated.quantity,
        price: updated.price,
        type: updated.type,
        unit_of_measure: updated.unit_of_measure || 'piece'
      })
      .eq('id', existing.id);

    if (updateError) {
      throw new Error(`Failed to update item: ${updateError.message}`);
    }
  }
  console.log('Updated items:', diff.toUpdate.length);

  // Add new items
  if (diff.toAdd.length > 0) {
    const itemsToInsert = diff.toAdd.map(item => ({
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
      organization_id: organizationId
    }));

    const { error: insertError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert);

    if (insertError) {
      throw new Error(`Failed to insert new items: ${insertError.message}`);
    }
    console.log('Added new items:', diff.toAdd.length);
  }

  return diff;
};