
import { useState } from 'react';
import type { Customer } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { fetchCustomerById } from '@/services/supabase-service';

export const useCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);

    const addCustomer = async (customer: Customer) => {
        try {
            const { data, error } = await supabase.from('customers').insert(customer).select();
            if (error) {
                console.error('Error adding customer:', error);
                toast.error('Failed to add customer');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Customer;
                setCustomers((prev) => [...prev, result]);
                toast.success('Customer added successfully');
                return result;
            }
            // Fallback: add to local state if database operation succeeded but no data returned
            setCustomers((prev) => [...prev, customer]);
            return customer;
        } catch (error) {
            console.error('Error adding customer:', error);
            toast.error('Failed to add customer');
            throw error;
        }
    };

    const removeCustomer = async (id: string) => {
        try {
            const { error } = await supabase.from('customers').delete().eq('id', id);
            if (error) {
                console.error('Error removing customer:', error);
                toast.error('Failed to delete customer');
                throw error;
            }
            setCustomers((prev) => prev.filter((item) => item.id !== id));
            toast.success('Customer deleted successfully');
        } catch (error) {
            console.error('Error removing customer:', error);
            toast.error('Failed to delete customer');
            throw error;
        }
    };

    const updateCustomer = async (id: string, updates: Partial<Customer>) => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating customer:', error);
                toast.error('Failed to update customer');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Customer;
                setCustomers((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Customer updated successfully');
            }
        } catch (error) {
            console.error('Error updating customer:', error);
            toast.error('Failed to update customer');
            throw error;
        }
    };

    const getCustomerById = async (id: string): Promise<Customer | null> => {
        try {
            const localCustomer = customers.find(customer => customer.id === id);
            if (localCustomer) {
                return localCustomer;
            }
            
            const customerData = await fetchCustomerById(id);
            return customerData;
        } catch (error) {
            console.error('Error fetching customer:', error);
            return null;
        }
    };

    const loadCustomers = async () => {
        try {
            console.log("Loading customers from Supabase...");
            const { data: customersData, error: customersError } = await supabase
                .from('customers')
                .select('*');
            
            if (customersError) {
                console.error('Error fetching customers:', customersError);
                toast.error('Failed to load customers');
            } else {
                console.log("Customers loaded:", customersData ? customersData.length : 0, "customers found");
                setCustomers(customersData || []);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            toast.error('Failed to load customers');
        }
    };

    return {
        customers,
        setCustomers,
        addCustomer,
        removeCustomer,
        updateCustomer,
        getCustomerById,
        loadCustomers
    };
};
