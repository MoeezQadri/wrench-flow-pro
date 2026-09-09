import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import BillPartDetails from '@/components/vendor/BillPartDetails';
import { TrendingDown, Building, CreditCard } from 'lucide-react';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { useDataContext } from '@/context/data/DataContext';
import { PayableDialog } from '@/components/payable/PayableDialog';
import { Payable } from '@/types';
import { formatOrgDate, orgToday, toOrgDateInputValue } from '@/utils/datetime';

const outstandingOf = (p: Payable) => Math.max(0, (p.amount || 0) - (p.paid_amount || 0));

const Finance = () => {
  const { formatCurrency } = useOrganizationSettings();
  const {
    payables,
    markPayableAsPaid,
    vendors,
    loadPayables,
  } = useDataContext();

  const [selectedPayable, setSelectedPayable] = useState<Payable | undefined>();
  const [isPayableDialogOpen, setIsPayableDialogOpen] = useState(false);

  useEffect(() => {
    loadPayables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unpaidBills = payables.filter(p => p.status !== 'paid' && p.status !== 'cancelled' && outstandingOf(p) > 0);
  const paidBills = payables.filter(p => p.status === 'paid' || outstandingOf(p) === 0);

  // What is still owed on bills
  const totalPayables = unpaidBills.reduce((sum, p) => sum + outstandingOf(p), 0);

  const overduePayables = unpaidBills
    .filter(p => p.due_date && toOrgDateInputValue(p.due_date) < orgToday())
    .reduce((sum, p) => sum + outstandingOf(p), 0);

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
          <h1 className="text-3xl font-bold">Payable Management</h1>
          <p className="text-muted-foreground">Bills the workshop owes and payments made against them</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payables</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words text-red-600">{formatCurrency(totalPayables)}</div>
            <p className="text-xs text-muted-foreground">
              {unpaidBills.length} unpaid bill{unpaidBills.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Bills</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold break-words text-orange-600">{formatCurrency(overduePayables)}</div>
            <p className="text-xs text-muted-foreground">Past the due date</p>
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

      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
          <p className="text-sm text-muted-foreground">
            Bills are created automatically when an expense is recorded or parts are purchased.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="unpaid">
            <TabsList>
              <TabsTrigger value="unpaid">Unpaid ({unpaidBills.length})</TabsTrigger>
              <TabsTrigger value="paid">Paid ({paidBills.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="unpaid" className="space-y-3 pt-4">
              {unpaidBills.map((payable) => (
                <div 
                  key={payable.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handlePayableClick(payable)}
                >
                  <div>
                    <p className="font-medium">{payable.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {payable.due_date ? `Due: ${formatOrgDate(payable.due_date)}` : 'No due date'}
                      {(payable.paid_amount || 0) > 0 && ` · ${formatCurrency(payable.paid_amount || 0)} already paid`}
                    </p>
                    <BillPartDetails bill={payable} />
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-semibold">{formatCurrency(outstandingOf(payable))}</p>
                    <Button size="sm" variant="outline">
                      Record payment
                    </Button>
                  </div>
                </div>
              ))}
              {unpaidBills.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No unpaid bills</p>
              )}
            </TabsContent>

            <TabsContent value="paid" className="space-y-3 pt-4">
              {paidBills.slice(0, 50).map((payable) => (
                <div 
                  key={payable.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => handlePayableClick(payable)}
                >
                  <div>
                    <p className="font-medium">{payable.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {payable.payment_date ? `Paid: ${formatOrgDate(payable.payment_date)}` : 'Paid'}
                      {payable.payment_method ? ` · ${payable.payment_method}` : ''}
                    </p>
                    <BillPartDetails bill={payable} />
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(payable.amount)}</p>
                    <Badge variant="secondary">Paid</Badge>
                  </div>
                </div>
              ))}
              {paidBills.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No paid bills yet</p>
              )}
            </TabsContent>
          </Tabs>
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
