import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchCustomers, fetchVehiclesByCustomerId } from "@/services/data-service";
import { Customer, Vehicle } from "@/types";

interface CustomerVehicleSelectionProps {
  selectedCustomerId: string;
  onCustomerIdChange: (customerId: string) => void;
  selectedVehicleId: string;
  onVehicleIdChange: (vehicleId: string) => void;
}

const CustomerVehicleSelection: React.FC<CustomerVehicleSelectionProps> = ({
  selectedCustomerId,
  onCustomerIdChange,
  selectedVehicleId,
  onVehicleIdChange,
}) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    const loadCustomers = async () => {
      const fetchedCustomers = await fetchCustomers();
      setCustomers(fetchedCustomers);
    };

    loadCustomers();
  }, []);

  useEffect(() => {
    const loadVehicles = async () => {
      if (selectedCustomerId) {
        const fetchedVehicles = await fetchVehiclesByCustomerId(selectedCustomerId);
        setVehicles(fetchedVehicles);
      } else {
        setVehicles([]);
      }
    };

    loadVehicles();
  }, [selectedCustomerId]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="customer">Customer</Label>
        <Select value={selectedCustomerId} onValueChange={(value) => {
          onCustomerIdChange(value);
          onVehicleIdChange(""); // Reset vehicle selection when customer changes
        }} required>
          <SelectTrigger id="customer">
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="vehicle">Vehicle</Label>
        <Select value={selectedVehicleId} onValueChange={onVehicleIdChange} required={vehicles.length > 0}>
          <SelectTrigger id="vehicle">
            <SelectValue placeholder="Select a vehicle" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.map((vehicle) => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.licensePlate})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CustomerVehicleSelection;
