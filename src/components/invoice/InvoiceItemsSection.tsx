
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
  invoiceId?: string;
}

const InvoiceItemsSection: React.FC<InvoiceItemsSectionProps> = ({
  items,
  onItemsChange,
  availableParts,
  availableTasks,
  vehicleId,
  invoiceId
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
      type: 'part' as const,
      quantity: quantity,
      price: part.price,
      part_id: part.id,
      is_auto_added: false
    }));

    onItemsChange(prev => [...prev, ...newItems]);
    setShowPartsSelector(false);
  };

  const handleAddTasksFromWorkshop = (selectedTasks: { task: Task; quantity: number }[]) => {
    const newItems: InvoiceItem[] = selectedTasks.map(({ task, quantity }) => ({
      id: `workshop-task-${task.id}-${Date.now()}`,
      description: task.title,
      type: 'labor' as const,
      quantity: quantity,
      price: task.price || 0,
      task_id: task.id,
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

  // Button click handlers with proper event handling
  const handleShowPartsSelector = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("Parts selector button clicked");
    setShowPartsSelector(true);
  };

  const handleShowItemForm = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("Add Custom Item button clicked");
    setShowItemForm(true);
  };

  const handleEditItemClick = (event: React.MouseEvent<HTMLButtonElement>, item: InvoiceItem) => {
    event.preventDefault();
    event.stopPropagation();
    handleEditItem(item);
  };

  const handleRemoveItemClick = (event: React.MouseEvent<HTMLButtonElement>, itemId: string) => {
    event.preventDefault();
    event.stopPropagation();
    handleRemoveItem(itemId);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Invoice Items</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleShowPartsSelector}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add from Workshop
          </Button>
          <Button
            type="button"
            onClick={handleShowItemForm}
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
                    <div className="flex flex-col gap-1">
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
                        {item.creates_inventory_part && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                            Creates Part
                          </span>
                        )}
                        {item.creates_task && (
                          <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                            Creates Task
                          </span>
                        )}
                      </div>
                      {/* Show custom data if available */}
                      {item.custom_part_data && (
                        <div className="text-xs text-muted-foreground">
                          {item.custom_part_data.part_number && `Part #: ${item.custom_part_data.part_number}`}
                          {item.custom_part_data.manufacturer && ` | Mfg: ${item.custom_part_data.manufacturer}`}
                        </div>
                      )}
                      {item.custom_labor_data && (
                        <div className="text-xs text-muted-foreground">
                          {item.custom_labor_data.labor_rate && `Rate: $${item.custom_labor_data.labor_rate}/hr`}
                          {item.custom_labor_data.skill_level && ` | Level: ${item.custom_labor_data.skill_level}`}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 capitalize">{item.type}</td>
                  <td className="p-3 text-right">
                    {item.quantity} {item.unit_of_measure || 'piece'}
                  </td>
                  <td className="p-3 text-right">${item.price.toFixed(2)}</td>
                  <td className="p-3 text-right font-medium">${calculateItemTotal(item)}</td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(event) => handleEditItemClick(event, item)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(event) => handleRemoveItemClick(event, item.id)}
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
              onClick={handleShowPartsSelector}
            >
              Add from Workshop
            </Button>
            <Button
              type="button"
              onClick={handleShowItemForm}
            >
              Add Custom Item
            </Button>
          </div>
        </div>
      )}

      {/* Workshop Items Selector Dialog */}
      <WorkshopPartsSelector
        open={showPartsSelector}
        onOpenChange={setShowPartsSelector}
        availableParts={availableParts}
        availableTasks={availableTasks}
        onAddParts={handleAddPartsFromWorkshop}
        onAddTasks={handleAddTasksFromWorkshop}
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
        invoiceId={invoiceId}
      />
    </div>
  );
};

export default InvoiceItemsSection;
