
import { useState } from 'react';
import type { Vehicle } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useVehicles = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);

    const addVehicle = async (vehicle: Vehicle) => {
        try {
            const { data, error } = await supabase.from('vehicles').insert(vehicle).select();
            if (error) {
                console.error('Error adding vehicle:', error);
                toast.error('Failed to add vehicle');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Vehicle;
                setVehicles((prev) => [...prev, result]);
                toast.success('Vehicle added successfully');
            }
        } catch (error) {
            console.error('Error adding vehicle:', error);
            toast.error('Failed to add vehicle');
            throw error;
        }
    };

    const removeVehicle = async (id: string) => {
        try {
            const { error } = await supabase.from('vehicles').delete().eq('id', id);
            if (error) {
                console.error('Error removing vehicle:', error);
                toast.error('Failed to delete vehicle');
                throw error;
            }
            setVehicles((prev) => prev.filter((item) => item.id !== id));
            toast.success('Vehicle deleted successfully');
        } catch (error) {
            console.error('Error removing vehicle:', error);
            toast.error('Failed to delete vehicle');
            throw error;
        }
    };

    const updateVehicle = async (id: string, updates: Partial<Vehicle>) => {
        try {
            const { data, error } = await supabase
                .from('vehicles')
                .update(updates)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Error updating vehicle:', error);
                toast.error('Failed to update vehicle');
                throw error;
            }

            if (data && data.length > 0) {
                const result = data[0] as Vehicle;
                setVehicles((prev) => prev.map((item) => item.id === id ? result : item));
                toast.success('Vehicle updated successfully');
            }
        } catch (error) {
            console.error('Error updating vehicle:', error);
            toast.error('Failed to update vehicle');
            throw error;
        }
    };

    const getVehiclesByCustomerId = (customerId: string) => vehicles.filter(item => item.customer_id === customerId);
    const getVehicleById = (id: string) => vehicles.find(vehicle => vehicle.id === id) || null;

    const loadVehicles = async () => {
        try {
            const { data: vehiclesData, error: vehiclesError } = await supabase.from('vehicles').select('*');
            if (vehiclesError) {
                console.error('Error fetching vehicles:', vehiclesError);
                toast.error('Failed to load vehicles');
            } else {
                setVehicles(vehiclesData || []);
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            toast.error('Failed to load vehicles');
        }
    };

    return {
        vehicles,
        setVehicles,
        addVehicle,
        removeVehicle,
        updateVehicle,
        getVehiclesByCustomerId,
        getVehicleById,
        loadVehicles
    };
};
