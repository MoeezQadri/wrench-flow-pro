
import { useState } from 'react';
import { 
  PlusCircle, 
  Search, 
  Filter, 
  SortDesc, 
  FileText 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { invoices, getCustomerById, calculateInvoiceTotal } from '@/services/data-service';
import StatusBadge from '@/components/StatusBadge';
import { InvoiceStatus } from '@/types';

const Invoices = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  
  // Filter invoices based on search and status filter
  const filteredInvoices = invoices.filter(invoice => {
    const customer = getCustomerById(invoice.customerId);
    const vehicleInfo = `${invoice.vehicleInfo.make} ${invoice.vehicleInfo.model} ${invoice.vehicleInfo.year}`;
    const searchMatch = 
      vehicleInfo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.vehicleInfo.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const statusMatch = statusFilter === 'all' || invoice.status === statusFilter;
    
    return searchMatch && statusMatch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage workshop invoices</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Invoice
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center">
              <Filter className="mr-2 h-4 w-4" />
              Status: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('open')}>
              Open
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('in-progress')}>
              In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('completed')}>
              Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('paid')}>
              Paid
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="outline">
          <SortDesc className="mr-2 h-4 w-4" />
          Sort
        </Button>
      </div>
      
      {filteredInvoices.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h3 className="mt-4 text-lg font-medium">No invoices found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search or filter to find what you're looking for.
          </p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-3 font-medium text-sm">Invoice #</th>
                <th className="text-left pb-3 font-medium text-sm">Customer</th>
                <th className="text-left pb-3 font-medium text-sm">Vehicle</th>
                <th className="text-left pb-3 font-medium text-sm">Date</th>
                <th className="text-left pb-3 font-medium text-sm">Total</th>
                <th className="text-left pb-3 font-medium text-sm">Status</th>
                <th className="text-left pb-3 font-medium text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => {
                const customer = getCustomerById(invoice.customerId);
                const { total } = calculateInvoiceTotal(invoice);
                
                return (
                  <tr key={invoice.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 text-sm">#{invoice.id}</td>
                    <td className="py-3 text-sm">{customer?.name || 'Unknown'}</td>
                    <td className="py-3 text-sm">
                      {invoice.vehicleInfo.make} {invoice.vehicleInfo.model} ({invoice.vehicleInfo.year})
                    </td>
                    <td className="py-3 text-sm">{invoice.date}</td>
                    <td className="py-3 text-sm">${total.toFixed(2)}</td>
                    <td className="py-3 text-sm">
                      <StatusBadge status={invoice.status} />
                    </td>
                    <td className="py-3 text-sm">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Invoices;
