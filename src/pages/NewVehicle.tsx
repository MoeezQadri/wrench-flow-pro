import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Vehicle } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useDataContext } from '@/context/data/DataContext';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import VehicleFormSection, { VehicleFormValues } from '@/components/vehicle/VehicleFormSection';

const NewVehicle: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const customerId = searchParams.get('customerId');
  const { currentUser } = useAuthContext();
  const { getCustomerById } = useDataContext();
  const [customerName, setCustomerName] = useState<string>('');

  // Check permissions
  const userCanManageVehicles = hasPermission(currentUser, 'vehicles', 'manage') || hasPermission(currentUser, 'vehicles', 'create');

  useEffect(() => {
    // Load customer name if customerId is provided
    if (customerId) {
      getCustomerById(customerId)
        .then(customer => {
          setCustomerName(customer?.name || 'Unknown Customer');
        })
        .catch(error => {
          console.error('Error loading customer:', error);
          setCustomerName('Unknown Customer');
        });
    }
  }, [customerId, getCustomerById]);

  if (!userCanManageVehicles) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">You don't have permission to create vehicles.</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const handleSaveVehicle = async (vehicleData: VehicleFormValues) => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .insert([{
          customer_id: vehicleData.customer_id,
          make: vehicleData.make,
          model: vehicleData.model,
          year: vehicleData.year,
          license_plate: vehicleData.license_plate,
          vin: vehicleData.vin || '',
          color: vehicleData.color || ''
        }])
        .select()
        .single();

      if (error) throw error;

      toast.success("Vehicle created successfully!");
      
      // Navigate back to the previous page or to vehicles list
      navigate(-1);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      toast.error("Failed to create vehicle");
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        <h1 className="text-2xl font-bold">Add New Vehicle</h1>
        {customerName && (
          <p className="text-muted-foreground mt-2">
            Adding vehicle for: <span className="font-medium">{customerName}</span>
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <VehicleFormSection
          onSubmit={handleSaveVehicle}
          formId="new-vehicle-form"
          preselectedCustomerId={customerId || undefined}
        />

        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" form="new-vehicle-form">
            Create Vehicle
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewVehicle;