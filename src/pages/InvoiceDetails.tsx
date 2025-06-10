import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { calculateInvoiceTotal } from '@/services/data-service';
import { Invoice } from '@/types';
import { resolvePromiseAndSetState } from '@/utils/async-helpers';
import { useDataContext } from '@/context/data/DataContext';

const InvoiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const {
    getInvoiceById
  } = useDataContext();

  useEffect(() => {
    const loadInvoice = async () => {
      setLoading(true);
      if (id) {
        const resp = await getInvoiceById(id);
        setInvoice(resp);
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

  const { subtotal, tax, total, paidAmount, balanceDue } = calculateInvoiceTotal(invoice);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Invoice Details</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Invoice #{invoice.id.substring(0, 8)}</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
            invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
            {invoice.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Customer Details</h3>
            <p>Customer ID: {invoice.customer_id}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">Vehicle Details</h3>
            <p>Vehicle: {invoice.vehicleInfo.make} {invoice.vehicleInfo.model} ({invoice.vehicleInfo.year})</p>
            <p>License Plate: {invoice.vehicleInfo.license_plate}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-2">Invoice Items</h3>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{item.description}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm">{item.type}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{item.quantity}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right">${item.price.toFixed(2)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-right">${(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-6">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Tax ({(invoice.tax_rate * 100).toFixed(0)}%):</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b font-medium">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-green-600">
                <span>Paid:</span>
                <span>${paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold">
                <span>Balance Due:</span>
                <span>${balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">Notes</h3>
            <p className="text-gray-600">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetails;
