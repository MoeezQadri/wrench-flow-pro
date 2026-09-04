import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDataContext } from '@/context/data/DataContext';
import type { Invoice } from '@/types';

interface DeleteInvoiceDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  formattedTotal: string;
  onDeleted?: () => void;
}

const DeleteInvoiceDialog: React.FC<DeleteInvoiceDialogProps> = ({
  invoice,
  open,
  onOpenChange,
  customerName,
  formattedTotal,
  onDeleted,
}) => {
  const { removeInvoice } = useDataContext();
  const [isDeleting, setIsDeleting] = useState(false);

  const isEstimate = invoice?.status === 'estimate' || invoice?.status === 'declined';
  const documentLabel = isEstimate ? 'estimate' : 'invoice';

  const handleDelete = async () => {
    if (!invoice) return;
    setIsDeleting(true);
    try {
      await removeInvoice(invoice.id);
      onOpenChange(false);
      onDeleted?.();
    } catch {
      // The data layer already surfaces the reason (e.g. payments recorded).
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this {documentLabel}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {documentLabel === 'estimate' ? 'Estimate' : 'Invoice'} #
                {invoice?.id.substring(0, 8)} for <strong>{customerName}</strong> totalling{' '}
                <strong>{formattedTotal}</strong> will be permanently removed.
              </p>
              <p>
                Line items are removed, any parts taken from stock are returned, purchase
                expenses created by this {documentLabel} are deleted, and linked work orders
                stay but lose their {documentLabel} link. This cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting…' : `Delete ${documentLabel}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteInvoiceDialog;
