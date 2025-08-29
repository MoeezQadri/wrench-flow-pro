
import { toast } from 'sonner';
import type { Part } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useEnhancedRealtime } from '@/hooks/useEnhancedRealtime';
import { useEnhancedDataLoading } from '@/hooks/useEnhancedDataLoading';

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

    const removePart = async (id: string) => {
        try {
            const { error } = await supabase.from('parts').delete().eq('id', id);
            if (error) {
                console.error('Error removing part:', error);
                toast.error('Failed to delete part');
                throw error;
            }
            setParts((prev) => prev.filter((item) => item.id !== id));
            toast.success('Part deleted successfully');
        } catch (error) {
            console.error('Error removing part:', error);
            toast.error('Failed to delete part');
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
        loadParts: loadPartsWrapper,
        forceRefresh,
        forceReconnect
    };
};
