
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SubscriptionPlanConfig from './SubscriptionPlanConfig';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/services/data-service';
import { CreditCard, Users, Calendar } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const SubscriptionSettingsTab = () => {
  const { currentUser } = useAuthContext();
  const canManageSubscription = hasPermission(currentUser, 'settings', 'edit');
  const [additionalSeats, setAdditionalSeats] = useState(0);
  
  // Mock organization subscription data
  const subscription = {
    plan: 'Professional',
    status: 'active',
    includedSeats: 10,
    additionalSeats: 2,
    pricePerSeat: 8,
    nextBillingDate: '2023-12-01',
    paymentMethod: {
      type: 'credit_card',
      last4: '4242',
      brand: 'Visa'
    }
  };
  
  // Mock subscription invoices
  const subscriptionInvoices = [
    {
      id: 'inv-001',
      date: '2023-11-01',
      amount: 79 + (subscription.additionalSeats * subscription.pricePerSeat),
      status: 'paid',
      pdf: '#'
    },
    {
      id: 'inv-002',
      date: '2023-10-01',
      amount: 79 + (subscription.additionalSeats * subscription.pricePerSeat),
      status: 'paid',
      pdf: '#'
    },
    {
      id: 'inv-003',
      date: '2023-09-01',
      amount: 79,
      status: 'paid',
      pdf: '#'
    }
  ];
  
  const handleAddSeats = () => {
    if (additionalSeats <= 0) {
      toast.error("Please enter a positive number of seats to add");
      return;
    }
    
    toast.success(`Added ${additionalSeats} additional seats to your subscription`);
    setAdditionalSeats(0);
  };
  
  const handleUpdatePayment = () => {
    toast.success("Payment method updated successfully");
  };
  
  return (
    <div className="space-y-6">
      {/* Current Subscription Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Subscription</CardTitle>
          <CardDescription>
            Information about your current subscription plan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-lg font-semibold">{subscription.plan} Plan</div>
                <div className="text-sm text-muted-foreground capitalize">
                  Status: {subscription.status}
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {subscription.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Seats</div>
                  <div className="text-xl">{subscription.includedSeats + subscription.additionalSeats}</div>
                  <div className="text-xs text-muted-foreground">
                    {subscription.includedSeats} included + {subscription.additionalSeats} additional
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Billing</div>
                  <div className="text-xl">${subscription.pricePerSeat}/seat</div>
                  <div className="text-xs text-muted-foreground">
                    For additional seats
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Next Billing</div>
                  <div className="text-xl">{subscription.nextBillingDate}</div>
                  <div className="text-xs text-muted-foreground">
                    Auto-renews on this date
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {canManageSubscription && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="additional-seats">Add More Seats</Label>
                <div className="flex mt-1">
                  <Input
                    id="additional-seats"
                    type="number"
                    min="1"
                    value={additionalSeats}
                    onChange={(e) => setAdditionalSeats(parseInt(e.target.value) || 0)}
                    className="mr-2"
                  />
                  <Button onClick={handleAddSeats}>Add Seats</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${subscription.pricePerSeat} per seat per month
                </p>
              </div>
              
              <div>
                <Label>Payment Method</Label>
                <div className="bg-background border rounded-md p-3 mt-1">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <div className="font-medium capitalize">
                        {subscription.paymentMethod.brand} •••• {subscription.paymentMethod.last4}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleUpdatePayment}>
                      Update
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Billing History Card */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View your past subscription invoices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-3">Invoice</th>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3">Amount</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {subscriptionInvoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b">
                    <td className="px-6 py-4 font-medium">{invoice.id}</td>
                    <td className="px-6 py-4">{invoice.date}</td>
                    <td className="px-6 py-4">${invoice.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 capitalize">
                      <Badge variant={invoice.status === 'paid' ? 'success' : 'destructive'}>
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="link" size="sm" asChild>
                        <a href={invoice.pdf} target="_blank" rel="noopener noreferrer">Download</a>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Plan Configuration (Only visible for users with permission) */}
      {canManageSubscription && (
        <SubscriptionPlanConfig />
      )}
    </div>
  );
};

export default SubscriptionSettingsTab;
