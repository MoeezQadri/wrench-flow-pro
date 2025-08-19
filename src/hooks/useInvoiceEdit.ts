import { useState, useCallback } from 'react';
import { Invoice } from '@/types';
import { updateInvoiceService } from '@/services/invoice-service';
import { toast } from 'sonner';

export const useInvoiceEdit = () => {
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
      
      // Create timeout promise to prevent infinite loading
      const updatePromise = updateInvoiceService(invoiceData);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Update timed out after 30 seconds')), 30000);
      });
      
      const result = await Promise.race([updatePromise, timeoutPromise]);
      
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