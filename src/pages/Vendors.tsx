import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import PageWrapper from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { Vendor } from '@/types';
import { useDataContext } from '@/context/data/DataContext';
import VendorDialog from '@/components/vendor/VendorDialog';
import VendorList from '@/components/vendor/VendorList';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/utils/permissions';

/**
 * Vendors live on their own screen (previously a pop-up on the Parts page) so
 * bills and vendor payments have a permanent home.
 */
const Vendors: React.FC = () => {
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | undefined>();
  const { vendors, refreshAllData, loadVendors, loadPayables, loadParts } = useDataContext();
  const { currentUser } = useAuthContext();

  // Vendors, their bills and the parts those bills cover are fetched when the
  // screen opens, so it no longer depends on visiting the Parts page first.
  useEffect(() => {
    loadVendors();
    loadPayables();
    loadParts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canCreate = hasPermission(currentUser, 'vendors', 'create');

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

  const headerActions = canCreate ? (
    <Button onClick={handleAddVendor} className="flex items-center gap-2">
      <Plus className="w-4 h-4" />
      Add Vendor
    </Button>
  ) : undefined;

  return (
    <PageWrapper
      title="Vendors"
      subtitle="Vendor details, what you owe them and how you pay it"
      headerActions={headerActions}
    >
      <VendorList vendors={vendors} onEditVendor={handleEditVendor} />

      <VendorDialog
        open={showVendorDialog}
        onOpenChange={setShowVendorDialog}
        onVendorSaved={handleVendorSaved}
        vendor={selectedVendor}
      />
    </PageWrapper>
  );
};

export default Vendors;
