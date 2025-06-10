
import { useState } from 'react';
import type { Part } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useParts = () => {
    const [parts, setParts] = useState<Part[]>([]);

    const addPart = async (part: Part) => {
        try {
            const { data, error } = await supabase.from('parts').insert(part).select();
            if (error) {
                console.error('Error adding part:', error);
                toast.error('Failed to add part');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Part;
                setParts((prev) => [...prev, result]);
                toast.success('Part added successfully');
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
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating part:', error);
                toast.error('Failed to update part');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Part;
                setParts((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Part updated successfully');
            }
        } catch (error) {
            console.error('Error updating part:', error);
            toast.error('Failed to update part');
            throw error;
        }
    };

    const loadParts = async () => {
        try {
            const { data: partsData, error: partsError } = await supabase.from('parts').select('*');
            if (partsError) {
                console.error('Error fetching parts:', partsError);
                toast.error('Failed to load parts');
            } else {
                setParts(partsData || []);
            }
        } catch (error) {
            console.error('Error fetching parts:', error);
            toast.error('Failed to load parts');
        }
    };

    return {
        parts,
        setParts,
        addPart,
        removePart,
        updatePart,
        loadParts
    };
};
