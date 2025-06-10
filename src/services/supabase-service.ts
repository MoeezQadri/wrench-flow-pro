import { supabase } from '@/integrations/supabase/client';
import { Customer, Vehicle, Invoice, Part, Task, InvoiceItem } from '@/types';
import { toast } from 'sonner';

export const createInvoiceWithAutoAssignment = async (invoiceData: {
  customerId: string;
  vehicleId: string;
  date: string;
  taxRate: number;
  discountType: string;
  discountValue: number;
  notes: string;
  items: InvoiceItem[];
}) => {
  try {
    const invoiceId = crypto.randomUUID();
    
    console.log('Creating invoice with data:', invoiceData);

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
      throw invoiceError;
    }

    console.log('Invoice created:', invoice);

    // Insert invoice items
    if (invoiceData.items && invoiceData.items.length > 0) {
      const itemsToInsert = invoiceData.items.map(item => ({
        id: crypto.randomUUID(),
        invoice_id: invoiceId,
        description: item.description,
        type: item.type, // All types should now be correct ('part', 'labor', 'other')
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
        throw itemsError;
      }

      // Update parts inventory and task assignments
      for (const item of invoiceData.items) {
        if (item.type === 'part' && item.part_id) {
          try {
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

              console.log(`Updating part ${part.name}: quantity ${part.quantity} -> ${newQuantity}`);

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
              }
            }
          } catch (error) {
            console.error('Error processing part inventory update:', error);
          }
        }

        if (item.type === 'labor' && item.task_id) {
          try {
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
            }
          } catch (error) {
            console.error('Error processing task update:', error);
          }
        }
      }
    }

    // Get assigned parts for this vehicle/customer
    const { data: assignedParts, error: partsError } = await supabase
      .from('parts')
      .select('*')
      .contains('invoice_ids', []);

    if (!partsError && assignedParts) {
      // Filter parts that are assigned to this customer's vehicles
      const relevantParts = assignedParts.filter(part => 
        part.vendor_id === invoiceData.customerId
      );

      for (const part of relevantParts) {
        if (!part.invoice_ids || !part.invoice_ids.includes(invoiceId)) {
          const autoItem = {
            id: crypto.randomUUID(),
            invoice_id: invoiceId,
            description: part.name,
            type: 'part', // Changed from 'parts' to 'part'
            quantity: 1,
            price: part.price,
            part_id: part.id,
            task_id: null,
            is_auto_added: true
          };

          const { error: autoItemError } = await supabase
            .from('invoice_items')
            .insert(autoItem);

          if (!autoItemError) {
            // Update part with invoice reference
            const updatedInvoiceIds = [...(part.invoice_ids || []), invoiceId];
            const { error: partUpdateError } = await supabase
              .from('parts')
              .update({
                invoice_ids: updatedInvoiceIds,
                quantity: Math.max(0, part.quantity - 1),
                updated_at: new Date().toISOString()
              })
              .eq('id', part.id);

            if (partUpdateError) {
              console.error('Error updating auto-assigned part:', partUpdateError);
            }
          }
        }
      }
    }

    // Get completed tasks for this vehicle
    const { data: completedTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('vehicle_id', invoiceData.vehicleId)
      .eq('status', 'completed')
      .is('invoice_id', null);

    if (!tasksError && completedTasks) {
      for (const task of completedTasks) {
        const autoItem = {
          id: crypto.randomUUID(),
          invoice_id: invoiceId,
          description: task.title,
          type: 'labor',
          quantity: task.hours_estimated || 1,
          price: task.price || 0,
          part_id: null,
          task_id: task.id,
          is_auto_added: true
        };

        const { error: autoItemError } = await supabase
          .from('invoice_items')
          .insert(autoItem);

        if (!autoItemError) {
          // Update task with invoice reference
          const { error: taskUpdateError } = await supabase
            .from('tasks')
            .update({
              invoice_id: invoiceId,
              updated_at: new Date().toISOString()
            })
            .eq('id', task.id);

          if (taskUpdateError) {
            console.error('Error updating auto-assigned task:', taskUpdateError);
          }
        }
      }
    }

    console.log('Invoice creation completed successfully');
    return invoice;
  } catch (error) {
    console.error('Error in createInvoiceWithAutoAssignment:', error);
    toast.error('Failed to create invoice');
    throw error;
  }
};

