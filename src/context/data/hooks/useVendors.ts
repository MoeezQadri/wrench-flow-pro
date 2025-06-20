
import { useState } from 'react';
import type { Vendor } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useVendors = () => {
    const [vendors, setVendors] = useState<Vendor[]>([]);

    const generateUUID = () => crypto.randomUUID();

    const addVendor = async (vendorData: any) => {
        console.log('Vendor data to be saved:', vendorData);
        const newVendor = {
            id: generateUUID(),
            ...vendorData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        try {
            const { data, error } = await supabase.from('vendors').insert(newVendor).select();
            if (error) {
                console.error('Error adding vendor:', error);
                toast.error('Failed to add vendor');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0];
                setVendors((prev) => [...prev, result]);
                toast.success('Vendor added successfully');
                return result;
            }
            return null;
        } catch (error) {
            console.error('Error adding vendor:', error);
            toast.error('Failed to add vendor');
            throw error;
        }
    };

    const removeVendor = async (id: string) => {
        try {
            const { error } = await supabase.from('vendors').delete().eq('id', id);
            if (error) {
                console.error('Error removing vendor:', error);
                toast.error('Failed to delete vendor');
                throw error;
            }
            setVendors((prev) => prev.filter((item) => item.id !== id));
            toast.success('Vendor deleted successfully');
        } catch (error) {
            console.error('Error removing vendor:', error);
            toast.error('Failed to delete vendor');
            throw error;
        }
    };

    const updateVendor = async (id: string, updates: Partial<Vendor>) => {
        try {
            const { data, error } = await supabase
                .from('vendors')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating vendor:', error);
                toast.error('Failed to update vendor');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Vendor;
                setVendors((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Vendor updated successfully');
            }
        } catch (error) {
            console.error('Error updating vendor:', error);
            toast.error('Failed to update vendor');
            throw error;
        }
    };

    const loadVendors = async () => {
        try {
            const { data: vendorsData, error: vendorsError } = await supabase.from('vendors').select('*');
            if (vendorsError) {
                console.error('Error fetching vendors:', vendorsError);
                toast.error('Failed to load vendors');
            } else {
                setVendors(vendorsData || []);
            }
        } catch (error) {
            console.error('Error fetching vendors:', error);
            toast.error('Failed to load vendors');
        }
    };

    return {
        vendors,
        setVendors,
        addVendor,
        removeVendor,
        updateVendor,
        loadVendors
    };
};
