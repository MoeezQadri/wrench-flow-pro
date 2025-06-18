
export interface VehicleFormValues {
  customer_id: string;
  make: string;
  model: string;
  year: string; // Keep as string to match Vehicle interface
  license_plate: string;
  vin?: string;
  color?: string;
}
