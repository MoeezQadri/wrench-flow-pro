
import React, { useState, useEffect, useRef } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw } from "lucide-react";
import { Customer, Vehicle } from "@/types";
import { useDataContext } from '@/context/data/DataContext';
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface CustomerVehicleSelectionProps {
  selectedCustomerId: string;
  onCustomerIdChange: (customerId: string) => void;
  selectedVehicleId: string;
  onVehicleIdChange: (vehicleId: string) => void;
  isEditing?: boolean;
  vehicleInfo?: {
    make: string;
    model: string;
    year: string;
    license_plate: string;
  };
}

const CustomerVehicleSelection: React.FC<CustomerVehicleSelectionProps> = ({
  selectedCustomerId,
  onCustomerIdChange,
  selectedVehicleId,
  onVehicleIdChange,
  isEditing = false,
  vehicleInfo,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const loadedCustomerRef = useRef<string>("");
  const hasInitiallyLoaded = useRef(false);
  
  const {
    customers,
    getVehiclesByCustomerId,
    loadCustomers
  } = useDataContext();

  // Load customers on mount if empty
  useEffect(() => {
    if (customers.length === 0 && !isLoadingCustomers) {
      console.log("No customers found, attempting to reload...");
      handleRefreshCustomers();
    }
  }, [customers.length]);

  // Load vehicles when customer is selected - optimized to prevent unnecessary calls
  useEffect(() => {
    const loadVehicles = async () => {
      // Skip if we already loaded for this customer (prevents unnecessary calls when editing)
      if (selectedCustomerId && selectedCustomerId !== loadedCustomerRef.current) {
        setIsLoadingVehicles(true);
        try {
          console.log("Loading vehicles for customer:", selectedCustomerId);
          const fetchedVehicles = await getVehiclesByCustomerId(selectedCustomerId);
          console.log("Vehicles loaded:", fetchedVehicles);
          setVehicles(fetchedVehicles);
          loadedCustomerRef.current = selectedCustomerId;
          hasInitiallyLoaded.current = true;
        } catch (error) {
          console.error("Error loading vehicles:", error);
          toast.error("Failed to load vehicles for selected customer");
          setVehicles([]);
        } finally {
          setIsLoadingVehicles(false);
        }
      } else if (!selectedCustomerId) {
        setVehicles([]);
        loadedCustomerRef.current = "";
      }
    };

    loadVehicles();
  }, [selectedCustomerId, getVehiclesByCustomerId]);

  const handleRefreshCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      console.log("Refreshing customers...");
      await loadCustomers();
      toast.success("Customers refreshed");
    } catch (error) {
      console.error("Error refreshing customers:", error);
      toast.error("Failed to refresh customers");
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  const handleCustomerChange = (value: string) => {
    onCustomerIdChange(value);
    if (!isEditing) {
      onVehicleIdChange(""); // Reset vehicle selection when customer changes, but not when editing
    }
    // Reset the loaded customer ref to allow loading vehicles for the new customer
    loadedCustomerRef.current = "";
  };

  // Find the selected vehicle to display its name - prefer from loaded vehicles, fallback to vehicleInfo
  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  
  // Get display text for the selected vehicle
  const getVehicleDisplayText = () => {
    if (selectedVehicle) {
      return `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model} (${selectedVehicle.license_plate})`;
    } else if (isEditing && vehicleInfo && selectedVehicleId) {
      // When editing, use the vehicle info from the invoice data if vehicles haven't loaded yet
      return `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.license_plate})`;
    }
    return null;
  };

  const vehicleDisplayText = getVehicleDisplayText();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div className="flex justify-between items-center mb-2 min-h-[32px]">
          <Label htmlFor="customer">Customer *</Label>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="h-8"
              onClick={handleRefreshCustomers}
              disabled={isLoadingCustomers}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {!isEditing && (
              <Link to="/customers/new">
                <Button type="button" variant="ghost" size="sm" className="h-8">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add New
                </Button>
              </Link>
            )}
          </div>
        </div>
        <Select 
          value={selectedCustomerId} 
          onValueChange={handleCustomerChange} 
          required
          disabled={isEditing}
        >
          <SelectTrigger id="customer">
            <SelectValue placeholder={isLoadingCustomers ? "Loading customers..." : "Select a customer"} />
          </SelectTrigger>
          <SelectContent>
            {customers.length === 0 ? (
              <SelectItem value="no-customers" disabled>
                {isLoadingCustomers ? "Loading customers..." : "No customers available - click Refresh or Add New"}
              </SelectItem>
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
        <div className="flex justify-between items-center mb-2 min-h-[32px]">
          <Label htmlFor="vehicle">Vehicle *</Label>
          <div className="flex gap-2">
            {selectedCustomerId && !isEditing && (
              <Link to={`/vehicles/new?customerId=${selectedCustomerId}`}>
                <Button type="button" variant="ghost" size="sm" className="h-8">
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add New
                </Button>
              </Link>
            )}
          </div>
        </div>
        <Select 
          value={selectedVehicleId} 
          onValueChange={onVehicleIdChange} 
          required={vehicles.length > 0}
          disabled={!selectedCustomerId || isLoadingVehicles}
        >
          <SelectTrigger id="vehicle">
            <SelectValue 
              placeholder={
                !selectedCustomerId 
                  ? "Select a customer first" 
                  : isLoadingVehicles 
                    ? "Loading vehicles..."
                    : "Select a vehicle"
              }
            >
              {vehicleDisplayText}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {vehicles.length === 0 ? (
              <SelectItem value="no-vehicles" disabled>
                {selectedCustomerId 
                  ? (isLoadingVehicles ? "Loading vehicles..." : "No vehicles found for this customer") 
                  : "Please select a customer first"}
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
