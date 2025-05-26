
import React, { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus } from 'lucide-react';
import { InvoiceItem } from '@/types';

export interface InvoiceItemsSectionProps {
  items: InvoiceItem[];
  onItemsChange: Dispatch<SetStateAction<InvoiceItem[]>>;
}

const InvoiceItemsSection: React.FC<InvoiceItemsSectionProps> = ({
  items,
  onItemsChange
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

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    onItemsChange(updatedItems);
  };

  const removeItem = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-medium">Invoice Items</Label>
        <Button type="button" variant="outline" onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

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
            <Label htmlFor={`quantity-${index}`}>Quantity</Label>
            <Input
              id={`quantity-${index}`}
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
            />
          </div>

          <div>
            <Label htmlFor={`price-${index}`}>Price</Label>
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
          No items added yet. Click "Add Item" to get started.
        </div>
      )}
    </div>
  );
};

export default InvoiceItemsSection;
