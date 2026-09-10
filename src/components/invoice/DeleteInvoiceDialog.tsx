import React, { useEffect, useState } from 'react';
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
import { getInvoiceDeletePreview, type InvoiceDeletePreview } from '@/services/optimized-invoice-service';
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
  const [preview, setPreview] = useState<InvoiceDeletePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const isEstimate = invoice?.status === 'estimate' || invoice?.status === 'declined';
  const documentLabel = isEstimate ? 'estimate' : 'invoice';

  useEffect(() => {
    if (!open || !invoice) {
      setPreview(null);
      setPreviewError(null);
      return;
    }

    let active = true;
    getInvoiceDeletePreview(invoice.id)
      .then(result => {
        if (active) setPreview(result);
      })
      .catch(error => {
        if (active) setPreviewError(error instanceof Error ? error.message : 'Could not load the details');
      });

    return () => {
      active = false;
    };
  }, [open, invoice]);

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

  const hasPayments = (preview?.payment_count || 0) > 0;

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

              {hasPayments ? (
                <p className="text-destructive">
                  This {documentLabel} has {preview?.payment_count} payment
                  {(preview?.payment_count || 0) > 1 ? 's' : ''} recorded. Remove the payments
                  first, then delete it.
                </p>
              ) : (
                <>
                  {preview && preview.parts_restored.length > 0 && (
                    <div>
                      <p>These parts go back into stock:</p>
                      <ul className="list-disc pl-5">
                        {preview.parts_restored.map(part => (
                          <li key={part.part_id}>
                            {part.name} — {part.quantity}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {preview && preview.parts_restored.length === 0 && (
                    <p>No parts go back into stock.</p>
                  )}
                  <p>
                    {preview?.task_count || 0} job{(preview?.task_count || 0) === 1 ? '' : 's'} will be
                    released and can be billed again on a new {documentLabel}.
                    {(preview?.expense_count || 0) > 0
                      ? ` ${preview?.expense_count} purchase bill${(preview?.expense_count || 0) === 1 ? '' : 's'} raised by this ${documentLabel} will be removed.`
                      : ''}
                  </p>
                  <p>This cannot be undone.</p>
                </>
              )}

              {previewError && <p className="text-destructive">{previewError}</p>}
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
            disabled={isDeleting || hasPayments}
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
