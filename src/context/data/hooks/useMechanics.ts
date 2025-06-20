
import { useState } from 'react';
import type { Mechanic } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useMechanics = () => {
    const [mechanics, setMechanics] = useState<Mechanic[]>([]);

    const generateUUID = () => crypto.randomUUID();

    const addMechanic = async (mechanicData: Omit<Mechanic, 'id'>) => {
        const newMechanic: Mechanic = {
            id: generateUUID(),
            ...mechanicData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        console.log('Adding mechanic:', newMechanic);
        try {
            const { data, error } = await supabase.from('mechanics').insert(newMechanic).select();
            if (error) {
                console.error('Error adding mechanic:', error);
                toast.error('Failed to add mechanic');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Mechanic;
                setMechanics((prev) => [...prev, result]);
                toast.success('Mechanic added successfully');
                return result;
            }
            throw new Error('Failed to add mechanic');
        } catch (error) {
            console.error('Error adding mechanic:', error);
            toast.error('Failed to add mechanic');
            throw error;
        }
    };

    const removeMechanic = async (id: string) => {
        try {
            const { error } = await supabase.from('mechanics').delete().eq('id', id);
            if (error) {
                console.error('Error removing mechanic:', error);
                toast.error('Failed to delete mechanic');
                throw error;
            }
            setMechanics((prev) => prev.filter((item) => item.id !== id));
            toast.success('Mechanic deleted successfully');
        } catch (error) {
            console.error('Error removing mechanic:', error);
            toast.error('Failed to delete mechanic');
            throw error;
        }
    };

    const updateMechanic = async (id: string, mechanicData: Omit<Mechanic, 'id'>) => {
        const updatedData = {
            ...mechanicData,
            updated_at: new Date().toISOString()
        };

        console.log('Updating mechanic:', updatedData);
        try {
            const { data, error } = await supabase
                .from('mechanics')
                .update(updatedData)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating mechanic:', error);
                toast.error('Failed to update mechanic');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Mechanic;
                setMechanics((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Mechanic updated successfully');
                return result;
            }
            throw new Error('Failed to update mechanic');
        } catch (error) {
            console.error('Error updating mechanic:', error);
            toast.error('Failed to update mechanic');
            throw error;
        }
    };

    const getMechanicById = (id: string) => mechanics.find(mechanic => mechanic.id === id) || null;

    const loadMechanics = async () => {
        try {
            const { data: mechanicsData, error: mechanicsError } = await supabase.from('mechanics').select('*');
            if (mechanicsError) {
                console.error('Error fetching mechanics:', mechanicsError);
                toast.error('Failed to load mechanics');
            } else {
                setMechanics(mechanicsData || []);
            }
        } catch (error) {
            console.error('Error fetching mechanics:', error);
            toast.error('Failed to load mechanics');
        }
    };

    return {
        mechanics,
        setMechanics,
        addMechanic,
        removeMechanic,
        updateMechanic,
        getMechanicById,
        loadMechanics
    };
};
