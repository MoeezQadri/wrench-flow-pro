
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchInvoiceById } from '@/services/supabase-service';
import { Invoice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const InvoiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const loadInvoice = async () => {
        try {
          const invoiceData = await fetchInvoiceById(id);
          setInvoice(invoiceData);
        } catch (error) {
          console.error('Error loading invoice:', error);
        } finally {
          setLoading(false);
        }
      };

      loadInvoice();
    }
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-48">Loading invoice details...</div>;
  }

  if (!invoice) {
    return <div className="text-center py-8">Invoice not found</div>;
  }

  // Calculate subtotal, tax, and total
  const subtotal = invoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * (invoice.taxRate / 100);
  const total = subtotal + tax;
  
  // Calculate total payments
  const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const balance = total - totalPaid;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Invoice #{invoice.id.substring(0, 8)}</h1>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium">Vehicle Information</h3>
              <div className="mt-2">
                {invoice.vehicleInfo && (
                  <>
                    <p>{invoice.vehicleInfo.year} {invoice.vehicleInfo.make} {invoice.vehicleInfo.model}</p>
                    <p>License Plate: {invoice.vehicleInfo.licensePlate}</p>
                  </>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium">Invoice Details</h3>
              <div className="mt-2">
                <p>Date: {new Date(invoice.date).toLocaleDateString()}</p>
                <p>Status: {invoice.status}</p>
                {invoice.notes && <p>Notes: {invoice.notes}</p>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="capitalize">{item.type}</TableCell>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">Subtotal</TableCell>
                <TableCell className="text-right">${subtotal.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">Tax ({invoice.taxRate}%)</TableCell>
                <TableCell className="text-right">${tax.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">Total</TableCell>
                <TableCell className="text-right font-bold">${total.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">Paid</TableCell>
                <TableCell className="text-right">${totalPaid.toFixed(2)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={4} className="text-right font-medium">Balance</TableCell>
                <TableCell className="text-right font-bold">
                  ${balance.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {invoice.payments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell className="capitalize">{payment.method}</TableCell>
                    <TableCell className="text-right">${payment.amount.toFixed(2)}</TableCell>
                    <TableCell>{payment.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center py-4">No payments recorded</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceDetails;
