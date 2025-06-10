
import React, { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Package, Wrench } from 'lucide-react';
import { InvoiceItem, Part, Task } from '@/types';

export interface InvoiceItemsSectionProps {
  items: InvoiceItem[];
  onItemsChange: Dispatch<SetStateAction<InvoiceItem[]>>;
  availableParts?: Part[];
  availableTasks?: Task[];
  vehicleId?: string;
}

const InvoiceItemsSection: React.FC<InvoiceItemsSectionProps> = ({
  items,
  onItemsChange,
  availableParts = [],
  availableTasks = [],
  vehicleId
}) => {
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      description: '',
      type: 'labor',
      quantity: 1,
      price: 0
    };
    onItemsChange([...items, newItem]);
  };

  const addPartFromInventory = (part: Part) => {
    const newItem: InvoiceItem = {
      id: `part-${part.id}-${Date.now()}`,
      description: part.name,
      type: 'parts',
      quantity: 1,
      price: part.price,
      part_id: part.id
    };
    onItemsChange([...items, newItem]);
  };

  const addTaskAsLabor = (task: Task) => {
    const newItem: InvoiceItem = {
      id: `task-${task.id}-${Date.now()}`,
      description: task.title,
      type: 'labor',
      quantity: task.hoursEstimated || 1,
      price: task.price || 0,
      task_id: task.id
    };
    onItemsChange([...items, newItem]);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    onItemsChange(updatedItems);
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  // Filter tasks by vehicle if vehicleId is provided
  const filteredTasks = vehicleId 
    ? availableTasks.filter(task => task.vehicleId === vehicleId || !task.vehicleId)
    : availableTasks;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-medium">Invoice Items</Label>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Item
          </Button>
        </div>
      </div>

      {/* Quick Add Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
        {/* Parts Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4" />
            <Label className="font-medium">Add Parts from Inventory</Label>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {availableParts.length > 0 ? (
              availableParts.map((part) => (
                <div key={part.id} className="flex items-center justify-between p-2 bg-background rounded border">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{part.name}</div>
                    <div className="text-xs text-muted-foreground">
                      ${part.price.toFixed(2)} • Qty: {part.quantity}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addPartFromInventory(part)}
                  >
                    Add
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No parts available</div>
            )}
          </div>
        </div>

        {/* Tasks Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="h-4 w-4" />
            <Label className="font-medium">Add Tasks as Labor</Label>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-2 bg-background rounded border">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {task.price ? `$${task.price.toFixed(2)}` : 'No price set'} • 
                      {task.hoursEstimated}h estimated
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => addTaskAsLabor(task)}
                  >
                    Add
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No tasks available</div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Items List */}
      {items.map((item, index) => (
        <div key={item.id} className="grid grid-cols-1 md:grid-cols-6 gap-2 p-4 border rounded-lg">
          <div className="md:col-span-2">
            <Label htmlFor={`description-${index}`}>Description</Label>
            <Input
              id={`description-${index}`}
              value={item.description}
              onChange={(e) => updateItem(index, 'description', e.target.value)}
              placeholder="Service description"
            />
            {(item.part_id || item.task_id) && (
              <div className="text-xs text-muted-foreground mt-1">
                {item.part_id && "From inventory part"}
                {item.task_id && "From task"}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor={`type-${index}`}>Type</Label>
            <Select
              value={item.type}
              onValueChange={(value) => updateItem(index, 'type', value)}
            >
              <SelectTrigger id={`type-${index}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="parts">Parts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`quantity-${index}`}>
              {item.type === 'labor' ? 'Hours' : 'Quantity'}
            </Label>
            <Input
              id={`quantity-${index}`}
              type="number"
              min="0.1"
              step={item.type === 'labor' ? "0.1" : "1"}
              value={item.quantity}
              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
            />
          </div>

          <div>
            <Label htmlFor={`price-${index}`}>
              {item.type === 'labor' ? 'Rate/Hour' : 'Price'}
            </Label>
            <Input
              id={`price-${index}`}
              type="number"
              step="0.01"
              min="0"
              value={item.price}
              onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
            />
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No items added yet. Add parts from inventory, tasks as labor, or custom items.
        </div>
      )}
    </div>
  );
};

export default InvoiceItemsSection;
