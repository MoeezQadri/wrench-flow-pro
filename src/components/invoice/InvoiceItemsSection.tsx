
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { InvoiceItem, Part, Task } from "@/types";
import InvoiceItemForm from "./InvoiceItemForm";
import WorkshopPartsSelector from "./WorkshopPartsSelector";

interface InvoiceItemsSectionProps {
  items: InvoiceItem[];
  onItemsChange: (items: InvoiceItem[] | ((prev: InvoiceItem[]) => InvoiceItem[])) => void;
  availableParts: Part[];
  availableTasks: Task[];
  vehicleId: string;
}

const InvoiceItemsSection: React.FC<InvoiceItemsSectionProps> = ({
  items,
  onItemsChange,
  availableParts,
  availableTasks,
  vehicleId
}) => {
  const [showItemForm, setShowItemForm] = useState(false);
  const [showPartsSelector, setShowPartsSelector] = useState(false);
  const [editingItem, setEditingItem] = useState<InvoiceItem | null>(null);

  const handleAddItem = (item: InvoiceItem) => {
    if (editingItem) {
      onItemsChange(prev => prev.map(i => i.id === editingItem.id ? item : i));
      setEditingItem(null);
    } else {
      onItemsChange(prev => [...prev, item]);
    }
    setShowItemForm(false);
  };

  const handleAddPartsFromWorkshop = (selectedParts: { part: Part; quantity: number }[]) => {
    const newItems: InvoiceItem[] = selectedParts.map(({ part, quantity }) => ({
      id: `workshop-part-${part.id}-${Date.now()}`,
      description: part.name,
      type: 'parts' as const,
      quantity: quantity,
      price: part.price,
      part_id: part.id,
      is_auto_added: false
    }));

    onItemsChange(prev => [...prev, ...newItems]);
    setShowPartsSelector(false);
  };

  const handleEditItem = (item: InvoiceItem) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  const handleRemoveItem = (itemId: string) => {
    onItemsChange(prev => prev.filter(item => item.id !== itemId));
  };

  const calculateItemTotal = (item: InvoiceItem) => {
    return (item.price * item.quantity).toFixed(2);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Invoice Items</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPartsSelector(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Parts from Workshop
          </Button>
          <Button
            type="button"
            onClick={() => setShowItemForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Custom Item
          </Button>
        </div>
      </div>

      {/* Items List */}
      {items.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">Description</th>
                <th className="text-left p-3">Type</th>
                <th className="text-right p-3">Quantity</th>
                <th className="text-right p-3">Unit Price</th>
                <th className="text-right p-3">Total</th>
                <th className="text-center p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/50"}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {item.description}
                      {item.is_auto_added && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          Auto-added
                        </span>
                      )}
                      {item.part_id && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          Workshop Part
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 capitalize">{item.type}</td>
                  <td className="p-3 text-right">{item.quantity}</td>
                  <td className="p-3 text-right">${item.price.toFixed(2)}</td>
                  <td className="p-3 text-right font-medium">${calculateItemTotal(item)}</td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
          <p className="text-muted-foreground mb-4">No items added to this invoice yet.</p>
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPartsSelector(true)}
            >
              Add Parts from Workshop
            </Button>
            <Button
              type="button"
              onClick={() => setShowItemForm(true)}
            >
              Add Custom Item
            </Button>
          </div>
        </div>
      )}

      {/* Workshop Parts Selector Dialog */}
      <WorkshopPartsSelector
        open={showPartsSelector}
        onOpenChange={setShowPartsSelector}
        availableParts={availableParts}
        onAddParts={handleAddPartsFromWorkshop}
      />

      {/* Item Form Dialog */}
      <InvoiceItemForm
        open={showItemForm}
        onOpenChange={setShowItemForm}
        onSave={handleAddItem}
        availableParts={availableParts}
        availableTasks={availableTasks}
        vehicleId={vehicleId}
        editingItem={editingItem}
      />
    </div>
  );
};

export default InvoiceItemsSection;
