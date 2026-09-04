import { supabase } from '@/integrations/supabase/client';
import { Invoice, InvoiceItem, Part, Task, Payment, InvoiceStatus } from '@/types';

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

/** Estimates (and declined estimates) never move stock or create purchase expenses. */
const isNonStockStatus = (status?: string | null) =>
  status === 'estimate' || status === 'declined';

/** Quantity of each inventory part consumed by the given lines. */
const countPartQuantities = (items: { type?: string; part_id?: string | null; quantity?: number }[]) => {
  const counts = new Map<string, number>();
  (items || []).forEach(item => {
    if (item.type === 'part' && item.part_id) {
      counts.set(item.part_id, (counts.get(item.part_id) || 0) + (item.quantity || 0));
    }
  });
  return counts;
};

/**
 * Applies the *net* stock movement between what the invoice previously consumed
 * and what it consumes now. Never restores-then-deducts, so a failure part way
 * through a save cannot double count inventory.
 */
const applyInventoryChanges = async (
  before: Map<string, number>,
  after: Map<string, number>,
  invoiceId: string
) => {
  const partIds = new Set<string>([...before.keys(), ...after.keys()]);
  if (partIds.size === 0) return;

  for (const partId of partIds) {
    const previous = before.get(partId) || 0;
    const current = after.get(partId) || 0;
    const delta = previous - current; // positive: give stock back

    const { data: part, error } = await supabase
      .from('parts')
      .select('quantity, invoice_ids')
      .eq('id', partId)
      .maybeSingle();

    if (error) throw new Error(`Failed to read part for stock update: ${error.message}`);
    if (!part) continue;

    const invoiceIds: string[] = part.invoice_ids || [];
    const nextInvoiceIds = current > 0
      ? [...new Set([...invoiceIds, invoiceId])]
      : invoiceIds.filter(id => id !== invoiceId);

    if (delta === 0 && nextInvoiceIds.length === invoiceIds.length) continue;

    const { error: updateError } = await supabase
      .from('parts')
      .update({
        quantity: Math.max(0, (part.quantity || 0) + delta),
        invoice_ids: nextInvoiceIds,
        updated_at: new Date().toISOString()
      })
      .eq('id', partId);

    if (updateError) throw new Error(`Failed to update part stock: ${updateError.message}`);
  }
};

/**
 * Creates the inventory part (and the vendor purchase expense) for custom
 * part/other lines, exactly once, at save time. The created part id is written
 * back onto the line so a second save updates instead of duplicating.
 * Returns the lines with part_id resolved.
 */
