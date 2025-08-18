import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { Vendor } from "@/types";
import { useDataContext } from "@/context/data/DataContext";
import VendorDialog from "./VendorDialog";
import VendorList from "./VendorList";

interface VendorManagementProps {
  onClose?: () => void;
}

const VendorManagement = ({ onClose }: VendorManagementProps) => {
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | undefined>();
  const { vendors, refreshAllData } = useDataContext();

  const handleAddVendor = () => {
    setSelectedVendor(undefined);
    setShowVendorDialog(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowVendorDialog(true);
  };

  const handleVendorSaved = () => {
    refreshAllData();
    setShowVendorDialog(false);
    setSelectedVendor(undefined);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Vendor Management
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleAddVendor} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Vendor
              </Button>
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <VendorList vendors={vendors} onEditVendor={handleEditVendor} />
        </CardContent>
      </Card>

      <VendorDialog
        open={showVendorDialog}
        onOpenChange={setShowVendorDialog}
        onVendorSaved={handleVendorSaved}
        vendor={selectedVendor}
      />
    </>
  );
};

export default VendorManagement;