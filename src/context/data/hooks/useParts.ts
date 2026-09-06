
import { toast } from 'sonner';
import type { Part } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedRealtime } from '@/hooks/useEnhancedRealtime';
import { useEnhancedDataLoading } from '@/hooks/useEnhancedDataLoading';

export interface PartDependencies {
    invoiceItems: number;
    invoices: number;
    total: number;
}

export const useParts = () => {
    const { 
        data: parts, 
        setData: setParts, 
        loading, 
        error, 
        loadData: loadParts,
        forceRefresh 
    } = useEnhancedDataLoading<Part>('parts');

    // Set up enhanced real-time subscription
    const { isSubscribed, forceReconnect } = useEnhancedRealtime(
        'parts',
        parts,
        setParts,
        { conflictResolution: 'server-wins' }
    );

    const addPart = async (part: Part) => {
        try {
            // Ensure we use proper UUID generation
            const partWithId = {
                ...part,
                id: crypto.randomUUID(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            console.log('Adding part to database:', partWithId);

            const { data, error } = await supabase
                .from('parts')
                .insert(partWithId)
                .select()
                .single();

            if (error) {
                console.error('Error adding part:', error);
                toast.error('Failed to add part');
                throw error;
            }

            if (data) {
                console.log('Part added successfully:', data);
                setParts((prev) => [...prev, data as Part]);
                toast.success('Part added successfully');
                return data;
            }
        } catch (error) {
            console.error('Error adding part:', error);
            toast.error('Failed to add part');
            throw error;
        }
    };

    // Counts invoice/estimate lines that reference this part so the UI can
    // refuse a delete that would corrupt billing history.
    const getPartDependencies = async (id: string): Promise<PartDependencies> => {
        const empty: PartDependencies = { invoiceItems: 0, invoices: 0, total: 0 };
        if (!id) return empty;

        const { data, error } = await supabase
            .from('invoice_items')
            .select('invoice_id')
            .eq('part_id', id);

        if (error) {
            console.error('Error checking part dependencies:', error);
            throw error;
        }

        const rows = data || [];
        const invoiceIds = new Set(rows.map((row: any) => row.invoice_id).filter(Boolean));
        return {
            invoiceItems: rows.length,
            invoices: invoiceIds.size,
            total: rows.length,
        };
    };

    const removePart = async (id: string) => {
        try {
            const dependencies = await getPartDependencies(id);
            if (dependencies.total > 0) {
                toast.error(
                    `This part is used on ${dependencies.invoices} invoice/estimate${dependencies.invoices === 1 ? '' : 's'} and cannot be deleted. Set its quantity to 0 instead.`
                );
                throw new Error('PART_HAS_DEPENDENCIES');
            }

            const { error } = await supabase.from('parts').delete().eq('id', id);
            if (error) {
                console.error('Error removing part:', error);
                toast.error('Failed to delete part');
                throw error;
            }
            setParts((prev) => prev.filter((item) => item.id !== id));
            toast.success('Part deleted successfully');
        } catch (error: any) {
            if (error?.message !== 'PART_HAS_DEPENDENCIES') {
                console.error('Error removing part:', error);
            }
            throw error;
        }
    };


    const updatePart = async (id: string, updates: Partial<Part>) => {
        try {
            const { data, error } = await supabase
                .from('parts')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                console.error('Error updating part:', error);
                toast.error('Failed to update part');
                throw error;
            }

            if (data) {
                const result = data as Part;
                setParts((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Part updated successfully');
                return result;
            }
        } catch (error) {
            console.error('Error updating part:', error);
            toast.error('Failed to update part');
            throw error;
        }
    };


    // Wrapper to match expected interface
    const loadPartsWrapper = async () => {
        await loadParts();
    };

    return {
        parts,
        setParts,
        loading,
        error,
        isSubscribed,
        addPart,
        removePart,
        updatePart,
        getPartDependencies,

        loadParts: loadPartsWrapper,
        forceRefresh,
        forceReconnect
    };
};
