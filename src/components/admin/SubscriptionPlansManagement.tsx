
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Trash2, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  pricePerSeat: number;
  includedSeats: number;
  features: string[];
  isPopular: boolean;
}

const defaultPlans: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'For small workshops',
    basePrice: 29,
    pricePerSeat: 10,
    includedSeats: 3,
    features: [
      'Up to 3 users included',
      'Basic reporting',
      'Standard support',
      'Essential workshop features'
    ],
    isPopular: false
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing businesses',
    basePrice: 79,
    pricePerSeat: 8,
    includedSeats: 10,
    features: [
      'Up to 10 users included',
      'Advanced reporting',
      'Priority support',
      'Complete feature set',
      'API access',
      'Unlimited customers'
    ],
    isPopular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large operations',
    basePrice: 199,
    pricePerSeat: 5,
    includedSeats: 25,
    features: [
      'Up to 25 users included',
      'Custom reporting',
      '24/7 support',
      'White-labeling',
      'Custom integrations',
      'Dedicated account manager'
    ],
    isPopular: false
  }
];

const SubscriptionPlansManagement = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(defaultPlans);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  
  const handleCreatePlan = () => {
    setEditingPlan({
      id: '',
      name: '',
      description: '',
      basePrice: 0,
      pricePerSeat: 0,
      includedSeats: 1,
      features: [],
      isPopular: false
    });
    setIsDialogOpen(true);
  };
  
  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan({ ...plan });
    setIsDialogOpen(true);
  };
  
  const handleDeletePlan = (planId: string) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      setPlans(plans.filter(p => p.id !== planId));
      toast.success('Plan deleted successfully');
    }
  };
  
  const handleAddFeature = () => {
    if (!featureInput.trim() || !editingPlan) return;
    
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, featureInput.trim()]
    });
    
    setFeatureInput('');
  };
  
  const handleRemoveFeature = (index: number) => {
    if (!editingPlan) return;
    
    const newFeatures = [...editingPlan.features];
    newFeatures.splice(index, 1);
    
    setEditingPlan({
      ...editingPlan,
      features: newFeatures
    });
  };
  
  const handleSavePlan = () => {
    if (!editingPlan) return;
    
    if (!editingPlan.name.trim()) {
      toast.error('Plan name is required');
      return;
    }
    
    if (editingPlan.basePrice < 0) {
      toast.error('Base price cannot be negative');
      return;
    }
    
    if (editingPlan.pricePerSeat < 0) {
      toast.error('Price per seat cannot be negative');
      return;
    }
    
    if (editingPlan.includedSeats < 1) {
      toast.error('At least 1 seat must be included');
      return;
    }
    
    // Generate ID for new plans
    if (!editingPlan.id) {
      editingPlan.id = editingPlan.name.toLowerCase().replace(/\s+/g, '-');
    }
    
    // Check if plan with this ID already exists
    const existingPlanIndex = plans.findIndex(p => p.id === editingPlan.id);
    
    if (existingPlanIndex >= 0) {
      // Update existing plan
      const updatedPlans = [...plans];
      updatedPlans[existingPlanIndex] = editingPlan;
      setPlans(updatedPlans);
      toast.success('Plan updated successfully');
    } else {
      // Add new plan
      setPlans([...plans, editingPlan]);
      toast.success('New plan created successfully');
    }
    
    setIsDialogOpen(false);
    setEditingPlan(null);
  };
  
  const handleTogglePopular = (planId: string) => {
    setPlans(plans.map(plan => 
      plan.id === planId 
        ? { ...plan, isPopular: !plan.isPopular } 
        : plan
    ));
    toast.success('Plan updated successfully');
  };
  
  const getTotalPriceForDisplay = (plan: SubscriptionPlan) => {
    return plan.basePrice + (plan.pricePerSeat * 0); // Add extra seats calculation here
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription Plans</CardTitle>
        <CardDescription>
          Configure subscription plans and seat-based pricing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Manage your subscription plans, base prices, and per-seat fees.
            </p>
          </div>
          <Button onClick={handleCreatePlan}>
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead>Included Seats</TableHead>
              <TableHead>Price Per Extra Seat</TableHead>
              <TableHead className="text-center">Popular</TableHead>
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
                <TableCell>${plan.basePrice}/mo</TableCell>
                <TableCell>{plan.includedSeats}</TableCell>
                <TableCell>${plan.pricePerSeat}/seat</TableCell>
                <TableCell className="text-center">
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
                    <Edit className="h-4 w-4" />
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
      
      {/* Edit/Create Plan Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {editingPlan?.id ? `Edit Plan: ${editingPlan.name}` : 'Create New Plan'}
            </DialogTitle>
            <DialogDescription>
              Configure subscription plan details and seat-based pricing model.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan-name">Plan Name</Label>
                <Input
                  id="plan-name"
                  value={editingPlan?.name || ''}
                  onChange={(e) => setEditingPlan(prev => (
                    prev ? { ...prev, name: e.target.value } : null
                  ))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="plan-description">Description</Label>
                <Input
                  id="plan-description"
                  value={editingPlan?.description || ''}
                  onChange={(e) => setEditingPlan(prev => (
                    prev ? { ...prev, description: e.target.value } : null
                  ))}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="base-price">Base Price ($)</Label>
                <Input
                  id="base-price"
                  type="number"
                  min="0"
                  value={editingPlan?.basePrice || 0}
                  onChange={(e) => setEditingPlan(prev => (
                    prev ? { ...prev, basePrice: parseFloat(e.target.value) || 0 } : null
                  ))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="included-seats">Included Seats</Label>
                <Input
                  id="included-seats"
                  type="number"
                  min="1"
                  value={editingPlan?.includedSeats || 1}
                  onChange={(e) => setEditingPlan(prev => (
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
                  value={editingPlan?.pricePerSeat || 0}
                  onChange={(e) => setEditingPlan(prev => (
                    prev ? { ...prev, pricePerSeat: parseFloat(e.target.value) || 0 } : null
                  ))}
                  className="mt-1"
                />
              </div>
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
                  {editingPlan?.features.map((feature, index) => (
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
                  {editingPlan?.features.length === 0 && (
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
                checked={editingPlan?.isPopular || false}
                onCheckedChange={(checked) => setEditingPlan(prev => (
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
              {editingPlan?.id ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SubscriptionPlansManagement;
