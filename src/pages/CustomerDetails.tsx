
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchCustomerById } from '@/services/supabase-service';
import { Customer } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const loadCustomer = async () => {
        try {
          const customerData = await fetchCustomerById(id);
          setCustomer(customerData);
        } catch (error) {
          console.error('Error loading customer:', error);
        } finally {
          setLoading(false);
        }
      };

      loadCustomer();
    }
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-48">Loading customer details...</div>;
  }

  if (!customer) {
    return <div className="text-center py-8">Customer not found</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Customer Details</h1>

      <Card>
        <CardHeader>
          <CardTitle>{customer.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium">Contact Information</h3>
              <div className="mt-2 space-y-2">
                <p><span className="font-medium">Email:</span> {customer.email || 'N/A'}</p>
                <p><span className="font-medium">Phone:</span> {customer.phone || 'N/A'}</p>
                <p><span className="font-medium">Address:</span> {customer.address || 'N/A'}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium">Customer Statistics</h3>
              <div className="mt-2 space-y-2">
                <p><span className="font-medium">Total Visits:</span> {customer.totalVisits || 0}</p>
                <p><span className="font-medium">Lifetime Value:</span> ${customer.lifetimeValue?.toFixed(2) || '0.00'}</p>
                <p><span className="font-medium">Last Visit:</span> {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional sections for vehicles, invoices, etc. would go here */}
    </div>
  );
};

export default CustomerDetails;
