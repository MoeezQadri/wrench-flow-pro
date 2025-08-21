
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDataContext } from '@/context/data/DataContext';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import VehicleDialog from '@/components/VehicleDialog';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customerNames, setCustomerNames] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>(undefined);
  const { getCustomerById } = useDataContext();
  const { currentUser } = useAuthContext();
  
  // Check permissions
  const userCanManageVehicles = hasPermission(currentUser, 'vehicles', 'manage') || hasPermission(currentUser, 'vehicles', 'create');
  const userCanEditVehicles = hasPermission(currentUser, 'vehicles', 'edit');
  const userCanDeleteVehicles = hasPermission(currentUser, 'vehicles', 'delete');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch vehicles from Supabase
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*');

        if (vehicleError) {
          throw vehicleError;
        }

        const vehicles = vehicleData || [];
        setVehicles(vehicles);

        // Load customer names for all customer IDs
        const customerIds = vehicles.map(vehicle => vehicle.customer_id).filter(Boolean);
        const uniqueCustomerIds = [...new Set(customerIds)];
        const nameMap: { [id: string]: string } = {};
        
        for (const customerId of uniqueCustomerIds) {
          try {
            const customer = await getCustomerById(customerId);
            nameMap[customerId] = customer?.name || 'Unknown';
          } catch (error) {
            console.error('Error loading customer:', error);
            nameMap[customerId] = 'Unknown';
          }
        }
        
        setCustomerNames(nameMap);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        toast.error("Failed to load vehicles");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getCustomerById]);

  const handleSaveVehicle = async (vehicle: Vehicle) => {
    try {
      if (editingVehicle) {
        // Update existing vehicle
        const { error } = await supabase
          .from('vehicles')
          .update({
            customer_id: vehicle.customer_id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            license_plate: vehicle.license_plate,
            vin: vehicle.vin,
            color: vehicle.color,
            updated_at: new Date().toISOString()
          })
          .eq('id', vehicle.id);

        if (error) throw error;

        // Update local state
        setVehicles(prev => prev.map(v => v.id === vehicle.id ? vehicle : v));

        // Update customer name cache if customer changed
        if (editingVehicle.customer_id !== vehicle.customer_id) {
          try {
            const customer = await getCustomerById(vehicle.customer_id);
            setCustomerNames(prev => ({
              ...prev,
              [vehicle.customer_id]: customer?.name || 'Unknown'
            }));
          } catch (error) {
            console.error('Error loading customer name:', error);
          }
        }

        toast.success("Vehicle updated successfully!");
      } else {
        // Add new vehicle
        const { data, error } = await supabase
          .from('vehicles')
          .insert([{
            customer_id: vehicle.customer_id,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            license_plate: vehicle.license_plate,
            vin: vehicle.vin,
            color: vehicle.color
          }])
          .select()
          .single();

        if (error) throw error;

        setVehicles(prev => [...prev, data]);
        toast.success("Vehicle added successfully!");
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error("Failed to save vehicle");
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setDialogOpen(true);
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;

      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
      toast.success("Vehicle deleted successfully!");
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      toast.error("Failed to delete vehicle");
    }
  };

  const handleAddNewVehicle = () => {
    setEditingVehicle(undefined);
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading vehicles...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vehicles</h1>
        {userCanManageVehicles && (
          <Button onClick={handleAddNewVehicle} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Vehicle
          </Button>
        )}
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No vehicles found. Add vehicles to get started.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make & Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License Plate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VIN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {vehicle.make} {vehicle.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{vehicle.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{vehicle.license_plate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/customers/${vehicle.customer_id}`} className="text-blue-600 hover:underline">
                      {customerNames[vehicle.customer_id] || 'Loading...'}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{vehicle.vin || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      {userCanEditVehicles && (
                        <button 
                          onClick={() => handleEditVehicle(vehicle)}
                          className="text-green-600 hover:underline flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </button>
                      )}
                      {userCanDeleteVehicles && (
                        <button 
                          onClick={() => handleDeleteVehicle(vehicle.id)}
                          className="text-red-600 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <VehicleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveVehicle}
        vehicle={editingVehicle}
      />
    </div>
  );
};

export default Vehicles;
