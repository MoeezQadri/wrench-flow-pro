
import { useState } from 'react';
import type { Mechanic } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationAwareQuery } from '@/hooks/useOrganizationAwareQuery';

export const useMechanics = () => {
    const [mechanics, setMechanics] = useState<Mechanic[]>([]);
    const { applyOrganizationFilter } = useOrganizationAwareQuery();

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
            const { data, error } = await supabase.from('mechanics').insert(newMechanic as any).select();
            if (error) {
                console.error('Error adding mechanic:', error);
                toast.error('Failed to add technician');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Mechanic;
                setMechanics((prev) => [...prev, result]);
                toast.success('Technician added successfully');
                return result;
            }
            throw new Error('Failed to add technician');
        } catch (error) {
            console.error('Error adding mechanic:', error);
            toast.error('Failed to add technician');
            throw error;
        }
    };

    const removeMechanic = async (id: string) => {
        try {
            const { error } = await supabase.from('mechanics').delete().eq('id', id);
            if (error) {
                console.error('Error removing mechanic:', error);
                toast.error('Failed to delete technician');
                throw error;
            }
            setMechanics((prev) => prev.filter((item) => item.id !== id));
            toast.success('Technician deleted successfully');
        } catch (error) {
            console.error('Error removing mechanic:', error);
            toast.error('Failed to delete technician');
            throw error;
        }
    };

    const updateMechanic = async (id: string, mechanicData: Omit<Mechanic, 'id'>) => {
        const updatedData = {
            ...mechanicData,
            updated_at: new Date().toISOString()
        };

        console.log('Updating mechanic:', { id, updatedData });
        try {
            const { data, error } = await supabase
                .from('mechanics')
                .update(updatedData as any)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating mechanic:', error);
                toast.error('Failed to update technician');
                throw error;
            }

            let result: Mechanic | null = null;

            if (data && data.length > 0) {
                result = data[0] as Mechanic;
            } else {
                // Fallback when RLS prevents returning rows: optimistically update local state
                const existing = mechanics.find((m) => m.id === id);
                if (existing) {
                    result = { ...existing, ...updatedData, id } as Mechanic;
                }
            }

            if (result) {
                setMechanics((prev) => prev.map((item) => item.id === id ? result as Mechanic : item));
                toast.success('Technician updated successfully');
                return result;
            }
            throw new Error('Failed to update technician');
        } catch (error) {
            console.error('Error updating mechanic:', error);
            toast.error('Failed to update technician');
            throw error;
        }
    };

    const getMechanicById = (id: string) => mechanics.find(mechanic => mechanic.id === id) || null;

    const loadMechanics = async () => {
        try {
            const baseQuery = supabase.from('mechanics').select('*');
            const filteredQuery = applyOrganizationFilter(baseQuery);
            const { data: mechanicsData, error: mechanicsError } = await filteredQuery;
            if (mechanicsError) {
                console.error('Error fetching mechanics:', mechanicsError);
                toast.error('Failed to load technicians');
                return;
            }
            setMechanics(mechanicsData ?? []);
        } catch (error) {
            console.error('Error fetching mechanics:', error);
            toast.error('Failed to load technicians');
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
