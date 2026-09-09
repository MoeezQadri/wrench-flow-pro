import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Building, CreditCard } from 'lucide-react';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useDataContext } from '@/context/data/DataContext';
import { PayableDialog } from '@/components/payable/PayableDialog';
import { AddBillDialog } from '@/components/payable/AddBillDialog';
import { PermissionGuard } from '@/components/PermissionGuard';
import { Payable } from '@/types';
import { formatOrgDate, orgToday, toOrgDateInputValue } from '@/utils/datetime';
import { calculateTotalReceivables, calculateOverdueAmount } from '@/utils/invoice-calculations';

const outstandingOf = (p: Payable) => Math.max(0, (p.amount || 0) - (p.paid_amount || 0));

const Finance = () => {
  const { formatCurrency } = useOrganizationSettings();
  const { 
    payables, 
    markPayableAsPaid, 
    invoices, 
    vendors,
    loadPayables
  } = useDataContext();
  
  const [selectedPayable, setSelectedPayable] = useState<Payable | undefined>();
  const [isPayableDialogOpen, setIsPayableDialogOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);

  useEffect(() => {
    loadPayables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unpaidBills = payables.filter(p => p.status !== 'paid' && p.status !== 'cancelled' && outstandingOf(p) > 0);
  const paidBills = payables.filter(p => p.status === 'paid' || outstandingOf(p) === 0);

  // Money out: what is still owed on bills
  const totalPayables = unpaidBills.reduce((sum, p) => sum + outstandingOf(p), 0);

  const overduePayables = unpaidBills
    .filter(p => p.due_date && toOrgDateInputValue(p.due_date) < orgToday())
    .reduce((sum, p) => sum + outstandingOf(p), 0);

  // Money in: outstanding balances on billable invoices (same formula as reports)
  const totalReceivables = calculateTotalReceivables(invoices);
  const overdueReceivables = calculateOverdueAmount(invoices);

  const activeVendorCount = vendors.filter(v => v.is_active).length;

  const handleMarkAsPaid = async (id: string, paymentData: {
    amount: number;
    payment_method: string;
    payment_date?: string;
    notes?: string;
  }) => {
    await markPayableAsPaid(id, paymentData);
    setIsPayableDialogOpen(false);
    setSelectedPayable(undefined);
  };

  const handlePayableClick = (payable: Payable) => {
    setSelectedPayable(payable);
    setIsPayableDialogOpen(true);
  };
  

  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Finance</h1>
          <p className="text-muted-foreground">Financial overview and management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receivables</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words text-green-600">{formatCurrency(totalReceivables)}</div>
            <p className="text-xs text-muted-foreground">Outstanding invoices</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payables</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words text-red-600">{formatCurrency(totalPayables)}</div>
            <p className="text-xs text-muted-foreground">
              {payables.filter(p => p.status === 'pending').length} pending items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words text-orange-600">{formatCurrency(overduePayables)}</div>
            <p className="text-xs text-muted-foreground">Past due payables</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeVendorCount}</div>
            <p className="text-xs text-muted-foreground">Total vendors</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Payables Section */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Payables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payables
              .filter(p => p.status === 'pending')
              .slice(0, 10)
              .map((payable) => (
                <div 
                  key={payable.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handlePayableClick(payable)}
                >
                  <div>
                    <p className="font-medium">{payable.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {payable.due_date && `Due: ${formatOrgDate(payable.due_date)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(payable.amount)}</p>
                    <Button size="sm" variant="outline">
                      Pay Now
                    </Button>
                  </div>
                </div>
              ))}
            {payables.filter(p => p.status === 'pending').length === 0 && (
              <p className="text-center text-muted-foreground py-4">No pending payables</p>
            )}
          </div>
        </CardContent>
      </Card>

      <PayableDialog
        open={isPayableDialogOpen}
        onOpenChange={setIsPayableDialogOpen}
        payable={selectedPayable}
        onMarkAsPaid={handleMarkAsPaid}
      />
    </div>
  );
};

export default Finance;