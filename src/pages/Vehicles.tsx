
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDataContext } from '@/context/data/DataContext';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customerNames, setCustomerNames] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const { getCustomerById } = useDataContext();

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

  if (loading) {
    return <div className="p-8 text-center">Loading vehicles...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vehicles</h1>
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Add New Vehicle
        </button>
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
                      <Link to={`/vehicles/${vehicle.id}`} className="text-blue-600 hover:underline">
                        View
                      </Link>
                      <button className="text-green-600 hover:underline">Edit</button>
                      <button className="text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
