
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vehicle } from '@/types';
import { Car, Plus, Search } from 'lucide-react';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Mock data for now - would fetch from Supabase in a real implementation
    const fetchVehicles = async () => {
      try {
        // This would be replaced with a real API call
        const mockVehicles: Vehicle[] = [
          {
            id: '1',
            customerId: 'cust1',
            make: 'Toyota',
            model: 'Camry',
            year: '2019',
            licensePlate: 'ABC123',
            vin: '1HGBH41JXMN109186',
            color: 'Silver'
          },
          {
            id: '2',
            customerId: 'cust2',
            make: 'Honda',
            model: 'Accord',
            year: '2020',
            licensePlate: 'XYZ789',
            vin: '5YJSA1E64MF410430',
            color: 'Black'
          },
          {
            id: '3',
            customerId: 'cust3',
            make: 'Ford',
            model: 'F-150',
            year: '2018',
            licensePlate: 'DEF456',
            vin: 'WVWAA71K08W201032',
            color: 'Red'
          }
        ];
        
        setVehicles(mockVehicles);
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center">
          <Car className="mr-2" /> Vehicles
        </h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Vehicle Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search by make, model, or license plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-48">
              <p>Loading vehicles...</p>
            </div>
          ) : filteredVehicles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Make/Model</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>License Plate</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>VIN</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">
                      {vehicle.make} {vehicle.model}
                    </TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>{vehicle.licensePlate}</TableCell>
                    <TableCell>{vehicle.color}</TableCell>
                    <TableCell>{vehicle.vin}</TableCell>
                    <TableCell className="text-right">
                      <Link to={`/vehicles/${vehicle.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No vehicles found matching your search</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Vehicles;
