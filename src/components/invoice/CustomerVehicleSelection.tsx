
import React, { useState, useEffect } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Customer, Vehicle } from "@/types";
import { useDataContext } from '@/context/data/DataContext';
import { Link } from "react-router-dom";

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
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const {
    customers,
    getVehiclesByCustomerId
  } = useDataContext();

  useEffect(() => {
    const loadVehicles = async () => {
      if (selectedCustomerId) {
        const fetchedVehicles = await getVehiclesByCustomerId(selectedCustomerId);
        setVehicles(fetchedVehicles);
      } else {
        setVehicles([]);
      }
    };

    loadVehicles();
  }, [selectedCustomerId]); // Only depend on selectedCustomerId

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="flex justify-between items-end mb-2">
          <Label htmlFor="customer">Customer</Label>
          <Link to="/customers/new">
            <Button type="button" variant="ghost" size="sm" className="h-8">
              <PlusCircle className="h-4 w-4 mr-1" />
              Add New
            </Button>
          </Link>
        </div>
        <Select value={selectedCustomerId} onValueChange={(value) => {
          onCustomerIdChange(value);
          onVehicleIdChange(""); // Reset vehicle selection when customer changes
        }} required>
          <SelectTrigger id="customer">
            <SelectValue placeholder="Select a customer" />
          </SelectTrigger>
          <SelectContent>
            {customers.length === 0 ? (
              <SelectItem value="no-customers" disabled>No customers available</SelectItem>
            ) : (
              customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex justify-between items-end mb-2">
          <Label htmlFor="vehicle">Vehicle</Label>
          {selectedCustomerId && (
            <Link to={`/vehicles/new?customerId=${selectedCustomerId}`}>
              <Button type="button" variant="ghost" size="sm" className="h-8">
                <PlusCircle className="h-4 w-4 mr-1" />
                Add New
              </Button>
            </Link>
          )}
        </div>
        <Select value={selectedVehicleId} onValueChange={onVehicleIdChange} required={vehicles.length > 0}>
          <SelectTrigger id="vehicle" disabled={!selectedCustomerId}>
            <SelectValue placeholder={!selectedCustomerId ? "Select a customer first" : "Select a vehicle"} />
          </SelectTrigger>
          <SelectContent>
            {vehicles.length === 0 ? (
              <SelectItem value="no-vehicles" disabled>
                {selectedCustomerId ? "No vehicles found for this customer" : "Please select a customer first"}
              </SelectItem>
            ) : (
              vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model} ({vehicle.license_plate})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CustomerVehicleSelection;
