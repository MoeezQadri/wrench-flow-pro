
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Customer, Vehicle } from '@/types';
import { useDataContext } from '@/context/data/DataContext';
import { useOrganizationSettings } from '@/hooks/useOrganizationSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Car, Phone, Mail, MapPin, Calendar, DollarSign, ArrowLeft } from 'lucide-react';

const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { formatCurrency } = useOrganizationSettings();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const {
    getCustomerById,
    getVehiclesByCustomerId
  } = useDataContext();

  useEffect(() => {
    const loadCustomerData = async () => {
      setLoading(true);
      if (id) {
        try {
          const [customerData, vehicleData] = await Promise.all([
            getCustomerById(id),
            getVehiclesByCustomerId(id)
          ]);
          setCustomer(customerData);
          setVehicles(vehicleData);
        } catch (error) {
          console.error('Error loading customer data:', error);
        }
      }
      setLoading(false);
    };

    loadCustomerData();
  }, [id, getCustomerById, getVehiclesByCustomerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading customer details...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-semibold mb-2">Customer not found</h2>
        <p className="text-muted-foreground mb-4">The customer you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/customers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-muted-foreground">Customer Details</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Customer Information Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{customer.phone || 'No phone provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{customer.address || 'No address provided'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Analytics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-2xl font-bold">{customer.total_visits || 0}</div>
              <p className="text-xs text-muted-foreground">Total Visits</p>
            </div>
            <div>
              <div className="text-2xl font-bold">{formatCurrency(customer.lifetime_value || 0)}</div>
              <p className="text-xs text-muted-foreground">Lifetime Value</p>
            </div>
            <div>
              <div className="text-sm font-medium">
                {customer.last_visit ? new Date(customer.last_visit).toLocaleDateString() : 'Never'}
              </div>
              <p className="text-xs text-muted-foreground">Last Visit</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicles ({vehicles.length})
          </CardTitle>
          <CardDescription>
            All vehicles registered to this customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-8">
              <Car className="mx-auto h-12 w-12 text-muted-foreground/60" />
              <h3 className="mt-4 text-lg font-medium">No vehicles registered</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                This customer doesn't have any vehicles registered yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vehicles.map((vehicle) => (
                <Card key={vehicle.id} className="border-border/50">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h4>
                        {vehicle.color && (
                          <Badge variant="secondary" className="text-xs">
                            {vehicle.color}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">License Plate:</span>
                          <span className="font-medium">{vehicle.license_plate}</span>
                        </div>
                        
                        {vehicle.vin && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">VIN:</span>
                            <span className="font-mono text-xs">{vehicle.vin}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Added:</span>
                          <span>{new Date(vehicle.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerDetails;
