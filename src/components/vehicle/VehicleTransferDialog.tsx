import React, { useState } from 'react';
import { Vehicle, Customer } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Car, User, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VehicleTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: Vehicle | null;
  customers: Customer[];
  currentCustomer: Customer | null;
  onTransfer: (vehicleId: string, newCustomerId: string) => Promise<void>;
}

export const VehicleTransferDialog: React.FC<VehicleTransferDialogProps> = ({
  open,
  onOpenChange,
  vehicle,
  customers,
  currentCustomer,
  onTransfer
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState(false);
  const { toast } = useToast();

  // Filter out the current customer from the list
  const availableCustomers = customers.filter(customer => 
    customer.id !== currentCustomer?.id
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleTransfer = async () => {
    if (!vehicle || !selectedCustomerId) return;

    setIsTransferring(true);
    try {
      await onTransfer(vehicle.id, selectedCustomerId);
      toast({
        title: "Vehicle transferred successfully",
        description: `${vehicle.year} ${vehicle.make} ${vehicle.model} has been transferred to ${selectedCustomer?.name}.`
      });
      onOpenChange(false);
      setSelectedCustomerId('');
    } catch (error) {
      toast({
        title: "Transfer failed",
        description: "Could not transfer the vehicle. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedCustomerId('');
  };

  if (!vehicle) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transfer Vehicle</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vehicle Details */}
          <Card className="border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-primary" />
                <div>
                  <h4 className="font-semibold">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    License Plate: {vehicle.license_plate}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transfer From/To */}
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
              {/* From Customer */}
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">From</p>
                      <p className="font-medium">{currentCustomer?.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Arrow */}
              <ArrowRight className="h-5 w-5 text-muted-foreground" />

              {/* To Customer */}
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">To</p>
                      <p className="font-medium">
                        {selectedCustomer?.name || 'Select customer'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Customer Selection */}
            <div className="space-y-2">
              <Label htmlFor="customer-select">Select new customer</Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger id="customer-select">
                  <SelectValue placeholder="Choose a customer to transfer to..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div className="flex flex-col">
                        <span>{customer.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {customer.email}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {availableCustomers.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No other customers available for transfer.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedCustomerId || isTransferring || availableCustomers.length === 0}
          >
            {isTransferring ? 'Transferring...' : 'Transfer Vehicle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};