export const addCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer | null> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();

    if (error) {
      console.error('Error adding customer:', error);
      return null;
    }

    return data as Customer;
  } catch (error) {
    console.error('Error adding customer:', error);
    return null;
  }
};

export const addVehicle = async (vehicleData: Omit<Vehicle, 'id' | 'created_at' | 'updated_at'>): Promise<Vehicle | null> => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicleData)
      .select()
      .single();

    if (error) {
      console.error('Error adding vehicle:', error);
      return null;
    }

    return data as Vehicle;
  } catch (error) {
    console.error('Error adding vehicle:', error);
    return null;
  }
};

export const fetchCustomerById = async (id: string): Promise<Customer | null> => {
    try {
        const { data, error } = await supabase
            .from('customers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching customer:', error);
            return null;
        }

        return data || null;
    } catch (error) {
        console.error('Error fetching customer:', error);
        return null;
    }
};

export const fetchVehicleById = async (id: string): Promise<Vehicle | null> => {
    try {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching vehicle:', error);
            return null;
        }

        return data || null;
    } catch (error) {
        console.error('Error fetching vehicle:', error);
        return null;
    }
};

export const fetchInvoiceById = async (id: string): Promise<Invoice | null> => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching invoice:', error);
            return null;
        }

        return data as Invoice || null;
    } catch (error) {
        console.error('Error fetching invoice:', error);
        return null;
    }
};

export const fetchPartById = async (id: string): Promise<Part | null> => {
    try {
        const { data, error } = await supabase
            .from('parts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching part:', error);
            return null;
        }

        return data || null;
    } catch (error) {
        console.error('Error fetching part:', error);
        return null;
    }
};

export const fetchTaskById = async (id: string): Promise<Task | null> => {
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching task:', error);
            return null;
        }

        // Map database fields to TypeScript interface
        if (data) {
            return {
                ...data,
                hoursEstimated: data.hours_estimated,
                hoursSpent: data.hours_spent,
                mechanicId: data.mechanic_id,
                vehicleId: data.vehicle_id,
                startTime: data.start_time,
                endTime: data.end_time,
                completedBy: data.completed_by,
                completedAt: data.completed_at,
                invoiceId: data.invoice_id
            } as Task;
        }

        return null;
    } catch (error) {
        console.error('Error fetching task:', error);
        return null;
    }
};

export const getCustomerAnalytics = async (customerId: string): Promise<{ totalInvoices: number; lifetimeValue: number }> => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('id')
            .eq('customer_id', customerId);

        if (error) {
            console.error('Error fetching invoices for analytics:', error);
            return { totalInvoices: 0, lifetimeValue: 0 };
        }

        const totalInvoices = data ? data.length : 0;
        // Note: Removed 'total' field access since it doesn't exist in the database
        const lifetimeValue = 0; // This would need to be calculated from invoice_items

        return { totalInvoices, lifetimeValue };
    } catch (error) {
        console.error('Error calculating customer analytics:', error);
        return { totalInvoices: 0, lifetimeValue: 0 };
    }
};

