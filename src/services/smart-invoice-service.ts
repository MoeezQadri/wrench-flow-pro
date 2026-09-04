import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceItem } from '@/types';

export interface InvoiceItemDiff {
  toAdd: InvoiceItem[];
  toUpdate: { existing: any; updated: InvoiceItem }[];
  toDelete: string[];
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Diffs the invoice's saved line items against the lines currently on the form.
 *
 * Identity is the persisted invoice_items.id whenever the line carries one, so
 * renaming a line updates the same row instead of deleting it and inserting a
 * duplicate, and two lines with the same description stay separate rows.
 * Part/task matching is only used as a fallback for lines that were never saved.
 */
export const computeItemDiff = (existingItems: any[], newItems: InvoiceItem[]): InvoiceItemDiff => {
  const toAdd: InvoiceItem[] = [];
  const toUpdate: { existing: any; updated: InvoiceItem }[] = [];
  const toDelete: string[] = [];

  const existingById = new Map<string, any>();
  (existingItems || []).forEach(item => existingById.set(item.id, item));

  const matchedExistingIds = new Set<string>();

  newItems.forEach(newItem => {
    let existing: any | undefined;

    // 1. Stable identity: the line already has a database row id
    if (newItem.id && UUID_RE.test(newItem.id) && existingById.has(newItem.id)) {
      existing = existingById.get(newItem.id);
    }

    // 2. Fallback for lines added on the form (temporary ids): link by part/task
    if (!existing) {
      existing = (existingItems || []).find(item =>
        !matchedExistingIds.has(item.id) &&
        ((item.part_id && newItem.part_id && item.part_id === newItem.part_id) ||
         (item.task_id && newItem.task_id && item.task_id === newItem.task_id))
      );
    }

    if (existing) {
      matchedExistingIds.add(existing.id);
      toUpdate.push({ existing, updated: newItem });
    } else {
      toAdd.push(newItem);
    }
  });

  // Anything that was not matched by a submitted line has been removed
  (existingItems || []).forEach(existing => {
    if (!matchedExistingIds.has(existing.id)) {
      toDelete.push(existing.id);
    }
  });

  return { toAdd, toUpdate, toDelete };
};

const buildItemPayload = (item: InvoiceItem) => ({
  description: item.description,
  type: item.type,
  quantity: item.quantity,
  price: item.price,
  cost: item.cost || 0,
  part_id: item.part_id || null,
  task_id: item.task_id || null,
  is_auto_added: item.is_auto_added || false,
  unit_of_measure: item.unit_of_measure || 'piece',
  creates_inventory_part: item.creates_inventory_part || false,
  creates_task: item.creates_task || false,
  custom_part_data: item.custom_part_data || null,
  custom_labor_data: item.custom_labor_data || null
});

export interface SmartUpdateResult extends InvoiceItemDiff {
  /** The invoice's line items as persisted, each carrying its database row id */
  savedItems: InvoiceItem[];
}

export const smartUpdateInvoiceItems = async (
  invoiceId: string,
  newItems: InvoiceItem[],
  organizationId: string
): Promise<SmartUpdateResult> => {
  console.log('Starting smart update for invoice items:', invoiceId);

  const { data: existingItems, error: fetchError } = await supabase
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId);

  if (fetchError) {
    throw new Error(`Failed to fetch existing items: ${fetchError.message}`);
  }

  const diff = computeItemDiff(existingItems || [], newItems);
  console.log('Item diff computed:', diff);

  const savedItems: InvoiceItem[] = [];

  // Delete removed lines
  if (diff.toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('invoice_items')
      .delete()
      .in('id', diff.toDelete);

    if (deleteError) {
      throw new Error(`Failed to delete items: ${deleteError.message}`);
    }
  }

  // Update matched lines with the full payload
  for (const { existing, updated } of diff.toUpdate) {
    const { error: updateError } = await supabase
      .from('invoice_items')
      .update(buildItemPayload(updated) as any)
      .eq('id', existing.id);

    if (updateError) {
      throw new Error(`Failed to update item "${updated.description}": ${updateError.message}`);
    }

    savedItems.push({ ...updated, id: existing.id });
  }

  // Insert brand new lines
  if (diff.toAdd.length > 0) {
    const itemsToInsert = diff.toAdd.map(item => ({
      id: crypto.randomUUID(),
      invoice_id: invoiceId,
      organization_id: organizationId,
      ...buildItemPayload(item)
    }));

    const { data: inserted, error: insertError } = await supabase
      .from('invoice_items')
      .insert(itemsToInsert as any)
      .select('id');

    if (insertError) {
      throw new Error(`Failed to insert new items: ${insertError.message}`);
    }

    diff.toAdd.forEach((item, index) => {
      savedItems.push({ ...item, id: itemsToInsert[index].id });
    });

    console.log('Added new items:', inserted?.length ?? diff.toAdd.length);
  }

  return { ...diff, savedItems };
};
