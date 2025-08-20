import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateInvoiceTotal } from '@/services/data-service';
import { Invoice } from '@/types';
import { useDataContext } from '@/context/data/DataContext';
import { toast } from 'sonner';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useSmartDataLoading } from '@/hooks/useSmartDataLoading';

const InvoiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const {
    getInvoiceById,
    customers,
    getVehiclesByCustomerId,
    loadInvoices,
    loadCustomers
  } = useDataContext();
  const [customerName, setCustomerName] = useState<string>('');
  const [vehicleInfo, setVehicleInfo] = useState<any>(null);
  const { formatCurrency } = useOrganizationSettings();
  const { smartLoad, isLoaded, resetLoadedState } = useSmartDataLoading();


  useEffect(() => {
    const loadInvoice = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        console.log("Loading invoice details with ID:", id);
        
        // Load data efficiently
        const loadPromises = [];
        
        // Load invoices and customers
        if (loadInvoices) {
          loadPromises.push(smartLoad('invoices', loadInvoices));
        }
        
        if (loadCustomers) {
          loadPromises.push(smartLoad('customers', loadCustomers));
        }
        
        if (loadPromises.length > 0) {
          await Promise.all(loadPromises);
        }
        
        // Get invoice from context
        const foundInvoice = getInvoiceById(id);
        console.log("Found invoice:", foundInvoice);
        
        if (foundInvoice) {
          setInvoice(foundInvoice);
          
          // Get customer name
          const customer = customers.find(c => c.id === foundInvoice.customer_id);
          setCustomerName(customer ? customer.name : 'Unknown Customer');
          
          // Get vehicle info
          if (foundInvoice.customer_id) {
            const vehicles = await getVehiclesByCustomerId(foundInvoice.customer_id);
            const vehicle = vehicles.find(v => v.id === foundInvoice.vehicle_id);
            setVehicleInfo(vehicle);
          }
        } else {
          console.error("Invoice not found with ID:", id);
          toast.error('Invoice not found');
        }
      } catch (error) {
        console.error('Error loading invoice:', error);
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [id]); // Only depend on id to prevent infinite loops

  if (loading) {
    return <div className="p-6">Loading invoice details...</div>;
  }

  if (!invoice) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Invoice not found</h2>
          <p className="text-gray-600 mb-4">The invoice you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/invoices">Back to Invoices</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { subtotal, tax, total, paidAmount, balanceDue } = calculateInvoiceTotal(invoice);

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Invoice Details</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Invoice #{invoice.id.substring(0, 8)}</h2>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
              invoice.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {invoice.status.toUpperCase()}
            </span>
            {invoice.status !== 'paid' && invoice.status !== 'completed' && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/invoices/${invoice.id}/edit`}>
                  Edit Invoice
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Customer Details</h3>
            <p className="font-semibold">{customerName}</p>
            <p className="text-sm text-gray-600">Customer ID: {invoice.customer_id.substring(0, 8)}</p>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-2">Vehicle Details</h3>
            {vehicleInfo ? (
              <>
                <p className="font-semibold">{vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}</p>
                <p className="text-sm text-gray-600">License Plate: {vehicleInfo.license_plate}</p>
                {vehicleInfo.vin && <p className="text-sm text-gray-600">VIN: {vehicleInfo.vin}</p>}
              </>
            ) : invoice.vehicleInfo ? (
              <>
                <p className="font-semibold">{invoice.vehicleInfo.year} {invoice.vehicleInfo.make} {invoice.vehicleInfo.model}</p>
                <p className="text-sm text-gray-600">License Plate: {invoice.vehicleInfo.license_plate}</p>
              </>
            ) : (
              <p className="text-gray-600">Vehicle information not available</p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-medium text-gray-700 mb-2">Invoice Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Date:</span> {new Date(invoice.date).toLocaleDateString()}
            </div>
            <div>
              <span className="text-gray-600">Tax Rate:</span> {invoice.tax_rate}%
            </div>
          </div>
        </div>

        {invoice.items && invoice.items.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">Invoice Items</h3>
            <div className="overflow-x-auto">
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
                    <tr key={item.id || index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {item.description}
                        {item.is_auto_added && (
                          <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Auto</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm capitalize">{item.type}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{item.quantity}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{formatCurrency(item.price)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{formatCurrency(item.quantity * item.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {invoice.discount_value && invoice.discount_value > 0 && (
                <div className="flex justify-between py-2 border-b text-red-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(invoice.discount_value)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b">
                <span>Tax ({(invoice.tax_rate).toFixed(1)}%):</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between py-2 border-b font-medium">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between py-2 border-b text-green-600">
                <span>Paid:</span>
                <span>{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between py-2 font-bold">
                <span>Balance Due:</span>
                <span>{formatCurrency(balanceDue)}</span>
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

        {/* Payments Section */}
        {invoice.payments && invoice.payments.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Payments</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoice.payments.map((payment, index) => (
                    <tr key={payment.id || index}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm capitalize">
                        {payment.method === "cash" ? "Cash" : 
                         payment.method === "card" ? "Card" : 
                         payment.method === "bank_transfer" ? "Bank Transfer" :
                         payment.method === "check" ? "Check" : payment.method}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        {payment.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceDetails;
