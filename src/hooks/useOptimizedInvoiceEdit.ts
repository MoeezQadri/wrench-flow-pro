import { useState, useCallback } from 'react';
import { Invoice } from '@/types';
import { updateInvoiceOptimized } from '@/services/optimized-invoice-service';
import { toast } from 'sonner';

export const useOptimizedInvoiceEdit = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateInvoice = useCallback(async (invoiceData: Invoice): Promise<Invoice | null> => {
    if (isSubmitting) {
      console.log('Update already in progress, ignoring duplicate request');
      return null;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      // Show progress indication
      toast.loading('Updating invoice...', { id: 'invoice-update' });
      
      const result = await updateInvoiceOptimized(invoiceData);
      
      toast.dismiss('invoice-update');
      toast.success('Invoice updated successfully!');
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Invoice update failed:', err);
      
      toast.dismiss('invoice-update');
      toast.error(`Failed to update invoice: ${errorMessage}`);
      
      setError(errorMessage);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    updateInvoice,
    isSubmitting,
    error,
    clearError
  };
};