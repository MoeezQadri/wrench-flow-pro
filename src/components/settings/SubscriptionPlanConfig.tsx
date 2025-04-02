
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, CreditCard, DollarSign, Users } from 'lucide-react';

// Interface for subscription plans
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  pricePerSeat: number;
  includedSeats: number;
  description: string;
  features: string[];
  isPopular: boolean;
}

// Default subscription plans
const defaultPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    pricePerSeat: 10,
    includedSeats: 3,
    description: 'For small workshops',
    features: [
      'Up to 3 users included',
      'Basic reporting',
      'Standard support',
      '$10 per additional user'
    ],
    isPopular: false
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    pricePerSeat: 8,
    includedSeats: 10,
    description: 'For growing businesses',
    features: [
      'Up to 10 users included',
      'Advanced reporting',
      'Priority support',
      '$8 per additional user'
    ],
    isPopular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    pricePerSeat: 5,
    includedSeats: 25,
    description: 'For large operations',
    features: [
      'Up to 25 users included',
      'Custom reporting',
      '24/7 support',
      '$5 per additional user'
    ],
    isPopular: false
  }
];

const SubscriptionPlanConfig = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(defaultPlans);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  
  // Handle adding a new plan
  const handleAddPlan = () => {
    setSelectedPlan({
      id: '',
      name: '',
      price: 0,
      pricePerSeat: 0,
      includedSeats: 1,
      description: '',
      features: [],
      isPopular: false
    });
    setIsDialogOpen(true);
  };
  
  // Handle editing a plan
  const handleEditPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan({ ...plan });
    setIsDialogOpen(true);
  };
  
  // Handle adding a feature to the selected plan
  const handleAddFeature = () => {
    if (!featureInput.trim() || !selectedPlan) return;
    
    setSelectedPlan({
      ...selectedPlan,
      features: [...selectedPlan.features, featureInput.trim()]
    });
    
    setFeatureInput('');
  };
  
  // Handle removing a feature from the selected plan
  const handleRemoveFeature = (index: number) => {
    if (!selectedPlan) return;
    
    const newFeatures = [...selectedPlan.features];
    newFeatures.splice(index, 1);
    
    setSelectedPlan({
      ...selectedPlan,
      features: newFeatures
    });
  };
  
  // Handle saving a plan
  const handleSavePlan = () => {
    if (!selectedPlan) return;
    
    if (!selectedPlan.name.trim()) {
      toast.error("Plan name is required");
      return;
    }
    
    if (selectedPlan.price < 0) {
      toast.error("Price cannot be negative");
      return;
    }
    
    if (selectedPlan.pricePerSeat < 0) {
      toast.error("Price per seat cannot be negative");
      return;
    }
    
    if (selectedPlan.includedSeats < 1) {
      toast.error("At least 1 seat must be included");
      return;
    }
    
    // For new plans, generate an ID
    if (!selectedPlan.id) {
      selectedPlan.id = selectedPlan.name.toLowerCase().replace(/\s+/g, '-');
    }
    
    // Check if plan with this ID already exists
    const existingPlanIndex = plans.findIndex(p => p.id === selectedPlan.id);
    
    if (existingPlanIndex >= 0) {
      // Update existing plan
      const updatedPlans = [...plans];
      updatedPlans[existingPlanIndex] = selectedPlan;
      setPlans(updatedPlans);
      toast.success("Plan updated successfully");
    } else {
      // Add new plan
      setPlans([...plans, selectedPlan]);
      toast.success("New plan created successfully");
    }
    
    setIsDialogOpen(false);
    setSelectedPlan(null);
  };
  
  // Handle deleting a plan
  const handleDeletePlan = (planId: string) => {
    if (window.confirm(`Are you sure you want to delete this plan?`)) {
      setPlans(plans.filter(p => p.id !== planId));
      toast.success("Plan deleted successfully");
    }
  };
  
  // Toggle the popular status of a plan
  const handleTogglePopular = (planId: string) => {
    setPlans(plans.map(plan => 
      plan.id === planId 
        ? { ...plan, isPopular: !plan.isPopular } 
        : plan
    ));
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>
            Configure your subscription plans and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Manage your subscription plans, prices and included features.
              </p>
            </div>
            <Button onClick={handleAddPlan}>
              <Plus className="h-4 w-4 mr-2" />
              Add Plan
            </Button>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Included Seats</TableHead>
                <TableHead>Price Per Extra Seat</TableHead>
                <TableHead>Popular</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">
                    {plan.name}
                    <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
                  </TableCell>
                  <TableCell>${plan.price}/mo</TableCell>
                  <TableCell>{plan.includedSeats}</TableCell>
                  <TableCell>${plan.pricePerSeat}/seat</TableCell>
                  <TableCell>
                    <Switch 
                      checked={plan.isPopular}
                      onCheckedChange={() => handleTogglePopular(plan.id)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditPlan(plan)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Plan Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {selectedPlan?.id ? `Edit Plan: ${selectedPlan.name}` : 'Create New Plan'}
            </DialogTitle>
            <DialogDescription>
              Configure the subscription plan details and features.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input
                  id="plan-name"
                  value={selectedPlan?.name || ''}
                  onChange={(e) => setSelectedPlan(prev => (
                    prev ? { ...prev, name: e.target.value } : null
                  ))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="plan-price">Monthly Price ($)</Label>
                <Input
                  id="plan-price"
                  type="number"
                  min="0"
                  value={selectedPlan?.price || 0}
                  onChange={(e) => setSelectedPlan(prev => (
                    prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null
                  ))}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="included-seats">Included Seats</Label>
                <Input
                  id="included-seats"
                  type="number"
                  min="1"
                  value={selectedPlan?.includedSeats || 1}
                  onChange={(e) => setSelectedPlan(prev => (
                    prev ? { ...prev, includedSeats: parseInt(e.target.value) || 1 } : null
                  ))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="price-per-seat">Price Per Additional Seat ($)</Label>
                <Input
                  id="price-per-seat"
                  type="number"
                  min="0"
                  step="0.01"
                  value={selectedPlan?.pricePerSeat || 0}
                  onChange={(e) => setSelectedPlan(prev => (
                    prev ? { ...prev, pricePerSeat: parseFloat(e.target.value) || 0 } : null
                  ))}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="plan-description">Description</Label>
              <Input
                id="plan-description"
                value={selectedPlan?.description || ''}
                onChange={(e) => setSelectedPlan(prev => (
                  prev ? { ...prev, description: e.target.value } : null
                ))}
                className="mt-1"
              />
            </div>
            
            <div className="mt-4">
              <Label>Features</Label>
              <div className="flex mt-1">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="Add a feature..."
                  className="mr-2"
                />
                <Button type="button" onClick={handleAddFeature}>Add</Button>
              </div>
              
              <div className="mt-2">
                <ul className="border rounded-md divide-y">
                  {selectedPlan?.features.map((feature, index) => (
                    <li key={index} className="flex justify-between items-center p-2">
                      <span>{feature}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFeature(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                  {selectedPlan?.features.length === 0 && (
                    <li className="p-2 text-muted-foreground text-center">
                      No features added yet
                    </li>
                  )}
                </ul>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mt-2">
              <Switch
                id="is-popular"
                checked={selectedPlan?.isPopular || false}
                onCheckedChange={(checked) => setSelectedPlan(prev => (
                  prev ? { ...prev, isPopular: checked } : null
                ))}
              />
              <Label htmlFor="is-popular">Mark as popular plan</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan}>
              {selectedPlan?.id ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubscriptionPlanConfig;
