
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
import { Part, Task } from "@/types";
import { Plus, Minus, Search, Package, Wrench } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface WorkshopPartsSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableParts: Part[];
  availableTasks: Task[];
  onAddParts: (selectedParts: { part: Part; quantity: number }[]) => void;
  onAddTasks: (selectedTasks: { task: Task; quantity: number }[]) => void;
}

const WorkshopPartsSelector: React.FC<WorkshopPartsSelectorProps> = ({
  open,
  onOpenChange,
  availableParts,
  availableTasks,
  onAddParts,
  onAddTasks
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParts, setSelectedParts] = useState<Record<string, number>>({});
  const [selectedTasks, setSelectedTasks] = useState<Record<string, number>>({});

  // Use the already filtered availableParts (these are workshop parts) and availableTasks
  const workshopParts = availableParts;
  const workshopTasks = availableTasks;

  const filteredParts = workshopParts.filter(part =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.part_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTasks = workshopTasks.filter(task =>
    task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePartQuantityChange = (partId: string, delta: number) => {
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

  const handleTaskQuantityChange = (taskId: string, delta: number) => {
    setSelectedTasks(prev => {
      const currentQuantity = prev[taskId] || 0;
      const newQuantity = Math.max(0, currentQuantity + delta);
      
      if (newQuantity === 0) {
        const { [taskId]: removed, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [taskId]: newQuantity
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
    }
  };

  const handleAddSelectedTasks = () => {
    const tasksToAdd = Object.entries(selectedTasks)
      .map(([taskId, quantity]) => {
        const task = workshopTasks.find(t => t.id === taskId);
        return task ? { task, quantity } : null;
      })
      .filter(Boolean) as { task: Task; quantity: number }[];

    if (tasksToAdd.length > 0) {
      onAddTasks(tasksToAdd);
    }
  };

  const handleAddAllSelected = () => {
    handleAddSelectedParts();
    handleAddSelectedTasks();
    setSelectedParts({});
    setSelectedTasks({});
    setSearchTerm("");
  };

  const getPartsSelectedCount = () => Object.keys(selectedParts).length;
  const getTasksSelectedCount = () => Object.keys(selectedTasks).length;
  const getTotalSelectedCount = () => getPartsSelectedCount() + getTasksSelectedCount();
  
  const getTotalPartsItems = () => Object.values(selectedParts).reduce((sum, qty) => sum + qty, 0);
  const getTotalTasksItems = () => Object.values(selectedTasks).reduce((sum, qty) => sum + qty, 0);
  const getTotalItems = () => getTotalPartsItems() + getTotalTasksItems();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add Items from Workshop
          </DialogTitle>
          <DialogDescription>
            Select parts from inventory and completed labor tasks to add to this invoice.
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

        {/* Selected Items Summary */}
        {getTotalSelectedCount() > 0 && (
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">
                {getTotalSelectedCount()} item types selected ({getTotalItems()} total items)
                {getPartsSelectedCount() > 0 && ` - ${getPartsSelectedCount()} parts`}
                {getTasksSelectedCount() > 0 && ` - ${getTasksSelectedCount()} tasks`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedParts({});
                  setSelectedTasks({});
                }}
              >
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Tabs for Parts and Tasks */}
        <Tabs defaultValue="parts" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="parts" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Parts ({workshopParts.length})
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Labor Tasks ({workshopTasks.length})
            </TabsTrigger>
          </TabsList>

          {/* Parts Tab */}
          <TabsContent value="parts" className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {filteredParts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {workshopParts.length === 0 ? (
                    <>
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No workshop parts available.</p>
                      <p className="text-sm mt-2">Parts with inventory quantity {"> 0"} will appear here.</p>
                    </>
                  ) : (
                    <>
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No parts found matching your search.</p>
                    </>
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
                                onClick={() => handlePartQuantityChange(part.id, -1)}
                                disabled={selectedQuantity === 0}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="min-w-[2rem] text-center">{selectedQuantity}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handlePartQuantityChange(part.id, 1)}
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
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto border rounded-lg">
              {filteredTasks.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {workshopTasks.length === 0 ? (
                    <>
                      <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No completed labor tasks available.</p>
                      <p className="text-sm mt-2">Completed tasks not assigned to invoices will appear here.</p>
                    </>
                  ) : (
                    <>
                      <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No tasks found matching your search.</p>
                    </>
                  )}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-3">Task Title</th>
                      <th className="text-left p-3">Description</th>
                      <th className="text-right p-3">Hours</th>
                      <th className="text-right p-3">Price</th>
                      <th className="text-center p-3">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task, index) => {
                      const selectedQuantity = selectedTasks[task.id] || 0;
                      
                      return (
                        <tr key={task.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/50"}>
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{task.title}</div>
                              <div className="text-sm text-muted-foreground">
                                Status: {task.status}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-sm">{task.description || 'N/A'}</td>
                          <td className="p-3 text-right">{task.hoursEstimated || task.hoursSpent || 1}h</td>
                          <td className="p-3 text-right font-medium">${(task.price || 0).toFixed(2)}</td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleTaskQuantityChange(task.id, -1)}
                                disabled={selectedQuantity === 0}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <span className="min-w-[2rem] text-center">{selectedQuantity}</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleTaskQuantityChange(task.id, 1)}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                            {selectedQuantity > 0 && (
                              <div className="text-center text-sm text-muted-foreground mt-1">
                                Total: ${((task.price || 0) * selectedQuantity).toFixed(2)}
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
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddAllSelected}
            disabled={getTotalSelectedCount() === 0}
          >
            Add {getTotalSelectedCount() > 0 ? `${getTotalItems()} Items` : 'Selected Items'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WorkshopPartsSelector;
