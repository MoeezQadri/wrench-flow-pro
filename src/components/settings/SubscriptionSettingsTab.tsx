import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/context/AuthContext';
import { hasPermission } from '@/services/data-service';
import { CreditCard, Users, Calendar, CheckCircle, Crown, Zap, Building } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  included_seats: number;
  price_per_additional_seat: number;
  features: string[];
  sort_order: number;
}

const SubscriptionSettingsTab = () => {
  const { currentUser, organization } = useAuthContext();
  const canManageSubscription = hasPermission(currentUser, 'settings', 'edit');
  const [additionalSeats, setAdditionalSeats] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(''); 
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isYearly, setIsYearly] = useState(false);
  
  // Mock current subscription data based on organization
  const subscription = {
    plan: organization?.subscription_level || 'trial',
    status: organization?.subscription_status || 'active',
    includedSeats: 10,
    additionalSeats: 2,
    pricePerSeat: 8,
    nextBillingDate: '2024-01-01',
    paymentMethod: {
      type: 'credit_card',
      last4: '4242',
      brand: 'Visa'
    }
  };

  useEffect(() => {
    loadSubscriptionPlans();
  }, []);

  const loadSubscriptionPlans = async () => {
    try {
      const { data: plans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        console.error('Error loading subscription plans:', error);
        toast.error('Failed to load subscription plans');
      } else {
        // Transform the data to match our interface
        const transformedPlans = (plans || []).map(plan => ({
          ...plan,
          features: Array.isArray(plan.features) ? plan.features as string[] : 
                   typeof plan.features === 'string' ? JSON.parse(plan.features) : []
        }));
        
        setAvailablePlans(transformedPlans);
        if (transformedPlans && transformedPlans.length > 0) {
          setSelectedPlan(transformedPlans[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading subscription plans:', error);
      toast.error('Failed to load subscription plans');
    } finally {
      setLoading(false);
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
  
  const handleChangePlan = () => {
    const newPlan = availablePlans.find(plan => plan.id === selectedPlan);
    if (newPlan) {
      toast.success(`Your subscription has been updated to ${newPlan.name}`);
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'trial':
        return <Zap className="h-5 w-5" />;
      case 'basic':
        return <Users className="h-5 w-5" />;
      case 'professional':
        return <Crown className="h-5 w-5" />;
      case 'enterprise':
        return <Building className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'trial':
        return 'text-green-600';
      case 'basic':
        return 'text-blue-600';
      case 'professional':
        return 'text-purple-600';
      case 'enterprise':
        return 'text-gold-600';
      default:
        return 'text-gray-600';
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-center">Loading subscription plans...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Plans Card - Only visible for users with permission */}
      {canManageSubscription && availablePlans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Available Subscription Plans</CardTitle>
            <CardDescription>
              Choose the subscription plan that fits your business needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center mb-6">
              <Button
                variant={!isYearly ? "default" : "outline"}
                size="sm"
                onClick={() => setIsYearly(false)}
                className="mr-2"
              >
                Monthly
              </Button>
              <Button
                variant={isYearly ? "default" : "outline"}
                size="sm"
                onClick={() => setIsYearly(true)}
              >
                Yearly (Save 15%)
              </Button>
            </div>

            <RadioGroup 
              value={selectedPlan} 
              onValueChange={setSelectedPlan}
              className="space-y-4"
            >
              {availablePlans.map(plan => (
                <div 
                  key={plan.id} 
                  className={`border rounded-lg p-4 transition-all ${selectedPlan === plan.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
                >
                  <div className="flex items-start">
                    <RadioGroupItem value={plan.id} id={`plan-${plan.id}`} className="mt-1" />
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className={getPlanColor(plan.name)}>
                            {getPlanIcon(plan.name)}
                          </div>
                          <Label htmlFor={`plan-${plan.id}`} className="text-lg font-semibold">
                            {plan.name}
                          </Label>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">
                            ${isYearly ? (plan.price_yearly || plan.price_monthly * 12) : plan.price_monthly}
                            <span className="text-sm font-normal text-muted-foreground">
                              /{isYearly ? 'year' : 'month'}
                            </span>
                          </div>
                          {plan.price_per_additional_seat > 0 && (
                            <div className="text-sm text-muted-foreground">
                              +${plan.price_per_additional_seat}/additional seat
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">{plan.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <CheckCircle className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={handleChangePlan} size="lg">
                Update Subscription Plan
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
              <div className="flex items-center gap-2">
                <div className={getPlanColor(subscription.plan)}>
                  {getPlanIcon(subscription.plan)}
                </div>
                <div>
                  <div className="text-lg font-semibold capitalize">{subscription.plan} Plan</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    Status: {subscription.status}
                  </div>
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
                  <div className="text-sm font-medium">Total Seats</div>
                  <div className="text-xl">{subscription.includedSeats + subscription.additionalSeats}</div>
                  <div className="text-xs text-muted-foreground">
                    {subscription.includedSeats} included + {subscription.additionalSeats} additional
                  </div>
                </div>
              </div>
              
              <div className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2 text-muted-foreground" />
                <div>
                  <div className="text-sm font-medium">Per Additional Seat</div>
                  <div className="text-xl">${subscription.pricePerSeat}</div>
                  <div className="text-xs text-muted-foreground">
                    Monthly billing
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
                    placeholder="Number of seats"
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
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
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
    </div>
  );
};

export default SubscriptionSettingsTab;
