
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Part } from "@/types";
import { Plus, Minus, Search } from "lucide-react";

interface WorkshopPartsSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableParts: Part[];
  onAddParts: (selectedParts: { part: Part; quantity: number }[]) => void;
}

const WorkshopPartsSelector: React.FC<WorkshopPartsSelectorProps> = ({
  open,
  onOpenChange,
  availableParts,
  onAddParts
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParts, setSelectedParts] = useState<Record<string, number>>({});

  // Use the already filtered availableParts (these are workshop parts)
  const workshopParts = availableParts;

  const filteredParts = workshopParts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.part_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuantityChange = (partId: string, delta: number) => {
    setSelectedParts(prev => {
      const currentQuantity = prev[partId] || 0;
      const newQuantity = Math.max(0, currentQuantity + delta);
      
      if (newQuantity === 0) {
        const { [partId]: removed, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [partId]: newQuantity
      };
    });
  };

  const handleAddSelectedParts = () => {
    const partsToAdd = Object.entries(selectedParts)
      .map(([partId, quantity]) => {
        const part = workshopParts.find(p => p.id === partId);
        return part ? { part, quantity } : null;
      })
      .filter(Boolean) as { part: Part; quantity: number }[];

    if (partsToAdd.length > 0) {
      onAddParts(partsToAdd);
      setSelectedParts({});
      setSearchTerm("");
    }
  };

  const getSelectedCount = () => {
    return Object.keys(selectedParts).length;
  };

  const getTotalItems = () => {
    return Object.values(selectedParts).reduce((sum, qty) => sum + qty, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Parts from Workshop Inventory</DialogTitle>
          <DialogDescription>
            Select parts from your workshop inventory to add to this invoice.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search parts by name, description, or part number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected Parts Summary */}
        {getSelectedCount() > 0 && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">
                {getSelectedCount()} part types selected ({getTotalItems()} total items)
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedParts({})}
              >
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Parts List */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {filteredParts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {workshopParts.length === 0 ? (
                <>
                  <p>No workshop parts available.</p>
                  <p className="text-sm mt-2">Parts with inventory quantity {"> 0"} and not assigned to invoices will appear here.</p>
                </>
              ) : (
                <p>No parts found matching your search.</p>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-3">Part Name</th>
                  <th className="text-left p-3">Description</th>
                  <th className="text-right p-3">Stock</th>
                  <th className="text-right p-3">Price</th>
                  <th className="text-center p-3">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {filteredParts.map((part, index) => {
                  const selectedQuantity = selectedParts[part.id] || 0;
                  const maxQuantity = part.quantity;
                  
                  return (
                    <tr key={part.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/50"}>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{part.name}</div>
                          {part.part_number && (
                            <div className="text-sm text-muted-foreground">
                              Part #: {part.part_number}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-sm">{part.description || 'N/A'}</td>
                      <td className="p-3 text-right">
                        <span className={`${part.quantity <= 5 ? 'text-red-600 font-medium' : ''}`}>
                          {part.quantity}
                        </span>
                        {part.quantity <= 5 && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Low Stock
                          </Badge>
                        )}
                      </td>
                      <td className="p-3 text-right font-medium">${part.price.toFixed(2)}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(part.id, -1)}
                            disabled={selectedQuantity === 0}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="min-w-[2rem] text-center">{selectedQuantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuantityChange(part.id, 1)}
                            disabled={selectedQuantity >= maxQuantity}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        {selectedQuantity > 0 && (
                          <div className="text-center text-sm text-muted-foreground mt-1">
                            Total: ${(part.price * selectedQuantity).toFixed(2)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddSelectedParts}
            disabled={getSelectedCount() === 0}
          >
            Add {getSelectedCount() > 0 ? `${getTotalItems()} Items` : 'Selected Parts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkshopPartsSelector;
