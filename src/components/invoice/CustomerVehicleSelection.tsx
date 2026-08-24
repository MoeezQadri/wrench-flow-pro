import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PlusCircle, RefreshCw } from "lucide-react";
import { Customer, Vehicle } from "@/types";
import { useDataContext } from '@/context/data/DataContext';
import { toast } from "sonner";
import VehicleDialog from "@/components/VehicleDialog";
import CustomerQuickAddDialog from "@/components/customer/CustomerQuickAddDialog";
import { SearchableSelect, SearchableOption } from "@/components/ui/searchable-select";

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

const customerToOption = (customer: Customer): SearchableOption => ({
  value: customer.id,
  label: customer.name,
  description: [customer.phone, customer.email].filter(Boolean).join(' • ') || undefined,
});

const vehicleToOption = (vehicle: Vehicle): SearchableOption => ({
  value: vehicle.id,
  label: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
  description: vehicle.license_plate || undefined,
});

const CustomerVehicleSelection: React.FC<CustomerVehicleSelectionProps> = ({
  selectedCustomerId,
  onCustomerIdChange,
  selectedVehicleId,
  onVehicleIdChange,
  isEditing = false,
  vehicleInfo
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [extraCustomers, setExtraCustomers] = useState<Customer[]>([]);
  const loadedCustomerRef = useRef<string>("");
  const hasInitiallyLoaded = useRef(false);
  const {
    customers,
    getVehiclesByCustomerId,
    searchVehicles,
    loadCustomers,
    searchCustomers,
    addVehicle,
    addCustomer,
    getCustomerById
  } = useDataContext();

  // Load customers on mount if empty
  useEffect(() => {
    if (customers.length === 0 && !isLoadingCustomers) {
      handleRefreshCustomers(true);
    }
  }, [customers.length]);

  // When editing (or after picking a searched customer), make sure the selected
  // customer is available locally so its name renders.
  useEffect(() => {
    const hydrateSelectedCustomer = async () => {
      if (!selectedCustomerId) return;
      const known =
        customers.some(c => c.id === selectedCustomerId) ||
        extraCustomers.some(c => c.id === selectedCustomerId);
      if (known) return;

      const fetched = await getCustomerById(selectedCustomerId);
      if (fetched) {
        setExtraCustomers(prev => [...prev.filter(c => c.id !== fetched.id), fetched]);
      }
    };

    hydrateSelectedCustomer();
  }, [selectedCustomerId, customers, extraCustomers, getCustomerById]);

  // Load vehicles when customer is selected
  useEffect(() => {
    const loadVehicles = async () => {
      const needsLoading = selectedCustomerId && (
        selectedCustomerId !== loadedCustomerRef.current ||
        (isEditing && !hasInitiallyLoaded.current) ||
        (selectedVehicleId && !vehicles.find(v => v.id === selectedVehicleId))
      );

      if (needsLoading) {
        setIsLoadingVehicles(true);
        try {
          const fetchedVehicles = await getVehiclesByCustomerId(selectedCustomerId);
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
  }, [selectedCustomerId, selectedVehicleId, getVehiclesByCustomerId, isEditing]);

  const handleRefreshCustomers = async (silent = false) => {
    setIsLoadingCustomers(true);
    try {
      await loadCustomers();
      if (!silent) toast.success("Customers refreshed");
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
      onVehicleIdChange("");
    }
    loadedCustomerRef.current = "";
  };

  const handleCustomerSearch = useCallback(async (term: string): Promise<SearchableOption[]> => {
    const results = await searchCustomers(term);
    if (results.length > 0) {
      setExtraCustomers(prev => {
        const map = new Map(prev.map(c => [c.id, c]));
        results.forEach(c => map.set(c.id, c));
        return Array.from(map.values());
      });
    }
    return results.map(customerToOption);
  }, [searchCustomers]);

  const handleVehicleSearch = useCallback(async (term: string): Promise<SearchableOption[]> => {
    if (!selectedCustomerId) return [];
    const results = await searchVehicles(selectedCustomerId, term);
    return results.map(vehicleToOption);
  }, [searchVehicles, selectedCustomerId]);

  const handleAddVehicle = () => setVehicleDialogOpen(true);

  const handleVehicleSave = async (vehicle: Vehicle) => {
    try {
      const created = await addVehicle(vehicle);
      loadedCustomerRef.current = "";
      const updatedVehicles = await getVehiclesByCustomerId(selectedCustomerId);
      setVehicles(updatedVehicles);
      loadedCustomerRef.current = selectedCustomerId;
      const vehicleIdToSelect = created?.id || vehicle.id;
      onVehicleIdChange(vehicleIdToSelect);
      toast.success("Vehicle added successfully!");
    } catch (error) {
      console.error("Error adding vehicle:", error);
      toast.error("Failed to add vehicle");
    }
  };

  const handleCustomerSave = async (customer: Partial<Customer>) => {
    const created = await addCustomer(customer as Customer);
    if (created) {
      setExtraCustomers(prev => [...prev.filter(c => c.id !== created.id), created]);
      onCustomerIdChange(created.id);
      onVehicleIdChange("");
      loadedCustomerRef.current = "";
      toast.success("Customer added and selected");
    }
  };

  const allCustomers = React.useMemo(() => {
    const map = new Map<string, Customer>();
    customers.forEach(c => map.set(c.id, c));
    extraCustomers.forEach(c => { if (!map.has(c.id)) map.set(c.id, c); });
    return Array.from(map.values());
  }, [customers, extraCustomers]);

  const customerOptions = React.useMemo(
    () => allCustomers.map(customerToOption),
    [allCustomers]
  );
  const vehicleOptions = React.useMemo(() => vehicles.map(vehicleToOption), [vehicles]);

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);
  const vehicleFallbackLabel = !selectedVehicle && isEditing && vehicleInfo && selectedVehicleId
    ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} (${vehicleInfo.license_plate})`
    : undefined;

  if (isEditing) {
    const selectedCustomer = allCustomers.find(c => c.id === selectedCustomerId);
    const customerName = selectedCustomer?.name || "Loading customer...";
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Customer</Label>
          <div className="mt-2 p-3 border rounded-md bg-muted/50">
            <p className="font-medium">{customerName}</p>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-muted-foreground">Vehicle</Label>
          <div className="mt-2 p-3 border rounded-md bg-muted/50">
            {vehicleInfo ? (
              <p className="font-medium">
                {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model} ({vehicleInfo.license_plate})
              </p>
            ) : (
              <p className="font-medium text-muted-foreground">Loading vehicle...</p>
            )}
          </div>
        </div>
      </div>
    );
  }

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
              onClick={() => handleRefreshCustomers()}
              disabled={isLoadingCustomers}
              aria-label="Refresh customers"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingCustomers ? 'animate-spin' : ''}`} />
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setCustomerDialogOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Customer
            </Button>
          </div>
        </div>
        <SearchableSelect
          id="customer"
          value={selectedCustomerId}
          onChange={handleCustomerChange}
          options={customerOptions}
          onSearch={handleCustomerSearch}
          placeholder="Select a customer"
          searchPlaceholder="Search by name, phone or email..."
          emptyText="No customers match your search"
          loading={isLoadingCustomers && customerOptions.length === 0}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Type to search all customers, not just the recent ones.
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2 min-h-[32px]">
          <Label htmlFor="vehicle">Vehicle *</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddVehicle}
              disabled={!selectedCustomerId}
              title={!selectedCustomerId ? "Select a customer first" : "Add a vehicle"}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              Add Vehicle
            </Button>
          </div>
        </div>
        <SearchableSelect
          id="vehicle"
          value={selectedVehicleId}
          onChange={onVehicleIdChange}
          options={vehicleOptions}
          onSearch={handleVehicleSearch}
          placeholder={!selectedCustomerId ? "Select a customer first" : "Select a vehicle"}
          searchPlaceholder="Search by make, model or plate..."
          emptyText={selectedCustomerId ? "No vehicles found for this customer" : "Select a customer first"}
          disabled={!selectedCustomerId}
          loading={isLoadingVehicles}
          selectedLabel={vehicleFallbackLabel}
        />
      </div>

      <VehicleDialog
        open={vehicleDialogOpen}
        onOpenChange={setVehicleDialogOpen}
        onSave={handleVehicleSave}
        customerId={selectedCustomerId}
      />

      <CustomerQuickAddDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onSave={handleCustomerSave}
      />
    </div>
  );
};

export default CustomerVehicleSelection;
