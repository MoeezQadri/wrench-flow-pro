
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, FileText, Eye, ArrowUpDown, CreditCard, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';

// Sample data - in a real app, this would come from your API
const paymentsData = [
  { id: 'INV-001', user: 'John Doe', email: 'john@example.com', amount: 99.99, status: 'paid', date: '2023-06-10T10:30:00Z', type: 'subscription', plan: 'Pro' },
  { id: 'INV-002', user: 'Jane Smith', email: 'jane@example.com', amount: 299.99, status: 'paid', date: '2023-06-09T14:45:00Z', type: 'subscription', plan: 'Enterprise' },
  { id: 'INV-003', user: 'Bob Johnson', email: 'bob@example.com', amount: 49.99, status: 'pending', date: '2023-06-11T09:15:00Z', type: 'subscription', plan: 'Basic' },
  { id: 'INV-004', user: 'Alice Williams', email: 'alice@example.com', amount: 99.99, status: 'failed', date: '2023-06-08T16:20:00Z', type: 'subscription', plan: 'Pro' },
  { id: 'INV-005', user: 'Charlie Brown', email: 'charlie@example.com', amount: 99.99, status: 'refunded', date: '2023-06-07T11:10:00Z', type: 'subscription', plan: 'Pro' },
];

const AdminPaymentManagement = () => {
  const { formatCurrency } = useOrganizationSettings();
  const [payments, setPayments] = useState(paymentsData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortColumn, setSortColumn] = useState('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Filter payments based on search term and filters
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
      payment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesPlan = planFilter === 'all' || payment.plan === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });
  
  // Sort payments
  const sortedPayments = [...filteredPayments].sort((a, b) => {
    if (sortColumn === 'date') {
      return sortDirection === 'asc' 
        ? new Date(a.date).getTime() - new Date(b.date).getTime()
        : new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortColumn === 'amount') {
      return sortDirection === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
    return 0;
  });
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  
  const handleViewPayment = (payment: any) => {
    setSelectedPayment(payment);
    setIsDialogOpen(true);
  };
  
  const handleUpdatePaymentStatus = (paymentId: string, newStatus: string) => {
    setPayments(payments.map(payment => 
      payment.id === paymentId ? { ...payment, status: newStatus } : payment
    ));
    
    setIsDialogOpen(false);
    toast.success(`Payment status updated to ${newStatus}`);
  };
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid': return { variant: 'default', icon: <CheckCircle className="h-3 w-3 mr-1" /> };
      case 'pending': return { variant: 'secondary', icon: <AlertCircle className="h-3 w-3 mr-1" /> };
      case 'failed': return { variant: 'destructive', icon: <XCircle className="h-3 w-3 mr-1" /> };
      case 'refunded': return { variant: 'outline', icon: <ArrowUpDown className="h-3 w-3 mr-1" /> };
      default: return { variant: 'outline', icon: null };
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <h2 className="text-2xl font-bold">Payment Management</h2>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" /> Export Payments
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Subscription plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPayments.map((payment) => {
                const statusBadge = getStatusBadgeVariant(payment.status);
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{payment.user}</span>
                        <span className="text-sm text-muted-foreground">{payment.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge.variant as any} className="flex items-center w-fit">
                        {statusBadge.icon}
                        <span className="capitalize">{payment.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                    <TableCell>{payment.plan}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewPayment(payment)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {sortedPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <CreditCard className="h-8 w-8 mb-2" />
                      <p>No payments found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Payment Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Payment Details - {selectedPayment?.id}</DialogTitle>
            <DialogDescription>
              View and manage payment information.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPayment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Customer</p>
                  <p>{selectedPayment.user}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Email</p>
                  <p>{selectedPayment.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Amount</p>
                  <p className="text-xl font-bold">{formatCurrency(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Status</p>
                  <div className="flex items-center">
                    <Badge 
                      variant={getStatusBadgeVariant(selectedPayment.status).variant as any} 
                      className="flex items-center w-fit"
                    >
                      {getStatusBadgeVariant(selectedPayment.status).icon}
                      <span className="capitalize">{selectedPayment.status}</span>
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Date</p>
                  <p>{new Date(selectedPayment.date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Type</p>
                  <p className="capitalize">{selectedPayment.type}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Plan</p>
                <p>{selectedPayment.plan}</p>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Update Payment Status</p>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleUpdatePaymentStatus(selectedPayment.id, 'paid')}
                    disabled={selectedPayment.status === 'paid'}
                  >
                    Mark as Paid
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleUpdatePaymentStatus(selectedPayment.id, 'pending')}
                    disabled={selectedPayment.status === 'pending'}
                  >
                    Mark as Pending
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleUpdatePaymentStatus(selectedPayment.id, 'refunded')}
                    disabled={selectedPayment.status === 'refunded'}
                  >
                    Mark as Refunded
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPaymentManagement;
