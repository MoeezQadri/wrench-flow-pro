
import { useState, useEffect } from 'react';
import type { Customer } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationFilter } from '@/hooks/useOrganizationFilter';
import { useOrganizationAwareQuery } from '@/hooks/useOrganizationAwareQuery';
import { fetchCustomerById } from '@/services/supabase-service';

// Enhanced error logging utility
const logCustomerOperation = (operation: string, data?: any, error?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    operation,
    data: data ? JSON.stringify(data, null, 2) : null,
    error: error ? {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    } : null,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  console.log(`[CustomerHook] ${operation}:`, logEntry);
  
  // Store in sessionStorage for debugging (keep last 50 entries)
  try {
    const existingLogs = JSON.parse(sessionStorage.getItem('customerOperationLogs') || '[]');
    const updatedLogs = [...existingLogs, logEntry].slice(-50);
    sessionStorage.setItem('customerOperationLogs', JSON.stringify(updatedLogs));
  } catch (storageError) {
    console.warn('Failed to store customer operation log:', storageError);
  }
  
  return logEntry;
};

export const useCustomers = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { applyOrganizationFilter } = useOrganizationAwareQuery();
    const { organizationId, isSuperAdmin, canAccessAllOrganizations } = useOrganizationFilter();

    // Log initialization
    useEffect(() => {
        logCustomerOperation('HOOK_INITIALIZED', { 
            organizationId, 
            isSuperAdmin, 
            canAccessAllOrganizations 
        });
    }, [organizationId, isSuperAdmin, canAccessAllOrganizations]);

    // Set up real-time subscription for customer data
    useEffect(() => {
        if (!organizationId) {
            console.log("No organization ID available for real-time subscription");
            return;
        }

        console.log("Setting up real-time subscription for customers in org:", organizationId);
        
        // Create a unique channel name to avoid conflicts
        const channelName = `customers-changes-${organizationId}`;
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'customers',
                    filter: `organization_id=eq.${organizationId}`
                },
                (payload) => {
                    console.log('Customer real-time update received:', payload);
                    
                    try {
                        if (payload.eventType === 'INSERT' && payload.new) {
                            const newCustomer = payload.new as Customer;
                            setCustomers(prev => {
                                const exists = (prev || []).some(c => c.id === newCustomer.id);
                                if (exists) {
                                    console.log("Customer already exists, skipping insert");
                                    return prev || [];
                                }
                                console.log("Adding new customer from real-time:", newCustomer.name);
                                return [...(prev || []), newCustomer];
                            });
                        } else if (payload.eventType === 'UPDATE' && payload.new) {
                            const updatedCustomer = payload.new as Customer;
                            setCustomers(prev => {
                                const updated = (prev || []).map(customer => 
                                    customer.id === updatedCustomer.id ? updatedCustomer : customer
                                );
                                console.log("Updated customer from real-time:", updatedCustomer.name);
                                return updated;
                            });
                        } else if (payload.eventType === 'DELETE' && payload.old) {
                            const deletedId = payload.old.id;
                            setCustomers(prev => {
                                const filtered = (prev || []).filter(customer => customer.id !== deletedId);
                                console.log("Removed customer from real-time:", deletedId);
                                return filtered;
                            });
                        }
                    } catch (error) {
                        console.error('Error handling real-time customer update:', error);
                        // Don't show toast for real-time errors to avoid spam
                    }
                }
            )
            .subscribe((status) => {
                console.log("Real-time subscription status:", status);
                if (status === 'SUBSCRIBED') {
                    console.log("Successfully subscribed to customer changes");
                } else if (status === 'CHANNEL_ERROR') {
                    console.error("Error in real-time channel");
                    setError("Real-time sync error - data may not be current");
                } else if (status === 'TIMED_OUT') {
                    console.warn("Real-time subscription timed out");
                    setError("Connection timeout - data may not be current");
                }
            });

        return () => {
            console.log("Cleaning up customer real-time subscription");
            supabase.removeChannel(channel);
        };
    }, [organizationId]);

    const addCustomer = async (customer: Customer) => {
        logCustomerOperation('ADD_CUSTOMER_STARTED', { customerName: customer.name });
        
        if (!customer || typeof customer !== 'object') {
            const errorMsg = 'Invalid customer data provided';
            logCustomerOperation('ADD_CUSTOMER_VALIDATION_FAILED', customer, new Error(errorMsg));
            console.error(errorMsg, customer);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        // Validate required fields
        if (!customer.name?.trim()) {
            const errorMsg = 'Customer name is required';
            logCustomerOperation('ADD_CUSTOMER_VALIDATION_FAILED', customer, new Error(errorMsg));
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        const tempId = crypto.randomUUID();
        const customerData = {
            ...customer,
            id: tempId,
            name: customer.name.trim(),
            email: customer.email?.trim() || null,
            phone: customer.phone?.trim() || null,
            address: customer.address?.trim() || null,
            organization_id: organizationId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Optimistic update - add to UI immediately
        setCustomers((prev) => [...(prev || []), customerData as Customer]);
        setLoading(true);
        setError(null);

        try {
            console.log("Adding customer:", customerData);
            const { data, error } = await supabase
                .from('customers')
                .insert(customerData)
                .select();
            
            if (error) {
                // Rollback optimistic update
                setCustomers((prev) => (prev || []).filter(c => c.id !== tempId));
                logCustomerOperation('ADD_CUSTOMER_FAILED', customerData, error);
                console.error('Error adding customer:', error);
                const errorMsg = error.message?.includes('duplicate') ? 'Customer already exists' : 'Failed to add customer';
                setError(errorMsg);
                toast.error(errorMsg);
                throw error;
            }
            
            if (data && data.length > 0) {
                const result = data[0] as Customer;
                // Replace optimistic entry with real data
                setCustomers((prev) => (prev || []).map(c => c.id === tempId ? result : c));
                logCustomerOperation('ADD_CUSTOMER_SUCCESS', result);
                toast.success('Customer added successfully');
                console.log("Customer added successfully:", result);
                return result;
            }
            
            // Keep optimistic update if no data returned but no error
            logCustomerOperation('ADD_CUSTOMER_SUCCESS_OPTIMISTIC', customerData);
            console.log("Customer added (optimistic update kept)");
            return customerData as Customer;
        } catch (error: any) {
            // Rollback optimistic update on error
            setCustomers((prev) => (prev || []).filter(c => c.id !== tempId));
            logCustomerOperation('ADD_CUSTOMER_EXCEPTION', customerData, error);
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
        if (!id?.trim()) {
            const errorMsg = 'Customer ID is required for update';
            console.error(errorMsg);
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        if (!updates || Object.keys(updates).length === 0) {
            console.log("No updates provided");
            return;
        }

        // Store original customer for rollback
        const originalCustomer = customers.find(c => c.id === id);
        if (!originalCustomer) {
            const errorMsg = 'Customer not found for update';
            toast.error(errorMsg);
            throw new Error(errorMsg);
        }

        // Optimistic update
        const optimisticCustomer = {
            ...originalCustomer,
            ...updates,
            updated_at: new Date().toISOString()
        };
        setCustomers((prev) => (prev || []).map((item) => item.id === id ? optimisticCustomer : item));
        setLoading(true);
        setError(null);

        try {
            console.log("Updating customer:", id, updates);
            const { data, error } = await supabase
                .from('customers')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                // Rollback optimistic update
                setCustomers((prev) => (prev || []).map((item) => item.id === id ? originalCustomer : item));
                console.error('Error updating customer:', error);
                const errorMsg = error.message?.includes('duplicate') 
                    ? 'Customer with this information already exists'
                    : 'Failed to update customer';
                setError(errorMsg);
                toast.error(errorMsg);
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Customer;
                // Replace optimistic update with real data
                setCustomers((prev) => (prev || []).map((item) => item.id === id ? result : item));
                toast.success('Customer updated successfully');
                console.log("Customer updated successfully:", result);
            } else {
                console.warn("No data returned from customer update, keeping optimistic update");
            }
        } catch (error: any) {
            // Rollback optimistic update
            setCustomers((prev) => (prev || []).map((item) => item.id === id ? originalCustomer : item));
            console.error('Error updating customer:', error);
            const errorMsg = error?.message?.includes('organization_id') 
                ? 'Organization access error - please refresh and try again'
                : error?.message || 'Failed to update customer';
            setError(errorMsg);
            toast.error(errorMsg);
            throw error;
        } finally {
            setLoading(false);
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
        logCustomerOperation('LOAD_CUSTOMERS_STARTED', { retryCount, organizationId });
        setLoading(true);
        setError(null);

        try {
            console.log("Loading customers from Supabase...", { retryCount, organizationId });
            
            // Check if organization context is available
            if (!organizationId) {
                logCustomerOperation('LOAD_CUSTOMERS_NO_ORG', { organizationId });
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
                logCustomerOperation('LOAD_CUSTOMERS_SUCCESS', { 
                    customerCount: safeCustomersData.length, 
                    organizationId 
                });
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
        logCustomerOperation('MANUAL_REFRESH_TRIGGERED');
        console.log("Manual refresh of customers triggered");
        setError(null);
        await loadCustomers();
    };

    // Expose debugging utilities
    const getDebugInfo = () => {
        const logs = JSON.parse(sessionStorage.getItem('customerOperationLogs') || '[]');
        return {
            currentState: {
                customerCount: customers.length,
                loading,
                error,
                organizationId,
                isSuperAdmin,
                canAccessAllOrganizations
            },
            recentLogs: logs.slice(-10),
            allLogs: logs
        };
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
        refreshCustomers,
        getDebugInfo
    };
};
