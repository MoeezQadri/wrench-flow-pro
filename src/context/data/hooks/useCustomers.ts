
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
            console.log("Adding customer:", customer);
            const { data, error } = await supabase.from('customers').insert(customer).select();
            if (error) {
                console.error('Error adding customer:', error);
                const errorMsg = error.message?.includes('duplicate') ? 'Customer already exists' : 'Failed to add customer';
                toast.error(errorMsg);
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Customer;
                setCustomers((prev) => [...prev, result]);
                toast.success('Customer added successfully');
                console.log("Customer added successfully:", result);
                return result;
            }
            // Fallback: add to local state if database operation succeeded but no data returned
            setCustomers((prev) => [...prev, customer]);
            console.log("Customer added to local state as fallback");
            return customer;
        } catch (error: any) {
            console.error('Error adding customer:', error);
            const errorMsg = error?.message?.includes('organization_id') 
                ? 'Organization access error - please refresh and try again'
                : 'Failed to add customer';
            toast.error(errorMsg);
            throw error;
        }
    };

    const removeCustomer = async (id: string) => {
        try {
            console.log("Removing customer:", id);
            const { error } = await supabase.from('customers').delete().eq('id', id);
            if (error) {
                console.error('Error removing customer:', error);
                const errorMsg = error.message?.includes('violates foreign key') 
                    ? 'Cannot delete customer - they have associated records'
                    : 'Failed to delete customer';
                toast.error(errorMsg);
                throw error;
            }
            setCustomers((prev) => prev.filter((item) => item.id !== id));
            toast.success('Customer deleted successfully');
            console.log("Customer removed successfully:", id);
        } catch (error: any) {
            console.error('Error removing customer:', error);
            const errorMsg = error?.message?.includes('organization_id') 
                ? 'Organization access error - please refresh and try again'
                : 'Failed to delete customer';
            toast.error(errorMsg);
            throw error;
        }
    };

    const updateCustomer = async (id: string, updates: Partial<Customer>) => {
        try {
            console.log("Updating customer:", id, updates);
            const { data, error } = await supabase
                .from('customers')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating customer:', error);
                const errorMsg = error.message?.includes('duplicate') 
                    ? 'Customer with this information already exists'
                    : 'Failed to update customer';
                toast.error(errorMsg);
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Customer;
                setCustomers((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Customer updated successfully');
                console.log("Customer updated successfully:", result);
            } else {
                console.warn("No data returned from customer update");
            }
        } catch (error: any) {
            console.error('Error updating customer:', error);
            const errorMsg = error?.message?.includes('organization_id') 
                ? 'Organization access error - please refresh and try again'
                : 'Failed to update customer';
            toast.error(errorMsg);
            throw error;
        }
    };

    const getCustomerById = async (id: string): Promise<Customer | null> => {
        try {
            console.log("Getting customer by ID:", id);
            const localCustomer = customers.find(customer => customer.id === id);
            if (localCustomer) {
                console.log("Customer found in local state:", localCustomer);
                return localCustomer;
            }
            
            console.log("Customer not in local state, fetching from database...");
            const customerData = await fetchCustomerById(id);
            if (customerData) {
                console.log("Customer fetched from database:", customerData);
            } else {
                console.log("Customer not found in database");
            }
            return customerData;
        } catch (error: any) {
            console.error('Error fetching customer:', error);
            const errorMsg = error?.message?.includes('organization_id') 
                ? 'Organization access error - customer may not be accessible'
                : 'Error retrieving customer details';
            toast.error(errorMsg);
            return null;
        }
    };

    const loadCustomers = async (retryCount = 0) => {
        try {
            console.log("Loading customers from Supabase...", { retryCount, organizationId });
            
            // Check if organization context is available
            if (!organizationId) {
                console.warn("No organization ID available, skipping customer load");
                return;
            }

            const query = supabase.from('customers').select('*');
            const { data: customersData, error: customersError } = await applyOrganizationFilter(query);
            
            if (customersError) {
                console.error('Error fetching customers:', customersError);
                
                // Specific error handling
                if (customersError.message?.includes('JWT')) {
                    toast.error('Authentication expired - please refresh the page');
                    return;
                }
                
                if (customersError.message?.includes('permission')) {
                    toast.error('No permission to access customer data');
                    return;
                }
                
                // Retry logic for transient errors
                if (retryCount < 3 && (
                    customersError.message?.includes('timeout') || 
                    customersError.message?.includes('network') ||
                    customersError.message?.includes('connection')
                )) {
                    const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff
                    console.log(`Retrying customer load in ${delay}ms (attempt ${retryCount + 1})`);
                    setTimeout(() => loadCustomers(retryCount + 1), delay);
                    return;
                }
                
                toast.error('Failed to load customers');
            } else {
                console.log("Customers loaded successfully:", customersData ? customersData.length : 0, "customers found");
                setCustomers(customersData || []);
            }
        } catch (error: any) {
            console.error('Unexpected error fetching customers:', error);
            
            // Retry logic for unexpected errors
            if (retryCount < 2) {
                const delay = 1000 * (retryCount + 1);
                console.log(`Retrying customer load after error in ${delay}ms (attempt ${retryCount + 1})`);
                setTimeout(() => loadCustomers(retryCount + 1), delay);
                return;
            }
            
            const errorMsg = error?.name === 'AbortError' 
                ? 'Request cancelled - please try again'
                : 'Unexpected error loading customers';
            toast.error(errorMsg);
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
