import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { TabsContent, Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  Car, 
  FileText, 
  BarChart, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  DollarSign
} from 'lucide-react';
import { 
  getCustomerById, 
  getCustomerAnalytics, 
  calculateInvoiceTotal 
} from '@/services/data-service';
import StatusBadge from '@/components/StatusBadge';
import { Customer, CustomerAnalytics } from '@/types';

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load customer data
  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      setLoading(true);
      // Get customer and analytics data
      const customerData = getCustomerById(id);
      if (customerData) {
        setCustomer(customerData);
        const analyticsData = getCustomerAnalytics(id);
        setAnalytics(analyticsData);
      }
      setLoading(false);
    };
    
    loadData();
  }, [id]);
  
  // Fallback if ID is not provided
  if (!id) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Customer Not Found</CardTitle>
            <CardDescription>No customer ID was provided.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/customers">Back to Customers</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Loading Customer</CardTitle>
            <CardDescription>Please wait...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  if (!customer || !analytics) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Card className="w-[400px]">
          <CardHeader>
            <CardTitle>Customer Not Found</CardTitle>
            <CardDescription>The requested customer could not be found.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/customers">Back to Customers</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" asChild>
            <Link to="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
        </div>
        <Button asChild>
          <Link to={`/invoices/new?customer=${id}`}>
            <FileText className="mr-2 h-4 w-4" />
            New Invoice
          </Link>
        </Button>
      </div>
      
      {/* Customer Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{customer.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 sm:col-span-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{customer.address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Customer Value</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium">Lifetime Value</p>
              <p className="text-2xl font-bold">${analytics.lifetimeValue.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Total Visits</p>
              <p className="text-2xl font-bold">{analytics.totalInvoices}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Average Service</p>
              <p className="text-2xl font-bold">${analytics.averageInvoiceValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabs for Vehicles, Invoices, Service History */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="overview">Vehicles</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="history">Service History</TabsTrigger>
        </TabsList>
        
        {/* Vehicles Tab */}
        <TabsContent value="overview" className="space-y-4">
          <h2 className="text-xl font-semibold">Customer Vehicles</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analytics.vehicles.map((vehicle) => (
              <Card key={vehicle.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-md">{vehicle.make} {vehicle.model}</CardTitle>
                    <Car className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription>{vehicle.year} • {vehicle.color}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 text-sm">
                      <span className="font-medium">License:</span>
                      <span>{vehicle.licensePlate}</span>
                    </div>
                    {vehicle.vin && (
                      <div className="grid grid-cols-2 text-sm">
                        <span className="font-medium">VIN:</span>
                        <span className="truncate" title={vehicle.vin}>{vehicle.vin}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 text-sm">
                      <span className="font-medium">Service Count:</span>
                      <span>{analytics.invoiceHistory.filter(i => i.vehicleId === vehicle.id).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="flex flex-col items-center justify-center h-full p-6 border-dashed">
              <Car className="h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="font-medium mb-1">Add Vehicle</h3>
              <p className="text-sm text-muted-foreground text-center mb-3">Register a new vehicle for this customer</p>
              <Button variant="outline">Add Vehicle</Button>
            </Card>
          </div>
        </TabsContent>
        
        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Customer Invoices</h2>
            <Button>
              <FileText className="mr-2 h-4 w-4" />
              New Invoice
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.invoiceHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                        No invoices found for this customer
                      </TableCell>
                    </TableRow>
                  ) : (
                    analytics.invoiceHistory.map((invoice) => {
                      const { total } = calculateInvoiceTotal(invoice);
                      const vehicle = analytics.vehicles.find(v => v.id === invoice.vehicleId);
                      
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell>#{invoice.id}</TableCell>
                          <TableCell>{invoice.date}</TableCell>
                          <TableCell>
                            {vehicle?.make} {vehicle?.model} ({vehicle?.year})
                          </TableCell>
                          <TableCell>${total.toFixed(2)}</TableCell>
                          <TableCell>
                            <StatusBadge status={invoice.status} />
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">View</Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Service History Tab */}
        <TabsContent value="history" className="space-y-4">
          <h2 className="text-xl font-semibold">Service History</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-8">
                {analytics.invoiceHistory.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    No service history found for this customer
                  </div>
                ) : (
                  analytics.invoiceHistory
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((invoice) => {
                      const vehicle = analytics.vehicles.find(v => v.id === invoice.vehicleId);
                      
                      return (
                        <div key={invoice.id} className="relative pl-6 pb-6 border-l-2 border-muted last:border-0 last:pb-0">
                          <div className="absolute -left-1.5 top-0">
                            <div className="h-3 w-3 rounded-full bg-primary" />
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div>
                              <p className="font-medium">{invoice.date} - {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</p>
                              <p className="text-sm text-muted-foreground">
                                {vehicle?.make} {vehicle?.model} • {vehicle?.licensePlate}
                              </p>
                            </div>
                            <Button variant="outline" size="sm">
                              <FileText className="mr-2 h-4 w-4" />
                              View Invoice
                            </Button>
                          </div>
                          <div className="mt-2 text-sm">
                            <p className="font-medium">Services Performed:</p>
                            <ul className="list-disc list-inside pl-2 mt-1">
                              {invoice.items
                                .filter(item => item.type === 'labor')
                                .map(item => (
                                  <li key={item.id}>{item.description}</li>
                                ))}
                            </ul>
                          </div>
                          {invoice.notes && (
                            <div className="mt-2 text-sm">
                              <p className="font-medium">Notes:</p>
                              <p className="text-muted-foreground">{invoice.notes}</p>
                            </div>
                          )}
                        </div>
                      );
                    })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDetail;
