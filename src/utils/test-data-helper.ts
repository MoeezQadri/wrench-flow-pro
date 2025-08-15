
import { Customer, Vehicle } from '@/types';
import { addCustomer, addVehicle } from '@/services/supabase-service';
import { toast } from 'sonner';

export const createTestCustomers = async (): Promise<void> => {
  const testCustomers: Omit<Customer, 'id' | 'created_at' | 'updated_at'>[] = [
    {
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "(555) 123-4567",
      address: "123 Main St, Anytown, ST 12345",
      organization_id: "00000000-0000-0000-0000-000000000001",
      totalVisits: 0,
      lifetimeValue: 0,
      lastVisit: null
    },
    {
      name: "Sarah Johnson", 
      email: "sarah.johnson@email.com",
      phone: "(555) 987-6543",
      address: "456 Oak Ave, Somewhere, ST 67890",
      organization_id: "00000000-0000-0000-0000-000000000001",
      totalVisits: 0,
      lifetimeValue: 0,
      lastVisit: null
    },
    {
      name: "Mike Davis",
      email: "mike.davis@email.com", 
      phone: "(555) 456-7890",
      address: "789 Pine Rd, Elsewhere, ST 54321",
      organization_id: "00000000-0000-0000-0000-000000000001",
      totalVisits: 0,
      lifetimeValue: 0,
      lastVisit: null
    }
  ];

  try {
    console.log('Creating test customers...');
    const createdCustomers = [];
    
    for (const customerData of testCustomers) {
      const customer = await addCustomer(customerData);
      if (customer) {
        createdCustomers.push(customer);
        console.log('Created customer:', customer.name);
      }
    }

    // Create test vehicles for the first customer
    if (createdCustomers.length > 0) {
      const testVehicles = [
        {
          customer_id: createdCustomers[0].id,
          make: "Toyota",
          model: "Camry", 
          year: "2020",
          license_plate: "ABC123",
          vin: "1HGBH41JXMN109186",
          color: "Silver"
        },
        {
          customer_id: createdCustomers[0].id,
          make: "Honda",
          model: "Civic",
          year: "2019", 
          license_plate: "XYZ789",
          vin: "2HGFA16599H123456",
          color: "Blue"
        }
      ];

      for (const vehicleData of testVehicles) {
        const vehicle = await addVehicle(vehicleData);
        if (vehicle) {
          console.log('Created vehicle:', vehicle.make, vehicle.model);
        }
      }
    }

    toast.success(`Created ${createdCustomers.length} test customers with vehicles`);
  } catch (error) {
    console.error('Error creating test data:', error);
    toast.error('Failed to create test data');
  }
};
