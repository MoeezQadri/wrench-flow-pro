
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Vehicle, Customer } from '@/types';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<{ [id: string]: Customer }>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // This would be replaced with actual API calls in a real implementation
        const response = await fetch('/api/vehicles');
        const vehicleData = await response.json();
        setVehicles(vehicleData);

        // Fetch all customers to map to vehicles
        const customerResponse = await fetch('/api/customers');
        const customerData = await customerResponse.json();

        // Create a mapping of customer IDs to customer objects for quick lookup
        const customerMap = customerData.reduce((map: any, customer: Customer) => {
          map[customer.id] = customer;
          return map;
        }, {});

        setCustomers(customerMap);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
                  <Link to={`/customers/${vehicle.customerId}`} className="text-blue-600 hover:underline">
                    {customers[vehicle.customerId]?.name || 'Unknown'}
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
    </div>
  );
};

export default Vehicles;