const ensureInventoryParts = async (
  items: InvoiceItem[],
  invoiceId: string,
  organizationId: string,
  createExpenses: boolean
): Promise<InvoiceItem[]> => {
  const resolved: InvoiceItem[] = [];

  for (const item of items) {
    const needsPart =
      (item.type === 'part' || item.type === 'other') &&
      !item.part_id &&
      item.creates_inventory_part;

    if (!needsPart) {
      resolved.push(item);
      continue;
    }

    const name = (item.description || '').trim();
    const custom = (item.custom_part_data || {}) as Record<string, any>;

    // Reuse an existing inventory part with the same name (and part number when given)
    let query = supabase
      .from('parts')
      .select('id')
      .eq('organization_id', organizationId)
      .ilike('name', name);

    if (custom.part_number) query = query.eq('part_number', custom.part_number);

    const { data: existingPart } = await query.limit(1).maybeSingle();

    if (existingPart?.id) {
      resolved.push({ ...item, part_id: existingPart.id });
      continue;
    }

    const newPartId = crypto.randomUUID();
    const { error: partError } = await supabase
      .from('parts')
      .insert({
        id: newPartId,
        name,
        description: name,
        price: item.price,
        cost: item.cost || 0,
        // Stocked at the consumed quantity, so the stock movement below nets to zero
        quantity: item.quantity,
        part_number: custom.part_number || null,
        manufacturer: custom.manufacturer || null,
        category: item.type === 'other' ? 'other' : (custom.category || null),
        location: custom.location || null,
        vendor_id: custom.vendor_id || null,
        vendor_name: custom.vendor_name || null,
        unit: item.unit_of_measure || 'piece',
        reorder_level: 5,
        invoice_ids: [invoiceId],
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as any);

    if (partError) {
      throw new Error(`Failed to create inventory part "${name}": ${partError.message}`);
    }

    if (createExpenses && custom.vendor_id && (item.cost || 0) > 0) {
      const { error: expenseError } = await supabase
        .from('expenses')
        .insert({
          id: crypto.randomUUID(),
          category: 'parts',
          description: `Invoice ${invoiceId.substring(0, 8)}: ${name}`,
          amount: (item.cost || 0) * item.quantity,
          date: new Date().toISOString(),
          vendor_id: custom.vendor_id,
          vendor_name: custom.vendor_name || null,
          payment_method: 'cash',
          payment_status: 'unpaid',
          invoice_id: invoiceId,
          organization_id: organizationId
        } as any);

      if (expenseError) {
        throw new Error(`Failed to record purchase expense for "${name}": ${expenseError.message}`);
      }
    }

    resolved.push({ ...item, part_id: newPartId });
  }

  return resolved;
};

const buildItemRow = (item: InvoiceItem, invoiceId: string, organizationId: string) => ({
  id: crypto.randomUUID(),
  invoice_id: invoiceId,
  organization_id: organizationId,
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

// Optimized invoice creation with minimal database calls
export const createInvoiceOptimized = async (invoiceData: CreateInvoiceData): Promise<Invoice> => {
  if (!invoiceData.customerId) throw new Error('Customer ID is required');
  if (!invoiceData.vehicleId) throw new Error('Vehicle ID is required');
  if (!invoiceData.items || invoiceData.items.length === 0) {
    throw new Error('At least one item is required');
  }

  const totalAmount = invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  if (totalAmount === 0) {
    throw new Error('Cannot create invoice with zero total amount. Please check item prices.');
  }

  const invoiceId = crypto.randomUUID();
  const status = invoiceData.status || 'open';
  console.log('Creating optimized invoice:', invoiceId, 'with total amount:', totalAmount);

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
      status
    })
    .select('*, organization_id')
    .single();

  if (invoiceError) {
    console.error('Error creating invoice:', invoiceError);
    throw new Error(`Failed to create invoice: ${invoiceError.message}`);
  }

  try {
    const stockStatus = isNonStockStatus(status);

    // Resolve custom parts first so every line is saved with its part_id
    const resolvedItems = await ensureInventoryParts(
      invoiceData.items,
      invoiceId,
      invoice.organization_id,
      !stockStatus
    );

    const itemRows = resolvedItems.map(item => buildItemRow(item, invoiceId, invoice.organization_id));

    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(itemRows as any);

    if (itemsError) {
      throw new Error(`Failed to create invoice items: ${itemsError.message}`);
    }

    const savedItems: InvoiceItem[] = resolvedItems.map((item, index) => ({
      ...item,
      id: itemRows[index].id
    }));

    if (!stockStatus) {
      await applyInventoryChanges(new Map(), countPartQuantities(savedItems), invoiceId);
    }

    await linkSelectedTasks(savedItems, invoiceId);
    await syncLaborTasks(savedItems, invoiceId, invoice.organization_id);

    // Payments
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
        throw new Error(`Failed to create payments: ${paymentsError.message}`);
      }

      paymentsToReturn.push(...(insertedPayments || []));
    }

    return {
      ...invoice,
      items: savedItems,
      payments: paymentsToReturn
    } as Invoice;
  } catch (error) {
    // Never leave an empty invoice behind when the line items could not be saved
    console.error('Invoice creation failed after the invoice row was inserted, rolling back:', error);
    await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
    await supabase.from('invoices').delete().eq('id', invoiceId);
    throw error;
  }
};

