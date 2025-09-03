
import { useState } from 'react';
import type { Vehicle } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOrganizationAwareQuery } from '@/hooks/useOrganizationAwareQuery';

export const useVehicles = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const { applyOrganizationFilter } = useOrganizationAwareQuery();
    const { selectedOrganizationId } = useOrganizationContext();

    const addVehicle = async (vehicle: Vehicle) => {
        try {
            const { data, error } = await supabase.from('vehicles').insert({
                ...vehicle,
                year: vehicle.year // Already string in Vehicle interface
            }).select();
            if (error) {
                console.error('Error adding vehicle:', error);
                toast.error('Failed to add vehicle');
                throw error;
            }
            if (data && data.length > 0) {
                const result = data[0] as Vehicle;
                setVehicles((prev) => [...prev, result]);
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
                .update({
                    ...updates,
                    year: updates.year // Already string in Vehicle interface
                })
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

    const getVehiclesByCustomerId = async (customerId: string): Promise<Vehicle[]> => {
        try {
            console.log("Fetching vehicles for customer:", customerId);
            const query = supabase
                .from('vehicles')
                .select('*')
                .eq('customer_id', customerId);
            const { data, error } = await applyOrganizationFilter(query);
            
            if (error) {
                console.error('Error fetching vehicles:', error);
                toast.error('Failed to load vehicles');
                return [];
            }
            
            const mappedVehicles = (data || []).map(v => ({
                id: v.id,
                customer_id: v.customer_id,
                make: v.make,
                model: v.model,
                year: v.year, // Keep as string from database
                license_plate: v.license_plate,
                vin: v.vin,
                color: v.color
            }));
            
            console.log("Vehicles fetched from database:", mappedVehicles);
            return mappedVehicles;
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            toast.error('Failed to load vehicles');
            return [];
        }
    };

    const getVehicleById = (id: string) => vehicles.find(vehicle => vehicle.id === id) || null;

    const loadVehicles = async () => {
        try {
            const query = supabase.from('vehicles').select('*');
            const { data: vehiclesData, error: vehiclesError } = await applyOrganizationFilter(query);
            if (vehiclesError) {
                console.error('Error fetching vehicles:', vehiclesError);
                toast.error('Failed to load vehicles');
            } else {
                // Map the data to ensure year is treated as string
                const mappedVehicles = (vehiclesData || []).map(v => ({
                    ...v,
                    year: v.year // Keep as string from database
                }));
                setVehicles(mappedVehicles);
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
