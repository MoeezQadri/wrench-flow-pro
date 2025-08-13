
import { useState, useEffect } from 'react';
import type { Customer } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { useOrganizationAwareQuery } from '@/hooks/useOrganizationAwareQuery';
import { fetchCustomerById } from '@/services/supabase-service';

export const useCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { applyOrganizationFilter } = useOrganizationAwareQuery();
    const { organizationId } = useOrganizationFilter();

    // Set up real-time subscription for customer data
    useEffect(() => {
        if (!organizationId) {
            console.log("No organization ID available for real-time subscription");
            return;
        }

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
                    
                    try {
                        if (payload.eventType === 'INSERT' && payload.new) {
                            setCustomers(prev => {
                                const exists = prev.some(c => c.id === payload.new.id);
                                return exists ? prev : [...prev, payload.new as Customer];
                            });
                        } else if (payload.eventType === 'UPDATE' && payload.new) {
                            setCustomers(prev => prev.map(customer => 
                                customer.id === payload.new.id ? payload.new as Customer : customer
                            ));
                        } else if (payload.eventType === 'DELETE' && payload.old) {
                            setCustomers(prev => prev.filter(customer => customer.id !== payload.old.id));
                        }
                    } catch (error) {
                        console.error('Error handling real-time customer update:', error);
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
        if (!customer || typeof customer !== 'object') {
            const errorMsg = 'Invalid customer data provided';
            console.error(errorMsg, customer);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        // Validate required fields
        if (!customer.name?.trim()) {
            const errorMsg = 'Customer name is required';
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        setLoading(true);
        setError(null);

        try {
            console.log("Adding customer:", customer);
            const customerData = {
                ...customer,
                name: customer.name.trim(),
                email: customer.email?.trim() || null,
                phone: customer.phone?.trim() || null,
                address: customer.address?.trim() || null,
                organization_id: organizationId
            };

            const { data, error } = await supabase.from('customers').insert(customerData).select();
            
            if (error) {
                console.error('Error adding customer:', error);
                const errorMsg = error.message?.includes('duplicate') ? 'Customer already exists' : 'Failed to add customer';
                setError(errorMsg);
                toast.error(errorMsg);
                throw error;
            }
            
            if (data && data.length > 0) {
                const result = data[0] as Customer;
                setCustomers((prev) => [...(prev || []), result]);
                toast.success('Customer added successfully');
                console.log("Customer added successfully:", result);
                return result;
            }
            
            // Fallback: add to local state if database operation succeeded but no data returned
            setCustomers((prev) => [...(prev || []), customerData as Customer]);
            console.log("Customer added to local state as fallback");
            return customerData as Customer;
        } catch (error: any) {
            console.error('Error adding customer:', error);
            const errorMsg = error?.message?.includes('organization_id') 
                ? 'Organization access error - please refresh and try again'
                : error?.message || 'Failed to add customer';
            setError(errorMsg);
            toast.error(errorMsg);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const removeCustomer = async (id: string) => {
        if (!id?.trim()) {
            const errorMsg = 'Customer ID is required for deletion';
            console.error(errorMsg);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        setLoading(true);
        setError(null);

        try {
            console.log("Removing customer:", id);
            const { error } = await supabase.from('customers').delete().eq('id', id);
            
            if (error) {
                console.error('Error removing customer:', error);
                const errorMsg = error.message?.includes('violates foreign key') 
                    ? 'Cannot delete customer - they have associated records (vehicles, invoices, etc.)'
                    : 'Failed to delete customer';
                setError(errorMsg);
                toast.error(errorMsg);
                throw error;
            }
            
            setCustomers((prev) => (prev || []).filter((item) => item.id !== id));
            toast.success('Customer deleted successfully');
            console.log("Customer removed successfully:", id);
        } catch (error: any) {
            console.error('Error removing customer:', error);
            const errorMsg = error?.message?.includes('organization_id') 
                ? 'Organization access error - please refresh and try again'
                : error?.message || 'Failed to delete customer';
            setError(errorMsg);
            toast.error(errorMsg);
            throw error;
        } finally {
            setLoading(false);
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
        setLoading(true);
        setError(null);

        try {
            console.log("Loading customers from Supabase...", { retryCount, organizationId });
            
            // Check if organization context is available
            if (!organizationId) {
                console.warn("No organization ID available, skipping customer load");
                setCustomers([]);
                return;
            }

            const query = supabase.from('customers').select('*');
            
            // Apply organization filter with error handling
            let result;
            try {
                result = await applyOrganizationFilter(query);
            } catch (filterError: any) {
                console.error('Error applying organization filter:', filterError);
                throw new Error(`Filter error: ${filterError.message}`);
            }

            const { data: customersData, error: customersError } = result;
            
            if (customersError) {
                console.error('Error fetching customers:', customersError);
                
                // Specific error handling
                if (customersError.message?.includes('JWT')) {
                    const errorMsg = 'Authentication expired - please refresh the page';
                    setError(errorMsg);
                    toast.error(errorMsg);
                    return;
                }
                
                if (customersError.message?.includes('permission')) {
                    const errorMsg = 'No permission to access customer data';
                    setError(errorMsg);
                    toast.error(errorMsg);
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
                
                const errorMsg = `Failed to load customers: ${customersError.message}`;
                setError(errorMsg);
                toast.error('Failed to load customers');
                throw customersError;
            } else {
                const safeCustomersData = Array.isArray(customersData) ? customersData : [];
                console.log("Customers loaded successfully:", safeCustomersData.length, "customers found");
                setCustomers(safeCustomersData);
                
                if (safeCustomersData.length === 0) {
                    console.log("No customers found for organization:", organizationId);
                }
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
                : error?.message || 'Unexpected error loading customers';
            setError(errorMsg);
            toast.error('Failed to load customers - please try refreshing');
        } finally {
            setLoading(false);
        }
    };

    const refreshCustomers = async () => {
        console.log("Manual refresh of customers triggered");
        setError(null);
        await loadCustomers();
    };

    return {
        customers: customers || [],
        loading,
        error,
        setCustomers,
        addCustomer,
        removeCustomer,
        updateCustomer,
        getCustomerById,
        loadCustomers,
        refreshCustomers
    };
};