export const getVehiclesByCustomerId = async (customerId: string): Promise<Vehicle[]> => {
    try {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('customer_id', customerId);

        if (error) {
            console.error('Error fetching vehicles:', error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error('Error fetching vehicles:', error);
        return [];
    }
};

export const getInvoicesByCustomerId = async (customerId: string): Promise<Invoice[]> => {
    try {
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('customer_id', customerId);

        if (error) {
            console.error('Error fetching invoices:', error);
            return [];
        }

        return (data || []).map(invoice => ({
            ...invoice,
            status: invoice.status as any // Type assertion for status
        })) as Invoice[];
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return [];
    }
};

export const getPartsByInvoiceId = async (invoiceId: string): Promise<Part[]> => {
    try {
        const { data, error } = await supabase
            .from('invoice_items')
            .select('*, parts(*)')
            .eq('invoice_id', invoiceId)
            .eq('type', 'part'); // Changed from 'parts' to 'part'

        if (error) {
            console.error('Error fetching parts for invoice:', error);
            return [];
        }

        // Extract part data from invoice items
        const parts = data?.map(item => (item.parts ? { ...item.parts, quantity: item.quantity } : null)).filter(Boolean) as Part[];
        return parts || [];
    } catch (error) {
        console.error('Error fetching parts for invoice:', error);
        return [];
    }
};

export const getTasksByInvoiceId = async (invoiceId: string): Promise<Task[]> => {
    try {
        const { data, error } = await supabase
            .from('invoice_items')
            .select('*, tasks(*)')
            .eq('invoice_id', invoiceId)
            .eq('type', 'labor');

        if (error) {
            console.error('Error fetching tasks for invoice:', error);
            return [];
        }

        // Extract task data from invoice items and map database fields to TypeScript interface
        const tasks = data?.map(item => {
            if (item.tasks) {
                return {
                    ...item.tasks,
                    hoursEstimated: item.tasks.hours_estimated,
                    hoursSpent: item.tasks.hours_spent,
                    mechanicId: item.tasks.mechanic_id,
                    vehicleId: item.tasks.vehicle_id,
                    startTime: item.tasks.start_time,
                    endTime: item.tasks.end_time,
                    completedBy: item.tasks.completed_by,
                    completedAt: item.tasks.completed_at,
                    invoiceId: item.tasks.invoice_id
                } as Task;
            }
            return null;
        }).filter(Boolean) as Task[];
        
        return tasks || [];
    } catch (error) {
        console.error('Error fetching tasks for invoice:', error);
        return [];
    }
};

export const getAssignedPartsForInvoice = async (vehicleId: string, customerId: string): Promise<Part[]> => {
    try {
        // Fetch parts assigned to the customer and not yet assigned to any invoice
        const { data: parts, error } = await supabase
            .from('parts')
            .select('*')
            .eq('vendor_id', customerId)
            .is('invoice_ids', null);

        if (error) {
            console.error('Error fetching assigned parts:', error);
            return [];
        }

        return parts || [];
    } catch (error) {
        console.error('Error fetching assigned parts:', error);
        return [];
    }
};

export const getAssignedTasksForInvoice = async (vehicleId: string): Promise<Task[]> => {
    try {
        // Fetch completed tasks for the vehicle that are not yet assigned to any invoice
        const { data: tasks, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('vehicle_id', vehicleId)
            .eq('status', 'completed')
            .is('invoice_id', null);

        if (error) {
            console.error('Error fetching assigned tasks:', error);
            return [];
        }

        // Map database fields to TypeScript interface
        return (tasks || []).map(task => ({
            ...task,
            hoursEstimated: task.hours_estimated,
            hoursSpent: task.hours_spent,
            mechanicId: task.mechanic_id,
            vehicleId: task.vehicle_id,
            startTime: task.start_time,
            endTime: task.end_time,
            completedBy: task.completed_by,
            completedAt: task.completed_at,
            invoiceId: task.invoice_id
        })) as Task[];
    } catch (error) {
        console.error('Error fetching assigned tasks:', error);
        return [];
    }
};

export const hasPermission = (user: any, entity: string, action: string): boolean => {
    if (!user || !user.permissions) {
        return false;
    }

    const permissions = user.permissions[entity];
    return permissions && permissions.includes(action);
};

export const updateInvoice = async (invoiceData: Invoice) => {
    try {
        // Destructure invoiceData to separate invoice details from items and payments
        const { id, customer_id, vehicle_id, date, tax_rate, discount_type, discount_value, notes, status, items, payments } = invoiceData;

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
                status
            })
            .eq('id', id)
            .select();

        if (invoiceError) {
            console.error('Error updating invoice:', invoiceError);
            throw invoiceError;
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
                    type: item.type, // Should already be correct ('part', 'labor', 'other')
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
                    throw itemsError;
                }
            }
        }

        // Handle payments
        if (payments) {
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

                const { error: paymentsError } = await supabase
                    .from('payments')
                    .insert(paymentsToInsert);

                if (paymentsError) {
                    console.error('Error inserting payments:', paymentsError);
                    throw paymentsError;
                }
            }
        }

        return invoiceResult;
    } catch (error) {
        console.error('Error updating invoice:', error);
        throw error;
    }
};
