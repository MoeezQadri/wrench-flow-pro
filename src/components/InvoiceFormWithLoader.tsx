import React, { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDataContext } from '@/context/data/DataContext';
import { useIncrementalDataLoading } from '@/hooks/useIncrementalDataLoading';
import { Invoice } from '@/types';

const InvoiceForm = React.lazy(() => import('@/components/InvoiceForm'));

interface InvoiceFormWithLoaderProps {
  isEditing?: boolean;
  invoiceData?: Invoice | null;
  preselectedCustomerId?: string;
}

export function InvoiceFormWithLoader({ isEditing = false, invoiceData = null, preselectedCustomerId }: InvoiceFormWithLoaderProps) {
  const { customers, parts, tasks, mechanics } = useDataContext();
  const { loadMultipleDataTypes, getLoadingState } = useIncrementalDataLoading();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadRequiredData = async () => {
      // Check what data we need
      const dataRequirements = [
        { dataType: 'customers' as const, loadFunction: async () => {}, priority: 'high' as const },
        { dataType: 'parts' as const, loadFunction: async () => {}, priority: 'low' as const },
        { dataType: 'tasks' as const, loadFunction: async () => {}, priority: 'low' as const },
        { dataType: 'mechanics' as const, loadFunction: async () => {}, priority: 'low' as const }
      ];

      await loadMultipleDataTypes(dataRequirements);
    };

    loadRequiredData();
  }, [loadMultipleDataTypes]);

  // Check if minimum required data is available
  useEffect(() => {
    const hasMinimumData = customers && customers.length >= 0; // Even empty array is fine
    const customersLoaded = !getLoadingState('customers').isLoading;
    
    if (hasMinimumData && customersLoaded) {
      setIsReady(true);
    }
  }, [customers, getLoadingState]);

  if (!isReady) {
    return <InvoiceFormSkeleton />;
  }

  return (
    <React.Suspense fallback={<InvoiceFormSkeleton />}>
      <InvoiceForm isEditing={isEditing} invoiceData={invoiceData} preselectedCustomerId={preselectedCustomerId} />
    </React.Suspense>
  );
}

function InvoiceFormSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div>
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 border rounded">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}