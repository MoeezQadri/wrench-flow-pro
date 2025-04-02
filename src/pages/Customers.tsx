
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Search, 
  SortDesc, 
  Users,
  Car,
  FileText,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { customers, getCustomerAnalytics, getVehiclesByCustomerId } from '@/services/data-service';

const Customers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.phone.includes(searchQuery) ||
      customer.address.toLowerCase().includes(searchLower)
    );
  });
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage workshop customers</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Customer
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Button variant="outline">
          <SortDesc className="mr-2 h-4 w-4" />
          Sort
        </Button>
      </div>
      
      {filteredCustomers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <h3 className="mt-4 text-lg font-medium">No customers found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try adjusting your search to find what you're looking for.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => {
            const analytics = getCustomerAnalytics(customer.id);
            const vehicles = getVehiclesByCustomerId(customer.id);
            
            return (
              <Link to={`/customers/${customer.id}`} key={customer.id}>
                <Card className="h-full hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{customer.name}</h3>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      </div>
                      <Badge variant="outline">
                        {analytics.totalInvoices} {analytics.totalInvoices === 1 ? 'visit' : 'visits'}
                      </Badge>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="flex flex-col items-center">
                        <Car className="h-4 w-4 mb-1 text-muted-foreground" />
                        <p className="text-sm font-medium">{vehicles.length}</p>
                        <p className="text-xs text-muted-foreground">Vehicles</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <FileText className="h-4 w-4 mb-1 text-muted-foreground" />
                        <p className="text-sm font-medium">{analytics.totalInvoices}</p>
                        <p className="text-xs text-muted-foreground">Invoices</p>
                      </div>
                      <div className="flex flex-col items-center">
                        <DollarSign className="h-4 w-4 mb-1 text-muted-foreground" />
                        <p className="text-sm font-medium">${analytics.lifetimeValue.toFixed(0)}</p>
                        <p className="text-xs text-muted-foreground">Value</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center">
                      <p className="text-xs text-muted-foreground">
                        Last Visit: {customer.lastVisit || 'N/A'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Customers;
