
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchInvoiceById } from '@/services/data-service';
import { Invoice } from '@/types';

const InvoiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const loadInvoice = async () => {
      setLoading(true);
      if (id) {
        const invoiceData = await fetchInvoiceById(id);
        if (invoiceData) {
          setInvoice(invoiceData);
        }
      }
      setLoading(false);
    };
    
    loadInvoice();
  }, [id]);
  
  if (loading) {
    return <div>Loading invoice details...</div>;
  }
  
  if (!invoice) {
    return <div>Invoice not found</div>;
  }
  
  // Calculate totals
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * invoice.taxRate;
  const total = subtotal + tax;
  const paidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balanceDue = total - paidAmount;
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Invoice Details</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">Invoice #{invoice.id}</h2>
          <span className="px-2 py-1 rounded text-white bg-blue-500">{invoice.status}</span>
        </div>
        
        <div className="mb-4">
          <p><span className="font-medium">Date:</span> {new Date(invoice.date).toLocaleDateString()}</p>
          <p><span className="font-medium">Vehicle:</span> {invoice.vehicleInfo.make} {invoice.vehicleInfo.model} ({invoice.vehicleInfo.year})</p>
          <p><span className="font-medium">License Plate:</span> {invoice.vehicleInfo.licensePlate}</p>
        </div>
        
        <h3 className="text-lg font-semibold mt-6">Items</h3>
        <table className="w-full mt-2">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map(item => (
              <tr key={item.id} className="border-b">
                <td className="py-2">{item.description}</td>
                <td className="py-2 text-right">{item.quantity}</td>
                <td className="py-2 text-right">${item.price.toFixed(2)}</td>
                <td className="py-2 text-right">${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="mt-4 flex justify-end">
          <div className="w-1/3">
            <div className="flex justify-between py-1">
              <span>Subtotal:</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Tax ({(invoice.taxRate * 100).toFixed(1)}%):</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Paid:</span>
              <span>${paidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-1 font-bold">
              <span>Balance Due:</span>
              <span>${balanceDue.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        {invoice.notes && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Notes</h3>
            <p className="mt-1">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetails;
