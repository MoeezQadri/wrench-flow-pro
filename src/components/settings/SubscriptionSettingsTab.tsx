import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SubscriptionPlanConfig from './SubscriptionPlanConfig';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/services/data-service';
import { CreditCard, Users, Calendar, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';

const SubscriptionSettingsTab = () => {
  const { currentUser } = useAuthContext();
  const canManageSubscription = hasPermission(currentUser, 'settings', 'edit');
  const [additionalSeats, setAdditionalSeats] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState('professional'); // Default selection
  
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
  
  // Subscription models data
  const subscriptionModels = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'For small workshops or teams getting started',
      price: 29,
      includedSeats: 3,
      pricePerSeat: 10,
      features: [
        'Up to 3 users included',
        'Basic reporting',
        'Standard support',
        'Essential workshop features'
      ]
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For growing businesses with more complex needs',
      price: 79,
      includedSeats: 10,
      pricePerSeat: 8,
      features: [
        'Up to 10 users included',
        'Advanced reporting',
        'Priority support',
        'Complete feature set',
        'API access',
        'Unlimited customers'
      ]
    }
  ];
  
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
  
  const handleChangePlan = () => {
    const newPlan = subscriptionModels.find(model => model.id === selectedPlan);
    if (newPlan) {
      toast.success(`Your subscription has been updated to ${newPlan.name}`);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Subscription Models Card - Only visible for users with permission */}
      {canManageSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Models</CardTitle>
            <CardDescription>
              Choose the subscription model that fits your business needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup 
              value={selectedPlan} 
              onValueChange={setSelectedPlan}
              className="space-y-4"
            >
              {subscriptionModels.map(model => (
                <div key={model.id} className={`border rounded-lg p-4 ${selectedPlan === model.id ? 'border-primary' : 'border-border'}`}>
                  <div className="flex items-start">
                    <RadioGroupItem value={model.id} id={`plan-${model.id}`} className="mt-1" />
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <Label htmlFor={`plan-${model.id}`} className="text-lg font-semibold">
                          {model.name}
                        </Label>
                        <div className="text-right">
                          <div className="text-lg font-bold">${model.price}/mo</div>
                          <div className="text-sm text-muted-foreground">
                            ${model.pricePerSeat}/additional seat
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{model.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                        {model.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
            
            <div className="mt-4 flex justify-end">
              <Button onClick={handleChangePlan}>
                Update Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
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
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
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
