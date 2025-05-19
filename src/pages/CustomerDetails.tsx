
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCustomerById } from '@/services/data-service';
import { Customer } from '@/types';

const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const loadCustomer = async () => {
      setLoading(true);
      if (id) {
        const customerData = getCustomerById(id);
        if (customerData) {
          setCustomer(customerData);
        }
      }
      setLoading(false);
    };
    
    loadCustomer();
  }, [id]);
  
  if (loading) {
    return <div>Loading customer details...</div>;
  }
  
  if (!customer) {
    return <div>Customer not found</div>;
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Customer Details</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold">{customer.name}</h2>
        <div className="mt-4">
          <p><span className="font-medium">Email:</span> {customer.email}</p>
          <p><span className="font-medium">Phone:</span> {customer.phone}</p>
          <p><span className="font-medium">Address:</span> {customer.address}</p>
          <p><span className="font-medium">Total Visits:</span> {customer.totalVisits}</p>
          <p><span className="font-medium">Lifetime Value:</span> ${customer.lifetimeValue?.toFixed(2)}</p>
          <p><span className="font-medium">Last Visit:</span> {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'N/A'}</p>
        </div>
        
        {/* Additional sections for vehicles, invoices, etc. can be added here */}
      </div>
    </div>
  );
};

export default CustomerDetails;
