
export interface TaskFormValues {
  title: string;
  description?: string;
  status: 'in-progress' | 'completed';
  price: number;
  taskType: 'invoice' | 'internal';
  mechanicId: string;
  vehicleId?: string;
  invoiceId?: string;
  hoursEstimated?: number;
  hoursSpent: number;
}