// Optimized invoice update with smart item diffing
export const updateInvoiceOptimized = async (invoiceData: Invoice): Promise<Invoice> => {
  const { id, customer_id, vehicle_id, date, tax_rate, discount_type, discount_value, notes, status, items, payments } =
    invoiceData as Invoice & { payments?: Payment[] };
  console.log('Starting optimized invoice update:', id);

  const { data: previous, error: previousError } = await supabase
    .from('invoices')
    .select('status, organization_id')
    .eq('id', id)
    .single();

  if (previousError) {
    throw new Error(`Failed to load invoice: ${previousError.message}`);
  }

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

  let savedItems: InvoiceItem[] = items || [];

  if (items) {
    const { data: existingItems, error: existingError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', id);

    if (existingError) {
      throw new Error(`Failed to load existing invoice items: ${existingError.message}`);
    }

    const wasNonStock = isNonStockStatus(previous.status);
    const isNonStock = isNonStockStatus(status);

    const resolvedItems = await ensureInventoryParts(
      items,
      id,
      invoiceResult.organization_id,
      !isNonStock
    );

    const { smartUpdateInvoiceItems } = await import('./smart-invoice-service');
    const result = await smartUpdateInvoiceItems(id, resolvedItems, invoiceResult.organization_id);
    savedItems = result.savedItems;

    // Net stock movement only; an estimate consumed nothing before conversion
    await applyInventoryChanges(
      wasNonStock ? new Map() : countPartQuantities(existingItems || []),
      isNonStock ? new Map() : countPartQuantities(savedItems),
      id
    );

    await linkSelectedTasks(savedItems, id);
    await syncLaborTasks(savedItems, id, invoiceResult.organization_id);
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
    items: savedItems,
    payments: savedPayments
  } as Invoice;
};

/** Links workshop tasks that were picked on a labor line to this invoice. */
const linkSelectedTasks = async (items: InvoiceItem[], invoiceId: string) => {
  const taskLines = items.filter(item => item.type === 'labor' && item.task_id);
  for (const item of taskLines) {
    const { error } = await supabase
      .from('tasks')
      .update({
        invoice_id: invoiceId,
        price: item.price,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.task_id as string);

    if (error) throw new Error(`Failed to link task to invoice: ${error.message}`);
  }
};

/**
 * Ensures every custom labor line on the invoice has exactly one task row.
 * Uses the persisted invoice_items row id / task_id as the idempotency key, so
 * repeated saves update the existing task instead of inserting duplicates.
 */
const syncLaborTasks = async (items: InvoiceItem[], invoiceId: string, organizationId: string) => {
  const laborItems = items.filter(item => item.type === 'labor' && !item.task_id);
  if (laborItems.length === 0) return;

  for (const item of laborItems) {
    const linkedTaskId = (item as any).linked_task_id as string | undefined;
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

    if (linkedTaskId) {
      const updatePayload = { ...taskPayload };
      if (hoursSpent !== undefined) updatePayload.hours_spent = hoursSpent;

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updatePayload as any)
        .eq('id', linkedTaskId);

      if (updateError) throw new Error(`Failed to update task: ${updateError.message}`);
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

    if (insertError) throw new Error(`Failed to create task: ${insertError.message}`);

    if (item.id) {
      const { error: linkError } = await supabase
        .from('invoice_items')
        .update({ task_id: newTaskId, creates_task: true })
        .eq('id', item.id);

      if (linkError) throw new Error(`Failed to link task to invoice line: ${linkError.message}`);
    }
  }
};

/**
 * Deletes an invoice (or estimate) and undoes only the side effects it actually
 * created. Aborts with a real error instead of leaving a half-deleted document.
 *
 * Order matters: guard -> restore stock -> unlink tasks -> remove purchase
 * expenses -> delete line items -> delete payments -> delete the invoice.
 */
export const deleteInvoiceOptimized = async (invoiceId: string): Promise<void> => {
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id, status')
    .eq('id', invoiceId)
    .maybeSingle();

  if (invoiceError) throw new Error(`Failed to load invoice: ${invoiceError.message}`);
  if (!invoice) throw new Error('Invoice not found');

  const { data: payments, error: paymentsReadError } = await supabase
    .from('payments')
    .select('id')
    .eq('invoice_id', invoiceId);

  if (paymentsReadError) throw new Error(`Failed to check payments: ${paymentsReadError.message}`);
  if (payments && payments.length > 0) {
    throw new Error(
      'This invoice has payments recorded. Remove the payments first, then delete the invoice.'
    );
  }

  const { data: items, error: itemsReadError } = await supabase
    .from('invoice_items')
    .select('id, type, part_id, quantity')
    .eq('invoice_id', invoiceId);

  if (itemsReadError) throw new Error(`Failed to load invoice items: ${itemsReadError.message}`);

  // Estimates and declined estimates never consumed stock, so nothing to give back.
  if (!isNonStockStatus(invoice.status)) {
    const consumed = countPartQuantities(items || []);
    await applyInventoryChanges(consumed, new Map(), invoiceId);
  }

  // Work orders survive the invoice; they just lose the link.
  const { error: taskError } = await supabase
    .from('tasks')
    .update({ invoice_id: null, updated_at: new Date().toISOString() })
    .eq('invoice_id', invoiceId);

  if (taskError) throw new Error(`Failed to unlink work orders: ${taskError.message}`);

  // Purchase expenses this invoice created have no source document any more.
  const { error: expenseError } = await supabase
    .from('expenses')
    .delete()
    .eq('invoice_id', invoiceId);

  if (expenseError) throw new Error(`Failed to remove purchase expenses: ${expenseError.message}`);

  const { error: deleteItemsError } = await supabase
    .from('invoice_items')
    .delete()
    .eq('invoice_id', invoiceId);

  if (deleteItemsError) throw new Error(`Failed to remove invoice items: ${deleteItemsError.message}`);

  const { error: deleteInvoiceError } = await supabase
    .from('invoices')
    .delete()
    .eq('id', invoiceId);

  if (deleteInvoiceError) throw new Error(`Failed to delete invoice: ${deleteInvoiceError.message}`);
};
