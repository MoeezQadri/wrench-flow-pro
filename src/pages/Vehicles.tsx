
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDataContext } from '@/context/data/DataContext';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import VehicleDialog from '@/components/VehicleDialog';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customerNames, setCustomerNames] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | undefined>(undefined);
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null);
  const [vehicleDependencies, setVehicleDependencies] = useState<{ invoices: number; estimates: number; tasks: number; total: number } | null>(null);
  const [checkingDependencies, setCheckingDependencies] = useState(false);
  const {
    getCustomerById,
    getVehicleDependencies,
    addVehicle,
    updateVehicle,
    removeVehicle,
  } = useDataContext();
  const { currentUser } = useAuthContext();
  
  // Check permissions
  const userCanManageVehicles = hasPermission(currentUser, 'vehicles', 'manage') || hasPermission(currentUser, 'vehicles', 'create');
  const canAddVehicle = userCanManageVehicles;
  const userCanEditVehicles = hasPermission(currentUser, 'vehicles', 'edit');
  const userCanDeleteVehicles = hasPermission(currentUser, 'vehicles', 'delete');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: vehicleData, error: vehicleError } = await supabase
          .from('vehicles')
          .select('*');

        if (vehicleError) throw vehicleError;

        const loadedVehicles = vehicleData || [];
        setVehicles(loadedVehicles);
        const nameMap: { [id: string]: string } = {};
        const customerIds = loadedVehicles
          .map(vehicle => vehicle.customer_id)
          .filter((customerId): customerId is string => Boolean(customerId));
        for (const customerId of [...new Set(customerIds)]) {
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
        await updateVehicle(vehicle.id, {
          customer_id: vehicle.customer_id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          license_plate: vehicle.license_plate,
          vin: vehicle.vin,
          color: vehicle.color,
        });
        setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, ...vehicle } : v));
        if (editingVehicle.customer_id !== vehicle.customer_id) {
          const customer = await getCustomerById(vehicle.customer_id);
          setCustomerNames(prev => ({ ...prev, [vehicle.customer_id]: customer?.name || 'Unknown' }));
        }
      } else {
        const createdVehicle = await addVehicle(vehicle);
        if (createdVehicle) setVehicles(prev => [...prev, createdVehicle]);
      }
      setDialogOpen(false);
      setEditingVehicle(undefined);
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error("Failed to save vehicle");
    }
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setDialogOpen(true);
  };

  const handleRequestDeleteVehicle = async (vehicle: Vehicle) => {
    setCheckingDependencies(true);
    try {
      const dependencies = await getVehicleDependencies(vehicle.id);
      setVehicleDependencies(dependencies);
      setVehicleToDelete(vehicle);
    } catch (error) {
      console.error('Error checking vehicle history:', error);
      toast.error('Could not check vehicle history');
    } finally {
      setCheckingDependencies(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete || vehicleDependencies?.total) return;
    try {
      await removeVehicle(vehicleToDelete.id);
      setVehicles(prev => prev.filter(v => v.id !== vehicleToDelete.id));
      setVehicleToDelete(null);
      setVehicleDependencies(null);
    } catch (error) {
      console.error('Error deleting vehicle:', error);
    }
  };

  const handleAddNewVehicle = () => {
    setEditingVehicle(undefined);
    setDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditingVehicle(undefined);
  };

  if (loading) {
    return <div className="p-8 text-center">Loading vehicles...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vehicles</h1>
        {canAddVehicle && (
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRequestDeleteVehicle(vehicle)}
                          disabled={checkingDependencies}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="mr-1 h-3 w-3" />
                          {checkingDependencies ? 'Checking...' : 'Delete'}
                        </Button>
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
        onOpenChange={handleCloseDialog}
        onSave={handleSaveVehicle}
        vehicle={editingVehicle}
      />

      <AlertDialog open={!!vehicleToDelete} onOpenChange={(open) => !open && setVehicleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              {vehicleDependencies?.total
                ? `This vehicle cannot be removed because it has ${vehicleDependencies.invoices} invoice${vehicleDependencies.invoices === 1 ? '' : 's'}, ${vehicleDependencies.estimates} estimate${vehicleDependencies.estimates === 1 ? '' : 's'}, or ${vehicleDependencies.tasks} job${vehicleDependencies.tasks === 1 ? '' : 's'} linked to it.`
                : 'This action permanently removes the vehicle record. Billing and job history are protected.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            {!vehicleDependencies?.total && <AlertDialogAction onClick={handleDeleteVehicle}>Remove vehicle</AlertDialogAction>}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Vehicles;
