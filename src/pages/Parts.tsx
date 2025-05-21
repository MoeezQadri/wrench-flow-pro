import React, { useState, useEffect } from 'react';
import { resolvePromiseAndSetState } from '@/utils/async-helpers';
import { useAsyncCache } from '@/hooks/useAsyncData';
import { getCustomerById } from '@/services/data-service';
import { Customer } from '@/types';

// CustomerCell component to handle async loading of customer data
const CustomerCell = ({ 
  customerId, 
  getCustomer, 
  customerCache 
}: { 
  customerId: string; 
  getCustomer: (id: string) => Promise<Customer>; 
  customerCache: Record<string, Customer> 
}) => {
  const [name, setName] = useState('Loading...');
  
  useEffect(() => {
    const loadCustomer = async () => {
      if (customerCache[customerId]) {
        setName(customerCache[customerId].name);
      } else {
        const customer = await getCustomer(customerId);
        setName(customer.name);
      }
    };
    
    loadCustomer();
  }, [customerId, getCustomer, customerCache]);
  
  return <span>{name}</span>;
};

const Parts: React.FC = () => {
  // Use the async cache hook for customer data
  const [getCustomer, customerCache] = useAsyncCache<Customer>(getCustomerById);
  
  // Rest of your component code
  // When you need to display a customer name, use the CustomerCell component:
  
  // Example usage in a table row:
  // {part.customerId ? (
  //   <CustomerCell 
  //     customerId={part.customerId} 
  //     getCustomer={getCustomer} 
  //     customerCache={customerCache}
  //   />
  // ) : 'N/A'}
  
  return (
    <div>
      {/* Your parts listing UI */}
      <h1>Parts Inventory</h1>
      {/* Replace direct access to customer names with the CustomerCell component */}
    </div>
  );
};

export default Parts;
