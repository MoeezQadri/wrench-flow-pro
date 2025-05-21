
import { supabase } from "@/integrations/supabase/client";
import { Customer, Vehicle, Mechanic, Invoice, Task, Part } from "@/types";

/**
 * Helper function to create test data in the database for development
 */
export async function createTestData() {
  try {
    // Create a test customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert([{
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-123-4567',
        address: '123 Test St',
      }])
      .select()
      .single();
      
    if (customerError) throw customerError;
    
    // Create a test vehicle
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .insert([{
        customer_id: customer.id,
        make: 'Toyota',
        model: 'Camry',
        year: '2020',
        license_plate: 'TEST123',
        color: 'Blue'
      }])
      .select()
      .single();
      
    if (vehicleError) throw vehicleError;
    
    // Create a test mechanic
    const { data: mechanic, error: mechanicError } = await supabase
      .from('mechanics')
      .insert([{
        name: 'Test Mechanic',
        specialization: 'General',
        address: '456 Mechanic St',
        phone: '555-765-4321',
        employment_type: 'fulltime'
      }])
      .select()
      .single();
      
    if (mechanicError) throw mechanicError;
    
    // Create a test invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert([{
        customer_id: customer.id,
        vehicle_id: vehicle.id,
        status: 'open',
        date: new Date().toISOString(),
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        tax_rate: 7.5,
        notes: 'Test invoice'
      }])
      .select()
      .single();
      
    if (invoiceError) throw invoiceError;
    
    // Create test invoice items
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert([{
        invoice_id: invoice.id,
        type: 'labor',
        description: 'Oil Change',
        quantity: 1,
        price: 49.99
      }]);
      
    if (itemsError) throw itemsError;
    
    return {
      customer,
      vehicle,
      mechanic,
      invoice
    };
  } catch (error) {
    console.error('Error creating test data:', error);
    throw error;
  }
}
