
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { getOrganizationById } from '@/services/auth-service';

const mockInvoiceHistory = [
  {
    id: 'inv_123',
    date: '2023-10-01',
    amount: 79.00,
    status: 'paid',
    plan: 'Professional'
  },
  {
    id: 'inv_122',
    date: '2023-09-01',
    amount: 79.00,
    status: 'paid',
    plan: 'Professional'
  },
  {
    id: 'inv_121',
    date: '2023-08-01',
    amount: 29.00,
    status: 'paid',
    plan: 'Basic'
  }
];

const InvoiceSettingsTab = () => {
  const { currentUser } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState(mockInvoiceHistory);
  
  useEffect(() => {
    if (currentUser?.organizationId) {
      // In a real implementation, you would fetch actual invoice history from your API
      // For now, we're using mock data
      setLoading(false);
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-center">Loading invoice history...</div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="mr-2 h-5 w-5" />
          Subscription Billing History
        </CardTitle>
        <CardDescription>
          View your past subscription invoices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                  <TableCell>{invoice.plan}</TableCell>
                  <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                  <TableCell className="capitalize">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No billing history available yet
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceSettingsTab;
