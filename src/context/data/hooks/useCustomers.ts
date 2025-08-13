
import { useState, useEffect } from 'react';
import type { Customer } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { useOrganizationAwareQuery } from '@/hooks/useOrganizationAwareQuery';
import { fetchCustomerById } from '@/services/supabase-service';

export const useCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const { applyOrganizationFilter } = useOrganizationAwareQuery();
    const { organizationId } = useOrganizationFilter();

    // Set up real-time subscription for customer data
    useEffect(() => {
        if (!organizationId) return;

        console.log("Setting up real-time subscription for customers");
        const channel = supabase
            .channel('customers-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'customers',
                    filter: `organization_id=eq.${organizationId}`
                },
                (payload) => {
                    console.log('Customer real-time update:', payload);
                    
                    if (payload.eventType === 'INSERT') {
                        setCustomers(prev => [...prev, payload.new as Customer]);
                    } else if (payload.eventType === 'UPDATE') {
                        setCustomers(prev => prev.map(customer => 
                            customer.id === payload.new.id ? payload.new as Customer : customer
                        ));
                    } else if (payload.eventType === 'DELETE') {
                        setCustomers(prev => prev.filter(customer => customer.id !== payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            console.log("Cleaning up customer real-time subscription");
            supabase.removeChannel(channel);
        };
    }, [organizationId]);

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

    const loadCustomers = async (retryCount = 0) => {
        try {
            console.log("Loading customers from Supabase...");
            const query = supabase.from('customers').select('*');
            const { data: customersData, error: customersError } = await applyOrganizationFilter(query);
            
            if (customersError) {
                console.error('Error fetching customers:', customersError);
                
                // Retry logic for transient errors
                if (retryCount < 2 && (customersError.message?.includes('timeout') || customersError.message?.includes('network'))) {
                    console.log(`Retrying customer load (attempt ${retryCount + 1})`);
                    setTimeout(() => loadCustomers(retryCount + 1), 1000 * (retryCount + 1));
                    return;
                }
                
                toast.error('Failed to load customers');
            } else {
                console.log("Customers loaded:", customersData ? customersData.length : 0, "customers found");
                setCustomers(customersData || []);
            }
        } catch (error) {
            console.error('Error fetching customers:', error);
            
            // Retry logic for unexpected errors
            if (retryCount < 2) {
                console.log(`Retrying customer load after error (attempt ${retryCount + 1})`);
                setTimeout(() => loadCustomers(retryCount + 1), 1000 * (retryCount + 1));
                return;
            }
            
            toast.error('Failed to load customers');
        }
    };

    const refreshCustomers = async () => {
        console.log("Manual refresh of customers triggered");
        await loadCustomers();
    };

    return {
        customers,
        setCustomers,
        addCustomer,
        removeCustomer,
        updateCustomer,
        getCustomerById,
        loadCustomers,
        refreshCustomers
    };
};
